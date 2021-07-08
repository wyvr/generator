// toolbar
const toolbar = document.createElement('div');
toolbar.setAttribute('class', 'wyvr_debug_toolbar');
toolbar.innerHTML = `
<button id="wyvr_debug_outline" title="Outline hydrated elements">🔍</button>
<button id="wyvr_debug_inspect" title="Inspect data">💬</button>
<button id="wyvr_debug_inspect_global" title="Inspect global data">🌐</button>
`;
document.body.appendChild(toolbar);
// styles
const styles = document.createElement('style');
styles.innerHTML = `
.wyvr_debug_toolbar {
    position: fixed;
    left: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    border-top-right-radius: 10px;
}
.wyvr_debug_toolbar button {
    background: transparent;6
    border:none;
    color: #fff;
    padding: 0 16px;
    width: auto;
    height: 2em;
    line-height: 2em;
}
/* outline wyvr components */
.wyvr_debug_outline:before {
    content: 'Outlining hydrated elements';
    position: fixed;
    top:0;
    left:0;
    pointer-events: none;
    z-index: 100000;
    opacity: 0.3;
}
.wyvr_debug_outline [data-hydrate] {
    outline: 2px solid rgba(255,0,0,0.5);
}
.wyvr_debug_outline [data-hydrate]:hover {
    outline: 2px solid #f00;
}
.wyvr_debug_outline [data-hydrate]:hover:after {
	content: attr(data-hydrate);
    position: absolute;
}
.wyvr_debug_outline:before, .wyvr_debug_outline [data-hydrate]:hover:after {
    background: #f00;
    color: #fff;
    padding: 3px;
    font-size: 12px;
    font-family: monospace;
}
`;
document.head.appendChild(styles);

// events
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
