import { WyvrFileLoading, WyvrFileRender, WyvrFileRenderHydrequestAlias } from '../struc/wyvr_file.js';
import { in_array } from '../utils/validate.js';

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class WyvrFileClassification {
    static is_client_code_required(value) {
        return in_array([WyvrFileRender.hydrate, WyvrFileRender.hydrequest, WyvrFileRender.request], value);
    }
    static is_client_hydrateable(value) {
        return in_array([WyvrFileRender.hydrate, WyvrFileRender.hydrequest], value);
    }
    static is_server_request(value) {
        return in_array([WyvrFileRender.hydrequest, WyvrFileRender.request], value);
    }
    static normalize(value) {
        if (in_array([WyvrFileRender.hydrate, WyvrFileRender.hydrequest, WyvrFileRender.request], value)) {
            return value;
        }
        if (in_array(WyvrFileRenderHydrequestAlias, value)) {
            return WyvrFileRender.hydrequest;
        }
        return undefined;
    }
    static is_valid_loading_value(value) {
        return in_array(Object.values(WyvrFileLoading), value);
    }
}
