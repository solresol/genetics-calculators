import { Pedigree } from '../src/pedigree.js';
import {
    carrierFrequencyToAlleleFrequency,
    Individual
} from '../src/individual.js';

// Bug 2: population.js stores CARRIER (heterozygote) frequencies c, not disease
// allele frequencies. Under Hardy-Weinberg c = 2a(1-a), so the allele frequency
// is a = (1 - sqrt(1-2c))/2. The founder genotype vector must therefore be
// [(1-a)^2, a(1-a), a(1-a), a^2], giving carrier sum c and affected (c/2)^2 --
// not the old [ (1-c)^2, c(1-c), c(1-c), c^2 ] which doubled the carrier
// probability and quadrupled the affected probability.

test('carrierFrequencyToAlleleFrequency inverts c = 2a(1-a)', () => {
    for (const c of [0.029, 0.025, 0.017, 0.11, 0.0067]) {
        const a = carrierFrequencyToAlleleFrequency(c);
        expect(2 * a * (1 - a)).toBeCloseTo(c, 12);
        // For small c the allele frequency is close to (but slightly above) c/2.
        expect(a).toBeGreaterThan(c / 2);
        expect(a).toBeLessThan(c / 2 + c * c);
    }
});

test('CF European founder carrier sum equals the 2.9% carrier frequency', () => {
    const ind = new Individual(1, 'M');
    ind.setRace('european_ancestry', 'cf');

    const carrierSum = ind.probabilities[1] + ind.probabilities[2];
    expect(carrierSum).toBeCloseTo(0.029, 8); // was ~0.0563 (≈2c) before the fix
    expect(ind.probabilities[1]).toBeCloseTo(ind.probabilities[2], 12); // symmetric

    // Affected homozygote frequency ≈ (c/2)^2 ≈ (0.0145)^2 ≈ 2.1e-4 (was c^2).
    expect(ind.probabilities[3]).toBeCloseTo((0.029 / 2) ** 2, 4);
    expect(ind.probabilities[3]).toBeLessThan(0.029 * 0.029 / 2); // clearly not c^2
});

test('CF general founder carrier sum equals the 2.5% carrier frequency', () => {
    const ind = new Individual(1, 'F');
    ind.setRace('general', 'cf');
    const carrierSum = ind.probabilities[1] + ind.probabilities[2];
    expect(carrierSum).toBeCloseTo(0.025, 8);
});

test('child of two population founders has affected risk ≈ (c/2)^2, not c^2', () => {
    const c = 0.025; // CF general carrier frequency
    const pedigree = new Pedigree('cf');
    const father = pedigree.addIndividual('M');
    father.setRace('general', 'cf');
    const mother = pedigree.addIndividual('F');
    mother.setRace('general', 'cf');
    pedigree.addPartnership(father, mother);

    // Hypothetical (unborn) child so it carries the full population-based risk.
    const child = pedigree.addIndividual('F');
    child.hypothetical = true;
    pedigree.addParentChild(father, child);
    pedigree.addParentChild(mother, child);

    pedigree.updateAllProbabilities();

    expect(child.probabilities[3]).toBeCloseTo((c / 2) ** 2, 5);
    // The old bug reported ~c^2 (four times too high).
    expect(child.probabilities[3]).toBeLessThan(c * c / 2);
});
