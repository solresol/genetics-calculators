import { Pedigree } from '../src/pedigree.js';
import { optimizeFounderPowell } from '../src/optimjs.js';

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
