import { join } from 'path';
import { Cwd } from '../../vars/cwd.js';
import { copy_template_file } from '../create.mjs';
import { to_dirname } from '../to.js';
import { create_config } from './config.mjs';

export function create_package(name, templates, version, result, target_dir) {
    const boilerplate = join(to_dirname(import.meta.url), '..', '..', 'boilerplate');
    create_config(templates, version, result, target_dir);
    if (result.features.includes('assets')) {
        copy_template_file(join(boilerplate, 'assets', 'favicon.ico'), Cwd.get(target_dir, 'assets', 'favicon.ico'));
        copy_template_file(join(boilerplate, 'assets', 'favicon.png'), Cwd.get(target_dir, 'assets', 'favicon.png'));
    }
    if (result.features.includes('devtools')) {
        copy_template_file(join(templates, 'devtools', 'devtool.mjs'), Cwd.get(target_dir, 'devtools', 'devtool.mjs'), {
            version,
        });
        copy_template_file(
            join(templates, 'devtools', 'devtool.svelte'),
            Cwd.get(target_dir, 'devtools', 'devtool.svelte'),
            {
                version,
            }
        );
    }
    if (result.features.includes('i18n')) {
        result.i18n_folder
            .toLowerCase()
            .split(',')
            .map((x) => x.trim())
            .filter((x) => x)
            .forEach((lang) => {
                copy_template_file(
                    join(templates, 'i18n', 'i18n.json'),
                    Cwd.get(target_dir, 'i18n', lang, 'i18n.json'),
                    {
                        version,
                        lang,
                    }
                );
            });
    }
    if (result.features.includes('pages')) {
        copy_template_file(join(templates, 'pages', 'markdown.md'), Cwd.get(target_dir, 'pages', 'index.md'), {
            name,
            version,
        });
        copy_template_file(join(templates, 'pages', 'page.mjs'), Cwd.get(target_dir, 'pages', 'page.mjs'), {
            version,
        });
    }
    if (result.features.includes('plugins')) {
        copy_template_file(
            join(templates, 'plugins', 'plugin.mjs'),
            Cwd.get(target_dir, 'plugins', name, 'plugin.mjs'),
            {
                version,
            }
        );
    }
    if (result.features.includes('routes')) {
        copy_template_file(join(templates, 'routes', 'route.mjs'), Cwd.get(target_dir, 'routes', name, 'route.mjs'), {
            name: name,
            version,
        });
    }
}
