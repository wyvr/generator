<script>
    export let data = null;

<div class="layout">
    <div class="fullheight">
        <Header />
        {huhu(data.title)}

        <main>
            <slot />
        </main>
    </div>
    <Footer {data} />
</div>
