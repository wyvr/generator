import { join } from 'path';
import axios from 'axios';
import { File } from '@lib/file';
import { Cwd } from '@lib/vars/cwd';
import { IObject } from '@lib/interface/object';

export class MediaModel {
    src: string = null;
    result: string = null;
    width = -1;
    height = -1;
    mode: MediaModelMode = MediaModelMode.Cover;
    format = 'jpeg';
    hash: string = null;
    quality = 60;
    output: MediaModelOutput = MediaModelOutput.Path;

    constructor(config: IObject) {
        Object.keys(this).forEach((key) => {
            if (config[key]) {
                if (key == 'src') {
                    config[key] = config[key].replace(/^\//, '');
                }
                this[key] = config[key];
            }
        });
    }

    static get_config_hash(config: MediaModel) {
        const hash_config = {};
        ['width', 'height', 'mode', 'format', 'quality'].forEach((key) => {
            if (config[key]) {
                hash_config[key] = config[key];
            }
        });
        return MediaModel.get_hash(JSON.stringify(hash_config));
    }
    static get_hash(value: string) {
        // const hash = cryptoCreateHash('sha256');
        // hash.update(value);
        // return hash.digest('hex').substr(0, 16);
        return Buffer.from(value).toString('base64')
    }
    static async get_buffer(src: string) {
        if (!src) {
            return null;
        }
        // download the image and return buffer from it
        if (src.indexOf('http') == 0) {
            try {
                const res = await axios({
                    url: src,
                    method: 'GET',
                    responseType: 'arraybuffer',
                });
                return Buffer.from(<string>res.data);
            } catch (err) {
                // @TODO implement logging
                // console.log(err);
                return null;
            }
        }
        // assets are located in the gen folder, because they are combined from the packages
        if (src.match(/^\/?assets\//)) {
            return File.read_buffer(join(Cwd.get(), 'gen', src));
        }
        // local file, somewhere in the project
        return File.read_buffer(join(Cwd.get(), src));
    }
    static get_output(src: string) {
        return join('cache', src);
    }
}
export enum MediaModelMode {
    Contain = 'contain',
    Cover = 'cover',
}
export enum MediaModelOutput {
    Path = 'path',
    Base64 = 'base64', // @TODO
}
