/* Created with wyvr {{version}} */
import { Config } from '@wyvr/generator/src/utils/config.js';

export default async function (options) {
    const url = Config.get('url');

    console.log(url, options);
}
