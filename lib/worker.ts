import { WorkerHelper } from '@lib/worker/helper';
import { WorkerStatus } from '@lib/model/worker/status';
import { WorkerAction } from '@lib/model/worker/action';
import { File } from '@lib/file';
import { Build } from '@lib/build';
import { Dir } from '@lib/dir';
import { join, dirname } from 'path';
import * as fs from 'fs-extra';
import { LogType } from './model/log';

export class Worker {
    private config = null;
    private env = null;
    private cwd = process.cwd();
    private global_data: any = null;
    constructor() {
        this.init();
    }
    async init() {
        process.title = `wyvr worker ${process.pid}`;

        WorkerHelper.send_status(WorkerStatus.exists);

        process.on('message', async (msg) => {
            const action = msg?.action?.key;
            const value = msg?.action?.value;
            if (!value) {
                WorkerHelper.log(LogType.warning, 'ignored message from main, no value given', msg);
                return;
            }
            switch (action) {
                case WorkerAction.configure:
                    // set the config of the worker by the main process
                    this.config = value?.config;
                    this.env = value?.env;
                    this.cwd = value?.cwd;
                    this.global_data = value?.global_data;
                    // only when everything is configured set the worker idle
                    if ((!this.config && this.env == null) || !this.cwd) {
                        WorkerHelper.log(LogType.warning, 'invalid configure value', value);
                        return;
                    }
                    // set function to get global data in the svelte files 
                    (<any>global).getGlobal = (key: string) => {
                        if(!key || !this.global_data) {
                            return null;
                        }
                        const steps = key.split('.');
                        let value = null;
                        for (let i = 0; i < steps.length; i++) {
                            if(i == 0) {
                                value = this.global_data[steps[i]];
                                continue;
                            }
                            if(!value && !value[steps[i]]) {
                                return null;
                            }
                            value = value[steps[i]];
                        }
                        
                        return value;
                    }
                    WorkerHelper.send_status(WorkerStatus.idle);
                    break;
                case WorkerAction.build:
                    WorkerHelper.send_status(WorkerStatus.busy);
                    const result = await Promise.all(
                        value.map((filename) => {
                            const data = File.read_json(filename);
                            if (!data) {
                                WorkerHelper.log(LogType.error, 'broken/missing/empty file', filename);
                                return;
                            }
                            const doc_file_name = File.find_file(join(this.cwd, 'src', 'doc'), data._wyvr.template.doc);
                            const layout_file_name = File.find_file(join(this.cwd, 'src', 'layout'), data._wyvr.template.layout);
                            const page_file_name = File.find_file(join(this.cwd, 'src', 'page'), data._wyvr.template.page);

                            const page_code = Build.get_page_code(data, doc_file_name, layout_file_name, page_file_name);
                            const compiled = Build.compile(page_code);
                            // console.log(JSON.stringify(compiled))
                            if(compiled.error) {
                                // svelte error messages
                                WorkerHelper.log(LogType.error, '[svelte]', filename , compiled);
                                return;
                            }
                            const rendered = Build.render(compiled, data);
                            // console.log(rendered);

                            //const component = build.compile(filename);
                            //console.log('component', component)
                            // const rendered = build.render(component, { name: 'P@', details: true });
                            // console.log('rendered');
                            // console.log(rendered.result.html)
                            // await bundle.build(filename)
                            // const demo_file = `
                            // <!doctype html>
                            // <html>
                            //     <head>
                            //         <link href="/assets/global.css?${uniq_id}" rel="stylesheet" />
                            //     </head>
                            //     <body>
                            //         ${rendered.result.html}
                            //         <script src="/bundle.js?${uniq_id}"></script>
                            //     </body>
                            // </html>`;
                            // fs.writeFileSync('./pub/index.html', demo_file);
                            const path = File.to_extension(filename.replace(join(this.cwd, 'imported', 'data'), 'pub'), 'html');
                            // console.log(filename, path);
                            fs.mkdirSync(dirname(path), { recursive: true });
                            fs.writeFileSync(path, rendered.result.html);

                            return filename;
                        })
                    );
                    // console.log('result', result);
                    WorkerHelper.send_status(WorkerStatus.idle);
                    break;
                case WorkerAction.status:
                    WorkerHelper.log(LogType.debug, 'setting status from outside is not allowed');
                    break;
                default:
                    WorkerHelper.log(LogType.warning, 'unknown message action from outside', msg);
                    break;
            }
        });

        process.on('uncaughtException', (err) => {
            WorkerHelper.log(LogType.error, 'uncaughtException', err.message, err.stack);
            process.exit(1);
        });
    }
}
