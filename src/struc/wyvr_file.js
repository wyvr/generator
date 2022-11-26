export const WyvrHydrateDisplay = {
    inline: 'inline',
    block: 'block',
};

export const WyvrFileRender = { static: 'static', hydrate: 'hydrate' };

export const WyvrFileLoading = {
    instant: 'instant',
    lazy: 'lazy',
    idle: 'idle',
    interact: 'interact',
    media: 'media',
    none: 'none',
};

export const WyvrFileConfig = {
    display: WyvrHydrateDisplay.block,
    render: WyvrFileRender.static,
    loading: WyvrFileLoading.instant,
    error: undefined,
    portal: undefined,
    trigger: undefined,
    media: 'all',
};
