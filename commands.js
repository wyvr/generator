import { get_error_message } from './src/utils/error.js';
import { Logger } from './src/utils/logger.js';
import { collect_data_from_cli } from './src/cli/interactive.js';
import { filled_array, is_func } from './src/utils/validate.js';

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

export function prompt_option(name, value, checked = false) {
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
        Logger.error(get_error_message(e, undefined, 'execute prompts'));
        return undefined;
    }
}
