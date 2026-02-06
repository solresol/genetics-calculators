import { Pedigree } from '../src/pedigree.js';
import { optimizeFounderPowell } from '../src/optimjs.js';
import { readPedigree } from '../src/io.js';

// Basic sanity check that Powell optimizer can run and improve likelihood

test('Powell optimizer decreases negative log-likelihood for founder', () => {
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
    const end = optimizeFounderPowell(pedigree, father);
    expect(end).toBeLessThanOrEqual(start);
});

test('Powell single-founder return value matches final pedigree likelihood', () => {
    const pedigree = readPedigree('scenarios/hypothetical_child_with_afflicted_cousin.json');
    pedigree.updateAllProbabilities();
    const founder = pedigree.individuals.find(ind => ind.id === 1);

    const returned = optimizeFounderPowell(pedigree, founder);
    const actual = pedigree.calculateNegativeLogLikelihood();

    expect(returned).toBeCloseTo(actual, 9);
});
