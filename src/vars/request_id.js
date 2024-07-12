import { executionAsyncId, createHook } from 'node:async_hooks';

const context = new Map();

// Initialize async_hooks
const hooks = createHook({
    init(asyncId, type, triggerAsyncId) {
        // When a new async resource is created, inherit the context from the parent (trigger) async ID
        if (context.has(triggerAsyncId)) {
            context.set(asyncId, context.get(triggerAsyncId));
        }
    },
    destroy(asyncId) {
        // Clean up when the async resource is no longer needed
        context.delete(asyncId);
    },
});
hooks.enable();

export function getRequestId() {
    return context.get(executionAsyncId()) ?? '_';
}

export function setRequestId(value) {
    context.set(executionAsyncId(), value);
}
