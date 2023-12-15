import { join } from 'path';
import { Cwd } from '../../vars/cwd.js';
import { copy_template_file } from '../create.js';
import { exists, read, write } from '../file.js';
import { Logger } from '../logger.js';

export function create_ddev(templates) {
    // only allow when ddev was initated before
    if (!exists(Cwd.get('.ddev'))) {
        // ddev must create a pub folder when config starts, but it is a symlink to the release in wyvr
        Logger.error(
            `.ddev is not available, please run the following command first\n${Logger.color.bold(
                'ddev config --docroot=pub --project-type=php --create-docroot;rm -rf pub'
            )}`
        );
        process.exit(1);
    }
    const wyvr_command = join('commands', 'web', 'wyvr');
    copy_template_file(join(templates, 'ddev', wyvr_command), Cwd.get('.ddev', wyvr_command), {});

    const nginx = join('nginx_full', 'nginx-site.conf');
    copy_template_file(join(templates, 'ddev', nginx), Cwd.get('.ddev', nginx), {});

    const dockerfile = join('web-build', 'Dockerfile');
    copy_template_file(join(templates, 'ddev', dockerfile), Cwd.get('.ddev', dockerfile), {});

    const mounts = join('docker-compose.mounts.yaml');
    copy_template_file(join(templates, 'ddev', mounts), Cwd.get('.ddev', mounts), {});

    // modify existing files
    const gitignore = read(Cwd.get('.ddev', '.gitignore'));
    if (gitignore) {
        write(
            Cwd.get('.ddev', '.gitignore'),
            gitignore
                .replace('#ddev-generated: Automatically generated ddev .gitignore.', '')
                .replace('/nginx_full/nginx-site.conf', '')
        );
        Logger.info('modified', Cwd.get('.ddev', '.gitignore'));
    }
}
