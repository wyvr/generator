import { Config } from '@lib/config';
import { Logger } from '@lib/logger';
import fs from 'fs';
import { join, dirname, basename, extname } from 'path';
import { hrtime_to_ms } from '@lib/converter/time';
import { RequireCache } from '@lib/require_cache';
import { Routes } from '@lib/routes';
import { File } from '@lib/file';
import { WebSocketServer } from 'ws';
import { idle } from '@lib/helper/endings';
import { Cwd } from '@lib/vars/cwd';
import { delay } from '@lib/helper/delay';
import { between } from '@lib/helper/random';
import { LogType } from '@lib/struc/log';
import static_server from 'node-static';
import { ServerResponse } from 'http';
import { Error } from '@lib/error';
import { server } from '@lib/server';
import { IWatchFile } from '@lib/interface/watch';
import { IBuildFileResult } from '@lib/interface/build';
import { uniq } from '@lib/helper/uniq';

import fallback from '@lib/watch/fallback';
import file_watcher from '@lib/watch/file_watcher';

export class Watch {
    is_executing = false;
    watchers = {};
    websocket_server = null;
    packages = null;
    host = 'localhost';
    allowed_domains = null;

    private readonly IDLE_TEXT = 'changes or requests';

    constructor(
        private ports: [number, number],
        private callback: (
            changed_files: IWatchFile[],
            watched_files: string[]
        ) => Promise<[string[][], IBuildFileResult[]]> = null
    ) {
        if (!callback || typeof callback != 'function') {
            Logger.warning('can not start watching because no callback is defined');
            return null;
        }
        this.allowed_domains = Config.get('media.allowed_domains');
        RequireCache.clear();
        this.init();
    }

    private get_watched_files(): string[] {
        return (<string[]>Object.values(this.watchers)).filter((x) => x);
    }
    private init() {
        Logger.block('watch');
        this.packages = Config.get('packages');
        if (!this.packages || !Array.isArray(this.packages) || this.packages.length == 0) {
            throw 'no packages to watch';
        }

        // create simple static server
        const pub = new static_server.Server(join(Cwd.get(), 'pub'), {
            cache: false,
            serverInfo: `wyvr`,
        });
        this.host = 'localhost';
        server('localhost', this.ports[0], this.IDLE_TEXT, null, async (req, res, uid) => {
            pub.serve(req, res, async (err) => {
                if (err) {
                    await fallback(req, res, uid, err);
                }
            });
        });

        this.connect();

        // watch for file changes
        file_watcher(this.packages, (changed_files: IWatchFile[]) => {
            const force_complete_rebuild = !!changed_files.find((file) => {
                return file.rel_path.indexOf('plugin') > -1;
            });
            this.rebuild(force_complete_rebuild, changed_files);
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
            const id = uniq();
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
                    } catch (e) {
                        Logger.warning(Error.get(e, 'on message', 'ws'));
                    }
                }

                if (data.action) {
                    switch (data.action) {
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

    async rebuild(force_complete_rebuild = false, changed_files: IWatchFile[] = []) {
        // avoid that 2 commands get sent
        if (this.is_executing == true) {
            Logger.warning('currently running, try again after current execution');
            return;
        }
        if (force_complete_rebuild) {
            // build whole site
            const [build_errors] = await this.build([], null);
            if (build_errors) {
                this.send_errors(build_errors);
                return;
            }
            // reload all watcher
            Object.keys(this.watchers).forEach((id) => {
                this.send(id, { action: 'reload' });
            });
            return;
        }
        const routes = Routes.collect_routes(null).map((route) => {
            return {
                rel_path: route.rel_path,
                dir_path: dirname(route.rel_path),
            };
        });

        const exec = changed_files
            .filter((entry) => entry.rel_path.indexOf('exec') == 0 && entry.event != 'unlink')
            .map((exec) => {
                fs.copyFileSync(exec.path, join(Cwd.get(), 'gen', exec.rel_path));
                return exec;
            });

        if (exec.length > 0) {
            Logger.info('reloaded', 'exec', `files ${exec.map((exec) => exec.rel_path).join(',')}`);
        }

        const reversed_packages = this.packages.map((x) => x).reverse();

        if (this.get_watched_files().length == 0) {
            if (exec.length == 0) {
                Logger.improve('nobody is watching, no need to rebuild');
                Logger.info('open', `http://${this.host}:${this.ports[0]}`, 'to start watching');
                idle(this.IDLE_TEXT);
                return;
            } else {
                // when exec files are here force rebuild
                Logger.info('rebuild', 'required');
            }
        }

        const added_files = [];
        const files = changed_files
            .filter((f) => f)
            .map((file) => {
                // route handling
                if (file.rel_path.match(/^routes\//)) {
                    // search the real route files and append them
                    const route_files = routes.filter((route) => {
                        return (
                            dirname(file.rel_path).indexOf(route.dir_path) == 0 &&
                            basename(file.rel_path).indexOf('_') == 0
                        );
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
                        Logger.info(
                            'resolved to',
                            `${File.to_extension(file.rel_path, '.svelte')} ${Logger.color.dim(file.rel_path)}`
                        );
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

        // build the files
        const [build_errors] = await this.build([].concat(added_files, files), this.get_watched_files());

        // reload only whole page when no static asset is given
        const rel_file_paths = files.map((f) => f.rel_path);
        if (build_errors) {
            this.send_errors(build_errors)
            return;
        }
        // reload all watchers
        Object.keys(this.watchers).forEach((id) => {
            this.send(id, { action: 'reload' });
        });
        // send update for static files to client
        const assets = rel_file_paths.filter((p) => p.match(/^assets\//));
        if (assets.length > 0) {
            Object.keys(this.watchers).forEach((id) => {
                this.send(id, { action: 'assets', list: assets });
            });
        }
    }

    async build(changed_files: IWatchFile[], watched_files: string[]) {
        this.is_executing = true;
        const hr_start = process.hrtime();
        const result = await this.callback(changed_files, watched_files);
        RequireCache.clear();
        const timeInMs = hrtime_to_ms(process.hrtime(hr_start));
        Logger.stop('watch total', timeInMs);
        idle(this.IDLE_TEXT);
        this.is_executing = false;
        return result;
    }

    async fail(uid: string, res: ServerResponse, hr_start: [number, number]) {
        await delay(between(350, 1000));
        res.writeHead(404, { 'Content-Type': 'text/html' });
        return this.end(uid, res, hr_start, '');
    }
    end(uid: string, res: ServerResponse, hr_start: [number, number], value: string = null) {
        const duration = Math.round(hrtime_to_ms(process.hrtime(hr_start)) * 100) / 100;
        Logger.output(LogType.log, Logger.color.dim, '░', uid, Logger.color.reset(duration + ''), 'ms');
        res.end(value);
        return;
    }
    send_errors(errors: string[][]) {
        const plain_errors = errors.map((error) => {
            if (typeof error == 'string') {
                return Logger.color.unstyle(error);
            }
            if (Array.isArray(error)) {
                return error.map((e) => Logger.color.unstyle(e));
            }
            return error;
        });
        Object.keys(this.watchers).forEach((id) => {
            this.send(id, { action: 'error', data: plain_errors });
        });
    }
}
