const cwd = process.cwd();
const pkg = require(cwd + '/package.json');
const color = require('ansi-colors');

module.exports = {
    log(...message) {
        console.log(...message);
    },
    present(key, value) {
        console.log(key, color.green(value))
    },
    logo() {
        const logo = [
            '                              __',
            '  wyvr____ ___  ___ _______ _/ /____  ____',
            ' / _ `/ -_) _ \\/ -_) __/ _ `/ __/ _ \\/ __/',
            ' \\_, /\\__/_//_/\\__/_/  \\_,_/\\__/\\___/_/',
            '/___/',
        ].join('\n');
        console.log(color.green(logo) + ` ${color.dim('v')}${color.yellow(pkg.version)}`);
        console.log('');
    },
};
