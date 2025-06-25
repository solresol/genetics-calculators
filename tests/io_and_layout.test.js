import { parsePedigreeObject, pedigreeToObject } from '../src/io.js';
import { autoLayout } from '../src/layout.js';
import { Pedigree } from '../src/pedigree.js';

/** Verify that coordinates are parsed and written */
test('parse and write coordinates', () => {
    const obj = {
        condition: 'cf',
        individuals: [
            { id: 1, gender: 'M', x: 10, y: 20, is_sexual_partner_of: [2] },
            { id: 2, gender: 'F', is_sexual_partner_of: [1] }
        ]
    };
    const ped = parsePedigreeObject(obj);
    expect(ped.individuals[0].x).toBe(10);
    expect(ped.individuals[0].y).toBe(20);

    const out = pedigreeToObject(ped, true);
    expect(out.individuals[0].x).toBe(10);
    expect(out.individuals[0].y).toBe(20);
    expect(out.individuals[0].is_sexual_partner_of).toEqual([2]);
    expect(out.individuals[1].is_sexual_partner_of).toEqual([1]);
});

/** Basic check that autoLayout assigns generation based y */
test('autoLayout assigns coordinates', () => {
    const ped = new Pedigree('cf');
    const f = ped.addIndividual('M');
    const m = ped.addIndividual('F');
    ped.addPartnership(f, m);
    const c = ped.addIndividual('M');
    ped.addParentChild(f, c);
    ped.addParentChild(m, c);

    autoLayout(ped, { xSpacing: 50, ySpacing: 40 });

    expect(f.y).toBe(20);
    expect(m.y).toBe(20);
    expect(c.y).toBe(60);
});
