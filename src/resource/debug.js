/* eslint-disable no-undef */
/* eslint-disable no-console */
if (!window.wyvr_debug_initialized) {
    window.wyvr_debug_initialized = true;
    wyvr_debug_initialize();
}
async function wyvr_debug_initialize() {
    const modules_list = await wyvr_fetch('/wyvr/debug/modules.json');
    if (!Array.isArray(modules_list)) {
        console.error('could not load debug modules');
        return;
    }
    const modules = (
        await Promise.all(
            modules_list.map(async (path) => {
                try {
                    const module = await import(path);
                    return module?.default;
                } catch (e) {
                    console.error('can not load module ' + path, e);
                    return undefined;
                }
            })
        )
    )
        .filter((module) => {
            if (!module) {
                return false;
            }
            return typeof module?.onInit != 'function' || module.onInit();
        })
        .sort((a, b) => {
            return a.order < b.order;
        });

    console.log(modules);
    if (modules.length == 0) {
        return;
    }
    // styles
    const wyvr_debug_css = document.createElement('link');
    wyvr_debug_css.setAttribute('rel', 'stylesheet');
    wyvr_debug_css.setAttribute('href', '/wyvr/debug/debug.css');
    document.head.appendChild(wyvr_debug_css);

    // toolbar
    const icon =
        "data:image/svg+xml,%3Csvg width='839' height='293' viewBox='0 0 839 293' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23clip0)'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M838.932 2.05496e-05L749.198 176.524L618.098 176.524L558.322 292.63L389.516 292.63L354.069 223.309L318.639 292.511L148.862 292.643L-1.27918e-05 2.67029e-05L197.478 1.80709e-05L233.085 70.5426L268.692 1.4958e-05L438.514 3.80524e-05L489.297 101.073L653.876 2.86387e-05L838.932 2.05496e-05ZM416.212 28.2621L349.76 169.71L301.351 264.262L171.797 264.363L237.458 124.597L286.085 28.2621L416.212 28.2621ZM424.276 34.6138L474.766 135.103L405.722 262.246L359.657 172.16L424.276 34.6138ZM655.091 32.4201L485.273 136.71L415.949 264.368L541.085 264.368L598.656 152.546L655.091 32.4201ZM668.093 28.2621L792.861 28.2621L731.861 148.262L611.717 148.262L668.093 28.2621ZM180.085 28.2621L227.519 122.236L163.358 258.807L46.0848 28.2621L180.085 28.2621Z' fill='%235E7ED0'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0'%3E%3Crect width='839' height='293' fill='white'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E";
    const toolbar = document.createElement('div');
    toolbar.setAttribute('id', 'wyvr_debug_toolbar');
    toolbar.setAttribute('class', 'wyvr_debug_toolbar');
    toolbar.innerHTML = `
        <span><img width="48" height="17" src="${icon}" alt="wyvr Debug toolbar"/></span>
        <nav>${modules
            .map(
                (module, index) => `<button id="wyvr_debug_toolbar_${index}" class="wyvr_debug_toolbar_button">
        <span class="wyvr_debug_toolbar_icon">${module.icon || '•'}</span>
        <span class="wyvr_debug_toolbar_name">${module.name || ''}</span>
        ${module.description ? `<span class="wyvr_debug_toolbar_description">${module.description}</span>` : ''}
        </button>`
            )
            .join('')}</nav>
    `;
    /*
    <button id="wyvr_debug_rebuild" title="Rebuild">♻️</button>
        <button id="wyvr_debug_outline" title="Outline hydrated elements">🔍</button>
        
        <button id="wyvr_debug_inspect" title="Inspect data">✏️</button>
        <button id="wyvr_debug_inspect_global" title="Inspect global data">🌐</button>
        <button id="wyvr_debug_inspect_structure" title="Inspect structure">🏗</button>
        <button id="wyvr_debug_show_breakpoints" title="Show media breakpoints">📱</button>
        <button id="wyvr_debug_measure_cwv" title="Measure CWV">📈</button>
        <button id="wyvr_debug_clear_storage" title="Clear Storage">🗑️</button>
    */
    document.body.appendChild(toolbar);
    // add click handler
    modules.map((module, index) => {
        const button = document.querySelector(`#wyvr_debug_toolbar_${index}`);
        if (typeof module.onClick == 'function') {
            button.addEventListener('click', (e) => {
                module.onClick(button, e, module);
            });
        } else {
            button.disabled = true;
        }
        if (typeof module.onMount == 'function') {
            module.onMount(button, module);
        }
    });

    //     // styles
    //     const wyvr_debug_css = document.createElement('link');
    //     wyvr_debug_css.setAttribute('rel', 'stylesheet');
    //     wyvr_debug_css.setAttribute('href', '/debug.css');
    //     document.head.appendChild(wyvr_debug_css);

    //     // error container
    //     const error_target = document.getElementById('wyvr_error_target');
    //     if (!error_target) {
    //         const error_list = document.createElement('div');
    //         error_list.setAttribute('id', 'wyvr_error_target');
    //         document.body.appendChild(error_list);
    //     }

    //     // floating window
    //     const wyvr_floating_window = document.createElement('div');
    //     wyvr_floating_window.setAttribute('class', 'wyvr_floating_window');
    //     document.body.appendChild(wyvr_floating_window);
    //     window.wyvr_close_floating_window = () => {
    //         wyvr_floating_window.innerHTML = '';
    //         wyvr_debug_outline_last_element = null;
    //     };
}
function wyvr_debug_event(id, callback, immediately) {
    const element = document.getElementById(id);
    if (element && callback && typeof callback == 'function') {
        element.addEventListener('click', callback);
        if (immediately) {
            window.setTimeout(() => {
                element.click();
            }, 0);
        }
    }
}

window.wyvr_debug_message = (message) => {
    const element = document.createElement('div');
    element.setAttribute('class', 'wyvr_debug_message');
    element.innerText = message;
    document.body.appendChild(element);

    setTimeout(() => {
        element.style.opacity = 0;
    }, 1000);
    setTimeout(() => {
        element.remove();
    }, 3000);
}

// events
wyvr_debug_event('wyvr_debug_rebuild', () => {
    trigger('wyvr_debug_rebuild');
    wyvr_debug_message('triggered rebuild');
});

window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        wyvr_close_floating_window();
    }
});

wyvr_debug_event('wyvr_debug_ct.css', () => {
    const tag = document.querySelector('link.ct');
    if (tag) {
        tag.remove();
        wyvr_debug_message('removed ct.css');
        return;
    }
    const ct = document.createElement('link');
    ct.rel = 'stylesheet';
    ct.href = 'https://csswizardry.com/ct/ct.css';
    ct.classList.add('ct');
    document.head.appendChild(ct);
    wyvr_debug_message('added ct.css');
});
wyvr_debug_event('wyvr_debug_inspect', () => {
    wyvr_debug_inspect_data();
    wyvr_debug_message('open the console to inspect data');
});
wyvr_debug_event('wyvr_debug_inspect_global', () => {
    wyvr_debug_inspect_global_data();
    wyvr_debug_message('open the console to inspect global data');
});
wyvr_debug_event('wyvr_debug_inspect_structure', () => {
    wyvr_debug_inspect_structure_data();
    wyvr_debug_message('open the console to inspect structure');
});
wyvr_debug_event('wyvr_debug_show_breakpoints', () => {
    const html = document.querySelector('html');
    if (html.classList.contains('wyvr_debug_show_breakpoints')) {
        wyvr_debug_message('hide breakpoints');
        html.classList.remove('wyvr_debug_show_breakpoints');
        return;
    } else {
        html.classList.add('wyvr_debug_show_breakpoints');
    }
    let width_breakpoints = [];
    let height_breakpoints = [];
    const media = [];
    Array.from(document.styleSheets).forEach((ss) => {
        Array.from(ss.rules).forEach((rule) => {
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

    const colors = [
        '#F72585',
        '#B5179E',
        '#7209B7',
        '#560BAD',
        '#480CA8',
        '#3A0CA3',
        '#3A0CA3',
        '#4361EE',
        '#4895EF',
        '#4CC9F0',
    ];
    const breakpoints = width_breakpoints.sort().reverse();
    html.style = `--wyvr_debug_show_breakpoints-lines: ${width_breakpoints
        .map((a, index) => `linear-gradient(to right, ${colors[index]} 1px, transparent 1px, transparent)`)
        .join(',')}; --wyvr_debug_show_breakpoints-positions: ${breakpoints.map((width) => `${width}px 0`).join(',')};`;
    wyvr_debug_message('show breakpoints @ ' + breakpoints.map((width) => `${width}px`).join(', '));
    console.log('breakpoints', breakpoints);
});
wyvr_debug_event('wyvr_debug_measure_cwv', () => {
    wyvr_debug_message('reloading to measure CWV');
    const url = location.origin + location.pathname;
    location = location.search.indexOf('wyvr_debug_measure_cwv') > -1 ? url : `${url}?wyvr_debug_measure_cwv`;
});
wyvr_debug_event('wyvr_debug_clear_storage', () => {
    sessionStorage.clear();
    localStorage.clear();
    wyvr_debug_message('storage cleared');
});

if (window.location.search.indexOf('wyvr_debug_measure_cwv') > -1) {
    try {
        // LCP
        let lastLcp;
        new PerformanceObserver((entryList) => {
            (entryList.getEntries() || []).forEach((entry) => {
                if (entry.startTime !== lastLcp) {
                    console.group(`New LCP: ${entry.startTime}ms`);
                    console.log(`Size: ${entry.size} px^2`);
                    console.log('HTML:', entry.element || '(no element)');
                    console.groupEnd();
                    lastLcp = entry.startTime;
                }
            });
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // CLS
        new PerformanceObserver((entryList) => {
            let cls = 0;
            let nodes = [];
            (entryList.getEntries() || []).forEach((entry) => {
                if (!entry.hadRecentInput) {
                    // omit entries likely caused by user input
                    cls += entry.value;
                    nodes = [].concat(
                        nodes,
                        entry.sources.map((source) => {
                            return source.node;
                        })
                    );
                }
            });
            if (cls > 0 || nodes.length > 0) {
                console.group(`Cumulative Layout Shift: ${cls}ms`);
                console.log(`Shifting nodes`, nodes);
                console.groupEnd();
            }
        }).observe({ type: 'layout-shift', buffered: true });

        // FCP
        new PerformanceObserver((entryList) => {
            (entryList.getEntriesByName('first-contentful-paint') || []).forEach((entry) => {
                console.group(`First Contentful Paint: ${entry.startTime}ms`);
                console.groupEnd();
            });
        }).observe({ type: 'paint', buffered: true });

        // FID
        new PerformanceObserver((entryList) => {
            let entry = (entryList.getEntries() || []).find((x) => x);
            if (!entry) {
                return;
            }
            let fid = entry.processingStart - entry.startTime;
            console.group(`First Input Delay: ${fid}ms`);
            console.log(entry);
            console.groupEnd();
        }).observe({ type: 'first-input', buffered: true });
        document.body.click();
    } catch (e) {
        console.error('Measuring CWV is not supported');
    }
}
