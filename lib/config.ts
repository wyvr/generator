export class Config {
    // cached troughout the whole process
    private static cache = null;
    /**
     * get the config value
     * @example get('path.to.the.config.value')
     * @param config_segment config to get as string, when nothing is given return the whole config
     * @returns the value or null
     */
    static get(config_segment: string | null = null): any | null {
        if (!this.cache) {
            const raw_config = require('@config/config');

            this.cache = raw_config;
        }
        if (!config_segment || typeof config_segment != 'string') {
            return this.cache;
        }
        // load only the partial config segment
        const splitted_config_segment = config_segment.split('.');
        let shrinked_config = this.cache;
        for (let index in splitted_config_segment) {
            if (!splitted_config_segment[index] || !shrinked_config[splitted_config_segment[index]]) {
                return null;
            }
            shrinked_config = shrinked_config[splitted_config_segment[index]];
        }
        return shrinked_config;
    }
}
