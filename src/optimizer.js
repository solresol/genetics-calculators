import { optimizeAllFoundersPowell } from './optimjs.js';

export class Optimizer {
    constructor(pedigree) {
        this.pedigree = pedigree;
        this.iterations = 0;
        this.currentLikelihood = 0;
        this.bestLikelihood = Infinity;
        this.noImprovementCount = 0;
        this.temperature = 1.0;
        this.coolingRate = 0.995;
        this.learningRate = 0.0001;
    }

    initialize() {
        this.iterations = 0;
        this.currentLikelihood = this.pedigree.calculateNegativeLogLikelihood();
        this.bestLikelihood = this.currentLikelihood;
        this.noImprovementCount = 0;
        this.temperature = 1.0;
    }

    performSingleStep() {
        const founders = this.pedigree.individuals.filter(
            (ind) => !ind.affected && !ind.frozen && ind.parents.length === 0
        );
        if (founders.length === 0) {
            return null;
        }

        const baseline = founders.map(f => [...f.probabilities]);
        const newLikelihood = optimizeAllFoundersPowell(this.pedigree);

        let delta = 0;
        for (let i = 0; i < founders.length; i++) {
            for (let j = 0; j < founders[i].probabilities.length; j++) {
                delta += Math.abs(founders[i].probabilities[j] - baseline[i][j]);
            }
        }

        this.currentLikelihood = newLikelihood;
        if (newLikelihood < this.bestLikelihood) {
            this.bestLikelihood = newLikelihood;
            this.noImprovementCount = 0;
        } else {
            this.noImprovementCount++;
        }

        this.iterations++;
        this.temperature *= this.coolingRate;
        return delta;
    }

    performStepOnIndividual(individual) {
        if (!individual || individual.affected || individual.frozen) {
            return null;
        }
        const originalProbs = [...individual.probabilities];
        const changeAmount = this.learningRate;
        if (Math.random() < 0.5) {
            const change = (Math.random() - 0.5) * changeAmount;
            individual.probabilities[0] = Math.max(0, Math.min(1, individual.probabilities[0] + change));
            const remaining = 1 - individual.probabilities[0];
            const totalOther = individual.probabilities[1] + individual.probabilities[2] + individual.probabilities[3];
            if (totalOther > 0) {
                const scale = remaining / totalOther;
                individual.probabilities[1] *= scale;
                individual.probabilities[2] *= scale;
                individual.probabilities[3] *= scale;
            }
        } else {
            const change = (Math.random() - 0.5) * changeAmount;
            const currentCarrier = (individual.probabilities[1] + individual.probabilities[2]) / 2;
            const newCarrier = Math.max(0, Math.min(0.5, currentCarrier + change));
            individual.probabilities[1] = newCarrier;
            individual.probabilities[2] = newCarrier;
            const remaining = 1 - 2 * newCarrier;
            const totalOther = individual.probabilities[0] + individual.probabilities[3];
            if (totalOther > 0) {
                const scale = remaining / totalOther;
                individual.probabilities[0] *= scale;
                individual.probabilities[3] *= scale;
            }
        }
        const sum = individual.probabilities.reduce((a, b) => a + b, 0);
        if (sum > 0) {
            individual.probabilities = individual.probabilities.map((p) => p / sum);
        }
        this.pedigree.updateAllProbabilities();
        const newLikelihood = this.pedigree.calculateNegativeLogLikelihood();
        const deltaE = newLikelihood - this.currentLikelihood;
        const acceptProb = deltaE < 0 ? 1.0 : Math.exp(-deltaE / this.temperature);
        const accept = Math.random() < acceptProb;
        let delta = 0;
        if (accept) {
            this.currentLikelihood = newLikelihood;
            delta = originalProbs.reduce(
                (sum, p, idx) => sum + Math.abs(individual.probabilities[idx] - p),
                0
            );
            if (newLikelihood < this.bestLikelihood) {
                this.bestLikelihood = newLikelihood;
                this.noImprovementCount = 0;
            } else {
                this.noImprovementCount++;
            }
        } else {
            individual.probabilities = originalProbs;
            this.pedigree.updateAllProbabilities();
            this.noImprovementCount++;
        }
        this.iterations++;

        // Constant cooling with fixed rate
        this.temperature *= this.coolingRate;
        return delta;
    }

    run(maxIterations = 10000) {
        this.initialize();
        for (let i = 0; i < maxIterations; i++) {
            if (this.performSingleStep() === null) break;
            if (this.noImprovementCount > 5000) break;
        }
        return this.bestLikelihood;
    }
}
