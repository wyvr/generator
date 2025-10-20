import Component from './devtool.svelte';
import { mount } from "svelte";

let is_active = false;
let target;
let component;

const icon = '🎉';
const name = 'MyDevtool';

export default {
    icon,
    name,
    description: 'Created with wyvr {{version}}',
    instant: false,
    onMount: () => {
        on('my_devtool_close', () => {
            close();
        });
    },
    onClick: () => {
        if (!is_active) {
            is_active = true;
            target = document.createElement('div');
            target.setAttribute('id', 'my_devtool');
            document.body.appendChild(target);
            component = mount(Component, { target, props: { name } });
        } else {
            close();
        }
    }
};

function close() {
    if (is_active) {
        component.$destroy();
        target.remove();
    }
    is_active = false;
}
