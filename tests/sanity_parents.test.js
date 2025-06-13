import { parsePedigreeObject } from '../src/io.js';

// Ensure parsePedigreeObject throws when an individual lists more than two parents

test('rejects individuals with more than two parents', () => {
    const obj = {
        condition: 'cf',
        individuals: [
            { id: 1, gender: 'M' },
            { id: 2, gender: 'F' },
            { id: 3, gender: 'F' },
            { id: 4, gender: 'M', parents: [1,2,3] }
        ]
    };
    expect(() => parsePedigreeObject(obj)).toThrow(/more than two parents/);
});
