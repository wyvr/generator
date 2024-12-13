import { Logger } from './src/utils/logger.js';
import { collect_data_from_cli } from './src/cli/interactive.js';
import { filled_array, is_func, is_number } from './src/utils/validate.js';

export * from './shared.js';

const prompts = [];
export function prompt_input(name, message, default_value, validate) {
    const data = prompt(name, message, default_value, validate);
    data.type = 'input';
    return data;
}

export function prompt_number(name, message, default_value, validate) {
    const data = prompt(name, message, default_value, validate);
    data.type = 'number';
    return data;
}

export function prompt_confirm(name, message, default_value, validate) {
    const data = prompt(name, message, !!default_value, validate);
    data.type = 'confirm';
    return data;
}

export function prompt_list(name, message, choices, validate) {
    const data = prompt(name, message, 0, validate);
    data.type = 'list';
    if (filled_array(choices)) {
        data.choices = choices;
    }
    return data;
}

export function prompt_multilist(name, message, choices, validate) {
    const data = prompt(name, message, 0, validate);
    data.type = 'checkbox';
    if (filled_array(choices)) {
        data.choices = choices;
    }
    return data;
}

export function prompt_password(name, message, validate) {
    const data = prompt(name, message, 0, validate);
    data.type = 'password';
    data.mask = false;
    return data;
}

export function prompt_option(value, name, checked = false) {
    return { name, value, checked };
}

export function prompt_condition(field, conditions, default_value) {
    const condition = { _field: field, ...conditions, _: default_value };

    return condition;
}

function prompt(name, message, default_value, validate) {
    const data = { name, message };
    if (default_value) {
        data.default = default_value;
    }
    if (is_func(validate)) {
        data.validate = validate;
    }
    return data;
}

export function add_prompts(...questions) {
    prompts.push(...questions);
}

/**
 * Retrieves the prompts.
 *
 * @returns {Array} The prompts array.
 */
export function get_prompts() {
    return prompts;
}

/**
 * Clears the prompts array.
 */
export function clear_prompts() {
    prompts.length = 0;
}

/**
 * Executes prompts and collects data from the command line interface.
 *
 * @param {Object} default_data - The default data to be used for prompts.
 * @returns {Promise<Object|undefined>} - A promise that resolves to the collected data or undefined if an error occurs.
 */
export async function execute_prompts(default_data = {}) {
    try {
        const result = await collect_data_from_cli(prompts, default_data);
        clear_prompts();
        return result;
    } catch (e) {
        process.exit(1);
    }
}

export async function execute_flag_prompts(flags, fields) {
    const result = {};
    for (const field of fields) {
        const key = field.key;
        const name = field.name;
        const type = field.type || '';
        const validate_fn_type = validate?.[type] ?? (() => true);
        const default_value = field.default;
        const init_value = flags?.[key];
        const validate_fn = (v) => {
            const required_value = validate.required(v);
            if (field.required && required_value !== true && default_value === undefined) {
                return required_value;
            }
            return validate_fn_type(v);
        }
        if (init_value && (!is_func(validate_fn) || validate_fn(init_value) === true)) {
            if (type === 'password') {
                Logger.warning('Providing password via command line is not recommended');
                Logger.info(name, '***');
            } else {
                Logger.info(name, init_value);
            }

            result[key] = init_value;
        } else {
            let prompt_entry = prompt_input(key, name, default_value, validate_fn);
            switch (type) {
                case 'list':
                    prompt_entry = prompt_list(key, name, field.list, validate_fn);
                    break;
                case 'password':
                    prompt_entry = prompt_password(key, name, validate_fn);
                    break;
            }
            add_prompts(prompt_entry)
        }
    }
    return await execute_prompts(result);
}

export const validate = {
    required: (v) => !!v || 'This field is required',
    number: (v) => !is_number(v) || 'This field must be a number',
    email: (v) => /.+@.+\..+/.test(v) || 'This field must be a valid email address',
    min: (v, min) => v.length >= min || `This field must be at least ${min} characters long`,
    max: (v, max) => v.length <= max || `This field must be at most ${max} characters long`,
};