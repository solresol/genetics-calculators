import { minimize_Powell } from 'optimization-js';
import { Individual } from './individual.js';

const CONSTRAINT_TOLERANCE = 1e-9;
const REGRESSION_TOLERANCE = 1e-12;
const IMPROVEMENT_TOLERANCE = 1e-6;

function isValidFounderParams(pAA, pCarrier) {
    if (!Number.isFinite(pAA) || !Number.isFinite(pCarrier)) {
        return false;
    }
    if (pAA < 0 || pCarrier < 0) {
        return false;
    }
    return (pAA + 2 * pCarrier) <= (1 + CONSTRAINT_TOLERANCE);
}

function isValidFounderVector(x, founderCount) {
    if (!Array.isArray(x) || x.length !== founderCount * 2) {
        return false;
    }
    for (let i = 0; i < founderCount; i++) {
        if (!isValidFounderParams(x[2 * i], x[2 * i + 1])) {
            return false;
        }
    }
    return true;
}

function captureBaseline(pedigree) {
    return pedigree.individuals.map(ind => [...ind.probabilities]);
}

function restoreBaseline(pedigree, baseline) {
    for (let i = 0; i < pedigree.individuals.length; i++) {
        pedigree.individuals[i].probabilities = [...baseline[i]];
    }
}

function setFounderProbabilities(individual, pAA, pCarrier) {
    const pAffected = Math.max(0, 1 - pAA - 2 * pCarrier);
    individual.probabilities = [pAA, pCarrier, pCarrier, pAffected];
    individual.validateAndNormalizeProbabilities();
}

function applyFounderVector(founders, x) {
    for (let i = 0; i < founders.length; i++) {
        setFounderProbabilities(founders[i], x[2 * i], x[2 * i + 1]);
    }
}

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
    const baseline = captureBaseline(pedigree);
    const baselineLikelihood = pedigree.calculateNegativeLogLikelihood();
    const start = [
        individual.probabilities[0],
        (individual.probabilities[1] + individual.probabilities[2]) / 2
    ];
    let bestArgument = [...start];
    let bestLikelihood = baselineLikelihood;

    function objective(x) {
        const [pAA, pCarrier] = x;
        if (!isValidFounderParams(pAA, pCarrier)) {
            return Number.POSITIVE_INFINITY;
        }
        restoreBaseline(pedigree, baseline);
        setFounderProbabilities(individual, pAA, pCarrier);
        pedigree.updateAllProbabilities();
        const likelihood = pedigree.calculateNegativeLogLikelihood();
        if (Number.isFinite(likelihood) && likelihood < bestLikelihood - IMPROVEMENT_TOLERANCE) {
            bestLikelihood = likelihood;
            bestArgument = [pAA, pCarrier];
        }
        return likelihood;
    }

    minimize_Powell(objective, start);
    restoreBaseline(pedigree, baseline);
    if (isValidFounderParams(bestArgument[0], bestArgument[1])) {
        setFounderProbabilities(individual, bestArgument[0], bestArgument[1]);
    }
    pedigree.updateAllProbabilities();
    const finalLikelihood = pedigree.calculateNegativeLogLikelihood();
    if (!Number.isFinite(finalLikelihood) || finalLikelihood > baselineLikelihood + REGRESSION_TOLERANCE) {
        restoreBaseline(pedigree, baseline);
        pedigree.updateAllProbabilities();
        return baselineLikelihood;
    }
    return finalLikelihood;
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

    const baseline = captureBaseline(pedigree);
    const baselineLikelihood = pedigree.calculateNegativeLogLikelihood();
    const start = [];
    for (const f of founders) {
        start.push(f.probabilities[0]);
        start.push((f.probabilities[1] + f.probabilities[2]) / 2);
    }
    let bestArgument = [...start];
    let bestLikelihood = baselineLikelihood;

    function objective(x) {
        if (!isValidFounderVector(x, founders.length)) {
            return Number.POSITIVE_INFINITY;
        }

        restoreBaseline(pedigree, baseline);
        applyFounderVector(founders, x);
        pedigree.updateAllProbabilities();
        const likelihood = pedigree.calculateNegativeLogLikelihood();
        if (Number.isFinite(likelihood) && likelihood < bestLikelihood - IMPROVEMENT_TOLERANCE) {
            bestLikelihood = likelihood;
            bestArgument = [...x];
        }
        return likelihood;
    }

    minimize_Powell(objective, start);
    restoreBaseline(pedigree, baseline);
    if (isValidFounderVector(bestArgument, founders.length)) {
        applyFounderVector(founders, bestArgument);
    }
    pedigree.updateAllProbabilities();
    const finalLikelihood = pedigree.calculateNegativeLogLikelihood();
    if (!Number.isFinite(finalLikelihood) || finalLikelihood > baselineLikelihood + REGRESSION_TOLERANCE) {
        restoreBaseline(pedigree, baseline);
        pedigree.updateAllProbabilities();
        return baselineLikelihood;
    }
    return finalLikelihood;
}
