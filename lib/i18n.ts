import { Env } from '@lib/env';
import { Logger } from '@lib/logger';
import { File } from '@lib/file';
import { join, basename } from 'path';
import { existsSync } from 'fs-extra';
import merge from 'deepmerge';
import { Client } from '@lib/client';
import { Error } from './error';

export class I18N {
    static is_setup = false;
    static i18n: any = null;
    static translations: any = null;
    static setup() {
        if (this.is_setup) {
            return;
        }
        try {
            const content = Client.transform_resource(File.read(join(__dirname, 'resource', 'i18n.js')));
            I18N.i18n = eval(content);
            this.is_setup = true;
        } catch (e) {
            Logger.error('i18n', Error.extract(e, 'i18n'));
        }
    }
    static translate(key: string | string[], options?: any) {
        I18N.setup();
        const error = I18N.i18n.check(key, options);
        if (error) {
            Logger.warning('i18n', error);
        }
        return I18N.i18n.__(key, options);
    }
    static get(language: string) {
        if(!language) {
            language = 'en';
        }
        // load from cache
        if(this.translations && this.translations[language]) {
            return this.translations[language];
        }
        // load from file
        return File.read_json(join('gen', 'i18n', `${language}.json`));
    }
    static collect(packages: any[]) {
        const result = {};
        // search the i18n files in the packages
        if (packages) {
            packages.forEach((pkg) => {
                const pkg_i18n_path = join(pkg.path, 'i18n');
                if (existsSync(pkg_i18n_path)) {
                    File.collect_files(pkg_i18n_path, '.json').forEach((file) => {
                        const language = file.replace(pkg_i18n_path, '').replace(/^\//, '').split('/').shift();
                        if (!result[language]) {
                            result[language] = {};
                        }
                        const context = basename(file, '.json');
                        if (!result[language][context]) {
                            result[language][context] = {};
                        }
                        const data = File.read_json(file);
                        result[language][context] = merge(result[language][context], data);
                    });
                }
            });
        }
        I18N.translations = result;
        return result;
    }
    static write(result: any) {
        Object.keys(result).forEach((language) => {
            File.write_json(join('gen', 'i18n', `${language}.json`), result[language]);
        });
    }
}
