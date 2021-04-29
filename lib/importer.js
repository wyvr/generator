const fs = require('fs');
const path = require('path');
const stream_array = require('stream-json/streamers/StreamArray');
const dir = require('_lib/dir');
const file = require('_lib/file');
const config = require('_lib/config');
const logger = require('_lib/logger');

const cwd = process.cwd();

const importer = {
    chunk_index: 0,
    state_file: path.join(cwd, 'state', 'import.json'),
    state: null,
    perf: null,
    /**
     * import the datasets from the given filepath into `imported/data`
     * the callback must return the original object or a modified version, because it will be executed before the processing of the data
     * @param {string} import_file_path
     * @param {null|function} callback
     */
    import(import_file_path, callback) {
        this.perf.start('import');
        dir.create('imported/data');
        if (!this.should_import(import_file_path)) {
            const state = this.load_import_state();
            if (state) {
                logger.success('existing datasets', state.datasets_amount);
                this.perf.end('import');

                return state.datasets_amount;
            }
        }

        return new Promise((resolve, reject) => {
            const jsonStream = stream_array.withParser();
            const fileStream = fs.createReadStream(import_file_path, { flags: 'r', encoding: 'utf-8' }).pipe(jsonStream.input);
            this.chunk_index = 0;

            const format_processed_file = config.get('import.format_processed_file');

            if (callback && typeof callback == 'function') {
                jsonStream.on('data', (data) => {
                    this.process(callback(data), format_processed_file);
                });
            } else {
                jsonStream.on('data', ({ key, value }) => {
                    this.process({ key, value }, format_processed_file);
                });
            }
            jsonStream.on('error', (e) => {
                reject(e);
            });
            jsonStream.on('end', () => {
                this.save_import_state(import_file_path, this.chunk_index);
                logger.success('datasets imported', this.chunk_index);
                this.perf.end('import');
                resolve(this.chunk_index);
            });
        });
    },
    /**
     * stores the given value as dataset on the filesystem
     * @param {{key:number, value: any}} data
     */
    process({ key, value }, format_processed_file) {
        const perf_mark = `import/process ${value.url}`;
        this.perf.start(perf_mark);
        const filepath = file.to_extension(path.join(cwd, 'imported', 'data', value.url), 'json');

        fs.writeFileSync(filepath, JSON.stringify(value, null, format_processed_file ? 4 : null));

        this.perf.end(perf_mark);
        this.chunk_index++;
    },
    /**
     * Save the last import as state for next import
     * @param {string} import_file_path 
     * @param {number} datasets_amount 
     */
    save_import_state(import_file_path, datasets_amount) {
        const mtimeMs = fs.statSync(import_file_path).mtimeMs;
        file.create_dir(this.state_file);
        fs.writeFileSync(this.state_file, JSON.stringify({ mtimeMs, datasets_amount }, null, 4));
    },
    /**
     * Load the last import state, return null when nothing is present
     */
    load_import_state() {
        if (fs.existsSync(this.state_file)) {
            try {
                const content = fs.readFileSync(this.state_file);
                const json = JSON.parse(content);
                return json;
            } catch (e) {
                return null;
            }
        }
        return null;
    },
    /**
     * Return whether the import file should be imported
     * @param {string} import_file_path 
     */
    should_import(import_file_path) {
        if (!this.state) {
            this.state = this.load_import_state();
            const fs_stats = fs.statSync(import_file_path);
            if (this.state && fs_stats) {
                // only if modify date has changed
                if (this.state.mtimeMs == fs_stats.mtimeMs) {
                    logger.info('no import needed', 'unchanged');
                    return false;
                }
            }
        }
        return true;
    },
    /**
     * performance measuring factory, when measuring is needed
     */
    get_performance_func() {
        const func = {
            start: () => {},
            end: () => {},
        };
        // when set to false return empty functions
        if (!config.get('import.measure_performance')) {
            return func;
        }
        return require('./perf_measure');
    },
};
// set performance function
importer.perf = importer.get_performance_func();

module.exports = importer;
