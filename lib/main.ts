import { join } from 'path';
import { Logger } from '@lib/logger';
import { WorkerController } from '@lib/worker/controller';
import { Config } from '@lib/config';
import { Env } from '@lib/env';
import { EnvModel } from '@lib/model/env';
import { IPerformance_Measure, Performance_Measure, Performance_Measure_Blank } from '@lib/performance_measure';
import { File } from '@lib/file';
import { WyvrMode } from '@lib/model/wyvr/mode';
import { WorkerEmit } from '@lib/model/worker/emit';
import { DeliverMode } from '@lib/mode/deliver';
import { CronMode } from '@lib/mode/cron';
import { BuildMode } from '@lib/mode/build';
import { cleanup } from '@lib/main/cleanup';
import { Cwd } from '@lib/vars/cwd';
import { ReleasePath } from '@lib/vars/release_path';
import { Mode } from '@lib/vars/mode';
import { UniqId } from '@lib/vars/uniq_id';

export class Main {
    worker_controller: WorkerController = null;
    perf: IPerformance_Measure;
    worker_amount: number;
    identifiers: any = {};
    package_tree = {};
    cron_state = [];
    cron_config = [];
    identifier_data_list = [];
    watcher_ports: [number, number] = [3000, 3001];

    constructor() {
        this.start();
    }
    async start() {
        Cwd.set(process.cwd());
        Env.set(process.env.WYVR_ENV);

        Logger.logo();

        const args = process.argv.slice(2).map((arg) => arg.toLowerCase().trim());
        Mode.set(this.get_mode(args));
        // load build id
        const uniq = [WyvrMode.deliver, WyvrMode.cron].includes(Mode.get()) ? UniqId.load() : UniqId.new();
        if (!uniq) {
            process.exit(1);
            return;
        }
        UniqId.set(uniq);
        // create release folder
        ReleasePath.set(`releases/${UniqId.get()}`);

        process.title = `wyvr ${WyvrMode[Mode.get()]} ${process.pid}`;
        Logger.present('PID', process.pid, Logger.color.dim(`"${process.title}"`));
        Logger.present('cwd', Cwd.get());
        Logger.present('build',  UniqId.get());
        Logger.present('env', EnvModel[Env.get()]);
        Logger.present('mode', WyvrMode[Mode.get()]);
        this.perf = Config.get('import.measure_performance') ? new Performance_Measure() : new Performance_Measure_Blank();

        switch (Mode.get()) {
            case WyvrMode.build:
                const build = new BuildMode(this.perf);
                await build.init();
                this.validate_config();
                cleanup(this.perf);
                this.worker();
                await build.start(this.worker_controller, this.identifiers);
                break;
            case WyvrMode.cron:
                const cron = new CronMode(this.perf);
                await cron.init();
                this.validate_config();
                cleanup(this.perf);
                this.worker();
                await cron.start(this.worker_controller);
                break;
            case WyvrMode.deliver:
                const deliver = new DeliverMode();
                deliver.start();
                break;
            default:
                Logger.error('unknown mode');
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
    validate_config() {
        if (!Config.get('packages')) {
            Logger.error('no packages available, please configure wyvr.js file');
            process.exit(1);
            return;
        }
    }
    worker() {
        this.perf.start('worker');

        this.worker_controller = new WorkerController();
        this.worker_amount = this.worker_controller.get_worker_amount();
        Logger.present('workers', this.worker_amount, Logger.color.dim(`of ${require('os').cpus().length} cores`));
        const workers = this.worker_controller.create_workers(this.worker_amount);
        const gen_src_folder = join(Cwd.get(), 'gen', 'raw');
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
}
