const fs = require('fs');
const stream_array = require('stream-json/streamers/StreamArray');

module.exports = {
    process(import_file_path, callback) {
        if (!callback || typeof callback != 'function') {
            return null;
        }
        return new Promise((resolve, reject) => {
            const jsonStream = stream_array.withParser();
            const fileStream = fs.createReadStream(import_file_path, { flags: 'r', encoding: 'utf-8' }).pipe(jsonStream.input);
            let chunk_index = 0;

            jsonStream.on('data', ({ key, value }) => {
                callback(key, value);
                chunk_index++;
            });
            jsonStream.on('error', (e) => {
                reject(e);
            });
            jsonStream.on('end', () => {
                resolve(chunk_index);
            });
        });
    },
};
