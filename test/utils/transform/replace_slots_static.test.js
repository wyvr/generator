import { strictEqual } from 'node:assert';
import { replace_slots_static } from '../../../src/utils/transform.js';

describe('utils/transform/replace_slots_static', () => {
    // it('', ()=>{})
    it('slot', () => {
        strictEqual(replace_slots_static('<slot></slot>'), '<span data-slot="default"><slot></slot></span>');
        strictEqual(replace_slots_static('<slot />'), '<span data-slot="default"><slot /></span>');
    });
    it('multiple slots', () => {
        strictEqual(
            replace_slots_static('<slot></slot><slot></slot>'),
            '<span data-slot="default"><slot></slot></span><span data-slot="default"><slot></slot></span>'
        );
        strictEqual(
            replace_slots_static('<slot /><slot />'),
            '<span data-slot="default"><slot /></span><span data-slot="default"><slot /></span>'
        );
    });
    it('slot with content', () => {
        strictEqual(
            replace_slots_static('<slot><img /></slot>'),
            '<span data-slot="default"><slot><img /></slot></span>'
        );
    });
    it('multiple slots with content', () => {
        strictEqual(
            replace_slots_static('<slot><img /></slot><slot><img /></slot>'),
            '<span data-slot="default"><slot><img /></slot></span><span data-slot="default"><slot><img /></slot></span>'
        );
    });
    it('named slot', () => {
        strictEqual(
            replace_slots_static('<slot name="x"></slot>'),
            '<span data-slot="x"><slot name="x"></slot></span>'
        );
    });
    it('named slot with content', () => {
        strictEqual(
            replace_slots_static('<slot name="x"><img /></slot>'),
            '<span data-slot="x"><slot name="x"><img /></slot></span>'
        );
    });
});
