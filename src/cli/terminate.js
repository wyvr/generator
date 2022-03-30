// import {clearLine, cursorTo} from 'readline';

export function terminate(die) {
    if(die === true) {
        process.exit(1);
        return;
    }
}