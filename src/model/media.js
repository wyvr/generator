import { MediaModelMode, MediaModelOutput } from '../struc/media.js';

export class MediaModel {
    constructor(config) {
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
        if (config) {
            Object.keys(this).forEach((key) => {
                if (config[key]) {
                    if (key == 'src') {
                        config[key] = config[key].replace(/^\//, '');
                    }
                    this[key] = config[key];
                }
            });
        }
    }
}
