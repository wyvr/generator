import { get_config_data } from '../action/get_config_data.js';
import { search_segment } from '../utils/segment.js';

export async function version_command(config) {
    get_config_data(config);
    return search_segment(config, 'version', '');
}
