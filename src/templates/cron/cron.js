/* Created with wyvr {{version}} */
import { execute_route, get_config } from '@wyvr/generator/cron.js';

export default async function (options) {
    const url = get_config('url');

    // regenerate persistet route
    // await execute_route('/static');

    console.log(url, options);
}
