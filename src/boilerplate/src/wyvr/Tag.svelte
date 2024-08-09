<script>
/*
        import Tag from '$src/wyvr/Tag.svelte';

        <Tag name="name" attr={{ attr: 'value', 'data-attr': 'true', 'attr-bool': true, 'attr-hidden': false, 'attr-array-hidden': []}}>
            content
        </Tag>
    */
export let name = 'tag';
export let attr = {};

$: attr_value = Object.keys(attr)
    .map((key) => {
        const value = attr[key];
        if (!value) {
            return undefined;
        }
        if (value === true) {
            return key;
        }
        if (typeof value != 'string') {
            return undefined;
        }
        return `${key}="${quote(value)}"`;
    })
    .filter((x) => x)
    .join(' ');

function quote(value) {
    const nl = '&#13;';
    return value
        .replace(/&/g, '&amp;') /* This MUST be the 1st replacement. */
        .replace(/'/g, '&apos;') /* The 4 other predefined entities, required. */
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r\n/g, nl) /* Must be before the next replacement. */
        .replace(/[\r\n]/g, nl);
}
</script>

{@html `<${name} ${attr_value}>`}
<slot />
{@html `</${name}>`}
