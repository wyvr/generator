import { WorkerHelper } from '@lib/worker/helper';
import { WorkerStatus } from '@lib/model/worker/status';
import { WorkerAction } from '@lib/model/worker/action';
import { File } from '@lib/file';
import { Build } from '@lib/build';
import { Dir } from '@lib/dir';
import { join, dirname } from 'path';
import * as fs from 'fs-extra';

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
                console.log('ignored message from main, no value given', msg);
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
                    if (this.config && this.env && this.cwd) {
                        WorkerHelper.send_status(WorkerStatus.idle);
                    }
                    break;
                case WorkerAction.build:
                    WorkerHelper.send_status(WorkerStatus.busy);
                    const result = await Promise.all(
                        value.map((filename) => {
                            const data = File.read_json(filename);
                            if (!data) {
                                console.log('ERR', 'broken/missing/empty file', filename);
                                return;
                            }
                            const doc_file_name = File.find_file(join(this.cwd, 'src', 'doc'), data._wyvr.template.doc);
                            const layout_file_name = File.find_file(join(this.cwd, 'src', 'layout'), data._wyvr.template.layout);
                            const page_file_name = File.find_file(join(this.cwd, 'src', 'page'), data._wyvr.template.page);

                            const compiled = Build.compile(`
                            <script>
                                import Doc from '${doc_file_name}';
                                import Layout from '${layout_file_name}';
                                import Page from '${page_file_name}';
                                const data = ${JSON.stringify(data)};
                            </script>

                            <Doc data={data}>
                                <Layout data={data}>
                                    <Page data={data}>
                                    ${data.content || ''}
                                    </Page>
                                </Layout>
                            </Doc>
                            `);
                            // const compiled = Build.compile(`
                            // <script>
                            // const data = ${JSON.stringify(data)};
                            // </script>
                            // TEST
                            // ${data.content || ''}
                            // `);
                            const rendered = Build.render(compiled, data);

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
                            console.log(filename, path)
                            fs.mkdirSync(dirname(path), { recursive: true });
                            fs.writeFileSync(path, rendered.result.html);

                            return filename;
                        })
                    );
                    console.log('result', result);
                    WorkerHelper.send_status(WorkerStatus.idle);
                    break;
                case WorkerAction.status:
                default:
                    console.log('ignored message from main', msg);
                    break;
            }
        });

        process.on('uncaughtException', (err) => {
            console.error('worker PID', process.pid, 'uncaughtException', err.message, err.stack);
            process.exit(1);
        });
    }
}
