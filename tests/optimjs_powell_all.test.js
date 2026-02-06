import { Pedigree } from '../src/pedigree.js';
import { optimizeAllFoundersPowell } from '../src/optimjs.js';
import { readPedigree } from '../src/io.js';

// Ensure simultaneous Powell optimization runs and improves likelihood

test('Powell optimizer decreases negative log-likelihood for all founders', () => {
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
    const start = pedigree.calculateNegativeLogLikelihood();
    const end = optimizeAllFoundersPowell(pedigree);
    expect(end).toBeLessThanOrEqual(start);
});

test('Powell all-founders return value matches final pedigree likelihood', () => {
    const pedigree = readPedigree('scenarios/hypothetical_child_with_afflicted_cousin.json');
    pedigree.updateAllProbabilities();

    const returned = optimizeAllFoundersPowell(pedigree);
    const actual = pedigree.calculateNegativeLogLikelihood();

    expect(returned).toBeCloseTo(actual, 9);
});
