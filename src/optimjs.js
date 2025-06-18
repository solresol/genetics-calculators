import { minimize_Powell } from 'optimization-js';
import { Individual } from './individual.js';

/**
 * Optimize genotype probabilities for a single founder using Powell's method.
 * Returns the final negative log-likelihood.
 * @param {Pedigree} pedigree
 * @param {Individual} individual
 */
export function optimizeFounderPowell(pedigree, individual) {
    if (!individual || individual.affected || individual.frozen || individual.parents.length !== 0) {
        return null;
    }
    const baseline = pedigree.individuals.map(ind => [...ind.probabilities]);
    const start = [
        individual.probabilities[0],
        (individual.probabilities[1] + individual.probabilities[2]) / 2
    ];

    function objective(x) {
        const [pAA, pCarrier] = x;
        if (pAA < 0 || pCarrier < 0 || pAA + 2 * pCarrier > 1) {
            return Number.POSITIVE_INFINITY;
        }
        // restore baseline probabilities
        for (let i = 0; i < pedigree.individuals.length; i++) {
            pedigree.individuals[i].probabilities = [...baseline[i]];
        }
        individual.probabilities = [pAA, pCarrier, pCarrier, 1 - pAA - 2 * pCarrier];
        pedigree.updateAllProbabilities();
        return pedigree.calculateNegativeLogLikelihood();
    }

    const result = minimize_Powell(objective, start);
    const [bestAA, bestCarrier] = result.argument;
    if (!(bestAA < 0 || bestCarrier < 0 || bestAA + 2 * bestCarrier > 1)) {
        individual.probabilities = [bestAA, bestCarrier, bestCarrier, 1 - bestAA - 2 * bestCarrier];
        individual.validateAndNormalizeProbabilities();
    }
    // restore others to baseline then update
    for (let i = 0; i < pedigree.individuals.length; i++) {
        if (pedigree.individuals[i] !== individual) {
            pedigree.individuals[i].probabilities = [...baseline[i]];
        }
    }
    pedigree.updateAllProbabilities();
    return result.fncvalue;
}

/**
 * Optimize genotype probabilities for all founders simultaneously using Powell's method.
 * Returns the final negative log-likelihood.
 * @param {Pedigree} pedigree
 */
export function optimizeAllFoundersPowell(pedigree) {
    const founders = pedigree.individuals.filter(ind =>
        !ind.affected && !ind.frozen && ind.parents.length === 0
    );
    if (founders.length === 0) {
        return null;
    }

    const baseline = pedigree.individuals.map(ind => [...ind.probabilities]);
    const start = [];
    for (const f of founders) {
        start.push(f.probabilities[0]);
        start.push((f.probabilities[1] + f.probabilities[2]) / 2);
    }

    function objective(x) {
        for (let i = 0; i < founders.length; i++) {
            const pAA = x[2 * i];
            const pCarrier = x[2 * i + 1];
            if (pAA < 0 || pCarrier < 0 || pAA + 2 * pCarrier > 1) {
                return Number.POSITIVE_INFINITY;
            }
        }

        for (let i = 0; i < pedigree.individuals.length; i++) {
            pedigree.individuals[i].probabilities = [...baseline[i]];
        }
        for (let i = 0; i < founders.length; i++) {
            const pAA = x[2 * i];
            const pCarrier = x[2 * i + 1];
            founders[i].probabilities = [pAA, pCarrier, pCarrier, 1 - pAA - 2 * pCarrier];
        }
        pedigree.updateAllProbabilities();
        return pedigree.calculateNegativeLogLikelihood();
    }

    const result = minimize_Powell(objective, start);
    const best = result.argument;
    for (let i = 0; i < founders.length; i++) {
        const pAA = best[2 * i];
        const pCarrier = best[2 * i + 1];
        if (!(pAA < 0 || pCarrier < 0 || pAA + 2 * pCarrier > 1)) {
            founders[i].probabilities = [pAA, pCarrier, pCarrier, 1 - pAA - 2 * pCarrier];
            founders[i].validateAndNormalizeProbabilities();
        }
    }
    for (let i = 0; i < pedigree.individuals.length; i++) {
        if (!founders.includes(pedigree.individuals[i])) {
            pedigree.individuals[i].probabilities = [...baseline[i]];
        }
    }
    pedigree.updateAllProbabilities();
    return result.fncvalue;
}
