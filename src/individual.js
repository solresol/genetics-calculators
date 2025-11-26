/**
 * Individual module - Represents people in pedigrees with genotype probabilities
 *
 * This module implements the 4-state genotype model for autosomal recessive conditions:
 * - State 0: neg/neg (homozygous normal)
 * - State 1: neg/pos (carrier, disease allele from second parent)
 * - State 2: pos/neg (carrier, disease allele from first parent)
 * - State 3: pos/pos (homozygous affected)
 *
 * @module individual
 */

import { getCarrierFrequency } from './population.js';

/**
 * Converts a genotype index (0-3) to allele pair representation
 *
 * @param {number} index - Genotype index (0-3)
 * @returns {Array<string>} - Array of two alleles ['neg'/'pos', 'neg'/'pos']
 *
 * @example
 * indexToGenotype(0) // returns ['neg', 'neg']
 * indexToGenotype(3) // returns ['pos', 'pos']
 */
export function indexToGenotype(index) {
    const genotypes = [
        ['neg', 'neg'],
        ['neg', 'pos'],
        ['pos', 'neg'],
        ['pos', 'pos']
    ];
    return genotypes[index];
}

/**
 * Calculate offspring genotype probabilities from two parent genotypes
 * Uses Mendelian inheritance: each parent contributes one allele at random
 *
 * @param {Array<string>} parent1Geno - First parent's genotype ['neg'/'pos', 'neg'/'pos']
 * @param {Array<string>} parent2Geno - Second parent's genotype ['neg'/'pos', 'neg'/'pos']
 * @returns {Array<number>} - Probability vector [P(neg/neg), P(neg/pos), P(pos/neg), P(pos/pos)]
 *
 * @example
 * // Two carriers (neg/pos × neg/pos)
 * calculateOffspringProbabilities(['neg', 'pos'], ['neg', 'pos'])
 * // returns [0.25, 0.25, 0.25, 0.25] - classic Mendelian 25% affected
 */
export function calculateOffspringProbabilities(parent1Geno, parent2Geno) {
    const probs = [0, 0, 0, 0];
    for (const allele1 of parent1Geno) {
        for (const allele2 of parent2Geno) {
            let index;
            if (allele1 === 'neg' && allele2 === 'neg') index = 0;
            else if (allele1 === 'neg' && allele2 === 'pos') index = 1;
            else if (allele1 === 'pos' && allele2 === 'neg') index = 2;
            else index = 3;
            probs[index] += 0.25;
        }
    }
    return probs;
}

/**
 * Represents an individual in a pedigree with genotype probabilities
 *
 * @class Individual
 *
 * @property {number} id - Unique identifier
 * @property {string} gender - 'M' for male, 'F' for female
 * @property {boolean} affected - Whether individual has the genetic condition
 * @property {string|null} race - Population group for carrier frequency (e.g., 'european_ancestry')
 * @property {Array<Individual>} parents - Array of parent Individual objects (length 0 or 2)
 * @property {Array<Individual>} children - Array of child Individual objects
 * @property {Individual|null} partner - Sexual partner (if applicable)
 * @property {boolean} hypothetical - If true, excluded from likelihood calculations
 * @property {Array<number>} probabilities - Current genotype probabilities [P(neg/neg), P(neg/pos), P(pos/neg), P(pos/pos)]
 * @property {Array<number>} originalProbabilities - Backup of initial probabilities
 * @property {boolean} frozen - If true, probabilities cannot be changed (e.g., affected individuals)
 */
export class Individual {
    /**
     * Create a new individual
     *
     * @param {number} id - Unique identifier
     * @param {string} gender - 'M' or 'F'
     */
    constructor(id, gender) {
        this.id = id;
        this.gender = gender; // 'M' or 'F'
        this.affected = false;
        this.race = null;
        this.parents = [];
        this.children = [];
        this.partner = null;
        this.hypothetical = false;
        this.probabilities = [0.25, 0.25, 0.25, 0.25];
        this.originalProbabilities = [...this.probabilities];
        this.frozen = false;
    }

    /**
     * Set affected status and freeze probabilities accordingly
     *
     * Affected individuals are fixed at [0,0,0,1] (pos/pos with 100% certainty)
     * and their probabilities cannot be changed by optimization.
     *
     * @param {boolean} affected - True if individual has the genetic condition
     */
    setAffected(affected) {
        this.affected = affected;
        if (affected) {
            this.probabilities = [0, 0, 0, 1];
            this.frozen = true;
        } else {
            this.probabilities = [1, 0, 0, 0];
            this.frozen = false;
        }
        this.validateAndNormalizeProbabilities();
        this.originalProbabilities = [...this.probabilities];
    }

    /**
     * Ensure probabilities are valid and sum to 1.0
     *
     * - Replaces NaN or negative values with 0
     * - Normalizes so probabilities sum to exactly 1.0
     * - Falls back to uniform [0.25, 0.25, 0.25, 0.25] if all zeros
     */
    validateAndNormalizeProbabilities() {
        for (let i = 0; i < this.probabilities.length; i++) {
            const p = this.probabilities[i];
            if (isNaN(p) || p < 0) {
                this.probabilities[i] = 0;
            }
        }
        const sum = this.probabilities.reduce((a, b) => a + b, 0);
        if (sum > 0) {
            this.probabilities = this.probabilities.map((p) => p / sum);
        } else {
            this.probabilities = [0.25, 0.25, 0.25, 0.25];
        }
    }

    /**
     * Set race/population and update probabilities from carrier frequency
     *
     * Only affects founders (individuals without parents) and non-frozen individuals.
     *
     * @param {string} race - Population identifier (e.g., 'european_ancestry', 'african_american', 'general')
     * @param {string} condition - Genetic condition code (e.g., 'cf', 'sma', 'tay', 'pku', 'hemo')
     */
    setRace(race, condition) {
        this.race = race;
        if (this.parents.length === 0 && !this.frozen) {
            this.updateFromPopulationFrequency(condition);
        }
    }

    /**
     * Update probabilities based on population carrier frequency
     *
     * Uses Hardy-Weinberg equilibrium assuming:
     * - Carrier frequency q (from population data)
     * - Normal allele frequency p = 1 - q
     * - Genotype frequencies: [p², pq, qp, q²]
     *
     * Only updates founders (no parents) who are not frozen.
     *
     * @param {string} condition - Genetic condition code
     */
    updateFromPopulationFrequency(condition) {
        if (!this.race || this.frozen) return;
        const frequency = getCarrierFrequency(condition, this.race);
        if (frequency !== null) {
            const q = frequency;
            const p = 1 - q;
            if (!this.affected) {
                this.probabilities = [p * p, p * q, q * p, q * q];
            }
            this.validateAndNormalizeProbabilities();
            this.originalProbabilities = [...this.probabilities];
        }
    }

    /**
     * Calculate child's genotype probabilities from parents using Mendelian inheritance
     *
     * Iterates over all combinations of parent genotypes weighted by their probabilities.
     * For each combination, calculates offspring probabilities assuming each parent
     * contributes one allele at random.
     *
     * Requires exactly 2 parents and non-frozen status.
     *
     * @example
     * // Parent 1: [0, 0.5, 0.5, 0] (certain carrier)
     * // Parent 2: [0, 0.5, 0.5, 0] (certain carrier)
     * // Child will have: [0.25, 0.25, 0.25, 0.25] (25% affected risk)
     */
    calculateFromParents() {
        if (this.parents.length !== 2 || this.frozen) return;
        const [parent1, parent2] = this.parents;
        const newProbs = [0, 0, 0, 0];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const p1Prob = parent1.probabilities[i];
                const p2Prob = parent2.probabilities[j];
                if (p1Prob > 0 && p2Prob > 0) {
                    const p1Geno = indexToGenotype(i);
                    const p2Geno = indexToGenotype(j);
                    const offspringProbs = calculateOffspringProbabilities(p1Geno, p2Geno);
                    for (let k = 0; k < 4; k++) {
                        newProbs[k] += p1Prob * p2Prob * offspringProbs[k];
                    }
                }
            }
        }
        this.probabilities = newProbs;
        this.validateAndNormalizeProbabilities();
    }
}
