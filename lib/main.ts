import * as fs from 'fs-extra';

import { v4 } from 'uuid';

import { Build } from '@lib/build';
import { Bundle } from '@lib/bundle';
import { Generate } from '@lib/generate';

import { Link } from '@lib/link';
import { Importer } from '@lib/importer';
import { Dir } from '@lib/dir';
import { Logger } from '@lib/logger';
import { WorkerController } from '@lib/worker/controller';
import { Config } from '@lib/config';
import { Env } from '@lib/env';
import { EnvModel } from '@lib/model/env';
import { Queue } from '@lib/queue';
import { WorkerAction } from '@lib/model/worker/action';
import { WorkerStatus } from '@lib/model/worker/status';
import { IPerformance_Measure, Performance_Measure, Performance_Measure_Blank } from '@lib/performance_measure';
import { WorkerModel } from '@lib/model/worker/worker';
import { File } from '@lib/file';
import { Client } from '@lib/client';
import { dirname, join } from 'path';
import chokidar from 'chokidar';
import { hrtime_to_ms } from '@lib/converter/time';

export class Main {
    queue: Queue = null;
    worker_controller: WorkerController = null;
    perf: IPerformance_Measure;
    worker_amount: number;
    global_data: any = null;
    entrypoints: any = {};
    changed_files: any[] = [];
    is_executing: boolean = false;
    constructor() {
        Env.set(process.env.WYVR_ENV);
        this.init();
    }
    async init() {
        const hr_start = process.hrtime();
        const uniq_id = v4().split('-')[0];
        const pid = process.pid;
        const cwd = process.cwd();
        process.title = `wyvr main ${pid}`;
        Logger.logo();
        Logger.present('PID', pid, Logger.color.dim(`"${process.title}"`));
        Logger.present('cwd', cwd);
        Logger.present('build', uniq_id);
        Logger.present('env', EnvModel[Env.get()]);

        const project_config = Config.get();

        this.perf = Config.get('import.measure_performance') ? new Performance_Measure() : new Performance_Measure_Blank();

        Dir.create('pub');

        // import the data source
        let datasets_total = null;
        let is_imported = false;
        const importer = new Importer();

        try {
            this.global_data = File.read_json('./data/global.json');
            const import_path = join(cwd, 'data/sample.json');
            if (fs.existsSync(import_path)) {
                datasets_total = await importer.import(
                    import_path,
                    (data: { key: number; value: any }) => {
                        return this.generate(data);
                    },
                    () => {
                        is_imported = true;
                        importer.set_global(this.global_data);
                    }
                );
            } else {
                Logger.warning('import file does not exist', import_path);
            }
        } catch (e) {
            Logger.error(e);
            return;
        }
        if (!datasets_total) {
            Logger.error('no datasets found');
            return;
        }
        if (!is_imported) {
            this.global_data = await importer.get_global();
        }

        this.worker_controller = new WorkerController(this.global_data);
        this.worker_amount = this.worker_controller.get_worker_amount();
        Logger.present('workers', this.worker_amount, Logger.color.dim(`of ${require('os').cpus().length} cores`));
        const workers = this.worker_controller.create_workers(this.worker_amount);
        this.worker_controller.on_entrypoint((data: any) => {
            this.entrypoints[data.entrypoint] = {
                name: data.entrypoint,
                doc: data.doc,
                layout: data.layout,
                page: data.page,
            };
        });

        // collect configured themes
        this.perf.start('themes');
        const themes = await this.themes();
        this.perf.end('themes');
        Logger.debug('project_config', JSON.stringify(Config.get(), null, 4));

        // execute
        await this.execute(importer.get_import_list());

        const timeInMs = hrtime_to_ms(process.hrtime(hr_start));
        Logger.success('initial execution time', timeInMs, 'ms');

        if (Env.is_prod()) {
            Logger.success('shutdown');
            process.exit(0);
            return;
        }
        this.watch(importer.get_import_list());
    }
    async themes() {
        const themes = Config.get('themes');
        const disabled_themes = [];
        const available_themes = [];
        if (themes && Array.isArray(themes)) {
            // reset the config
            Config.set({ themes: null });
            themes.forEach((theme, index) => {
                // set default name for the config
                if (!theme.name) {
                    theme.name = '#' + index;
                }
                if (fs.existsSync(theme.path)) {
                    available_themes.push(theme);
                    return;
                }

                disabled_themes.push(theme);
            });
            const new_config = { themes: available_themes };
            Logger.debug('update config', JSON.stringify(new_config));
            Config.set(new_config);
        }
        Logger.present(
            'themes',
            available_themes
                ?.map((theme) => {
                    return `${theme.name}@${Logger.color.dim(theme.path)}`;
                })
                .join(' ')
        );
        if (disabled_themes.length) {
            Logger.warning(
                'disabled themes',
                disabled_themes
                    .map((theme) => {
                        return `${theme.name}@${Logger.color.dim(theme.path)}`;
                    })
                    .join(' ')
            );
        }

        return themes;
    }
    async collect() {
        const themes = Config.get('themes');
        if (themes) {
            themes.forEach((theme) => {
                // copy the files from the theme to the project
                ['src', 'assets'].forEach((part) => {
                    if (fs.existsSync(join(theme.path, part))) {
                        fs.copySync(join(theme.path, part), part);
                    }
                });
            });
        }
        if (!fs.existsSync('src')) {
            Logger.error('missing folder', 'src');
            return null;
        }
        fs.copySync('src', 'gen/src');
        const svelte_files = Client.collect_svelte_files('gen/src');
        // replace global data in the svelte files
        svelte_files.map((file) => {
            const raw_content = fs.readFileSync(file.path, { encoding: 'utf-8' });
            const combined_content = Client.insert_splits(file.path, raw_content);
            const content = Client.replace_global(combined_content, this.global_data);
            fs.writeFileSync(file.path, content);
        });
        // search for hydrateable files
        const hydrateable_files = Client.get_hydrateable_svelte_files(svelte_files);
        // copy the hydrateable files into the gen/client folder
        fs.mkdirSync('gen/client', { recursive: true });
        hydrateable_files.map((file) => {
            const source_path = file.path;
            const path = file.path.replace(/^gen\/src/, 'gen/client');
            fs.mkdirSync(dirname(path), { recursive: true });
            fs.writeFileSync(path, Client.replace_slots_client(fs.readFileSync(source_path, { encoding: 'utf-8' })));
            return file;
        });
        // correct the import paths in the static files
        Client.correct_svelte_file_import_paths(svelte_files);

        // @todo replace global in the svelte components which should be hydrated
        const transformed_files = Client.transform_hydrateable_svelte_files(hydrateable_files);
        return {
            src: svelte_files,
            client: transformed_files,
        };
    }
    async build(list: string[]): Promise<boolean> {
        fs.mkdirSync('gen/src', { recursive: true });
        Logger.info('build datasets', list.length);
        // create new queue
        this.queue = new Queue();

        // add the items from the list to the queue in batches for better load balancing
        const amount = list.length;
        const batch_size = 10;

        let runs = Math.ceil(amount / batch_size);
        Logger.info('build runs', runs);

        for (let i = 0; i < runs; i++) {
            const queue_data = {
                action: WorkerAction.build,
                data: list.slice(i * batch_size, (i + 1) * batch_size),
            };
            this.queue.push(queue_data);
        }

        return new Promise((resolve, reject) => {
            const listener_id = this.worker_controller.on(WorkerStatus.idle, () => {
                if (this.tick(this.queue)) {
                    this.worker_controller.off(listener_id);
                    resolve(true);
                }
            });
        });
    }
    async scripts(): Promise<boolean> {
        fs.mkdirSync('gen/js', { recursive: true });
        const keys = Object.keys(this.entrypoints);
        const amount = keys.length;
        Logger.info('build scripts', amount);
        // create new queue
        this.queue = new Queue();

        // add the items from the list to the queue in batches for better load balancing
        const batch_size = 10;

        let runs = Math.ceil(amount / batch_size);
        Logger.info('build runs', runs);

        for (let i = 0; i < runs; i++) {
            const queue_data = {
                action: WorkerAction.scripts,
                data: keys.slice(i * batch_size, (i + 1) * batch_size).map((key) => this.entrypoints[key]),
            };
            this.queue.push(queue_data);
        }
        return new Promise((resolve, reject) => {
            const listener_id = this.worker_controller.on(WorkerStatus.idle, () => {
                if (this.tick(this.queue)) {
                    this.worker_controller.off(listener_id);
                    resolve(true);
                }
            });
        });
    }
    ticks: number = 0;
    tick(queue: Queue): boolean {
        const workers = this.worker_controller.get_idle_workers();
        this.ticks++;
        if (workers.length == this.worker_amount && queue.length == 0) {
            return true;
        }
        if (queue.length > 0) {
            // get all idle workers
            if (workers.length > 0) {
                workers.forEach((worker) => {
                    const queue_entry = queue.take();
                    if (queue_entry != null) {
                        // set worker busy otherwise the same worker gets multiple actions send
                        worker.status = WorkerStatus.busy;
                        // send the data to the worker
                        this.worker_controller.send_action(worker.pid, queue_entry.action, queue_entry.data);
                    }
                });
            }
        }
        return false;
    }

    generate(data: { key: number; value: any }) {
        // enhance the data from the pages
        data.value = Generate.enhance_data(data.value);
        // extract navigation data
        const nav_result = data.value._wyvr.nav;
        if (nav_result) {
            if (!this.global_data.nav) {
                this.global_data.nav = {};
            }
            if (!this.global_data.nav.all) {
                this.global_data.nav.all = [];
            }

            if (nav_result.scope) {
                if (!this.global_data.nav[nav_result.scope]) {
                    this.global_data.nav[nav_result.scope] = [];
                }
                this.global_data.nav[nav_result.scope].push(nav_result);
            }
            this.global_data.nav.all.push(nav_result);
        }
        return data;
    }

    fail() {
        Logger.error('failed');
        process.exit(1);
    }

    watch(file_list: any[]) {
        const themes = Config.get('themes');
        if (!themes || !Array.isArray(themes) || themes.length == 0) {
            Logger.warning('no themes to watch');
            this.fail();
            return;
        }

        // start reloader
        const bs = require('browser-sync').create();
        bs.init(
            {
                proxy: Config.get('url'),
                ghostMode: false
            },
            function () {
                Logger.info('sync is ready');
            }
        );
        // watch for file changes
        let debounce = null;
        chokidar
            .watch(
                themes.map((theme) => theme.path),
                {
                    ignoreInitial: true,
                }
            )
            .on('all', (event, path) => {
                if (path.indexOf('/.git/') > -1) {
                    return;
                }
                const theme = themes.find((t) => path.indexOf(t.path) > -1);
                if (theme) {
                    Logger.info('detect', `${event} ${theme.name}@${Logger.color.dim(path.replace(theme.path, ''))}`);
                } else {
                    Logger.warning('detect', `${event}@${Logger.color.dim(path)}`, 'from unknown theme');
                }
                this.changed_files.push({ event, path });
                if (debounce) {
                    clearTimeout(debounce);
                }
                setTimeout(async () => {
                    const hr_start = process.hrtime();
                    const files = this.changed_files.filter((x) => x);
                    // reset the files
                    this.changed_files.length = 0;
                    console.log(files);
                    await this.execute(file_list);
                    bs.reload();
                    const timeInMs = hrtime_to_ms(process.hrtime(hr_start));
                    Logger.success('watch execution time', timeInMs, 'ms');
                }, 2000);
            });
        Logger.info('watching', themes.length, 'themes');
    }

    async execute(file_list: any[]) {
        if (this.is_executing == true) {
            return;
        }
        this.is_executing = true;

        // Process files in workers
        this.perf.start('collect');
        const collected_files = await this.collect();
        this.perf.end('collect');
        if (!collected_files) {
            this.fail();
        }

        // Process files in workers
        this.perf.start('build');
        const build_pages = await this.build(file_list);
        this.perf.end('build');

        this.perf.start('scripts');
        const build_scripts = await this.scripts();
        this.perf.end('scripts');

        // symlink the "static" folders to pub
        Link.to_pub('assets');
        Link.to_pub('gen/js', 'js');
        this.worker_controller.cleanup();
        this.is_executing = false;
    }
}
