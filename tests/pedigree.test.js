import { jest } from "@jest/globals";
import { Pedigree } from '../src/pedigree.js';
import { Optimizer } from '../src/optimizer.js';

jest.setTimeout(30000);

test('optimizer improves likelihood for simple pedigree', () => {
    const pedigree = new Pedigree('cf');
    const father = pedigree.addIndividual('M');
    father.setRace('general', 'cf');
    const mother = pedigree.addIndividual('F');
    mother.setRace('general', 'cf');
    pedigree.addPartnership(father, mother);

    const child = pedigree.addIndividual('M');
    child.setAffected(true);
    pedigree.addParentChild(father, child);
    pedigree.addParentChild(mother, child);

    pedigree.updateAllProbabilities();

    const startLikelihood = pedigree.calculateNegativeLogLikelihood();
    const optimizer = new Optimizer(pedigree);
    optimizer.run(5000);
    const endLikelihood = pedigree.calculateNegativeLogLikelihood();

    expect(endLikelihood).toBeCloseTo(startLikelihood);
});
