/* eslint-disable no-console */

import { context } from '$src/wyvr/context.js';
import { writable } from 'svelte/store';

/**
 * Retrieves or creates a shared store with the given name.
 * If a shared store with the given name already exists, it is returned.
 * Otherwise, a new shared store is created and returned.
 * @param {string} name - The name of the shared store.
 * @param {any} store - The store object to be associated with the shared store.
 * @returns {any} - The shared store object.
 */
export function getSharedStore(name, store) {
    if (existsSharedStore(name)) {
        return context().sharedStores[name];
    }
    context().sharedStores[name] = store;
    return store;
}

/**
 * Sets a shared store with the given name.
 * @param {string} name - The name of the shared store.
 * @param {any} store - The store object to be set.
 * @returns {any} - The store object that was set.
 */
export function setSharedStore(name, store) {
    initSharedStores();
    context().sharedStores[name] = store;
    return store;
}

/**
 * Checks if a shared store exists.
 * @param {string} name - The name of the shared store.
 * @returns {boolean} - Returns true if the shared store exists, false otherwise.
 */
export function existsSharedStore(name) {
    initSharedStores();
    return !!context().sharedStores[name];
}

/**
 * Deletes a shared store by name.
 * @param {string} name - The name of the shared store to delete.
 */
export function deleteSharedStore(name) {
    initSharedStores();
    context().sharedStores[name] = undefined;
}

export function sharedStore(name, defaultValue, implementationFn) {
    let store = getSharedStore(name);
    if (store) {
        return store;
    }
    const baseStore = writable(defaultValue);

    if (typeof implementationFn === 'function') {
        try {
            store = implementationFn(baseStore, name, defaultValue);
            // If the implementation function returns a promise, wait for it to resolve
            if (store instanceof Promise) {
                return new Promise((resolve) => {
                    store.then((value) => {
                        resolve(setSharedStore(name, value));
                    });
                });
            }
        } catch (e) {
            console.error('sharedStore', name, e);
            store = baseStore;
        }
    } else {
        store = baseStore;
    }

    return setSharedStore(name, store);
}

/**
 * Initializes the shared stores.
 */
function initSharedStores() {
    if (!context().sharedStores) {
        context().sharedStores = {};
    }
}
