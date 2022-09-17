export default {
    icon: '🧠',
    name: 'ct.css',
    description: 'Let’s take a look inside your &lt;head&gt; <a href="https://csswizardry.com/ct/" target="_blank" rel="noopener">@csswizardry</a>',

    onClick: () => {
        const tag = document.querySelector('link.ct');
        if (tag) {
            tag.remove();
            wyvr_message('removed ct.css');
            return;
        }
        const ct = document.createElement('link');
        ct.rel = 'stylesheet';
        ct.href = 'https://csswizardry.com/ct/ct.css';
        ct.classList.add('ct');
        document.head.appendChild(ct);
        wyvr_message('added ct.css');
    },
};
        