import { join } from 'path';

import { Publish } from '@lib/publish';
import { WyvrMode } from '@lib/model/wyvr/mode';
import { Logger } from '@lib/logger';
import { Dir } from '@lib/dir';
import { Generate } from '@lib/generate';

export class MainHelper {
    cwd = process.cwd();
    root_template_paths = [join(this.cwd, 'gen', 'src', 'doc'), join(this.cwd, 'gen', 'src', 'layout'), join(this.cwd, 'gen', 'src', 'page')];

    generate(data, ignore_global: boolean = false, default_values: any = null) {
        // enhance the data from the pages
        // set default values when the key is not available in the given data
        return Generate.set_default_values(Generate.enhance_data(data), default_values);
    }
}
