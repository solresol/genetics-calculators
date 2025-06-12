import { getCarrierFrequency } from './population.js';

export function indexToGenotype(index) {
    const genotypes = [
        ['neg', 'neg'],
        ['neg', 'pos'],
        ['pos', 'neg'],
        ['pos', 'pos']
    ];
    return genotypes[index];
}

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

export class Individual {
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

    setRace(race, condition) {
        this.race = race;
        if (this.parents.length === 0 && !this.frozen) {
            this.updateFromPopulationFrequency(condition);
        }
    }

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
