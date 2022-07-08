import { strictEqual } from 'assert';
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
                    render: WyvrFileRender.static,
                    loading: WyvrFileLoading.instant,
                    error: undefined,
                    portal: undefined,
                    trigger: undefined,
                    media: 'all',
                },
            }),
            `<script>export let a = '';</script><div data-hydrate="name"  data-props="{_prop('a', a)}"  ><p>{a}</p></div>`
        );
    });
    it('inline', () => {
        strictEqual(
            insert_hydrate_tag(`<script>export let a = '';</script><p>{a}</p>`, {
                path: 'path',
                name: 'name',
                config: {
                    display: WyvrHydrateDisplay.inline,
                    render: WyvrFileRender.static,
                    loading: WyvrFileLoading.instant,
                    error: undefined,
                    portal: undefined,
                    trigger: undefined,
                    media: 'all',
                },
            }),
            `<script>export let a = '';</script><span data-hydrate="name"  data-props="{_prop('a', a)}"  ><p>{a}</p></span>`
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
            `<script>export let a = '';</script><div data-hydrate="name"  data-props="{_prop('a', a)}"  ><p>{a}</p></div>`
        );
    });
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
            `<script>export let a = '';</script><div data-hydrate="name"  data-props="{_prop('a', a)}" data-portal="target" ><p>{a}</p></div>`
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
            `<script>export let a = '';</script><div data-hydrate="name"  data-props="{_prop('a', a)}"  ><p>{a}</p></div>`
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
            `<script>export let a = '';</script><div data-hydrate="name"  data-props="{_prop('a', a)}"  data-media="all"><p>{a}</p></div>`
        );
    });
    it('dev env', () => {
        Env.set(EnvType.dev);
        const result = insert_hydrate_tag(`<script>export let a = '';</script><p>{a}</p>`, {
            path: 'path',
            name: 'name',
            config: {
                display: WyvrHydrateDisplay.block,
                render: WyvrFileRender.static,
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
            `<script>export let a = '';</script><div data-hydrate="name" data-hydrate-path="undefined" data-props="{_prop('a', a)}"  ><p>{a}</p></div>`
        );
    });
});
