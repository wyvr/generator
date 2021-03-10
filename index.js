const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const hr_start = process.hrtime();

const build = require('./lib/build');
const bundle = require('./lib/bundle');
const link = require('./lib/link');
const importer = require('./lib/importer');
const dir = require('./lib/dir');
const output = require('./lib/output');
const worker_controller = require('./lib/worker/controller');
const config = require('./lib/config');

const filename = './src/App.svelte';

const uniq_id = uuidv4().split('-')[0];
const pid = process.pid;
const cwd = process.cwd();

(async () => {
    process.title = '[wyvr] [master] generator';
    output.logo();
    output.present('PID', `${pid} ${output.color.dim(`"${process.title}"`)}`);
    output.present('cwd', cwd);
    output.present('build', uniq_id);

    const project_config = config.get();

    const worker_amount = worker_controller.get_worker_amount();
    output.present('cpu cores', require('os').cpus().length);
    output.present('used workers', worker_amount);

    dir.create('pub');

    try {
        const datasets = await importer.import('./data/sample.json');
        output.present('datasets imported', datasets);
    } catch (e) {
        output.error(e);
        return;
    }

    // const component = build.compile(filename);
    // // console.log('component', component)

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

    // symlink the "static" folders to pub
    link.to_pub('assets');

    var hr_end = process.hrtime(hr_start); // hr_end[0] is in seconds, hr_end[1] is in nanoseconds
    const timeInMs = (hr_end[0] * 1000000000 + hr_end[1]) / 1000000; // convert first to ns then to ms
    output.present('total execution time', `${timeInMs} ms`);
})();
