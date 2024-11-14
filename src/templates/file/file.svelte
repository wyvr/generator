<script>
    /* Created with wyvr {{version}} */
{{wyvr_imports}}
{{wyvr_file_config}}
    export let value = 'default';
{{wyvr_split_js}}
{{wyvr_code}}
</script>

<div class="content">
    {get_icon(value)} {value}
</div>

<style>
    div {
        margin: 10px;
    }
{{wyvr_split_css}}
</style>