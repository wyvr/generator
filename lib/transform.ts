import { File } from '@lib/file';
import * as swc from '@swc/core';

export class Transform {
    /**
     * Replace the @src imports with the given to path
     * @param content source code with @src imports
     * @param to path to the src folder, relative to the cwd
     * @returns the soruce code ith the replaced @src imports
     */
    static src_import_path(content: string, to: string): string {
        if (!content || typeof content != 'string' || typeof to != 'string') {
            return '';
        }
        return content.replace(/(['"])@src\//g, `$1${process.cwd()}/${to.replace('^/', '').replace(/\/$/, '')}/`); //gen/src
    }
    static replace_wyvr_imports(content: string, as_client: boolean = true) {
        if (!content || typeof content != 'string') {
            return '';
        }
        // replace isServer and isClient and the imports
        return content
            .replace(/([^\w])isServer([^\w])/g, `$1${as_client ? 'false' : 'true'}$2`)
            .replace(/([^\w])isClient([^\w])/g, `$1${as_client ? 'true' : 'false'}$2`)
            .replace(/import \{[^\}]*?\} from \'@wyvr\/generator\';?/g, '')
            .replace(/(?:const|let)[^=]*?= require\(\'@wyvr\/generator\'\);?/g, '');
    }
    static async typescript_compile(path: string, content: string): Promise<boolean> {
        const output_path = File.to_extension(path, '.js');

        const result = await swc.transform(content, {
            // Some options cannot be specified in .swcrc
            filename: output_path,
            sourceMaps: true,
            // Input files are treated as module by default.
            isModule: true,

            // All options below can be configured via .swcrc
            jsc: {
                parser: {
                    syntax: 'typescript',
                    dynamicImport: true,
                    decorators: true,
                },
                transform: {},
                loose: true,
                target: 'es2016',
            },
            module: {
                type: 'commonjs',
            },
        });
        if (result) {
            File.write(output_path, result.code);
            File.write(`${output_path}.map`, result.map);
            return true;
        }
        
        return false;
    }
}
