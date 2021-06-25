// toolbar
const toolbar = document.createElement('div');
toolbar.setAttribute('class', 'wyvr_debug_toolbar');
toolbar.innerHTML = `
<button id="wyvr_debug_outline" title="Outline hydrated elements">🔍</button>
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
    background: transparent;
    border:none;
    color: #fff;
    padding: 0 16px;
    width: auto;
    height: 2em;
    line-height: 2em;
}
.wyvr_debug_outline [data-hydrate] {
    outline: 2px solid rgba(255,0,0,0.5);
}
.wyvr_debug_outline [data-hydrate]:hover {
    outline: 2px solid #f00;
}
.wyvr_debug_outline [data-hydrate]:hover:after {
	content: attr(data-hydrate);
    background: #f00;
    color: #fff;
    position: absolute;
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
