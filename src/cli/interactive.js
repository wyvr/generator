import inquirer from 'inquirer';
import { Logger } from '../utils/logger.js';
import { is_array, is_func, is_null, is_object } from '../utils/validate.js';
import { get_error_message } from '../utils/error.js';

export async function collect_data_from_cli(questions, default_data) {
    return await collect_data(questions, default_data, inquirer.prompt);
}
export async function collect_data(questions, default_data = {}, get_answers_callback = () => {}) {
    let data = Object.assign({}, default_data);
    if (!is_array(questions)) {
        return data;
    }
    if (!is_func(get_answers_callback)) {
        return default_data;
    }
    const question_list = is_object(questions) ? [questions] : questions;
    for await (const question of question_list) {
        // when no field is associated, it's a regular question
        if (!question._field) {
            const answer = await get_answers_callback([question]);
            if (!is_object(answer)) {
                continue;
            }
            // set selected values
            for (const [key, value] of Object.entries(answer)) {
                if (key === 'undefined' && value === undefined) {
                    continue;
                }
                data[key] = value;
            }
            continue;
        }

        let condition_values = data[question._field];
        if (condition_values === undefined) {
            continue;
        }
        if (!is_array(condition_values)) {
            condition_values = [condition_values.toString()];
        }

        const questions = [];
        // search the questions for the condition
        for (const condition_value of condition_values) {
            // found exact match
            if (question[condition_value]) {
                questions.push(...(is_array(question[condition_value]) ? question[condition_value] : [question[condition_value]]));
                continue;
            }
            // search universal condition
            if (question._) {
                questions.push(...(is_array(question._) ? question._ : [question._]));
            }
        }

        try {
            const condition_result = await collect_data(questions, data, get_answers_callback);
            data = { ...data, ...condition_result };
        } catch (e) {
            Logger.error(get_error_message(e, import.meta.url, 'interactive'));
        }
    }
    return data;
}
