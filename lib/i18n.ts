import i18next from 'i18next';
import { Env } from '@lib/env';
import { Logger } from '@lib/logger';
import { File } from '@lib/file';
import { join, basename } from 'path';
import { existsSync } from 'fs-extra';
import merge from 'deepmerge';

export class I18N {
    static is_setup: false;
    static async setup() {
        if (this.is_setup) {
            return;
        }
        i18next.on('missingKey', function (lngs, namespace, key, res) {
            Logger.warning('[i18n]', `missing key "${key}" in "${namespace}" language ${lngs.join(',')}`);
        });
        await i18next.init({
            fallbackLng: 'en',
            debug: false,
            saveMissing: true, // needed to emit missingKey
            resources: File.read_json(join('gen', 'i18n', `i18n.json`)),
        });
    }
    static translate(key: string | string[], options?: any) {
        I18N.setup();
        return i18next.t(key, options);
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
                        if (!result[language].translation) {
                            result[language].translation = {};
                        }
                        const context = basename(file, '.json');
                        if (!result[language].translation[context]) {
                            result[language].translation[context] = {};
                        }
                        const data = File.read_json(file);
                        result[language].translation[context] = merge(result[language][context], data);
                    });
                }
            });
        }
        return result;
    }
    static write(result: any) {
        File.write_json(join('gen', 'i18n', `i18n.json`), result);
    }
}
