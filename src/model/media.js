import { MediaModelMode, MediaModelOutput } from '../struc/media.js';

export class MediaModel {
    constructor(config) {
        this.ext = undefined;
        this.src = undefined;
        this.result = undefined;
        this.width = -1;
        this.height = -1;
        this.mode = MediaModelMode.cover;
        this.format = 'jpeg';
        this.hash = undefined;
        this.quality = 60;
        this.output = MediaModelOutput.path;
        this.domain = undefined;
        this.result_exists = false;
        if (config) {
            Object.keys(this).forEach((key) => {
                if (config[key]) {
                    if (key == 'src') {
                        const domain_match = config[key].match(/^(?<domain>https?:\/\/[^/]*?)\//);
                        if (domain_match) {
                            this.domain = domain_match.groups?.domain;
                        }
                        config[key] = config[key].replace(/^\//, '');
                    }
                    this[key] = config[key];
                }
            });
        }
    }
}
