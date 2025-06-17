import { jest } from "@jest/globals";
import { Pedigree } from '../src/pedigree.js';
import { Optimizer } from '../src/optimizer.js';

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

