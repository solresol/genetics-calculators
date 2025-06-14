import { sanityCheckPedigreeObject } from '../src/io.js';

const good = {
    condition: 'cf',
    individuals: [
        { id: 1, gender: 'M', race: 'general', is_sexual_partner_of: [2] },
        { id: 2, gender: 'F', race: 'general', is_sexual_partner_of: [1] },
        { id: 3, gender: 'M', parents: [1, 2] }
    ]
};

test('sanity check passes with reciprocal partner links', () => {
    expect(() => sanityCheckPedigreeObject(good)).not.toThrow();
});

test('sanity check fails when partner link missing', () => {
    const bad = JSON.parse(JSON.stringify(good));
    delete bad.individuals[0].is_sexual_partner_of;
    expect(() => sanityCheckPedigreeObject(bad)).toThrow(/Partner link/);
});
