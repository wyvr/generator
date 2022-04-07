import { v4 } from 'uuid';

export function uniq() {
    return v4().replace(/-/g, '');
}
