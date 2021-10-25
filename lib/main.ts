import { readFileSync, writeFileSync, existsSync } from 'fs-extra';
import { join } from 'path';

import { Generate } from '@lib/generate';
import { Importer } from '@lib/importer';
import { Dir } from '@lib/dir';
import { Logger } from '@lib/logger';
import { WorkerController } from '@lib/worker/controller';
import { Config } from '@lib/config';
import { Env } from '@lib/env';
import { EnvModel } from '@lib/model/env';
import { IPerformance_Measure, Performance_Measure, Performance_Measure_Blank } from '@lib/performance_measure';
import { File } from '@lib/file';
import { hrtime_to_ms } from '@lib/converter/time';
import { Watch } from '@lib/watch';
import { Dependency } from '@lib/dependency';
import { Plugin } from '@lib/plugin';
import { WyvrMode } from '@lib/model/wyvr/mode';
import { MainHelper } from '@lib/main/helper';
import { Global } from '@lib/global';
import { WorkerEmit } from '@lib/model/worker/emit';
import { Port } from '@lib/port';
import { Client } from '@lib/client';
import { uniq } from '@lib/helper/uniq';
import { DeliverMode } from '@lib/mode/deliver';
import { CronMode } from '@lib/mode/cron';
import { BuildMode } from '@lib/mode/build';
import { copy_static_files } from '@lib/main/copy_static_files';
import { packages } from './main/packages';
import { I18N } from './i18n';
import { fail } from './main/fail';
import { build_files, build_list } from './main/build';
import { routes } from './main/routes';
import { optimize } from './main/optimize';

export class Main {
    mode: WyvrMode = WyvrMode.build;
    worker_controller: WorkerController = null;
    helper = new MainHelper();
    perf: IPerformance_Measure;
    worker_amount: number;
    identifiers: any = {};
    is_executing: boolean = false;
    cwd = process.cwd();
    uniq_id = null;
    release_path = null;
    package_tree = {};
    cron_state = [];
    cron_config = [];
    identifier_data_list = [];
    watcher_ports: [number, number] = [3000, 3001];
    uniq_id_file = join('gen', 'uniq.txt');

    constructor() {
        this.start();
    }
    async start() {
        Env.set(process.env.WYVR_ENV);

        Logger.logo();

        const args = process.argv.slice(2).map((arg) => arg.toLowerCase().trim());
        this.mode = this.get_mode(args);
        this.uniq_id = this.get_uniq_id(this.mode);
        if (!this.uniq_id) {
            Logger.error('no previous version found in', this.uniq_id_file);
            process.exit(1);
            return;
        }

        process.title = `wyvr main ${process.pid}`;
        Logger.present('PID', process.pid, Logger.color.dim(`"${process.title}"`));
        Logger.present('cwd', this.cwd);
        Logger.present('build', this.uniq_id);
        Logger.present('env', EnvModel[Env.get()]);
        Logger.present('mode', WyvrMode[this.mode]);
        this.perf = Config.get('import.measure_performance') ? new Performance_Measure() : new Performance_Measure_Blank();

        // if ([WyvrMode.build, WyvrMode.cron].includes(this.mode)) {
        //     this.init();
        // }
        switch (this.mode) {
            case WyvrMode.build:
                File.write(this.uniq_id_file, this.uniq_id);
                const build = new BuildMode(this.perf);
                await build.init();
                this.validate_config();
                this.cleanup();
                this.worker();
                await build.start(this.worker_controller);
                break;
            case WyvrMode.cron:
                const cron = new CronMode(this.perf);
                await cron.init();
                this.validate_config();
                this.cleanup();
                this.worker();
                await cron.start(this.worker_controller);
                break;
            case WyvrMode.deliver:
                const deliver = new DeliverMode();
                deliver.start();
                break;
            default:
                Logger.error('unknown mode', this.mode);
        }
    }
    get_mode(args: string[]) {
        if (args.includes(WyvrMode[WyvrMode.deliver])) {
            return WyvrMode.deliver;
        }
        if (args.includes(WyvrMode[WyvrMode.cron])) {
            return WyvrMode.cron;
        }
        // build is default
        return WyvrMode.build;
    }
    get_uniq_id(mode: WyvrMode) {
        if (mode == null || isNaN(mode)) {
            return null;
        }
        if ([WyvrMode.deliver, WyvrMode.cron].includes(mode)) {
            return File.read(this.uniq_id_file);
        }
        return uniq();
    }
    validate_config() {
        if (!Config.get('packages')) {
            Logger.error('no packages available, please configure wyvr.js file');
            process.exit(1);
            return;
        }
    }
    cleanup() {
        this.perf.start('cleanup');
        // remove old releases
        this.helper.cleanup_releases(this.mode, Config.get('releases.keep') ?? 0);
        // create release folder
        this.release_path = `releases/${this.uniq_id}`;
        Dir.create(this.release_path);
        this.perf.end('cleanup');
    }
    worker() {
        this.perf.start('worker');

        this.worker_controller = new WorkerController(this.release_path);
        this.worker_amount = this.worker_controller.get_worker_amount();
        Logger.present('workers', this.worker_amount, Logger.color.dim(`of ${require('os').cpus().length} cores`));
        const workers = this.worker_controller.create_workers(this.worker_amount);
        const gen_src_folder = join(this.cwd, 'gen', 'raw');
        // watcher when worker sends identifier content
        this.worker_controller.events.on('emit', WorkerEmit.identifier, (data: any) => {
            if (!data) {
                return;
            }
            this.identifiers[data.identifier] = {
                name: data.identifier.replace(gen_src_folder + '/', ''),
                doc: data.doc.replace(gen_src_folder + '/', ''),
                layout: data.layout.replace(gen_src_folder + '/', ''),
                page: data.page.replace(gen_src_folder + '/', ''),
            };
        });
        this.perf.end('worker');
    }
    async _init() {
        // // import the data source
        // let datasets_total = null;
        // let is_imported = false;
        // const importer = new Importer();

        // if (this.mode == WyvrMode.build) {
        //     const import_global_path = Config.get('import.global');
        //     let global_data = {};
        //     if (existsSync(import_global_path)) {
        //         try {
        //             global_data = File.read_json(import_global_path);
        //         } catch (e) {
        //             Logger.warning('import global file does not exist', import_global_path);
        //         }
        //     }
        //     const config = Config.get(null);
        //     const import_main_path = Config.get('import.main');
        //     config.env = EnvModel[Env.get()];
        //     config.https = !!config.https;
        //     await Global.set('global', config);

        //     if (import_main_path && existsSync(import_main_path)) {
        //         try {
        //             datasets_total = await importer.import(
        //                 import_main_path,
        //                 (data: { key: number; value: any }) => {
        //                     data.value = this.helper.generate(data.value, config.default_values);
        //                     global_data = Generate.add_to_global(data.value, global_data);
        //                     return data;
        //                 },
        //                 () => {
        //                     is_imported = true;
        //                 }
        //             );
        //         } catch (e) {
        //             Logger.error(e);
        //             return;
        //         }
        //         if (!datasets_total) {
        //             Logger.error('no datasets found');
        //             return;
        //         }
        //         if (!is_imported) {
        //             global_data = await importer.get_global();
        //         }
        //     }
        //     await Global.merge_all(global_data);
        // }
    }

    async execute(changed_files: { event: string; path: string; rel_path: string }[] = [], watched_files: string[] = null) {
        this.is_executing = true;

        const is_regenerating = changed_files.length > 0;

        const only_static = is_regenerating && changed_files.every((file) => file.rel_path.match(/^assets\//));

        this.perf.start('static');
        this.package_tree = copy_static_files(this.cwd, this.package_tree);
        this.perf.end('static');

        this.perf.start('plugins');
        await this.helper.plugins(this.release_path);
        this.perf.end('plugins');

        this.perf.start('i18n');
        await I18N.create();
        this.perf.end('i18n');

        if (only_static) {
            this.is_executing = false;
            return [];
        }

        const watched_json_files = watched_files ? watched_files.map((path) => File.to_index(join(process.cwd(), 'gen', 'data', path), 'json')) : null;

        // collect the files for the generation
        this.perf.start('collect');
        this.package_tree = await this.helper.collect(this.package_tree);
        File.write_json(join('gen', 'package_tree.json'), JSON.parse(JSON.stringify(this.package_tree)));
        this.perf.end('collect');

        const contains_routes = changed_files.find((file) => file.rel_path.match(/^routes\//)) != null;
        let route_urls = [];
        this.perf.start('routes');
        if (!is_regenerating || contains_routes) {
            // get the route files
            [route_urls] = await routes(this.worker_controller, changed_files, !is_regenerating, null);
        } else {
            Logger.improve('routes, will not be regenerated');
        }
        this.perf.end('routes');

        this.perf.start('transform');

        // update the navigation entries
        await Generate.build_nav();

        const collected_files = await this.helper.transform();
        if (!collected_files) {
            fail('no collected files');
        }
        this.perf.end('transform');

        this.perf.start('build');
        if (Env.is_dev()) {
            // write global data to release
            Global.export(join(this.release_path, '_global.json'));
        }
        // read all imported files
        let files = route_urls.length > 0 ? route_urls : File.collect_files(join(this.cwd, 'gen', 'data'), 'json');

        // build static files
        // console.log('identifier_data_list before', this.identifier_data_list)
        let build_pages = [];
        let identifier_data_list = [];
        if (watched_json_files) {
            [build_pages, identifier_data_list] = await build_files(this.worker_controller, files, watched_json_files, changed_files, this.identifier_data_list);
        } else {
            [build_pages, identifier_data_list] = await build_list(this.worker_controller, files);
        }
        // console.log('identifier_data_list', identifier_data_list)
        if (this.identifier_data_list.length == 0) {
            this.identifier_data_list = identifier_data_list;
        }
        this.perf.end('build');

        // inject data into the pages
        this.perf.start('inject');
        const [shortcode_identifier, media] = await this.helper.inject(
            build_pages.map((d) => d.path),
            this.watcher_ports[1],
            this.release_path
        );
        Object.keys(shortcode_identifier).forEach((key) => {
            this.identifiers[key] = shortcode_identifier[key];
        });
        this.perf.end('inject');

        // check if the execution should stop after the build
        const collected_client_files = collected_files.client.map((file) => file.path.replace('gen/', ''));
        const exec_scripts = !is_regenerating || changed_files.some((file) => file.rel_path.match(/^src\//));

        if (exec_scripts) {
            this.perf.start('dependencies');
            const dep_source_folder = join(process.cwd(), 'gen', 'raw');
            Dependency.build(dep_source_folder, build_pages, shortcode_identifier);
            if (Env.is_dev()) {
                // build structure based on the identifiers
                Object.keys(this.identifiers).forEach((id) => {
                    const identifier = this.identifiers[id];
                    let structure: any = null;
                    if (identifier.doc) {
                        structure = Dependency.get_structure(identifier.doc, this.package_tree);
                        structure.layout = Dependency.get_structure(identifier.layout, this.package_tree);
                        structure.layout.page = Dependency.get_structure(identifier.page, this.package_tree);
                    }
                    File.write_json(join(this.release_path, `${id}.json`), structure);
                });
            }
            File.write_json(join('gen', 'dependencies.json'), Dependency.cache);
            File.write_json(join('gen', 'page_dependencies.json'), Dependency.page_cache);

            this.perf.end('dependencies');

            this.perf.start('scripts');
            let identifiers = this.identifiers;
            // when files are watched build only needed scripts
            if (watched_json_files) {
                // get the identfiers of the watched files
                const page_identifiers = Object.keys(Dependency.page_cache)
                    .filter((path) => watched_json_files.find((watched) => path.indexOf(watched) > -1))
                    .map((path) => Dependency.page_cache[path])
                    .map((identifier) => Client.get_identifier_name(['src/doc', 'src/layout', 'src/page'], identifier.doc, identifier.layout, identifier.page));
                // build new identifiers based on the page identifiers
                const watched_identifiers = {};
                Object.keys(identifiers)
                    .filter((name) => page_identifiers.indexOf(name) > -1)
                    .map((name) => {
                        watched_identifiers[name] = identifiers[name];
                    });
                // add shortcode identifiers
                const shortcodes = watched_files.map((file) => {
                    return File.to_index(file, '.html').replace(/^\//, '');
                });
                shortcodes
                    .filter((name) => {
                        return Dependency.cache.___shortcode___[name];
                    })
                    .forEach((name) => {
                        watched_identifiers[name] = { name, shortcodes: Dependency.cache.___shortcode___[name] };
                    });

                identifiers = watched_identifiers;
            }

            const build_scripts = await this.helper.scripts(this.worker_controller, identifiers, !!watched_files);
            this.perf.end('scripts');
        } else {
            Logger.improve('scripts, will not be regenerated');
        }

        this.perf.start('sitemap');
        if (!is_regenerating) {
            await this.helper.sitemap(this.release_path, build_pages);
        } else {
            Logger.improve('sitemap, will not be regenerated');
        }
        this.perf.end('sitemap');

        this.perf.start('link');
        await this.helper.link(this.uniq_id);
        this.perf.end('link');

        if (media) {
            this.perf.start('media');
            await this.helper.media(this.worker_controller, media);
            this.perf.end('media');
        }

        this.perf.start('optimize');
        await optimize(identifier_data_list, this.worker_controller);
        this.perf.end('optimize');

        this.perf.start('release');
        await this.helper.release(this.uniq_id);
        this.perf.end('release');

        this.worker_controller.cleanup();
        this.is_executing = false;
        return build_pages;
    }
}
