import { strictEqual } from 'node:assert';
import { EnvType } from '../../../src/struc/env.js';
import { WyvrFileLoading, WyvrFileRender, WyvrHydrateDisplay } from '../../../src/struc/wyvr_file.js';
import { insert_hydrate_tag } from '../../../src/utils/transform.js';
import { Env } from '../../../src/vars/env.js';

describe('utils/transform/insert_hydrate_tag', () => {
    it('undefined', () => {
        strictEqual(insert_hydrate_tag(), '');
    });
    it('has content, but no file', () => {
        strictEqual(insert_hydrate_tag('test'), 'test');
    });
    it('block', () => {
        strictEqual(
            insert_hydrate_tag(`<script>export let a = '';</script><p>{a}</p>`, {
                path: 'path',
                name: 'name',
                config: {
                    display: WyvrHydrateDisplay.block,
                    render: WyvrFileRender.hydrate,
                    loading: WyvrFileLoading.instant,
                    error: undefined,
                    portal: undefined,
                    trigger: undefined,
                    media: 'all',
                },
            }),
            `<script>export let a = '';</script><div data-render="hydrate" data-hydrate="name" data-props="{_prop('a', a)}" data-loading="instant"><p>{a}</p></div>`
        );
    });
    it('inline', () => {
        strictEqual(
            insert_hydrate_tag(`<script>export let a = '';</script><p>{a}</p>`, {
                path: 'path',
                name: 'name',
                config: {
                    display: WyvrHydrateDisplay.inline,
                    render: WyvrFileRender.hydrate,
                    loading: WyvrFileLoading.instant,
                    error: undefined,
                    portal: undefined,
                    trigger: undefined,
                    media: 'all',
                },
            }),
            `<script>export let a = '';</script><span data-render="hydrate" data-hydrate="name" data-props="{_prop('a', a)}" data-loading="instant"><p>{a}</p></span>`
        );
    });
    it('hydrate lazy', () => {
        strictEqual(
            insert_hydrate_tag(`<script>export let a = '';</script><p>{a}</p>`, {
                path: 'path',
                name: 'name',
                config: {
                    display: WyvrHydrateDisplay.block,
                    render: WyvrFileRender.hydrate,
                    loading: WyvrFileLoading.lazy,
                    error: undefined,
                    portal: undefined,
                    trigger: undefined,
                    media: 'all',
                },
            }),
            `<script>export let a = '';</script><div data-render="hydrate" data-hydrate="name" data-props="{_prop('a', a)}" data-loading="lazy"><p>{a}</p></div>`
        );
    });
    // it('hydrate lazy with boundary', () => {
    //     strictEqual(
    //         insert_hydrate_tag(`<script>export let a = '';</script><p>{a}</p>`, {
    //             path: 'path',
    //             name: 'name',
    //             config: {
    //                 display: WyvrHydrateDisplay.block,
    //                 render: WyvrFileRender.hydrate,
    //                 loading: WyvrFileLoading.lazy,
    //                 error: undefined,
    //                 portal: undefined,
    //                 trigger: undefined,
    //                 boundary: '100px',
    //                 media: 'all',
    //             },
    //         }),
    //         `<script>export let a = '';</script><div data-hydrate="name" data-props="{_prop('a', a)}" data-loading="lazy" data-boundary="100px"><p>{a}</p></div>`
    //     );
    // });
    // it('hydrate lazy with invalid boundary value', () => {
    //     strictEqual(
    //         insert_hydrate_tag(`<script>export let a = '';</script><p>{a}</p>`, {
    //             path: 'path',
    //             name: 'name',
    //             config: {
    //                 display: WyvrHydrateDisplay.block,
    //                 render: WyvrFileRender.hydrate,
    //                 loading: WyvrFileLoading.lazy,
    //                 error: undefined,
    //                 portal: undefined,
    //                 trigger: undefined,
    //                 boundary: true,
    //                 media: 'all',
    //             },
    //         }),
    //         `<script>export let a = '';</script><div data-hydrate="name" data-props="{_prop('a', a)}" data-loading="lazy"><p>{a}</p></div>`
    //     );
    // });
    it('portal', () => {
        strictEqual(
            insert_hydrate_tag(`<script>export let a = '';</script><p>{a}</p>`, {
                path: 'path',
                name: 'name',
                config: {
                    display: WyvrHydrateDisplay.block,
                    render: WyvrFileRender.hydrate,
                    loading: WyvrFileLoading.instant,
                    error: undefined,
                    portal: 'target',
                    trigger: undefined,
                    media: 'all',
                },
            }),
            `<script>export let a = '';</script><div data-render="hydrate" data-hydrate="name" data-props="{_prop('a', a)}" data-loading="instant" data-portal="target"><p>{a}</p></div>`
        );
    });
    it('none', () => {
        strictEqual(
            insert_hydrate_tag(`<script>export let a = '';</script><p>{a}</p>`, {
                path: 'path',
                name: 'name',
                config: {
                    display: WyvrHydrateDisplay.block,
                    render: WyvrFileRender.hydrate,
                    loading: WyvrFileLoading.none,
                    error: undefined,
                    portal: undefined,
                    trigger: 'trigger',
                    media: 'all',
                },
            }),
            `<script>export let a = '';</script><div data-render="hydrate" data-hydrate="name" data-props="{_prop('a', a)}" data-loading="none"><p>{a}</p></div>`
        );
    });
    it('media', () => {
        strictEqual(
            insert_hydrate_tag(`<script>export let a = '';</script><p>{a}</p>`, {
                path: 'path',
                name: 'name',
                config: {
                    display: WyvrHydrateDisplay.block,
                    render: WyvrFileRender.hydrate,
                    loading: WyvrFileLoading.media,
                    error: undefined,
                    portal: undefined,
                    trigger: 'trigger',
                    media: 'all',
                },
            }),
            `<script>export let a = '';</script><div data-render="hydrate" data-hydrate="name" data-props="{_prop('a', a)}" data-loading="media" data-media="all"><p>{a}</p></div>`
        );
    });
    it('dev env', () => {
        Env.set(EnvType.dev);
        const result = insert_hydrate_tag(`<script>export let a = '';</script><p>{a}</p>`, {
            path: 'path',
            name: 'name',
            config: {
                display: WyvrHydrateDisplay.block,
                render: WyvrFileRender.hydrate,
                loading: WyvrFileLoading.instant,
                error: undefined,
                portal: undefined,
                trigger: undefined,
                media: 'all',
            },
        });
        Env.set(EnvType.prod);
        strictEqual(
            result,
            `<script>export let a = '';</script><div data-render="hydrate" data-hydrate="name" data-hydrate-path="undefined" data-props="{_prop('a', a)}" data-loading="instant"><p>{a}</p></div>`
        );
    });
});
