import { Dependency } from '@lib/dependency';
import { Dir } from '@lib/dir';
import { WorkerAction } from '@lib/model/worker/action';
import { Plugin } from '@lib/plugin';
import { WorkerController } from '@lib/worker/controller';
import { removeSync } from 'fs-extra';
import { join } from 'path';
import { IPerformance_Measure } from '@lib/performance_measure';
import { Client } from '@lib/client';
import { File } from '@lib/file';

export const scripts = async (
    perf: IPerformance_Measure,
    worker_controller: WorkerController,
    identifiers: any,
    watched_files: string[],
    watched_json_files: string[]
): Promise<boolean> => {
    perf.start('scripts');
    const is_watching = !!watched_files;
    // when files are watched build only needed scripts
    if (watched_json_files) {
        // get the identfiers of the watched files
        const page_identifiers = Object.keys(Dependency.page_cache)
            .filter((path) => watched_json_files.find((watched) => path.indexOf(watched) > -1))
            .map((path) => Dependency.page_cache[path])
            .map((identifier) => Client.get_identifier_name(['src/doc', 'src/layout', 'src/page'], identifier.doc, identifier.layout, identifier.page));
        // build new identifiers based on the page identifiers
        const watched_identifiers = {};
        Object.keys(identifiers)
            .filter((name) => page_identifiers.indexOf(name) > -1)
            .map((name) => {
                watched_identifiers[name] = identifiers[name];
            });
        // add shortcode identifiers
        const shortcodes = watched_files.map((file) => {
            return File.to_index(file, '.html').replace(/^\//, '');
        });
        shortcodes
            .filter((name) => {
                return Dependency.cache.___shortcode___[name];
            })
            .forEach((name) => {
                watched_identifiers[name] = { name, shortcodes: Dependency.cache.___shortcode___[name] };
            });

        identifiers = watched_identifiers;
    }
    await Plugin.before('scripts', identifiers, Dependency.cache);

    if (is_watching) {
        // remove only new identifier files
        Object.keys(identifiers).forEach((identifier) => removeSync(join('gen', 'js', `${identifier}.js`)));
    } else {
        Dir.clear('gen/js');
    }

    const list = Object.keys(identifiers).map((key) => {
        return { file: identifiers[key], dependency: Dependency.cache };
    });

    const result = await worker_controller.process_in_workers('scripts', WorkerAction.scripts, list, 1);
    await Plugin.after('scripts', result);
    perf.end('scripts');

    return result;
};
