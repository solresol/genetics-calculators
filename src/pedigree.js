import { Individual } from './individual.js';

export class Pedigree {
    constructor(condition = 'cf') {
        this.condition = condition;
        this.individuals = [];
        this.relations = [];
        this.nextId = 1;
    }

    addIndividual(gender) {
        const individual = new Individual(this.nextId++, gender);
        this.individuals.push(individual);
        return individual;
    }

    addParentChild(parent, child) {
        if (!parent || !child) {
            throw new Error('Parent or child missing');
        }
        if (parent === child) {
            throw new Error('Individual cannot be their own parent');
        }
        if (child.parents.length >= 2 && !child.parents.includes(parent)) {
            throw new Error('Child already has two parents');
        }
        if (!child.parents.includes(parent)) {
            child.parents.push(parent);
        }
        if (!parent.children.includes(child)) {
            parent.children.push(child);
        }
        if (child.parents.length > 2) {
            throw new Error('Child cannot have more than two parents');
        }
        this.relations.push({ type: 'parent', parent, child });
        if (child.parents.length === 2) {
            const [p1, p2] = child.parents;
            this.addPartnership(p1, p2);
        }
    }

    addPartnership(ind1, ind2) {
        if (ind1.partner === ind2) return;
        if (ind1.partner) ind1.partner.partner = null;
        if (ind2.partner) ind2.partner.partner = null;
        ind1.partner = ind2;
        ind2.partner = ind1;
        this.relations.push({ type: 'partner', individuals: [ind1, ind2] });
    }

    freezeUninformativeFounders() {
        const informative = new Set();
        const queue = this.individuals.filter(ind => !ind.hypothetical);
        while (queue.length > 0) {
            const ind = queue.pop();
            for (const parent of ind.parents) {
                if (!informative.has(parent)) {
                    informative.add(parent);
                    queue.push(parent);
                }
            }
        }
        if (informative.size === 0) return;
        for (const ind of this.individuals) {
            if (ind.parents.length === 0 && !informative.has(ind)) {
                ind.frozen = true;
            }
        }
    }

    updateAllProbabilities() {
        for (const individual of this.individuals) {
            if (individual.parents.length === 2) {
                individual.calculateFromParents();
            }
        }

        for (const child of this.individuals) {
            if (child.affected && child.parents.length === 2) {
                const [parent1, parent2] = child.parents;
                for (const parent of [parent1, parent2]) {
                    if (!parent.affected) {
                        parent.probabilities = [0, 0.5, 0.5, 0];
                        parent.validateAndNormalizeProbabilities();
                        parent.originalProbabilities = [...parent.probabilities];
                    }
                }
            }
        }

        for (const individual of this.individuals) {
            if (individual.parents.length === 2) {
                individual.calculateFromParents();
            }
        }

        for (const child of this.individuals) {
            if (child.affected && child.parents.length === 2) {
                const [parent1, parent2] = child.parents;
                const siblings = parent1.children.filter(c =>
                    parent2.children.includes(c) && c !== child
                );
                for (const sib of siblings) {
                    if (!sib.affected) {
                        // Recompute the sibling probabilities from the
                        // now-obligate carrier parents rather than assuming
                        // a fixed distribution. This correctly yields a
                        // 25% chance of being affected for hypothetical
                        // children.
                        sib.calculateFromParents();
                        sib.originalProbabilities = [...sib.probabilities];
                    }
                }
            }
        }
    }

    calculateNegativeLogLikelihood() {
        let logLikelihood = 0;
        for (const individual of this.individuals) {
            if (individual.hypothetical) continue;
            if (individual.affected) {
                const prob = individual.probabilities[3];
                logLikelihood += Math.log(prob > 0 ? prob : 1e-10);
            } else {
                const prob = individual.probabilities[0] +
                    individual.probabilities[1] +
                    individual.probabilities[2];
                logLikelihood += Math.log(prob > 0 ? prob : 1e-10);
            }
        }
        return -logLikelihood;
    }
}
