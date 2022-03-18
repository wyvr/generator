import { Logger } from '@lib/logger';
import { Route } from '@lib/model/route';
import { WorkerAction } from '@lib/struc/worker/action';
import { WorkerEmit } from '@lib/struc/worker/emit';
import { Plugin } from '@lib/plugin';
import { Routes } from '@lib/routes';
import { WorkerController } from '@lib/worker/controller';
import { Error } from '@lib/error';
import { IPackageTree } from '@lib/interface/package_tree';
import { IWatchFile } from '@lib/interface/watch';
import { IObject } from '@lib/interface/object';
import { Storage } from '@lib/storage';

export const routes = async (
    worker_controller: WorkerController,
    package_tree: IPackageTree,
    changed_files: IWatchFile[],
    enhance_data = true,
    cron_state: IObject[] = null
): Promise<[string[], string[]]> => {
    let completed_routes = 0;
    const nav_data = [];
    const on_nav_index = worker_controller.events.on('emit', WorkerEmit.navigation, async (data) => {
        // add the results to the global data
        if (data && data.data && Object.keys(data.data).length > 0) {
            nav_data.push(data.data);
        }
        completed_routes++;
    });
    const [route_files, cron_routes, routes_count] = await execute_routes(worker_controller, package_tree, changed_files, enhance_data, cron_state);

    // wait for the global event actions to complete
    Logger.text('waiting for the events to finish');
    try {
        await new Promise((resolve, reject) => {
            const guard = setTimeout(() => {
                reject('timeout waiting for global events to complete');
            }, 60000);
            const interval = setInterval(() => {
                if (completed_routes == routes_count) {
                    clearInterval(interval);
                    clearTimeout(guard);
                    resolve(true);
                }
            }, 100);
        });
    } catch (e) {
        Logger.error(Error.get(e, 'routes', 'main'));
    }
    worker_controller.events.off('emit', WorkerEmit.navigation, on_nav_index);

    // merge nav_data and replace or insert into navigation storage
    const [nav_error, nav_result] = await Storage.get('navigation', '*', []);
    if(nav_error) {
        Logger.error(nav_error);
        return [route_files, cron_routes];
    }
    const nav_uniq = {};
    nav_data.forEach((entry) => {
        Object.keys(entry).forEach((scope) => {
            if (!nav_result[scope]) {
                nav_result[scope] = [];
            }
            if (!nav_uniq[scope]) {
                nav_uniq[scope] = [];
            }
            nav_result[scope] = [].concat(nav_result[scope], entry[scope]).filter((item) => {
                if (nav_uniq[scope].indexOf(item.ur) > -1) {
                    return false;
                }
                nav_uniq[scope].push(item.url);
                return true;
            });
        });
    });
    await Storage.set_all('navigation', nav_result);
    // await Global.set('global.navigation', nav_result);

    return [route_files, cron_routes];
};

export const execute_routes = async (
    worker_controller: WorkerController,
    package_tree: IPackageTree,
    changed_files: IWatchFile[],
    enhance_data = true,
    cron_state: IObject[] = null
): Promise<[string[], string[], number]> => {
    await Plugin.before('routes', changed_files, enhance_data);
    let routes = Routes.collect_routes(null, package_tree);
    // shrink routes to only modified ones
    if (changed_files.length > 0) {
        const rel_paths = changed_files.map((file) => file.rel_path);
        routes = routes.filter((route) => {
            return rel_paths.indexOf(route.rel_path) > -1;
        });
    }
    if (!routes || routes.length == 0) {
        return [changed_files.map((file) => file.path), null, 0];
    }
    // add meta data to the route
    if (!enhance_data) {
        routes.forEach((route) => {
            route.initial = false;
        });
    }

    // rebuild only specific routes based on cron config
    if (cron_state && cron_state.length > 0) {
        const cron_paths = cron_state.map((state) => state.route);
        routes = routes
            .filter((route: Route) => {
                return cron_paths.indexOf(route.rel_path) > -1;
            })
            .map((route) => {
                route.cron = cron_state.find((state) => state.route == route.rel_path);
                return route;
            });
    }
    // collect generated routes
    const route_urls = [];
    const on_route_index = worker_controller.events.on('emit', WorkerEmit.route, (data) => {
        // append the routes
        route_urls.push(...data.data);
    });

    await worker_controller.process_in_workers(
        'routes',
        WorkerAction.route,
        routes.map((route) => ({
            route,
            add_to_global: !!enhance_data,
        })),
        1
    );
    worker_controller.events.off('emit', WorkerEmit.route, on_route_index);
    await Plugin.after('routes', changed_files, enhance_data);
    // Logger.info('routes amount', routes_urls.length);
    // return [].concat(file_list, routes_urls);
    const cron_routes = route_urls.length > 0 ? route_urls : null;
    return [route_urls, cron_routes, routes.length];
};
