import Breakpoints from './wyvr_show_breakpoints.svelte';

let is_active = false;
let target;
let component;

export default {
    icon: '📱',
    name: 'Show media breakpoints',
    description: 'Show the available breakpoints',
    onMount: () => {
        target = document.createElement('div');
        document.body.appendChild(target);
    },
    onClick: () => {
        if (!is_active) {
            is_active = true;
            const { width_breakpoints } = get_breakpoints();
            component = new Breakpoints({ target, props: { breakpoints: width_breakpoints } });
        } else {
            is_active = false;
            component.$destroy();
        }
        // const html = document.querySelector('html');
        // if (html.classList.contains('wyvr_show_breakpoints')) {
        //     wyvr_message('hide breakpoints');
        //     html.classList.remove('wyvr_show_breakpoints');
        //     return;
        // } else {
        //     html.classList.add('wyvr_show_breakpoints');
        // }
    },
};

function get_breakpoints() {
    let width_breakpoints = [];
    let height_breakpoints = [];
    const media = [];
    Array.from(document.styleSheets).forEach((ss) => {
        Array.from(ss.cssRules).forEach((rule) => {
            media.push(rule.media);
        });
    });
    media
        .filter((x) => x)
        .forEach((media) => {
            Array.from(media).forEach((media_item) => {
                let match = media_item.match(/\(?(?:min|max)-width:\s*(\d*)px\)?/);
                if (match) {
                    width_breakpoints.push(parseFloat(match[1]));
                    return;
                }
                // match = media_item.match(/\(?(?:min|max)-height:\s*(\d*)px\)?/);
                // if (match) {
                //     height_breakpoints.push(parseFloat(match[1]));
                //     return;
                // }
            });
        });
    width_breakpoints = width_breakpoints.filter((item, index) => width_breakpoints.indexOf(item) == index);
    height_breakpoints = height_breakpoints.filter((item, index) => height_breakpoints.indexOf(item) == index);
    return { width_breakpoints, height_breakpoints };
}

