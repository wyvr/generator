const fs = require('fs');
const path = require('path');
const stream_array = require('stream-json/streamers/StreamArray');
const dir = require('./dir');
const file = require('./file');
const cwd = process.cwd();
const config = require('./config');

module.exports = {
    chunk_index: 0,
    /**
     * import the datasets from the given filepath into `imported/data`
     * the callback must return the original object or a modified version, because it will be executed before the processing of the data
     * @param {string} import_file_path
     * @param {null|function} callback
     */
    import(import_file_path, callback) {
        dir.create('imported/data');

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
                resolve(this.chunk_index);
            });
        });
    },
    /**
     * stores the given value as dataset on the filesystem
     * @param {{key:number, value: any}} data
     */
    process({ key, value }, format_processed_file) {
        const filepath = file.to_extension(path.join(cwd, 'imported/data', value.url), 'json');
        
        fs.writeFileSync(filepath, JSON.stringify(value, null, format_processed_file ? 4 : null));
        
        this.chunk_index++;
    },
};
