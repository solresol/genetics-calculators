import { Pedigree } from '../src/pedigree.js';
import { canInferExact } from '../src/inference.js';
import { optimizeAllFoundersPowell } from '../src/optimjs.js';

// Regression tests for the founder-optimisation fallback used when a pedigree has
// more than MAX_EXACT_FREE_NODES (15) unaffected nodes, so exact enumeration is
// skipped and the Powell optimiser searches founder genotypes.
//
// Bug: pedigree.updateAllProbabilities() unconditionally reset every founder to
// the population prior. The optimiser sets a candidate founder configuration and
// then calls updateAllProbabilities() to score it, so each candidate was wiped
// back to the population baseline before the likelihood was evaluated. The
// objective was therefore flat and founder/ancestor risks for affected
// descendants could never move away from baseline (only race-set founders were
// affected, since updateFromPopulationFrequency is a no-op without a race).

function padUnaffected(pedigree, n) {
    for (let i = 0; i < n; i++) {
        pedigree.addIndividual(i % 2 === 0 ? 'M' : 'F');
    }
}

test('fallback updateAllProbabilities preserves candidate founder probabilities', () => {
    const pedigree = new Pedigree('cf');
    const founder = pedigree.addIndividual('F');
    founder.setRace('general', 'cf'); // applies the Hardy-Weinberg population prior
    padUnaffected(pedigree, 16); // 17 unaffected -> exact inference is skipped

    expect(canInferExact(pedigree)).toBe(false);

    const populationPrior = [...founder.probabilities];
    const candidate = [0.4, 0.28, 0.28, 0.04]; // a distinct, valid configuration
    founder.probabilities = [...candidate];

    pedigree.updateAllProbabilities();

    // The candidate must survive the founder-prior refresh; before the fix it was
    // overwritten back to the population prior, flattening the objective.
    expect(founder.probabilities).toEqual(candidate);
    expect(founder.probabilities).not.toEqual(populationPrior);
});

test('fallback likelihood responds to founder genotype (objective is not flat)', () => {
    function likelihoodForFounder(founderProbs) {
        const pedigree = new Pedigree('cf');
        const father = pedigree.addIndividual('M');
        father.setRace('general', 'cf');
        const mother = pedigree.addIndividual('F');
        mother.setRace('general', 'cf');
        pedigree.addPartnership(father, mother);
        const child = pedigree.addIndividual('M'); // real, unaffected: reflects the founders
        pedigree.addParentChild(father, child);
        pedigree.addParentChild(mother, child);
        padUnaffected(pedigree, 15); // 18 unaffected -> fallback

        expect(canInferExact(pedigree)).toBe(false);
        father.probabilities = [...founderProbs];
        pedigree.updateAllProbabilities();
        return pedigree.calculateNegativeLogLikelihood();
    }

    const nllLowCarrier = likelihoodForFounder([0.9, 0.05, 0.05, 0]);
    const nllHighCarrier = likelihoodForFounder([0.1, 0.45, 0.45, 0]);

    // Both founder configurations now propagate to the child and yield different
    // likelihoods. Before the fix both collapsed to the population prior, so the
    // difference was exactly zero and Powell had nothing to optimise.
    expect(Math.abs(nllHighCarrier - nllLowCarrier)).toBeGreaterThan(1e-6);
});

test('Powell fallback optimiser improves on the population-prior baseline', () => {
    const pedigree = new Pedigree('cf');
    const father = pedigree.addIndividual('M');
    father.setRace('general', 'cf');
    const mother = pedigree.addIndividual('F');
    mother.setRace('general', 'cf');
    pedigree.addPartnership(father, mother);
    // Many unaffected children are evidence against the parents carrying, so the
    // maximum-likelihood founder configuration differs from the population prior.
    for (let i = 0; i < 16; i++) {
        const child = pedigree.addIndividual(i % 2 === 0 ? 'M' : 'F');
        pedigree.addParentChild(father, child);
        pedigree.addParentChild(mother, child);
    }
    expect(canInferExact(pedigree)).toBe(false);

    pedigree.updateAllProbabilities();
    const baseline = pedigree.calculateNegativeLogLikelihood();
    const optimised = optimizeAllFoundersPowell(pedigree);

    // The optimiser can now actually lower the likelihood in the fallback: the
    // many unaffected children pull the founders' carrier probability below the
    // population prior. Before the fix the objective was flat, so the regression
    // guard returned the baseline unchanged (optimised === baseline).
    expect(optimised).toBeLessThan(baseline);
});
