import { join } from 'path';

export const FOLDER_GEN = 'gen';
export const FOLDER_SRC = 'src';
export const FOLDER_GEN_SRC = join(FOLDER_GEN, FOLDER_SRC);
export const FOLDER_ASSETS = 'assets';
export const FOLDER_GEN_ASSETS = join(FOLDER_GEN, FOLDER_ASSETS);
export const FOLDER_LIST_PACKAGE_COPY = ['assets', 'routes', 'plugins', 'exec'];
