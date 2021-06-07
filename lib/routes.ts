import * as fs from 'fs';
import { join } from 'path';

export class Routes {
    static collect_routes(dir: string = null) {
        if (!dir) {
            dir = join(process.cwd(), 'routes');
        }
        const entries = fs.readdirSync(dir);
        const result = [];
        entries.forEach((entry) => {
            const path = join(dir, entry);
            const stat = fs.statSync(path);
            if (stat.isDirectory()) {
                result.push(...this.collect_routes(path));
                return;
            }
            if (stat.isFile() && entry.match(/\.js$/)) {
                result.push(path);
            }
        });

        return result;
    }
}
