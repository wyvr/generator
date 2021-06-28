import { Logger } from '@lib/logger';

export class Error {
    static get(e: any, filename: string, scope: string = null): string {
        if (e.message) {
            const stack = e.stack.split('\n');
            if (stack) {
                e.code = stack[0].slice(0, stack[0].indexOf(':'));
                e.requireStack = stack.slice(1).map((stack_entry) => {
                    return stack_entry.slice(stack_entry.indexOf('at') + 3);
                });
            }
        }
        return `${Logger.color.bold('@' + scope ?? '')}\n[${Logger.color.bold(e.code)}] ${e.message ?? '-'}\n${Logger.color.dim('in')} ${e.requireStack ? e.requireStack[0] : '-'}\n${Logger.color.dim(
            'source file'
        )} ${filename}`;
    }
}
