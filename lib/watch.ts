import { Config } from '@lib/config';
import { Logger } from '@lib/logger';
import chokidar from 'chokidar';
import fs from 'fs';
import { join, dirname, basename, extname, sep } from 'path';
import { hrtime_to_ms } from '@lib/converter/time';
import { RequireCache } from '@lib/require_cache';
import { Routes } from '@lib/routes';
import { File } from '@lib/file';
import { WebSocketServer } from 'ws';
import { idle } from '@lib/helper/endings';
import { Cwd } from '@lib/vars/cwd';
import { Media } from '@lib/media';
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
import { Exec } from '@lib/exec';
import { Env } from './env';
import { SocketPort } from './vars/socket_port';
import { Client } from './client';

export class Watch {
    changed_files: IWatchFile[] = [];
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
        ) => Promise<IBuildFileResult[]> = null
    ) {
        if (!callback || typeof callback != 'function') {
            Logger.warning(
                'can not start watching because no callback is defined'
            );
            return null;
        }
        this.allowed_domains = Config.get('media.allowed_domains');
        RequireCache.clear();
        this.init();
    }
    private restart() {
        Logger.warning('type "rs" and press [enter] to restart nodemon');
        process.exit(1);
    }
    private get_watched_files(): string[] {
        return (<string[]>Object.values(this.watchers)).filter((x) => x);
    }
    private init() {
        Logger.block('watch');
        this.packages = Config.get('packages');
        if (
            !this.packages ||
            !Array.isArray(this.packages) ||
            this.packages.length == 0
        ) {
            throw 'no packages to watch';
        }

        // create simple static server
        const pub = new static_server.Server(join(Cwd.get(), 'pub'), {
            cache: false,
            serverInfo: `wyvr`,
        });
        this.host = 'localhost';
        server(
            'localhost',
            this.ports[0],
            this.IDLE_TEXT,
            null,
            async (req, res, uid) => {
                pub.serve(req, res, async (err) => {
                    if (err) {
                        // check if the url is a page which should be generated
                        if (Env.is_dev()) {
                            // collect files
                            const data_path = join(
                                Cwd.get(),
                                'gen',
                                'data',
                                File.to_index(req.url, '.json')
                            );
                            const exists = File.is_file(data_path);
                            Logger.debug('request', req.url, data_path, exists);
                            if (exists) {
                                // build the page
                                Logger.block('generate', req.url);
                                let socket_script = '';

                                const page = File.read(
                                    join(__dirname, 'resource', 'page.html')
                                );
                                const client_socket = File.read(
                                    join(
                                        __dirname,
                                        'resource',
                                        'client_socket.js'
                                    )
                                );
                                if (page && client_socket) {
                                    socket_script = `<script id="wyvr_client_socket">
                                    (function wyvr_generate_page() {
                                        localStorage.removeItem('wyvr_socket_history');
                                        window.setTimeout(() => {
                                            location.href = location.href;
                                        }, 30000);
                                    })();
                                    ${Client.transform_resource(
                                        client_socket.replace(
                                            /\{port\}/g,
                                            SocketPort.get() + ''
                                        )
                                    )}</script>`;
                                    res.writeHead(200, {
                                        'Content-Type': 'text/html',
                                    });

                                    res.end(
                                        page
                                            .replace(
                                                /\{content\}/g,
                                                'Page will be generated, please wait &hellip;'
                                            )
                                            .replace(
                                                /\{script\}/g,
                                                socket_script
                                            )
                                    );
                                    return;
                                }
                            }
                        }

                        // check for media files
                        const media_config = Media.extract_config(req.url);
                        if (media_config) {
                            const start = process.hrtime();
                            return Media.serve(
                                res,
                                media_config,
                                async () => {
                                    const duration =
                                        Math.round(
                                            hrtime_to_ms(
                                                process.hrtime(start)
                                            ) * 100
                                        ) / 100;
                                    Logger.block(
                                        `processed ${media_config.src} in ${duration} ms`
                                    );
                                },
                                async (message) => {
                                    Logger.error(media_config.src, message);
                                }
                            );
                        }
                        // check for matching exec
                        const exec_config = Exec.match(req.url);
                        if (exec_config) {
                            Logger.info(uid, 'exec', req.url);
                            const rendered = await Exec.run(
                                uid,
                                req,
                                res,
                                exec_config
                            );
                            if (rendered && !res.writableEnded) {
                                // res.writeHead(404, { 'Content-Type': 'text/html' });
                                res.end(rendered.result.html);
                                return;
                            }
                        }
                        // check for universal/fallback exec
                        if (await Exec.fallback(uid, req, res)) {
                            return;
                        }

                        Logger.error(
                            'serve error',
                            Logger.color.bold(err.message),
                            req.method,
                            req.url,
                            err.status
                        );
                        res.writeHead(err.status, err.headers);
                        res.end();
                    }
                });
            }
        );

        this.connect();

        // watch for file changes
        let debounce = null;
        const watch_folder = this.packages.map((pkg) => pkg.path);
        watch_folder.push(join(Cwd.get(), 'wyvr.js'));
        chokidar
            .watch(watch_folder, {
                ignoreInitial: true,
            })
            .on('all', (event, path) => {
                Logger.info(event, path);
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
                    Logger.warning(
                        'config file has changed',
                        path,
                        ', restart required'
                    );

                    return this.restart();
                }
                // find the package of the changed file
                let pkg_index = -1;
                let pkg = null;
                for (
                    let index = this.packages.length - 1;
                    index >= 0;
                    index--
                ) {
                    const cur_pkg_index = path.indexOf(
                        this.packages[index].path.replace(/^\.\//, '')
                    );
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
                    if (
                        event != 'unlink' &&
                        pkg_index > -1 &&
                        pkg_index < this.packages.length - 1
                    ) {
                        for (
                            let i = pkg_index + 1;
                            i < this.packages.length;
                            i++
                        ) {
                            const pkg_path = join(
                                this.packages[i].path,
                                rel_path
                            );
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
                    Logger.info(
                        'detect',
                        `${event} ${pkg.name} ${Logger.color.dim(rel_path)}`
                    );
                } else {
                    Logger.warning(
                        'detect',
                        `${event}@${Logger.color.dim(path)}`,
                        'from unknown pkg'
                    );
                }
                // check if the file is empty >= ignore it for now
                const content = File.read(path);
                if (event != 'unlink' && (!content || content.trim() == '')) {
                    Logger.warning(
                        'the file is empty, empty files are ignored'
                    );
                    return;
                }
                // when file gets deleted, delete it from the gen folder
                if (event == 'unlink') {
                    // remove first part => "[src]/layout..."
                    const parts = rel_path.split(sep).filter((x, i) => i != 0);
                    const gen = join(Cwd.get(), 'gen');
                    const short_path = parts.join(sep);
                    // existing files in the gen folder
                    const existing_paths = fs
                        .readdirSync(gen)
                        .map((dir) => join(gen, dir, short_path))
                        .filter((path) => fs.existsSync(path));
                    // delete the files
                    existing_paths.forEach((path) => fs.unlinkSync(path));
                }

                this.changed_files = [
                    ...this.changed_files,
                    { event, path, rel_path },
                ];
                if (debounce) {
                    clearTimeout(debounce);
                }
                debounce = setTimeout(() => {
                    Logger.block('rebuild');
                    this.rebuild(
                        !!this.changed_files.find((file) => {
                            return file.rel_path.indexOf('plugin') > -1;
                        })
                    );
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
                                if (
                                    this.get_watched_files().indexOf(
                                        data.path
                                    ) == -1
                                ) {
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

    async rebuild(force_complete_rebuild = false) {
        // avoid that 2 commands get sent
        if (this.is_executing == true) {
            Logger.warning(
                'currently running, try again after current execution'
            );
            return;
        }
        if (force_complete_rebuild) {
            // build whole site
            await this.build([], null);
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

        const exec = this.changed_files
            .filter(
                (entry) =>
                    entry.rel_path.indexOf('exec') == 0 &&
                    entry.event != 'unlink'
            )
            .map((exec) => {
                fs.copyFileSync(
                    exec.path,
                    join(Cwd.get(), 'gen', exec.rel_path)
                );
                return exec;
            });

        if (exec.length > 0) {
            Logger.info(
                'reloaded',
                'exec',
                `files ${exec.map((exec) => exec.rel_path).join(',')}`
            );
        }

        const reversed_packages = this.packages.map((x) => x).reverse();

        if (this.get_watched_files().length == 0) {
            if (exec.length == 0) {
                Logger.improve('nobody is watching, no need to rebuild');
                Logger.info(
                    'open',
                    `http://${this.host}:${this.ports[0]}`,
                    'to start watching'
                );
                idle(this.IDLE_TEXT);
                return;
            } else {
                // when exec files are here force rebuild
                Logger.info('rebuild', 'required');
            }
        }

        const added_files = [];
        const files = this.changed_files
            .filter((f) => f)
            .map((file) => {
                // route handling
                if (file.rel_path.match(/^routes\//)) {
                    // search the real route files and append them
                    const route_files = routes.filter((route) => {
                        return (
                            dirname(file.rel_path).indexOf(route.dir_path) ==
                                0 && basename(file.rel_path).indexOf('_') == 0
                        );
                    });
                    if (route_files) {
                        route_files.forEach((route_file) => {
                            Logger.info(
                                'resolved to',
                                `${route_file.rel_path} ${Logger.color.dim(
                                    file.rel_path
                                )}`
                            );
                            const path = reversed_packages
                                .map((pkg) => {
                                    const pkg_path = join(
                                        pkg.path,
                                        route_file.rel_path
                                    );
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
                if (
                    file.rel_path.match(/^src\//) &&
                    extname(file.rel_path) != '.svelte'
                ) {
                    // check if the file is part of a base svelte file
                    const svelte_file = File.to_extension(
                        join('gen', file.rel_path),
                        '.svelte'
                    );
                    if (fs.existsSync(svelte_file)) {
                        Logger.info(
                            'resolved to',
                            `${File.to_extension(
                                file.rel_path,
                                '.svelte'
                            )} ${Logger.color.dim(file.rel_path)}`
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
                            rel_path: File.to_extension(
                                file.rel_path,
                                '.svelte'
                            ),
                        });
                        return null;
                    }
                }
                return file;
            })
            .filter((f) => f);
        // reset the files
        this.changed_files = [];

        // build the files
        await this.build(
            [].concat(added_files, files),
            this.get_watched_files()
        );

        // reload only whole page when no static asset is given
        const rel_file_paths = files.map((f) => f.rel_path);

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
    end(
        uid: string,
        res: ServerResponse,
        hr_start: [number, number],
        value: string = null
    ) {
        const duration =
            Math.round(hrtime_to_ms(process.hrtime(hr_start)) * 100) / 100;
        Logger.output(
            LogType.log,
            Logger.color.dim,
            '░',
            uid,
            Logger.color.reset(duration + ''),
            'ms'
        );
        res.end(value);
        return;
    }
}
