import { WorkerAction } from '../struc/worker_action.js';
import { get_name } from '../struc/worker_status.js';
import { Cwd } from '../vars/cwd.js';
import { WorkerController } from '../worker/controller.js';
import { Config } from './config.js';
import { append, read, write } from './file.js';
import { Logger } from './logger.js';
import { is_string } from './validate.js';

let chat_interval;
const chat_input = Cwd.get('command.wyvr');
const chat_output = Cwd.get('answer.wyvr');

// starts a intervall to read messages from the chat file to execute commands while wyvr is running
export function chat_start() {
    if (chat_interval) {
        return;
    }
    Logger.warning('chat started');
    chat_interval = setInterval(() => {
        // read chat file
        const content = read(chat_input)?.trim();
        if (!content) {
            return;
        }

        // execute command
        execute(content);
    }, 5000);
}

// stops the chat
export function chat_stop() {
    Logger.warning('chat stopped');
    clearInterval(chat_interval);
}

function execute(command) {
    if (!is_string(command)) {
        return;
    }

    const args = command.split(' ');

    if (args.length == 0) {
        return;
    }

    const cmd = args.shift();

    const answer = commands[cmd] ? commands[cmd](...args) : commands.help(cmd);

    Logger.warning('chat', JSON.stringify(command));
    write(chat_input, '');

    append(
        chat_output,
        `@ ${new Date()}\n> ${command}\n${answer.join('\n')}\n\n`
    );
}

const commands = {
    help: (cmd) => {
        const result = [
            'available commands:',
            ...Object.keys(commands).map((c) => '- ' + c),
        ];
        if (cmd) {
            return [cmd + ' is not a valid command', ...result];
        }
        return result;
    },
    config: () => {
        return [JSON.stringify(Config.get(), null, 4)];
    },
    worker: () => {
        return WorkerController.workers?.map((worker) => {
            return `worker ${worker.pid} ${worker.status} ${get_name(
                worker.status
            )}`;
        });
    },
    heap: (pid) => {
        const worker = WorkerController.workers?.find((worker) => worker.pid == pid);
        if(!worker) {
            return ['no worker found with pid ' + pid];
        }
        WorkerController.send_action(worker, WorkerAction.heap, true);
        return ['heap sent to worker ' + pid];
    },
};
