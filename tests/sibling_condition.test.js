import { Pedigree } from '../src/pedigree.js';

test('siblings of an affected child have 25% chance of the condition', () => {
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

    expect(sibling.probabilities[3]).toBeCloseTo(0.25);
    expect(sibling.probabilities[0]).toBeCloseTo(0.25);
});
