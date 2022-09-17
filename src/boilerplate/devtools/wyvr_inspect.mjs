import Inspect from './wyvr_inspect.svelte';

let is_active = false;
let target;
let component;

export default {
    icon: '🔍️',
    name: 'Inspect hydratable components',
    description: 'make hydated components visible and inspect the config',
    onMount: () => {
        target = document.createElement('div');
        document.body.appendChild(target);
    },
    onClick: () => {
        if (!is_active) {
            is_active = true;
            component = new Inspect({ target });
        } else {
            is_active = false;
            component.$destroy();
        }
    },
};
