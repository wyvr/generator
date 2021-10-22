import { v4 } from 'uuid';

export const uniq = () => {
    return v4().split('-')[0]
}