/**
 * Exact pedigree inference for autosomal-recessive genotype probabilities.
 *
 * The previous implementation only constrained the immediate parents of an
 * affected child and propagated probabilities *forward* from founders. That is
 * unable to raise the carrier probability of grandparents, aunts/uncles or
 * cousins of an affected individual, so extended-family assessments gave false
 * reassurance.
 *
 * This module replaces that with exact Bayesian inference. Pedigrees used by
 * this tool are small, so we can enumerate the joint genotype assignment of
 * every individual, weight each assignment by
 *
 *     prior(founder genotypes) x  transmission(non-founder genotypes | parents)
 *                              x  likelihood(observed phenotypes)
 *
 * and read off each individual's posterior marginal. This is O(3^k) where k is
 * the number of non-affected individuals (affected individuals are pinned to
 * the homozygous-affected genotype, so they do not enlarge the search space).
 *
 * Genotypes are counted by number of disease alleles: 0 (neg/neg), 1 (carrier),
 * 2 (pos/pos, affected). The public 4-state output splits the carrier mass
 * evenly between neg/pos and pos/neg, matching the existing convention.
 *
 * @module inference
 */

/**
 * Largest number of free (non-affected) individuals for which exact enumeration
 * is used. 3^15 ≈ 14M assignments is still fast; beyond that the caller should
 * fall back to the simulated-annealing optimiser. Real pedigrees in this tool
 * are far smaller than this bound.
 *
 * @type {number}
 */
export const MAX_EXACT_FREE_NODES = 15;

/**
 * True when exact enumeration is tractable for this pedigree.
 *
 * @param {{individuals: Array}} pedigree
 * @returns {boolean}
 */
export function canInferExact(pedigree) {
    const freeNodes = pedigree.individuals.filter((ind) => !ind.affected).length;
    return freeNodes <= MAX_EXACT_FREE_NODES;
}

/**
 * Prior distribution over {neg/neg, carrier, pos/pos} for a founder, derived
 * from its stored `originalProbabilities` (the Hardy-Weinberg genotype vector
 * set from the population carrier frequency, or an explicit override).
 *
 * @param {{originalProbabilities: number[]}} ind
 * @returns {number[]} normalised [P(0 alleles), P(1 allele), P(2 alleles)]
 */
function founderPrior(ind) {
    const op = ind.originalProbabilities || ind.probabilities;
    const three = [op[0], op[1] + op[2], op[3]];
    const sum = three[0] + three[1] + three[2];
    if (!(sum > 0)) {
        // Degenerate prior (should not happen for a real founder); fall back to
        // an uninformative distribution rather than dividing by zero.
        return [1 / 3, 1 / 3, 1 / 3];
    }
    return [three[0] / sum, three[1] / sum, three[2] / sum];
}

/**
 * Mendelian transmission probability P(child = k disease alleles | parents).
 *
 * Each parent passes one allele chosen uniformly from its two; a parent with
 * `g` disease alleles passes a disease allele with probability g/2.
 *
 * @param {number} k - child's disease-allele count (0, 1 or 2)
 * @param {number} father - father's disease-allele count
 * @param {number} mother - mother's disease-allele count
 * @returns {number}
 */
function transmission(k, father, mother) {
    const pf = father / 2;
    const pm = mother / 2;
    if (k === 0) return (1 - pf) * (1 - pm);
    if (k === 1) return pf * (1 - pm) + (1 - pf) * pm;
    return pf * pm;
}

/**
 * Run exact inference and write each individual's posterior marginal into its
 * `probabilities` field (4-state: [neg/neg, neg/pos, pos/neg, pos/pos]).
 *
 * Founder priors are read from `originalProbabilities`; this function never
 * mutates `originalProbabilities`, so repeated calls are idempotent.
 *
 * @param {{individuals: Array}} pedigree
 * @returns {number} the data negative log-likelihood, -log P(observed phenotypes)
 */
export function inferExact(pedigree) {
    const inds = pedigree.individuals;
    const n = inds.length;
    const index = new Map(inds.map((ind, i) => [ind, i]));

    // Precompute per-individual structure.
    const isFounder = new Array(n);
    const priors = new Array(n);
    const parentIdx = new Array(n);
    for (let i = 0; i < n; i++) {
        const ind = inds[i];
        if (ind.parents && ind.parents.length === 2) {
            isFounder[i] = false;
            parentIdx[i] = [index.get(ind.parents[0]), index.get(ind.parents[1])];
        } else {
            isFounder[i] = true;
            priors[i] = founderPrior(ind);
        }
    }

    // Free variables are the non-affected individuals; affected individuals are
    // pinned to genotype 2 (pos/pos).
    const freeIdx = [];
    const state = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        if (inds[i].affected) {
            state[i] = 2;
        } else {
            freeIdx.push(i);
        }
    }

    const marg = Array.from({ length: n }, () => [0, 0, 0]);
    let Z = 0;
    const total = Math.pow(3, freeIdx.length);

    for (let assignment = 0; assignment < total; assignment++) {
        // Decode this assignment into genotype states for the free individuals.
        let rem = assignment;
        for (let f = 0; f < freeIdx.length; f++) {
            state[freeIdx[f]] = rem % 3;
            rem = (rem - state[freeIdx[f]]) / 3;
        }

        // Weight = product of founder priors, transmissions and phenotype
        // likelihoods. Affected individuals are already pinned to state 2, so
        // their unaffected-check never fires; unaffected real individuals must
        // not be pos/pos; hypothetical individuals contribute no likelihood.
        let w = 1;
        for (let i = 0; i < n; i++) {
            const g = state[i];
            if (isFounder[i]) {
                w *= priors[i][g];
            } else {
                const [fi, mi] = parentIdx[i];
                w *= transmission(g, state[fi], state[mi]);
            }
            if (w === 0) break;
            const ind = inds[i];
            if (!ind.hypothetical && !ind.affected && g === 2) {
                // Observed unaffected but homozygous-affected genotype: impossible.
                w = 0;
                break;
            }
        }
        if (w === 0) continue;

        Z += w;
        for (let i = 0; i < n; i++) {
            marg[i][state[i]] += w;
        }
    }

    if (!(Z > 0)) {
        // Contradictory observations under the current priors. Leave a defined
        // NLL and do not divide by zero; callers may fall back if desired.
        pedigree._dataNLL = Infinity;
        return Infinity;
    }

    for (let i = 0; i < n; i++) {
        const m0 = marg[i][0] / Z;
        const m1 = marg[i][1] / Z;
        const m2 = marg[i][2] / Z;
        inds[i].probabilities = [m0, m1 / 2, m1 / 2, m2];
    }

    pedigree._dataNLL = -Math.log(Z);
    return pedigree._dataNLL;
}
