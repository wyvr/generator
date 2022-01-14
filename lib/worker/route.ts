/* eslint @typescript-eslint/no-explicit-any: 0 */
import { Config } from '@lib/config';
import { Error } from '@lib/error';
import { Generate } from '@lib/generate';
import { IWorkerRouteValue } from '@lib/interface/worker';
import { Logger } from '@lib/logger';
import { Routes } from '@lib/routes';
import { hrtime_to_ms } from '@lib/converter/time';

export const route = async (value: IWorkerRouteValue[], create_identifier: (any) => any) => {
    const default_values = Config.get('default_values');
    let global_data = {};
    let route_data = [];
    if (!create_identifier || typeof create_identifier != 'function') {
        return [null, null];
    }
    await Promise.all(
        value.map(async (entry) => {
            const start = process.hrtime();
            const filename = entry.route.path;
            const [error, route_result] = await Routes.execute_route(entry.route);
            if (error) {
                Logger.error('route error', Error.get(error, filename, 'route'));
                return null;
            }
            const route_url = Routes.write_routes(route_result, (data: any) => {
                // enhance the data from the pages
                // set default values when the key is not available in the given data
                const enhanced_data = Generate.set_default_values(Generate.enhance_data(data), default_values);
                const result = create_identifier(enhanced_data);

                if (!entry.add_to_global) {
                    return result.data;
                }
                global_data = Generate.add_to_global(enhanced_data, global_data);

                return result.data;
            });
            route_data = [].concat(route_data, route_url);
            Logger.report(hrtime_to_ms(process.hrtime(start)), 'route', entry.route.path);
            return filename;
        })
    );
    return [global_data, route_data];
};
