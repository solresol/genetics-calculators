import { Pedigree } from '../src/pedigree.js';

test('real unaffected siblings of an affected child are conditioned to 2/3 carrier risk', () => {
    const pedigree = new Pedigree('cf');
    const father = pedigree.addIndividual('M');
    const mother = pedigree.addIndividual('F');
    pedigree.addPartnership(father, mother);

    const affected = pedigree.addIndividual('M');
    affected.setAffected(true);
    pedigree.addParentChild(father, affected);
    pedigree.addParentChild(mother, affected);

    const sibling = pedigree.addIndividual('M');
    pedigree.addParentChild(father, sibling);
    pedigree.addParentChild(mother, sibling);

    pedigree.updateAllProbabilities();

    expect(sibling.probabilities[0]).toBeCloseTo(1 / 3, 6);
    expect(sibling.probabilities[1]).toBeCloseTo(1 / 3, 6);
    expect(sibling.probabilities[2]).toBeCloseTo(1 / 3, 6);
    expect(sibling.probabilities[3]).toBeCloseTo(0, 6);
});
