import { Pedigree } from '../src/pedigree.js';

test('hypothetical child does not affect likelihood', () => {
    const ped1 = new Pedigree('cf');
    const f1 = ped1.addIndividual('M');
    const m1 = ped1.addIndividual('F');
    ped1.addPartnership(f1, m1);
    ped1.updateAllProbabilities();
    const llWithout = ped1.calculateNegativeLogLikelihood();

    const ped2 = new Pedigree('cf');
    const f2 = ped2.addIndividual('M');
    const m2 = ped2.addIndividual('F');
    ped2.addPartnership(f2, m2);
    const child = ped2.addIndividual('M');
    child.hypothetical = true;
    ped2.addParentChild(f2, child);
    ped2.addParentChild(m2, child);
    ped2.updateAllProbabilities();
    const llWith = ped2.calculateNegativeLogLikelihood();

    expect(llWith).toBeCloseTo(llWithout);
    expect(child.probabilities[0]).toBeCloseTo(0.25);
    expect(child.probabilities[3]).toBeCloseTo(0.25);
});

