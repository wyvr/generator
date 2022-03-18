const bcl = document.body.classList;
setTimeout(() => {
    bcl.remove('loading');
    bcl.add('loaded');
}, 10);
