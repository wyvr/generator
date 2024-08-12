// biome-ignore lint/complexity/noStaticOnlyClass: should be static only
export class ServerShowRequests {
    static get() {
        return ServerShowRequests.value ?? true;
    }
    static set(value) {
        ServerShowRequests.value = !!value;
    }
}
