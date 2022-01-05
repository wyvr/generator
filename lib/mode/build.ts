import { IPerformance_Measure } from '@lib/performance_measure';
import { Dir } from '@lib/dir';
import { Logger } from '@lib/logger';
import { Env } from '@lib/env';
import { Port } from '@lib/port';
import { Config } from '@lib/config';
import { packages } from '@lib/main/packages';
import { EnvModel } from '@lib/model/env';
import { Global } from '@lib/global';
import { WorkerController } from '@lib/worker/controller';
import { File } from '@lib/file';
import { hrtime_to_ms } from '@lib/converter/time';
import { shutdown, fail } from '@lib/helper/endings';
import { Watch } from '@lib/watch';
import { Plugin } from '@lib/plugin';
import { join } from 'path';
import { plugins } from '@lib/main/plugin';
import { I18N } from '@lib/i18n';
import { copy_static_files } from '@lib/main/copy_static_files';
import { routes } from '@lib/main/routes';
import { Generate } from '@lib/generate';
import { link } from '@lib/main/link';
import { collect } from '@lib/main/collect';
import { transform } from '@lib/main/transform';
import { build_files, build_list } from '@lib/main/build';
import { inject } from '@lib/main/inject';
import { scripts } from '@lib/main/scripts';
import { sitemap } from '@lib/main/sitemap';
import { optimize } from '@lib/main/optimize';
import { release } from '@lib/main/release';
import { media } from '@lib/main/media';
import { dependencies } from '@lib/main/dependencies';
import { Cwd } from '@lib/vars/cwd';
import { ReleasePath } from '@lib/vars/release_path';
import { IObject } from '@lib/interface/object';
import { IWatchFile } from '@lib/interface/watch';
import { CronStatePath } from '@lib/vars/cron_state_path';
import { ConfigPath } from '@lib/vars/config_path';
import { PackageTreePath } from '@lib/vars/package_tree_path';
import { exec } from '@lib/main/exec';
import { Link } from '@lib/link';

export class BuildMode {
    hr_start = null;
    watcher_ports: [number, number] = [3000, null];
    is_executing = false;
    package_tree = {};
    identifier_data_list = [];
    identifiers: IObject = null;

    constructor(private perf: IPerformance_Measure) {
        this.hr_start = process.hrtime();
        if (!this.perf) {
            Logger.error('missing performance measure method');
            process.exit(1);
            return;
        }
    }
    async init() {
        this.perf.start('config');
        // a new build must destroy the old generated data
        Dir.clear('gen');

        if (Env.is_dev()) {
            // get the first 2 free ports for the watcher
            this.watcher_ports[0] = await Port.find(this.watcher_ports[0]); // server
            this.watcher_ports[1] = await Port.find(this.watcher_ports[0] + 1); // socket
            Logger.present('server port', this.watcher_ports[0]);
            Logger.present('socket port', this.watcher_ports[1]);
        }
        // add to Global
        // @todo this is realy slow ~10sec, when the db already exists or gets already written
        const config = Config.get(null);
        config.env = EnvModel[Env.get()];
        config.https = !!config.https;
        await Global.set('global', config);

        this.perf.end('config');
    }
    async start(worker_controller: WorkerController, identifiers: IObject) {
        this.identifiers = identifiers;
        Logger.block('build');

        // collect configured package
        this.perf.start('packages');
        await packages();
        this.perf.end('packages');

        Logger.debug('project_config', JSON.stringify(Config.get(), null, 4));

        // execute
        await this.execute(worker_controller);

        // save config for cron and debugging
        File.write_json(ConfigPath.get(), Config.get());

        // save cron file
        const cron = Config.get('cron');
        if (cron) {
            File.write_json(
                CronStatePath.get(),
                cron.map((entry) => {
                    entry.last_execution = new Date().getTime();
                    return entry;
                })
            );
        }

        const timeInMs = hrtime_to_ms(process.hrtime(this.hr_start));
        Logger.stop('initial total', timeInMs);

        if (Env.is_prod()) {
            return shutdown();
        }
        if (Env.is_dev()) {
            const src = join('node_modules', '@wyvr', 'generator', 'wyvr', 'resource', 'debug.css');
            const destination = join(ReleasePath.get(), 'debug.css');
            Link.to(src, destination);
        }
        // watch for file changes
        try {
            new Watch(this.watcher_ports, async (changed_files: IWatchFile[], watched_files: string[]) => {
                Plugin.clear();
                return await this.execute(worker_controller, changed_files, watched_files);
            });
        } catch (e) {
            fail(e);
        }
    }
    async execute(worker_controller: WorkerController, changed_files: IWatchFile[] = [], watched_files: string[] = null) {
        this.is_executing = true;

        const is_regenerating = changed_files.length > 0;

        const only_static = is_regenerating && changed_files.every((file) => file.rel_path.match(/^assets\//));

        let watched_json_files = null;
        if (watched_files) {
            watched_json_files = watched_files.map((path) => {
                return File.to_index(join(Cwd.get(), 'gen', 'data', path), 'json');
            });
        }

        this.perf.start('static');
        this.package_tree = copy_static_files(this.package_tree);
        this.perf.end('static');

        this.perf.start('plugins');
        await plugins();
        this.perf.end('plugins');

        this.perf.start('i18n');
        await I18N.create();
        this.perf.end('i18n');

        if (only_static) {
            this.is_executing = false;
            return [];
        }

        // collect the files for the generation
        this.perf.start('collect');
        this.package_tree = await collect(this.package_tree);
        File.write_json(PackageTreePath.get(), JSON.parse(JSON.stringify(this.package_tree)));
        this.perf.end('collect');

        const contains_routes = changed_files.find((file) => file.rel_path.match(/^routes\//)) != null;
        let route_urls = [];
        this.perf.start('routes');
        if (!is_regenerating || contains_routes) {
            // get the route files
            [route_urls] = await routes(worker_controller, this.package_tree, changed_files, !is_regenerating, null);
        } else {
            Logger.improve('routes, will not be regenerated');
        }
        this.perf.end('routes');

        this.perf.start('transform');

        // update the navigation entries
        await Generate.build_nav();

        const collected_files = await transform();
        if (!collected_files) {
            fail('no collected files');
        }
        this.perf.end('transform');

        this.perf.start('build');
        if (Env.is_dev()) {
            // write global data to release
            Global.export(join(ReleasePath.get(), '_global.json'));
        }
        // read all imported files
        const files = route_urls.length > 0 ? route_urls : File.collect_files(join(Cwd.get(), 'gen', 'data'), 'json');

        // build static files
        // console.log('identifier_data_list before', this.identifier_data_list)
        let build_pages = [];
        let identifier_data_list = [];
        if (watched_json_files) {
            [build_pages, identifier_data_list] = await build_files(worker_controller, files, watched_json_files);
        } else {
            [build_pages, identifier_data_list] = await build_list(worker_controller, files);
        }
        // console.log('identifier_data_list', identifier_data_list)
        if (this.identifier_data_list.length == 0) {
            this.identifier_data_list = identifier_data_list;
        }
        this.perf.end('build');

        // inject data into the pages
        this.perf.start('inject');
        const [shortcode_identifier, media_entries] = await inject(
            build_pages.map((d) => d.path),
            this.watcher_ports[1]
        );
        Object.keys(shortcode_identifier).forEach((key) => {
            this.identifiers[key] = shortcode_identifier[key];
        });
        this.perf.end('inject');

        // check if the execution should stop after the build
        const build_scripts =
            !is_regenerating ||
            changed_files.some((file) => file.rel_path.match(/^src\//)) ||
            // has missing scripts
            Object.keys(this.identifiers).find((identifier) => !File.is_file(join('gen', 'js', `${identifier}.js`)));

        if (build_scripts) {
            dependencies(this.perf, build_pages, shortcode_identifier, this.identifiers, this.package_tree);

            await scripts(this.perf, worker_controller, this.identifiers, watched_files, watched_files);
        } else {
            Logger.improve('scripts, will not be regenerated');
        }

        if (!is_regenerating) {
            await exec(this.perf);
        } else {
            Logger.improve('exec, will not be regenerated');
        }

        if (!is_regenerating) {
            await sitemap(this.perf, build_pages);
        } else {
            Logger.improve('sitemap, will not be regenerated');
        }

        await link(this.perf);

        if (media_entries) {
            await media(this.perf, worker_controller, media_entries);
        }

        await optimize(this.perf, identifier_data_list, worker_controller);
        await release(this.perf);

        worker_controller.cleanup();
        this.is_executing = false;
        return build_pages;
    }
}
