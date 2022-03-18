import { WyvrFile, WyvrFileLoading } from '@lib/model/wyvr/file';

export const is_lazy = (file: WyvrFile) => {
    if(!file || !file.config) {
        return false;
    }
    return [WyvrFileLoading.lazy, WyvrFileLoading.idle, WyvrFileLoading.media, WyvrFileLoading.none].indexOf(file.config.loading) > -1;
};
