import { readFileSync, writeFileSync, existsSync } from 'fs-extra';
import { v4 } from 'uuid';
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

export class Main {
    mode: WyvrMode = WyvrMode.build;
    worker_controller: WorkerController = null;
    helper = new MainHelper();
    perf: IPerformance_Measure;
    worker_amount: number;
    identifiers: any = {};
    is_executing: boolean = false;
    cwd = process.cwd();
    uniq_id = v4().split('-')[0];
    release_path = null;
    package_tree = {};
    cron_state = [];
    cron_config = [];
    identifier_data_list = [];
    watcher_ports: [number, number] = [3000, 3001];

    constructor() {
        Env.set(process.env.WYVR_ENV);
        const args = process.argv.slice(2).map((arg) => arg.toLowerCase().trim());
        if (args.indexOf('cron') > -1) {
            this.mode = WyvrMode.cron;
        }
        this.init();
    }
    async init() {
        const hr_start = process.hrtime();
        const pid = process.pid;
        process.title = `wyvr main ${pid}`;
        Logger.logo();
        this.perf = Config.get('import.measure_performance') ? new Performance_Measure() : new Performance_Measure_Blank();

        this.perf.start('config');
        Logger.present('PID', pid, Logger.color.dim(`"${process.title}"`));
        Logger.present('cwd', this.cwd);
        Logger.present('build', this.uniq_id);
        Logger.present('env', EnvModel[Env.get()]);
        Logger.present('mode', WyvrMode[this.mode]);

        const uniq_id_file = join('gen', 'uniq.txt');
        if (this.mode == WyvrMode.build) {
            Dir.clear('gen');
            writeFileSync(uniq_id_file, this.uniq_id);

            if (Env.is_dev()) {
                // get the first 2 free ports for the watcher
                this.watcher_ports[0] = await Port.find(); // server
                this.watcher_ports[1] = await Port.find(); // socket
                Logger.present('server port', this.watcher_ports[0]);
                Logger.present('socket port', this.watcher_ports[1]);
            }
        }
        this.perf.end('config');

        if (this.mode == WyvrMode.cron) {
            Logger.block('cron');
            this.perf.start('cron');
            if (!existsSync(uniq_id_file)) {
                Logger.warning('no previous version found in', uniq_id_file);
                process.exit(1);
                return;
            }
            // get the configs
            this.uniq_id = readFileSync(uniq_id_file, { encoding: 'utf-8' });
            Config.set(File.read_json(join('gen', 'config.json')));
            this.cron_state = File.read_json(join('gen', 'cron.json'));
            this.package_tree = File.read_json(join('gen', 'package_tree.json'));

            if (this.cron_state) {
                const current = new Date().getTime();
                this.cron_state = this.cron_state.filter((state) => {
                    return state.last_execution + state.every * 60 * 1000 < new Date().getTime();
                });
            } else {
                this.cron_state = [];
            }
            Logger.info('rebuild', this.cron_state.length, 'routes');
            this.perf.end('cron');

            if (this.cron_state.length == 0) {
                Logger.improve('nothing to build');
                return;
            }
        }
        if (!Config.get('packages')) {
            Logger.warning('no packages available, please configure wyvr.js file');
            return;
        }

        this.perf.start('cleanup');
        // remove old releases
        this.helper.cleanup_releases(this.mode, Config.get('releases.keep') ?? 0);
        // create release folder
        this.release_path = `releases/${this.uniq_id}`;
        Dir.create(this.release_path);
        this.perf.end('cleanup');

        // collect configured package
        if (this.mode == WyvrMode.build) {
            Logger.block('build');
            this.perf.start('packages');
            const packages = await this.helper.packages();
            this.perf.end('packages');
            Logger.debug('project_config', JSON.stringify(Config.get(), null, 4));
        }
        // import the data source
        let datasets_total = null;
        let is_imported = false;
        const importer = new Importer();

        if (this.mode == WyvrMode.build) {
            const import_global_path = Config.get('import.global');
            let global_data = {};
            if (existsSync(import_global_path)) {
                try {
                    global_data = File.read_json(import_global_path);
                } catch (e) {
                    Logger.warning('import global file does not exist', import_global_path);
                }
            }
            const config = Config.get(null);
            const import_main_path = Config.get('import.main');
            config.env = EnvModel[Env.get()];
            config.https = !!config.https;
            await Global.set('global', config);

            if (import_main_path && existsSync(import_main_path)) {
                try {
                    datasets_total = await importer.import(
                        import_main_path,
                        (data: { key: number; value: any }) => {
                            data.value = this.helper.generate(data.value, config.default_values);
                            global_data = Generate.add_to_global(data.value, global_data);
                            return data;
                        },
                        () => {
                            is_imported = true;
                        }
                    );
                } catch (e) {
                    Logger.error(e);
                    return;
                }
                if (!datasets_total) {
                    Logger.error('no datasets found');
                    return;
                }
                if (!is_imported) {
                    global_data = await importer.get_global();
                }
            }
            await Global.merge_all(global_data);
        }

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

        if (this.mode == WyvrMode.cron) {
            // execute the routes
            this.perf.start('routes');
            const [route_files, cron_routes] = await this.routes(null, true, this.cron_state);
            this.perf.end('routes');

            // avoid empty build
            if (!cron_routes || cron_routes.length == 0) {
                this.helper.fail('no routes to rebuild');
                return;
            }
            // build the cron routes
            this.perf.start('build');
            // build static files
            const [build_pages, identifier_data_list] = await this.helper.build_files(this.worker_controller, cron_routes);
            this.perf.end('build');

            this.perf.start('optimize');
            await this.helper.optimize(identifier_data_list, this.worker_controller);
            this.perf.end('optimize');

            // update last execution time in cron file
            const state_ids = this.cron_state.map((state) => state.id);
            const new_cron_config = Config.get('cron').map((entry) => {
                const index = state_ids.indexOf(entry.id);
                if (index > -1) {
                    entry.last_execution = new Date().getTime();
                }
            });
            const timeInMs = hrtime_to_ms(process.hrtime(hr_start));
            Logger.stop('cron total', timeInMs);
        }
        if (this.mode == WyvrMode.build) {
            // execute
            await this.execute();

            // save config for cron and debugging
            File.write_json('gen/config.json', Config.get());

            const timeInMs = hrtime_to_ms(process.hrtime(hr_start));
            Logger.stop('initial total', timeInMs);
        }

        // save cron file
        const cron = Config.get('cron');
        if (cron) {
            File.write_json(
                'gen/cron.json',
                cron.map((entry) => {
                    entry.last_execution = new Date().getTime();
                    return entry;
                })
            );
        }

        if (Env.is_prod() || this.mode == WyvrMode.cron) {
            Logger.success('shutdown');
            process.exit(0);
            return;
        }
        if (this.mode == WyvrMode.build) {
            // watch for file changes
            try {
                const watch = new Watch(this.watcher_ports, async (changed_files: any[], watched_files: string[]) => {
                    Plugin.clear();
                    return await this.execute(changed_files, watched_files);
                });
            } catch (e) {
                this.helper.fail(e);
            }
        }
    }

    async execute(changed_files: { event: string; path: string; rel_path: string }[] = [], watched_files: string[] = null) {
        this.is_executing = true;

        const is_regenerating = changed_files.length > 0;

        const only_static = is_regenerating && changed_files.every((file) => file.rel_path.match(/^assets\//));

        this.perf.start('static');
        this.package_tree = this.helper.copy_static_files(this.package_tree);
        this.perf.end('static');

        this.perf.start('plugins');
        await this.helper.plugins(this.release_path);
        this.perf.end('plugins');

        this.perf.start('i18n');
        await this.helper.i18n();
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
            [route_urls] = await this.routes(changed_files, !is_regenerating, null);
        } else {
            Logger.improve('routes, will not be regenerated');
        }
        this.perf.end('routes');

        this.perf.start('transform');

        // update the navigation entries
        await Generate.build_nav();

        const collected_files = await this.helper.transform();
        if (!collected_files) {
            this.helper.fail('no collected files');
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
            [build_pages, identifier_data_list] = await this.helper.build_files(this.worker_controller, files, watched_json_files, changed_files, this.identifier_data_list);
        } else {
            [build_pages, identifier_data_list] = await this.helper.build_list(this.worker_controller, files);
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
        await this.helper.optimize(identifier_data_list, this.worker_controller);
        this.perf.end('optimize');

        this.perf.start('release');
        await this.helper.release(this.uniq_id);
        this.perf.end('release');

        this.worker_controller.cleanup();
        this.is_executing = false;
        return build_pages;
    }
    async routes(changed_files: any[], enhance_data: boolean = true, cron_state: any[] = null): Promise<[any[], any[]]> {
        let completed_routes = 0;
        const on_global_index = this.worker_controller.events.on('emit', WorkerEmit.global, async (data) => {
            // add the results to the global data
            if (data) {
                await Global.merge_all(data.data);
            }
            completed_routes++;
        });
        const [route_files, cron_routes, routes_count] = await this.helper.routes(this.worker_controller, this.package_tree, changed_files, enhance_data, cron_state);

        // wait for the global event actions to complete
        Logger.text('waiting for the events to finish');
        try {
            await new Promise((resolve, reject) => {
                const guard = setTimeout(() => {
                    reject('timeout waiting for global events to complete');
                }, 60000);
                const interval = setInterval(() => {
                    if (completed_routes == routes_count) {
                        clearInterval(interval);
                        clearTimeout(guard);
                        resolve(true);
                    }
                }, 100);
            });
        } catch (e) {
            console.log(e);
        }
        this.worker_controller.events.off('emit', WorkerEmit.global, on_global_index);

        return [route_files, cron_routes];
    }
}
