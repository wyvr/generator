module.exports = (() => {
    let env = 'prod';
    return {
        set(value) {
            if(!value) {
                return this.get();
            }
            const env = value.toLowerCase();
            if (['debug', 'dev']) {
                this.env = env;
            }
            return this.get();
        },
        get() {
            return this.env;
        },
        is_debug() {
            return this.get() == 'debug' || this.is_dev();
        },
        is_dev() {
            return this.get() == 'dev';
        },
        is_prod() {
            return this.get() == 'prod';
        },
    };
})();
