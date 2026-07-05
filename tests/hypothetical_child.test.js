import { jest } from "@jest/globals";
import { Pedigree } from '../src/pedigree.js';

test('hypothetical children should be excluded from likelihood calculation', () => {
    const pedigree = new Pedigree('cf');
    
    // Create parents
    const father = pedigree.addIndividual('M');
    const mother = pedigree.addIndividual('F');
    pedigree.addPartnership(father, mother);
    
    // Create real affected child
    const realChild = pedigree.addIndividual('M');
    realChild.setAffected(true);
    pedigree.addParentChild(father, realChild);
    pedigree.addParentChild(mother, realChild);
    
    // Create hypothetical child (using src class - no hypothetical property in base class)
    const hypotheticalChild = pedigree.addIndividual('F');
    pedigree.addParentChild(father, hypotheticalChild);
    pedigree.addParentChild(mother, hypotheticalChild);
    
    pedigree.updateAllProbabilities();
    
    // Calculate likelihood - should only include parents and real child
    const likelihood = pedigree.calculateNegativeLogLikelihood();
    
    // Should be finite and non-negative
    expect(likelihood).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(likelihood)).toBe(true);
});

test('hypothetical child of two certain carriers has classic 25% Punnett split', () => {
    const pedigree = new Pedigree('cf');

    // Create parents that are certain carriers. The prior lives in
    // originalProbabilities (exact inference reads its founder priors there).
    const father = pedigree.addIndividual('M');
    const mother = pedigree.addIndividual('F');
    father.probabilities = [0, 0.5, 0.5, 0];
    father.originalProbabilities = [0, 0.5, 0.5, 0];
    mother.probabilities = [0, 0.5, 0.5, 0];
    mother.originalProbabilities = [0, 0.5, 0.5, 0];

    pedigree.addPartnership(father, mother);

    // Hypothetical (unborn) child: not conditioned on its own phenotype, so it
    // retains the full recurrence risk.
    const child = pedigree.addIndividual('M');
    child.hypothetical = true;
    pedigree.addParentChild(father, child);
    pedigree.addParentChild(mother, child);

    pedigree.updateAllProbabilities();

    // Child of two carriers: classic Mendelian 25% each genotype.
    expect(child.probabilities).toHaveLength(4);
    expect(child.probabilities[0]).toBeCloseTo(0.25, 6); // neg-neg
    expect(child.probabilities[1]).toBeCloseTo(0.25, 6); // neg-pos
    expect(child.probabilities[2]).toBeCloseTo(0.25, 6); // pos-neg
    expect(child.probabilities[3]).toBeCloseTo(0.25, 6); // pos-pos (affected)
});

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
    // The founders are observed unaffected, so exact inference conditions them
    // to be non-affected (they cannot be pos/pos). With the vague default
    // founder prior each parent then transmits a disease allele with
    // probability (2/3)*(1/2) = 1/3, so the hypothetical child's affected risk
    // is (1/3)^2 = 1/9 and neg/neg is (2/3)^2 = 4/9. (The previous expectation
    // of 0.25 came from the old forward model, which ignored the parents' own
    // unaffected status and let them be pos/pos.)
    expect(child.probabilities[0]).toBeCloseTo(4 / 9, 6);
    expect(child.probabilities[3]).toBeCloseTo(1 / 9, 6);
});

test('hypothetical child with affected sibling has 25% affected risk', () => {
    const ped = new Pedigree('cf');
    const f = ped.addIndividual('M');
    const m = ped.addIndividual('F');
    ped.addPartnership(f, m);

    const affected = ped.addIndividual('M');
    affected.setAffected(true);
    ped.addParentChild(f, affected);
    ped.addParentChild(m, affected);

    const hypo = ped.addIndividual('F');
    hypo.hypothetical = true;
    ped.addParentChild(f, hypo);
    ped.addParentChild(m, hypo);

    ped.updateAllProbabilities();

    expect(hypo.probabilities[3]).toBeCloseTo(0.25);
    expect(hypo.probabilities[0]).toBeCloseTo(0.25);
});

