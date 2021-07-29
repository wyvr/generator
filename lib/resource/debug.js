// toolbar
const toolbar = document.createElement('div');
toolbar.setAttribute('class', 'wyvr_debug_toolbar');
toolbar.innerHTML = `
<span><img width="48" height="48" src="data:text/xml;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAANrSURBVHgB7VZdUtswEN6V89oZbtBwAuITNNwA3iExJ0h47gAOaZ+bnqBJ4L3cAPcESU9AjpD2GWu7K8vUGMlOmekT+mY8sSPtane//RFAQEBAQEBAQEBAQMBbBZ5erL/xb3enzYjz5fXBovweXK5mRHjQJkcRTW7TOIMdkKSrfp7jiF/3dti+6bD6H2xYwh9b+/jQ5b38gHEg+bjqa8ARYqPcnnlylPcMmg3fI1JXWtMYsTAOGm0RYGK2Di7XD3KQ+k3781nsNOb0YsWK8YsICQvM3D0f1FeKZdJ445IZXP68QqQeERxpRYc+Flh3UugGdqJw9GbaOwS3o12t8V7el9e9fSUvRDQRYf0OxuDBzTSegYkKpazkSIwHTV99xktEgTTbRefyjTleuYwpAoGSxlud02EU0bmkqs8OrdUQDAOYyreyxs2NcYijZLzy5p51VCLwXfarDsx8e/McjlQE88JBWojDJ5zfpXPCDutZmUCwXmYyvv0cZ5rlqnVWd5h1JXJ2uUfVjGtjYQ5lbhItfNE3ihV+KNeVglR+hQUpUjFcmOR0WYvhy2mc8t6tGEgNdcg1IsXd5XQ8ezqnapzJv91Y2Eh0fXskp3OkpyhWWbD5y7lO55LnvLYu93H0kyiCO5dO4xzRWGys1pJ6ZpxuZ4EPyHaJfr1gSxakbqTwbU09MxAVvvfpfXws5KUlV//vVD8kB7moMixYmLk6kijqdKwxDkj0eTZkzkVmb/kpTn0GcsFnia2T54scVIXDevRfOGDOYBYwwnvLQlpdK2hEmqe9DXiBQy6wFy1Q0oPTzln0tjVKdxlq7dhg86Qe/crSXwgLvlqQIuIoTcADib7rfxl6gOpBCtW1XqaHMMR5fuZ6eMAdu+ZIx6XQxYKJUq5/Lab+3OfUk17flXZZPSxXOLq5Pjh2yZTRl6BxXaTwj1CuP10scF/vt3UesCO+OrTslL3zyZXR5wF2Bq+A8i3UOxLfObpNncdGf1MfWrYmvIOJO9aQ98+bdL/KgSoLPDVHOvJfxp6iz+2V26U4vBUWTEeK/DVTRr+prtqATYsnXHwqMoNnSwjeNEDi6wBIrycZTJvBxSoFywjLZQ1yiUR/Mem9Kn2MjrYN5a0TWlHcUuVN7jpcmOaG2ybVdJsNCAgICAgICAgICPiv+ANVAwLxOovLzwAAAABJRU5ErkJggg==" alt="wyvr Debug toolbar"/></span>
<nav>
    <button id="wyvr_debug_outline" title="Outline hydrated elements">🔍</button>
    <button id="wyvr_debug_inspect" title="Inspect data">💬</button>
    <button id="wyvr_debug_inspect_global" title="Inspect global data">🌐</button>
    <button id="wyvr_debug_inspect_structure" title="Inspect structure">🏗</button>
</nav>
`;
document.body.appendChild(toolbar);
// styles
const styles = document.createElement('style');
styles.innerHTML = `
.wyvr_debug_toolbar {
    position: fixed;
    left: 0;
    bottom: 0;
}
.wyvr_debug_toolbar>span {
    display: block;
    padding: 0 0 0 10px;
}
.wyvr_debug_toolbar>nav {
    position: absolute;
    bottom: 0;
    left: 0;
    background: rgba(0,0,0,0.75);
    padding: 10px;
    border-top-right-radius: 10px;
    display: none;
}
.wyvr_debug_toolbar:hover>nav{
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
.wyvr_debug_toolbar button:hover, .wyvr_debug_toolbar button:active {
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
const wyvr_debug_inspect_structure = document.getElementById('wyvr_debug_inspect_structure');
if (wyvr_debug_inspect_structure) {
    wyvr_debug_inspect_structure.addEventListener('click', (e) => {
        wyvr_debug_inspect_structure_data();
    });
}
