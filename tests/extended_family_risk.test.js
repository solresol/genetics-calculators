import { readPedigree } from '../src/io.js';

// Bug 1: an affected individual must raise the carrier probability of ALL
// relatives (parents, grandparents, aunts/uncles, cousins), not just its
// immediate parents. Exact enumeration inference (src/inference.js) makes the
// flagship "Extended Family Risk Assessment" scenario behave correctly.

const CF_GENERAL_CARRIER = 0.025; // population baseline carrier frequency

function carrier(ind) {
    return ind.probabilities[1] + ind.probabilities[2];
}

function loadCousinScenario(cousinAffected) {
    const pedigree = readPedigree(
        'scenarios/hypothetical_child_with_afflicted_cousin.json'
    );
    const cousin = pedigree.individuals.find((i) => i.id === 6);
    cousin.setAffected(cousinAffected);
    pedigree.updateAllProbabilities();
    return pedigree;
}

test('afflicted cousin elevates the aunt, grandparents and hypothetical child', () => {
    const pedigree = loadCousinScenario(true);
    const byId = (id) => pedigree.individuals.find((i) => i.id === id);

    const aunt = byId(4);
    const gp1 = byId(1);
    const gp2 = byId(2);
    const child = byId(8);

    // Aunt #4 is a sibling of the affected child's parent. Exact inference puts
    // her carrier probability just above 1/2 (the grandparents are population
    // founders, most likely exactly one carrier -> she inherits w.p. ~1/2). It
    // is within the tutorial's stated 1/2-2/3 band, at the low end.
    expect(carrier(aunt)).toBeGreaterThan(0.5);
    expect(carrier(aunt)).toBeLessThan(2 / 3);
    expect(carrier(aunt)).toBeCloseTo(0.5016, 3);

    // Grandparents are massively elevated above the 2.5% population baseline.
    expect(carrier(gp1)).toBeGreaterThan(0.4);
    expect(carrier(gp2)).toBeGreaterThan(0.4);
    expect(carrier(gp1)).toBeCloseTo(0.5048, 3);
    expect(carrier(gp2)).toBeCloseTo(0.5048, 3);

    // Hypothetical grandchild #8's affected risk. NOTE: exact inference gives
    // ~0.31%, not the tutorial's hand-computed 0.48%. The 0.48% figure assumed
    // BOTH grandparents were carriers (aunt = 2/3) and used the European CF
    // frequency; this scenario uses general-population founders (aunt ~1/2,
    // spouse #7 carrier ~2.5%), for which 0.5016 * 0.025 * 0.25 ≈ 0.31% is the
    // correct posterior. It is still ~20x the population baseline.
    expect(child.probabilities[3]).toBeGreaterThan(0.002);
    expect(child.probabilities[3]).toBeLessThan(0.005);
    expect(child.probabilities[3]).toBeCloseTo(0.00314, 4);
});

test('marking the cousin affected vs unaffected changes the aunt and child #8', () => {
    const affected = loadCousinScenario(true);
    const unaffected = loadCousinScenario(false);

    const auntAffected = carrier(affected.individuals.find((i) => i.id === 4));
    const auntUnaffected = carrier(unaffected.individuals.find((i) => i.id === 4));
    const childAffected = affected.individuals.find((i) => i.id === 8).probabilities[3];
    const childUnaffected = unaffected.individuals.find((i) => i.id === 8).probabilities[3];

    // Previously both runs were identical (aunt ~0.048, child ~0.0006).
    expect(auntAffected).toBeGreaterThan(auntUnaffected + 0.4);
    expect(childAffected).toBeGreaterThan(childUnaffected * 10);

    // With no affected cousin, the aunt sits near the population baseline.
    expect(auntUnaffected).toBeCloseTo(CF_GENERAL_CARRIER, 2);
});

test('three-generation PKU: affected grandchild elevates the grandparents', () => {
    const pedigree = readPedigree('scenarios/pku_three_generations.json');
    pedigree.updateAllProbabilities();

    const gp1 = pedigree.individuals.find((i) => i.id === 1);
    const gp2 = pedigree.individuals.find((i) => i.id === 2);

    // European PKU carrier baseline is 2%. The affected grandchild (#8) forces
    // one of grandparents #1/#2 to carry, lifting both far above baseline.
    expect(carrier(gp1)).toBeGreaterThan(0.02);
    expect(carrier(gp2)).toBeGreaterThan(0.02);
    expect(carrier(gp1)).toBeCloseTo(0.505, 2);
    expect(carrier(gp2)).toBeCloseTo(0.505, 2);
});
