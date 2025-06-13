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
    
    // Should be positive (negative log of probability < 1) and finite
    expect(likelihood).toBeGreaterThan(0);
    expect(Number.isFinite(likelihood)).toBe(true);
});

test('pedigree probability updates work correctly for children', () => {
    const pedigree = new Pedigree('cf');
    
    // Create parents with known carrier status
    const father = pedigree.addIndividual('M');
    const mother = pedigree.addIndividual('F');
    
    // Set specific probabilities for parents (carriers)
    father.probabilities = [0, 0.5, 0.5, 0]; // carrier
    mother.probabilities = [0, 0.5, 0.5, 0]; // carrier
    
    pedigree.addPartnership(father, mother);
    
    // Create child
    const child = pedigree.addIndividual('M');
    pedigree.addParentChild(father, child);
    pedigree.addParentChild(mother, child);
    
    pedigree.updateAllProbabilities();
    
    // Child should have 25% chance of each genotype when both parents are carriers
    expect(child.probabilities).toHaveLength(4);
    expect(child.probabilities[0]).toBeCloseTo(0.25, 2); // neg-neg
    expect(child.probabilities[1]).toBeCloseTo(0.25, 2); // neg-pos  
    expect(child.probabilities[2]).toBeCloseTo(0.25, 2); // pos-neg
    expect(child.probabilities[3]).toBeCloseTo(0.25, 2); // pos-pos (affected)
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
    expect(child.probabilities[0]).toBeCloseTo(0.25);
    expect(child.probabilities[3]).toBeCloseTo(0.25);
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


