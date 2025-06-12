import { Pedigree } from '../src/pedigree.js';

// Test that parents of an affected child are obligate carriers

test('affected child implies carrier parents', () => {
    const pedigree = new Pedigree('cf');
    const father = pedigree.addIndividual('M');
    const mother = pedigree.addIndividual('F');
    pedigree.addPartnership(father, mother);

    const child = pedigree.addIndividual('M');
    child.setAffected(true);
    pedigree.addParentChild(father, child);
    pedigree.addParentChild(mother, child);

    pedigree.updateAllProbabilities();

    expect(father.affected).toBe(false);
    expect(mother.affected).toBe(false);
    expect(father.probabilities).toEqual([0, 0.5, 0.5, 0]);
    expect(mother.probabilities).toEqual([0, 0.5, 0.5, 0]);
});
