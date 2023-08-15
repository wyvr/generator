import inquirer from 'inquirer';
import { Logger } from '../utils/logger.js';
import { is_array, is_func, is_null, is_object } from '../utils/validate.js';

/* c8 ignore start */
export async function collect_data_from_cli(questions, default_data) {
    return await collect_data(questions, default_data, inquirer.prompt);
}
/* c8 ignore end */
export async function collect_data(questions, default_data, get_answers_callback = () => {}) {
    if (!is_object(default_data)) {
        default_data = {};
    }
    if (!is_array(questions)) {
        return default_data;
    }

    if (!is_func(get_answers_callback)) {
        return default_data;
    }
    for await (const question of questions) {
        if (!is_array(question)) {
            if (!question._field) {
                continue;
            }
            if (is_null(default_data[question?._field])) {
                Logger.warning(`missing field ${JSON.stringify(question?._field)} for question condition`);
                continue;
            }
            let conditional_value = default_data[question._field].toString();
            // fallback condition "_"
            if (question._ && !question[conditional_value]) {
                conditional_value = '_';
            }
            // select the conditional questions
            let conditional_questions = question[conditional_value];
            // when array was given, combine the questions
            if (is_array(default_data[question._field])) {
                conditional_questions = default_data[question._field]
                    .map((value) => (value == '_' ? undefined : question[value]))
                    .filter((x) => x)
                    .flat();
            }
            if (!conditional_questions) {
                Logger.error(`unknown value ${JSON.stringify(conditional_value)} for ${question._field}`);
                continue;
            }
            default_data = await collect_data(conditional_questions, default_data, get_answers_callback);
            continue;
        }
        const entry_questions = question
            .map((item) => {
                // ignore when the item is already set
                if (Object.keys(default_data).includes(item.name) && !is_null(default_data[item.name])) {
                    return null;
                }
                return item;
            })
            .filter((x) => x);
        if (entry_questions.length == 0) {
            continue;
        }

        const result = await get_answers_callback(entry_questions);
        if (!is_object(result)) {
            continue;
        }
        // set selected values
        Object.entries(result).forEach(([key, value]) => {
            default_data[key] = value;
        });
        continue;
    }
    return default_data;
}
