import { jest } from "@jest/globals";
import { Pedigree } from '../src/pedigree.js';
import { Optimizer } from '../src/optimizer.js';
import { readPedigree } from '../src/io.js';

test('optimizer works with small learning rate', () => {
    const pedigree = new Pedigree('cf');
    
    // Create individuals that will produce a meaningful likelihood
    const father = pedigree.addIndividual('M');
    father.setRace('general', 'cf');
    const mother = pedigree.addIndividual('F');
    mother.setRace('general', 'cf');
    pedigree.addPartnership(father, mother);
    
    // Add an affected child to create optimization pressure
    const child = pedigree.addIndividual('M');
    child.setAffected(true);
    pedigree.addParentChild(father, child);
    pedigree.addParentChild(mother, child);
    
    pedigree.updateAllProbabilities();

    // Create optimizer and perform several steps manually
    const optimizer = new Optimizer(pedigree);
    optimizer.initialize();
    
    // Should have finite initial likelihood (may be 0 for affected children with default probs)
    expect(Number.isFinite(optimizer.currentLikelihood)).toBe(true);
    
    // Perform 50 optimization steps
    let stepsPerformed = 0;
    for (let i = 0; i < 50; i++) {
        const delta = optimizer.performSingleStep();
        if (delta !== null) {
            stepsPerformed++;
        }
    }

    // Should have attempted steps
    expect(stepsPerformed).toBeGreaterThan(0);
    
    // Should have completed some iterations
    expect(optimizer.iterations).toBeGreaterThan(0);
});

test('temperature always cools by fixed rate', () => {
    const pedigree = new Pedigree('cf');
    const father = pedigree.addIndividual('M');
    father.setRace('general', 'cf');

    const optimizer = new Optimizer(pedigree);
    optimizer.initialize();

    const initialTemp = optimizer.temperature;

    const stepped = optimizer.performSingleStep();
    expect(stepped).not.toBeNull();

    const expectedTemp = initialTemp * optimizer.coolingRate;
    expect(optimizer.temperature).toBeCloseTo(expectedTemp, 6);
});

test('afflicted cousin scenario stabilizes and keeps affected cousin fixed', () => {
    const pedigree = readPedigree('scenarios/hypothetical_child_with_afflicted_cousin.json');
    pedigree.updateAllProbabilities();

    const optimizer = new Optimizer(pedigree);
    optimizer.initialize();

    const deltas = [];
    const likelihoods = [];
    for (let i = 0; i < 300; i++) {
        const delta = optimizer.performSingleStep();
        if (delta === null) break;
        deltas.push(Math.abs(delta));
        likelihoods.push(optimizer.currentLikelihood);
    }

    expect(deltas.length).toBeGreaterThan(50);

    const recentDeltas = deltas.slice(-50);
    const recentLikelihoods = likelihoods.slice(-50);
    const deltaRange = Math.max(...recentDeltas) - Math.min(...recentDeltas);
    const likelihoodRange = Math.max(...recentLikelihoods) - Math.min(...recentLikelihoods);

    // The optimizer should settle into a stable region instead of bouncing between poor states.
    expect(deltaRange).toBeLessThan(0.001);
    expect(likelihoodRange).toBeLessThan(0.001);
    expect(Math.abs(optimizer.currentLikelihood - optimizer.bestLikelihood)).toBeLessThan(1e-9);

    const afflictedCousin = pedigree.individuals.find(ind => ind.id === 6);
    expect(afflictedCousin).toBeDefined();
    expect(afflictedCousin.affected).toBe(true);
    expect(afflictedCousin.probabilities[0]).toBeCloseTo(0, 12);
    expect(afflictedCousin.probabilities[1]).toBeCloseTo(0, 12);
    expect(afflictedCousin.probabilities[2]).toBeCloseTo(0, 12);
    expect(afflictedCousin.probabilities[3]).toBeCloseTo(1, 12);
});
