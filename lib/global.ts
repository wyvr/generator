import { Logger } from '@lib/logger';

export class Global {
    /**
     * Replace the getGlobal() method and insert the result
     * @param content svelte content
     * @param global_data data which gets injected
     * @returns the content with inserted getGlobal result
     */
    static replace_global(content: string, global_data: any = null): string {
        if (!content || typeof content != 'string') {
            return '';
        }
        const search_string = 'getGlobal(';
        let start_index = content.indexOf(search_string);
        // when not found
        if (start_index == -1) {
            return content;
        }
        let index = start_index + search_string.length + 1;
        let open_brackets = 1;
        let found_closing = false;
        const length = content.length;
        while (index < length && open_brackets > 0) {
            const char = content[index];
            switch (char) {
                case '(':
                    open_brackets++;
                    break;
                case ')':
                    open_brackets--;
                    if (open_brackets == 0) {
                        found_closing = true;
                    }
                    break;
            }
            index++;
        }
        if (found_closing) {
            // extract the function content, to execute it
            const func_content = content.substr(start_index, index - start_index);
            if (!(<any>global).getGlobal || typeof (<any>global).getGlobal != 'function') {
                (<any>global).getGlobal = (key, fallback, callback) => {
                    return this.get_global(key, fallback || null, global_data, callback);
                };
            }
            let result = eval(func_content); // @NOTE throw error, must be catched outside

            // insert result of getGlobal
            const replaced = content.substr(0, start_index) + JSON.stringify(result) + content.substr(index);
            // check if more onServer handlers are used
            return this.replace_global(replaced, global_data);
        }
        return content;
    }
    /**
     * get the value from the global_data
     * @param key the key path which should be get from global
     * @param fallback fallback value when the key path does not exist or global_data is not existing
     * @param global_data data from which the key gets extracted
     * @param callback when defined a method to transform the given data
     * @returns json string of the result
     */
    static get_global(key: string, fallback: any = null, global_data: any = null, callback: Function = null) {
        if (!key || !global_data) {
            return Global.apply_callback(fallback, callback);
        }
        // avoid loading to much data
        if (key == 'nav' && (!callback || typeof callback != 'function')) {
            Logger.error('[wyvr]', 'avoid getting getGlobal("nav") because of potential memory leak, add a callback to shrink results');
            return Global.apply_callback(fallback, callback);
        }
        const steps = key.split('.');
        let value = fallback;
        for (let i = 0; i < steps.length; i++) {
            let step = steps[i];
            let index = null;
            // searches an element at an specific index
            if (step.indexOf('[') > -1 && step.indexOf(']') > -1) {
                const match = step.match(/^([^\[]+)\[([^\]]+)\]$/);
                if (match) {
                    step = match[1];
                    index = parseInt((match[2] + '').trim(), 10);
                }
            }
            if (i == 0) {
                value = global_data[step];
                if (value === undefined) {
                    return Global.apply_callback(fallback, callback);
                }

                if (value !== undefined && index != null && Array.isArray(value)) {
                    value = value[index];
                }
                continue;
            }
            value = value[step];
            if (value === undefined) {
                return Global.apply_callback(fallback, callback);
            }
            if (value !== undefined && index != null && Array.isArray(value)) {
                value = value[index];
            }
        }

        return Global.apply_callback(value, callback);
    }
    /**
     * When callback is defined it gets applied to the given value
     * @param value value which can be transformed
     * @param callback when defined a method to transform the given data
     * @returns the transformed value
     */
    static apply_callback(value: any, callback: Function = null) {
        if (!value || !callback || typeof callback != 'function') {
            return value;
        }
        try {
            return callback(value);
        } catch (e) {
            return value;
        }
    }
}
