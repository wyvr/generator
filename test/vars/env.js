import { strictEqual } from 'assert';
import { after, beforeEach, describe, it } from 'mocha';
import { EnvType } from '../../src/struc/env.js';
import { Env } from '../../src/vars/env.js';

describe('vars/env', () => {
    beforeEach(() => {
        Env.value = undefined;
    });
    it('undefined', () => {
        strictEqual(Env.get(), EnvType.prod);
    });
    it('undefined state', () => {
        strictEqual(Env.set(), EnvType.prod);
    });
    it('unknown state', () => {
        strictEqual(Env.set(1024), EnvType.prod);
    });
    it('unknown state', () => {
        strictEqual(Env.set(EnvType.dev), EnvType.dev);
    });
    it('is_debug true', () => {
        Env.set(EnvType.debug);
        strictEqual(Env.is_debug(), true);
    });
    it('is_debug false', () => {
        strictEqual(Env.is_debug(), false);
    });
    it('is_dev true', () => {
        Env.set(EnvType.dev);
        strictEqual(Env.is_dev(), true);
    });
    it('is_dev false', () => {
        strictEqual(Env.is_dev(), false);
    });
    it('json_spaces prod', () => {
        strictEqual(Env.json_spaces(), undefined);
    });
    it('json_spaces non prod', () => {
        Env.set(EnvType.dev);
        strictEqual(Env.json_spaces(), 4);
    });
    it('get name', () => {
        Env.set(EnvType.dev);
        strictEqual(Env.name(), 'dev');
    });
    it('get unknown', () => {
        Env.value = undefined;
        strictEqual(Env.name(), 'prod');
    });
});
