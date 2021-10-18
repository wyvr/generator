import { Logger } from '@lib/logger';
import { Error } from '@lib/error';
import { MediaModel } from '@lib/model/media';

export class Media {
    static async get_config(content: string): Promise<MediaModel> {
        // get the config of the media
        const config = new MediaModel(Media.get_config_from_content(content));
        // create config hash to group different images together
        const hash = MediaModel.get_config_hash(config);
        config.hash = hash;
        let src = config.src;
        if (src.indexOf('http') == 0) {
            const domain = src.match(/^https?:\/\/([^\/]*?)\//);
            if(domain) {
                const domain_hash = MediaModel.get_hash(domain[1]);
                src = `${domain_hash}/${src.substring(src.indexOf(domain[1])+domain[1].length).replace(/^\//, '')}`;
            }
        }
        config.result = `/media/${hash}/${src}`;
        // return the newly combined path
        return config;
    }
    static get_config_from_content(content: string): any {
        const exec_code = `(() => {
            return {${content.replace(/&quot;/g, '"').replace(/&#39;/g, "'")}}
        })()`;
        try {
            const result = eval(exec_code);
            return result;
        } catch (e) {
            Logger.error(Error.get(e, null, 'media'));
        }
        return null;
    }
}
