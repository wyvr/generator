import { strictEqual } from 'assert';
import { WyvrFileLoading, WyvrFileRender, WyvrHydrateDisplay } from '../../../src/struc/wyvr_file.js';
import { insert_hydrate_tag } from '../../../src/utils/transform.js';

describe('utils/transform/insert_hydrate_tag', () => {
    it('undefined', () => {
        strictEqual(insert_hydrate_tag(), '');
    });
    it('has content, but no file', () => {
        strictEqual(insert_hydrate_tag('test'), 'test');
    });
    it('has content and file', () => {
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
});
