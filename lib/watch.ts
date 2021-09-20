import { Config } from '@lib/config';
import { Logger } from '@lib/logger';
import chokidar from 'chokidar';
import fs from 'fs';
import { join, dirname, basename, extname } from 'path';
import { hrtime_to_ms } from '@lib/converter/time';
import { RequireCache } from '@lib/require_cache';
import { Routes } from '@lib/routes';
import { File } from '@lib/file';
import { WebSocketServer } from 'ws';
import { v4 } from 'uuid';

export class Watch {
    changed_files: any[] = [];
    is_executing: boolean = false;
    watchers = {};
    websocket_server = null;
    packages = null;

    constructor(private ports: [number, number], private callback: Function = null) {
        if (!callback || typeof callback != 'function') {
            Logger.warning('can not start watching because no callback is defined');
            return;
        }
        RequireCache.clear();
        this.init();
    }
    private restart() {
        process.kill(process.pid, 'SIGUSR2');
    }
    private get_watched_files(): string[] {
        return (<string[]>Object.values(this.watchers)).filter((x) => x);
    }
    private init() {
        this.packages = Config.get('packages');
        if (!this.packages || !Array.isArray(this.packages) || this.packages.length == 0) {
            throw 'no packages to watch';
        }

        // create simple static server
        const static_server = require('node-static');

        const pub = new static_server.Server(join(process.cwd(), 'pub'), { cache: false, serverInfo: `wyvr` });
        const host = 'localhost';
        const port = this.ports[0];
        require('http')
            .createServer((req, res) => {
                // console.log(req.method, req.url);
                // console.log(Object.keys(req));
                req.addListener('end', () => {
                    pub.serve(req, res, (err, result) => {
                        if (err) {
                            Logger.error('serve error', Logger.color.bold(err.message), req.method, req.url, err.status);
                            res.writeHead(err.status, err.headers);
                            res.end();
                        }
                    });
                }).resume();
            })
            .listen(port, host, () => {
                Logger.success('server started', `http://${host}:${port}`);
            });

        this.connect();

        // start reloader
        // const bs = require('browser-sync').create();
        // bs.init(
        //     {
        //         proxy: Config.get('url'),
        //         ghostMode: false,
        //         open: false,
        //     },
        //     function () {
        //         Logger.info('sync is ready');
        //     }
        // );
        // watch for file changes
        let debounce = null;
        const watch_folder = this.packages.map((pkg) => pkg.path);
        watch_folder.push(join(process.cwd(), 'wyvr.js'));
        chokidar
            .watch(watch_folder, {
                ignoreInitial: true,
            })
            .on('all', (event, path) => {
                if (
                    path.indexOf('package.json') > -1 ||
                    path.indexOf('package-lock.json') > -1 ||
                    path.indexOf('/node_modules') > -1 ||
                    path.indexOf('/.git/') > -1 ||
                    event == 'addDir' ||
                    event == 'unlinkDir'
                ) {
                    return;
                }
                // when config file is changed restart
                if (path.indexOf('wyvr.js') > -1) {
                    Logger.info('config file has changed', path, 'restarting');

                    return this.restart();
                }
                // find the package of the changed file
                let pkg_index = -1;
                let pkg = null;
                for (let index = this.packages.length - 1; index > 0; index--) {
                    const cur_pkg_index = path.indexOf(this.packages[index].path.replace(/^\.\//, ''));
                    if (cur_pkg_index > -1) {
                        pkg_index = index;
                        pkg = this.packages[index];
                        break;
                    }
                }
                let rel_path = path;
                if (pkg) {
                    rel_path = path.replace(pkg.path + '/', '');
                    // check if the changed file gets overwritten in another pkg
                    if (event != 'unlink' && pkg_index > -1 && pkg_index < this.packages.length - 1) {
                        for (let i = pkg_index + 1; i < this.packages.length; i++) {
                            const pkg_path = join(this.packages[i].path, rel_path);
                            if (fs.existsSync(pkg_path) && pkg_path != path) {
                                Logger.warning(
                                    'ignore',
                                    `${event}@${Logger.color.dim(path)}`,
                                    'because it gets overwritten by pkg',
                                    Logger.color.bold(this.packages[i].name),
                                    Logger.color.dim(pkg_path)
                                );
                                return;
                            }
                        }
                    }
                    Logger.info('detect', `${event} ${pkg.name} ${Logger.color.dim(rel_path)}`);
                } else {
                    Logger.warning('detect', `${event}@${Logger.color.dim(path)}`, 'from unknown pkg');
                }
                // check if the file is empty >= ignore it for now
                if (event != 'unlink' && fs.readFileSync(path, { encoding: 'utf-8' }).trim() == '') {
                    Logger.warning('the file is empty, empty files are ignored');
                    return;
                }

                this.changed_files = [...this.changed_files, { event, path, rel_path }];
                if (debounce) {
                    clearTimeout(debounce);
                }
                debounce = setTimeout(() => {
                    this.rebuild();
                }, 500);
            });
        Logger.info('watching', this.packages.length, 'packages');
    }
    private send(id, data) {
        this.websocket_server.clients.forEach((client) => {
            if (client.id == id) {
                if (typeof data == 'object') {
                    data.id = id;
                }
                client.send(JSON.stringify(data));
            }
        });
    }

    private connect() {
        const ws_port = this.ports[1];
        this.websocket_server = new WebSocketServer({ port: ws_port });

        this.websocket_server.on('connection', (ws) => {
            const id = v4().split('-')[0];

            ws.id = id;
            this.watchers[id] = null;
            Logger.debug('ws connect', id);

            ws.on('close', () => {
                this.watchers[ws.id] = null;
                Logger.debug('ws close', id);
            });
            ws.on('message', (message) => {
                let data = null;
                if (message) {
                    try {
                        data = JSON.parse(message.toString('utf8'));
                    } catch (e) {}
                }

                if (data.action) {
                    switch (data.action) {
                        case 'ping':
                            this.send(ws.id, { action: 'ping' });
                            break;
                        case 'path':
                            if (data.path) {
                                if (this.get_watched_files().indexOf(data.path) == -1) {
                                    this.watchers[ws.id] = data.path;
                                }
                            }
                            break;
                        case 'reload':
                            if (data.path) {
                                Logger.block('rebuild', data.path);
                                this.rebuild();
                            }
                            break;
                    }
                }
            });
            if (!this.watchers[ws.id]) {
                this.send(ws.id, { action: 'available' });
            }
        });
    }

    async rebuild() {
        // avoid that 2 commands get sent
        if (this.is_executing == true) {
            Logger.warning('currently running, try again after current execution');
            return;
        }
        const routes = Routes.collect_routes(null).map((route) => {
            return { rel_path: route.rel_path, dir_path: dirname(route.rel_path) };
        });
        const added_files = [];

        const reversed_packages = this.packages.map((x) => x).reverse();

        const files = this.changed_files
            .filter((f) => f)
            .map((file) => {
                // route handling
                if (file.rel_path.match(/^routes\//)) {
                    // search the real route files and append them
                    const route_files = routes.filter((route) => {
                        return dirname(file.rel_path).indexOf(route.dir_path) == 0 && basename(file.rel_path).indexOf('_') == 0;
                    });
                    if (route_files) {
                        route_files.forEach((route_file) => {
                            Logger.info('resolved to', `${route_file.rel_path} ${Logger.color.dim(file.rel_path)}`);
                            const path = reversed_packages
                                .map((pkg) => {
                                    const pkg_path = join(pkg.path, route_file.rel_path);
                                    if (fs.existsSync(pkg_path)) {
                                        return pkg_path;
                                    }
                                    return null;
                                })
                                .find((x) => x);
                            added_files.push({
                                event: 'change',
                                path,
                                rel_path: route_file.rel_path,
                            });
                        });
                    }
                    // when the changed file starts with a _ it is a helper file and is not allowed to be executed
                    if (basename(file.rel_path).match(/^_/)) {
                        return null;
                    }
                }
                // source handling of combined files
                if (file.rel_path.match(/^src\//) && extname(file.rel_path) != '.svelte') {
                    // check if the file is part of a base svelte file
                    const svelte_file = File.to_extension(join('gen', file.rel_path), '.svelte');
                    if (fs.existsSync(svelte_file)) {
                        Logger.info('resolved to', `${File.to_extension(file.rel_path, '.svelte')} ${Logger.color.dim(file.rel_path)}`);
                        // find the package file
                        const path = reversed_packages
                            .map((pkg) => {
                                const pkg_path = join(pkg.path, file.rel_path);
                                if (fs.existsSync(pkg_path)) {
                                    return pkg_path;
                                }
                                return null;
                            })
                            .find((x) => x);
                        added_files.push({
                            event: 'change',
                            path,
                            rel_path: File.to_extension(file.rel_path, '.svelte'),
                        });
                        return null;
                    }
                }
                return file;
            })
            .filter((f) => f);
        // reset the files
        this.changed_files = [];
        this.is_executing = true;
        const hr_start = process.hrtime();
        const build_pages = await this.callback([].concat(added_files, files), this.get_watched_files());
        // reload only whole page when no static asset is given
        const reload_files = []
            .concat(
                build_pages.map((page) => page.path.replace(/releases\/[^/]*\//, '/').replace(/index.html$/, '')),
                files
                    .map((f) => f.rel_path)
                    .filter((p) => {
                        return p.match(/^(assets|css|js|md)\//);
                    })
            )
            .filter((x) => x);
        // console.log('watch files', files);
        // search for watchers which has the pages open
        const watcher_ids = [];
        Object.keys(this.watchers).forEach((key) => {
            if (reload_files.indexOf(this.watchers[key]) > -1) {
                watcher_ids.push(key);
            }
        });
        watcher_ids.forEach((id) => {
            this.send(id, { action: 'reload' });
        });
        // bs.reload(reload_files.length > 0 ? reload_files : undefined);

        RequireCache.clear();
        const timeInMs = hrtime_to_ms(process.hrtime(hr_start));
        Logger.stop('watch total', timeInMs);
        this.is_executing = false;
    }
}
