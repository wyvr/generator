let wyvr_server_setup = () => {
    const path = location.pathname;
    wyvr_server.send(JSON.stringify({ path }));
};
const wyvr_server = new WebSocket('ws://localhost:3001');
wyvr_server.onmessage = function (event) {
    let data = event.data;
    try {
        data = JSON.parse(data);
    } catch (e) {}
    if (wyvr_server_setup && data && data.state && data.state == 'active') {
        wyvr_server_setup();
        wyvr_server_setup = null;
    }
    console.log(data);
};
// document.addEventListener('DOMContentLoaded', () => {

// });
// wyvr_server.send(location.pathname)
