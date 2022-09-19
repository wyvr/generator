let is_active = false;

export default {
    icon: '♻️',
    name: 'Rebuild',
    description: 'rebuild the current page',
    order: 100,
    onClick: () => {
        if (!is_active) {
            trigger('wyvr_devtools_rebuild');
            wyvr_message('triggered rebuild');
            is_active = true;
        }
    },
};
