import { join } from 'node:path';
import { Cwd } from '../../vars/cwd.js';
import { copy_template_file } from '../create.js';
import { to_dirname } from '../to.js';
import { create_config } from './config.js';

export function create_package(name, templates, version, result, target_dir) {
    const boilerplate = join(to_dirname(import.meta.url), '..', '..', 'boilerplate');
    create_config(templates, version, result, target_dir);
    if (result.features.includes('assets')) {
        copy_template_file(join(boilerplate, 'assets', 'favicon.ico'), Cwd.get(target_dir, 'assets', 'favicon.ico'));
        copy_template_file(join(boilerplate, 'assets', 'favicon.png'), Cwd.get(target_dir, 'assets', 'favicon.png'));
    }
    if (result.features.includes('devtools')) {
        copy_template_file(join(templates, 'devtools', 'devtool.js'), Cwd.get(target_dir, 'devtools', 'devtool.js'), {
            version
        });
        copy_template_file(join(templates, 'devtools', 'devtool.svelte'), Cwd.get(target_dir, 'devtools', 'devtool.svelte'), {
            version
        });
    }
    if (result.features.includes('i18n')) {
        for (const lang of result.i18n_folder
            .toLowerCase()
            .split(',')
            .map((x) => x.trim())
            .filter((x) => x)) {
            copy_template_file(join(templates, 'i18n', 'i18n.json'), Cwd.get(target_dir, 'i18n', lang, 'i18n.json'), {
                version,
                lang
            });
        }
    }
    if (result.features.includes('pages')) {
        copy_template_file(join(templates, 'pages', 'markdown.md'), Cwd.get(target_dir, 'pages', 'index.md'), {
            name,
            version
        });
        copy_template_file(join(templates, 'pages', 'page.js'), Cwd.get(target_dir, 'pages', 'page.js'), {
            version
        });
    }
    if (result.features.includes('plugins')) {
        copy_template_file(join(templates, 'plugins', 'plugin.js'), Cwd.get(target_dir, 'plugins', name, 'plugin.js'), {
            version
        });
    }
    if (result.features.includes('routes')) {
        copy_template_file(join(templates, 'routes', 'route.js'), Cwd.get(target_dir, 'routes', name, 'route.js'), {
            name: name,
            version
        });
    }
}
