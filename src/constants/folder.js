import { join } from 'path';

export const FOLDER_GEN = 'gen';
export const FOLDER_SRC = 'src';
export const FOLDER_GEN_SRC = join(FOLDER_GEN, FOLDER_SRC);
export const FOLDER_SERVER = 'server';
export const FOLDER_GEN_SERVER = join(FOLDER_GEN, FOLDER_SERVER);
export const FOLDER_CLIENT = 'client';
export const FOLDER_GEN_CLIENT = join(FOLDER_GEN, FOLDER_CLIENT);
export const FOLDER_ASSETS = 'assets';
export const FOLDER_GEN_ASSETS = join(FOLDER_GEN, FOLDER_ASSETS);
export const FOLDER_I18N = 'i18n';
export const FOLDER_CACHE = 'cache';
export const FOLDER_TEMP = 'tmp';
export const FOLDER_GEN_TEMP = join(FOLDER_GEN, FOLDER_TEMP);
export const FOLDER_DATA = 'data';
export const FOLDER_GEN_DATA = join(FOLDER_GEN, FOLDER_DATA);
export const FOLDER_PLUGINS = 'plugins';
export const FOLDER_GEN_PLUGINS = join(FOLDER_GEN, FOLDER_PLUGINS);
export const FOLDER_EXEC = 'exec';
export const FOLDER_ROUTES = 'routes';
export const FOLDER_GEN_ROUTES = join(FOLDER_GEN, FOLDER_ROUTES);
export const FOLDER_RELEASES = 'releases';
export const FOLDER_STORAGE = 'storage';
export const FOLDER_LIST_PACKAGE_COPY = [FOLDER_SRC, FOLDER_ASSETS, FOLDER_ROUTES, FOLDER_PLUGINS, FOLDER_EXEC];
