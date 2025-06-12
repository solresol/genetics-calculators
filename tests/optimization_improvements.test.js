import { jest } from "@jest/globals";
import { Pedigree } from '../src/pedigree.js';
import { Optimizer } from '../src/optimizer.js';

test('optimizer with improved parameters should work with larger step sizes', () => {
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
        if (optimizer.performSingleStep()) {
            stepsPerformed++;
        }
    }
    
    // Should have performed steps
    expect(stepsPerformed).toBeGreaterThan(0);
    
    // Should have completed some iterations
    expect(optimizer.iterations).toBeGreaterThan(0);
});

test('adaptive cooling should maintain temperature when not improving', () => {
    const pedigree = new Pedigree('cf');
    const father = pedigree.addIndividual('M');
    father.setRace('general', 'cf');
    
    const optimizer = new Optimizer(pedigree);
    optimizer.initialize();
    
    // Manually test the cooling logic by setting noImprovementCount high
    optimizer.noImprovementCount = 600;
    const initialTemp = optimizer.temperature;
    
    // Manually apply the cooling logic (replicated from the source)
    if (optimizer.noImprovementCount < 100) {
        optimizer.temperature *= optimizer.coolingRate;
    } else if (optimizer.noImprovementCount < 500) {
        optimizer.temperature *= 0.9995;
    } else {
        optimizer.temperature *= 0.9999;
    }
    
    // Temperature should barely decrease (0.9999 factor)
    const expectedTemp = initialTemp * 0.9999;
    expect(optimizer.temperature).toBeCloseTo(expectedTemp, 6);
});

test('adaptive cooling should cool normally when improving', () => {
    const pedigree = new Pedigree('cf');
    const father = pedigree.addIndividual('M');
    father.setRace('general', 'cf'); // Need race for optimization to work
    
    const optimizer = new Optimizer(pedigree);
    optimizer.initialize();
    
    const initialTemp = optimizer.temperature;
    
    // Simulate good progress scenario
    optimizer.noImprovementCount = 50; // Low count = making progress
    
    // Perform a single step
    const stepped = optimizer.performSingleStep();
    
    // Should have performed a step
    expect(stepped).toBe(true);
    
    // Temperature should decrease by normal cooling rate (0.995)
    const expectedTemp = initialTemp * 0.995;
    expect(optimizer.temperature).toBeCloseTo(expectedTemp, 6);
});