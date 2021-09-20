// toolbar
const icon =
    "data:image/svg+xml,%3Csvg width='839' height='293' viewBox='0 0 839 293' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23clip0)'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M838.932 2.05496e-05L749.198 176.524L618.098 176.524L558.322 292.63L389.516 292.63L354.069 223.309L318.639 292.511L148.862 292.643L-1.27918e-05 2.67029e-05L197.478 1.80709e-05L233.085 70.5426L268.692 1.4958e-05L438.514 3.80524e-05L489.297 101.073L653.876 2.86387e-05L838.932 2.05496e-05ZM416.212 28.2621L349.76 169.71L301.351 264.262L171.797 264.363L237.458 124.597L286.085 28.2621L416.212 28.2621ZM424.276 34.6138L474.766 135.103L405.722 262.246L359.657 172.16L424.276 34.6138ZM655.091 32.4201L485.273 136.71L415.949 264.368L541.085 264.368L598.656 152.546L655.091 32.4201ZM668.093 28.2621L792.861 28.2621L731.861 148.262L611.717 148.262L668.093 28.2621ZM180.085 28.2621L227.519 122.236L163.358 258.807L46.0848 28.2621L180.085 28.2621Z' fill='%235E7ED0'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0'%3E%3Crect width='839' height='293' fill='white'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E";
const toolbar = document.createElement('div');
toolbar.setAttribute('class', 'wyvr_debug_toolbar');
toolbar.innerHTML = `
<span><img width="48" height="17" src="${icon}" alt="wyvr Debug toolbar"/></span>
<nav>
    <button id="wyvr_debug_rebuild" title="Rebuild">♻️</button>
    <button id="wyvr_debug_outline" title="Outline hydrated elements">🔍</button>
    <button id="wyvr_debug_inspect" title="Inspect data">✏️</button>
    <button id="wyvr_debug_inspect_global" title="Inspect global data">🌐</button>
    <button id="wyvr_debug_inspect_structure" title="Inspect structure">🏗</button>
    <button id="wyvr_debug_show_breakpoints" title="Show media breakpoints">📱</button>
    <button id="wyvr_debug_measure_cwv" title="Measure CWV">📈</button>
</nav>
`;
document.body.appendChild(toolbar);
// styles
const styles = document.createElement('style');
styles.innerHTML = `.wyvr_debug_toolbar {
    position: fixed;
    left: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    border-top-right-radius: 10px;
}
.wyvr_debug_toolbar:after {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    background: transparent;
    border: 2px solid transparent;
    top: 0px;
    right: 0px;
    border-radius: 50%;
    transition: background 0.2s ease-out, border 0.2s ease-out;
    pointer-events: none;
}
.wyvr_debug_toolbar.connected:after {
    background: #6d8ddf;
    border-color: #6d8ddf;
}
.wyvr_debug_toolbar.disconnected:after {
    border-color: #999;
}

.wyvr_debug_toolbar > span {
    display: block;
    padding: 10px;
}
.wyvr_debug_toolbar > span > img {
    display: block;
}
.wyvr_debug_toolbar > nav {
    position: absolute;
    bottom: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.75);
    padding: 10px;
    border-top-right-radius: 10px;
    display: none;
    z-index: 1000;
}
.wyvr_debug_toolbar:hover > nav {
    display: block;
}
.wyvr_debug_toolbar button {
    background: transparent;
    border: none;
    color: #fff;
    padding: 0 10px;
    width: auto;
    height: 2em;
    line-height: 2em;
    display: block;
    white-space: nowrap;
}
.wyvr_debug_toolbar #wyvr_debug_rebuild {
    display: none;
}
.wyvr_debug_toolbar.connected #wyvr_debug_rebuild {
    display: block;
}
.wyvr_debug_toolbar button:hover,
.wyvr_debug_toolbar button:active {
    background: #000;
}
.wyvr_debug_toolbar button::after {
    content: attr(title);
    padding-left: 10px;
}
/* outline wyvr components */
.wyvr_debug_outline:before {
    content: 'Outlining hydrated elements';
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 100000;
    opacity: 0.3;
}
.wyvr_debug_outline [data-hydrate] {
    outline: 2px solid rgba(255, 0, 0, 0.5);
    min-width: 10px;
    min-height: 10px;
}
.wyvr_debug_outline span[data-hydrate] {
    display: inline-block;
}
.wyvr_debug_outline [data-hydrate]:hover {
    outline: 2px solid #f00;
}
.wyvr_debug_outline [data-hydrate]:hover:after {
    content: attr(data-hydrate-path);
    position: absolute;
}
.wyvr_debug_outline:before,
.wyvr_debug_outline [data-hydrate]:hover:after {
    background: #f00;
    color: #fff;
    padding: 3px;
    font-size: 12px;
    font-family: monospace;
}
.wyvr_debug_show_breakpoints:after {
    content: '';
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 10000;
    pointer-events: none;
    background-image: var(--wyvr_debug_show_breakpoints-lines);
    background-position:  var(--wyvr_debug_show_breakpoints-positions);
    background-repeat: no-repeat;
}
`;
document.head.appendChild(styles);

// events
const wyvr_debug_rebuild = document.getElementById('wyvr_debug_rebuild');
if (wyvr_debug_rebuild) {
    wyvr_debug_rebuild.addEventListener('click', (e) => {
        trigger('wyvr_debug_rebuild');
    });
}
const wyvr_debug_outline = document.getElementById('wyvr_debug_outline');
if (wyvr_debug_outline) {
    wyvr_debug_outline.addEventListener('click', (e) => {
        document.body.classList.toggle('wyvr_debug_outline');
    });
}
const wyvr_debug_inspect = document.getElementById('wyvr_debug_inspect');
if (wyvr_debug_inspect) {
    wyvr_debug_inspect.addEventListener('click', (e) => {
        wyvr_debug_inspect_data();
    });
}
const wyvr_debug_inspect_global = document.getElementById('wyvr_debug_inspect_global');
if (wyvr_debug_inspect_global) {
    wyvr_debug_inspect_global.addEventListener('click', (e) => {
        wyvr_debug_inspect_global_data();
    });
}
const wyvr_debug_inspect_structure = document.getElementById('wyvr_debug_inspect_structure');
if (wyvr_debug_inspect_structure) {
    wyvr_debug_inspect_structure.addEventListener('click', (e) => {
        wyvr_debug_inspect_structure_data();
    });
}
const wyvr_debug_show_breakpoints = document.getElementById('wyvr_debug_show_breakpoints');
if (wyvr_debug_show_breakpoints) {
    wyvr_debug_show_breakpoints.addEventListener('click', (e) => {
        const html = document.querySelector('html');
        html.classList.toggle('wyvr_debug_show_breakpoints');
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

        let colors = ['#F72585', '#B5179E', '#7209B7', '#560BAD', '#480CA8', '#3A0CA3', '#3A0CA3', '#4361EE', '#4895EF', '#4CC9F0'];
        html.style = `--wyvr_debug_show_breakpoints-lines: ${width_breakpoints.map((a, index)=>`linear-gradient(to right, ${colors[index]} 1px, transparent 1px, transparent)`).join(',')}; --wyvr_debug_show_breakpoints-positions: ${width_breakpoints.map((width)=>`${width}px 0`).join(',')};`;
    });
}
const wyvr_debug_measure_cwv = document.getElementById('wyvr_debug_measure_cwv');
if (wyvr_debug_measure_cwv) {
    wyvr_debug_measure_cwv.addEventListener('click', (e) => {
        const url = location.origin + location.pathname;
        location = location.search.indexOf('wyvr_debug_measure_cwv') > -1 ? url : `${url}?wyvr_debug_measure_cwv`;
    });
}

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
