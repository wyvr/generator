import * as fs from 'fs-extra';

import { join } from 'path';
import stream_array from 'stream-json/streamers/StreamArray';
import stream_object from 'stream-json/streamers/StreamObject';
import { Dir } from '@lib/dir';
import { File } from '@lib/file';
import { Config } from '@lib/config';
import { Logger } from '@lib/logger';
import { IPerformance_Measure, Performance_Measure, Performance_Measure_Blank } from '@lib/performance_measure';
import { Global } from '@lib/global';

const cwd = process.cwd();

export class Importer {
    chunk_index = 0;
    state_file = join(cwd, 'gen', 'import.json');
    state_list_file = join(cwd, 'gen', 'import_list.json');
    state_global_file = join(cwd, 'gen', 'global.json');
    state = null;
    list: string[] = [];
    perf: IPerformance_Measure;
    constructor() {
        this.perf = Config.get('import.measure_performance') ? new Performance_Measure() : new Performance_Measure_Blank();
    }
    /**
     * import the datasets from the given filepath into `gen/data`
     * @param import_file_path path to the file which should be imported
     * @param hook_before_process the hook_before_process must return the original object or a modified version, because it will be executed before the processing of the data
     * @returns the amount of imported datasets
     */
    import(import_file_path: string, hook_before_process: Hook_Before_Process = null, hook_after_import: Function): Promise<number> {
        this.perf.start('import');

        Dir.create('gen/data');
        if (!this.should_import(import_file_path)) {
            const state = this.load_import_state();
            if (state) {
                Logger.success('existing datasets', state.datasets_amount);
                this.perf.end('import');

                return state.datasets_amount;
            }
        }

        return new Promise((resolve, reject) => {
            const jsonStream = stream_array.withParser();
            const fileStream = fs.createReadStream(import_file_path, { flags: 'r', encoding: 'utf-8' }).pipe(jsonStream.input);
            this.chunk_index = 0;

            const format_processed_file = Config.get('import.format_processed_file');

            jsonStream.on('data', (data) => {
                if (hook_before_process && typeof hook_before_process == 'function') {
                    data = hook_before_process(data);
                }
                this.process(data, format_processed_file);
            });

            jsonStream.on('error', (e) => {
                reject(e);
            });
            jsonStream.on('end', () => {
                this.save_import_state(import_file_path, this.chunk_index);
                Logger.success('datasets imported', this.chunk_index);
                if (hook_after_import && typeof hook_after_import == 'function') {
                    hook_after_import();
                }
                this.perf.end('import');
                resolve(this.chunk_index);
            });
        });
    }
    /**
     * stores the given value as dataset on the filesystem
     * @param data data from json stream
     * @param format_processed_file
     */
    process(data: { key: number; value: any }, format_processed_file: boolean): void {
        this.chunk_index++;
        if (!data || data.key == null || !data.value) {
            return;
        }
        const url = data.value.url || data.key.toString();
        const perf_mark = `import/process ${url}`;
        this.perf.start(perf_mark);
        const filepath = File.to_extension(File.to_index(join(cwd, 'gen', 'data', url)), '.json');
        File.create_dir(filepath);
        fs.writeFileSync(filepath, JSON.stringify(data.value, null, format_processed_file ? 4 : null));

        // add to list
        this.list.push(filepath);

        this.perf.end(perf_mark);
    }
    /**
     * get the lsit of all imported files
     * @returns list of all imported files
     */
    get_import_list(): string[] {
        if (this.list && this.list.length > 0) {
            return this.list;
        }
        if(!fs.existsSync(this.state_list_file)) {
            return [];
        }
        // try to load the list from state
        const content = fs.readFileSync(this.state_list_file, { encoding: 'utf-8' });
        try {
            const list = JSON.parse(content);
            return list;
        } catch (e) {
            Logger.error('can not read', this.state_list_file, e);
        }
        return [];
    }
    /**
     * Save the last import as state for next import
     * @param import_file_path path to the file which should be imported
     * @param datasets_amount amount of imported datasets
     */
    save_import_state(import_file_path, datasets_amount): void {
        const mtimeMs = fs.statSync(import_file_path).mtimeMs;
        File.create_dir(this.state_file);
        fs.writeFileSync(this.state_file, JSON.stringify({ mtimeMs, datasets_amount }, null, 4));
        // persist the list
        File.create_dir(this.state_list_file);
        fs.writeFileSync(this.state_list_file, JSON.stringify(this.list, null, 4));
    }
    /**
     * Load the last import state, return null when nothing is present
     * @returns last import state
     */
    load_import_state(): any {
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
    }
    /**
     * Return whether the import file should be imported
     * @param import_file_path path to the file which should be imported
     * @returns
     */
    should_import(import_file_path: string): boolean {
        if (!this.state) {
            const data_content = fs.readdirSync(join(cwd, 'gen', 'data'));
            if (!data_content || !Array.isArray(data_content) || data_content.length == 0) {
                Logger.info('no imported data', 'import');
                return true;
            }
            this.state = this.load_import_state();
            const fs_stats = fs.statSync(import_file_path);
            if (this.state && fs_stats) {
                // only if modify date has changed
                if (this.state.mtimeMs == fs_stats.mtimeMs) {
                    Logger.info('no import needed', 'unchanged');
                    return false;
                }
            }
        }
        return true;
    }
    get_global() {
        return new Promise((resolve) => {
            try {
                const jsonStream = stream_object.withParser();
                let global_data = {};
                fs.createReadStream(this.state_global_file, { flags: 'r', encoding: 'utf-8' }).pipe(jsonStream.input);

                jsonStream.on('data', async (data: {key: string, value: any}) => {
                    await Global.set(data.key, data.value);
                    global_data[data.key] = data.value;
                });

                jsonStream.on('error', (e) => {
                    Logger.error('error streaming global data', e);
                    resolve(null);
                });
                jsonStream.on('end', (data) => {
                    resolve(global_data);
                });
            } catch (e) {
                Logger.error('error reading global data', e);
                resolve(null);
            }
        });
    }
}

export type Hook_Before_Process = {
    ({ key: number, value: any }): { key: number; value: any };
};
