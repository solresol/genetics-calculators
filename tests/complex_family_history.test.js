import { Pedigree } from '../src/pedigree.js';
import { readPedigree } from '../src/io.js';

test('non-founder parent of an affected child remains an obligate carrier', () => {
    const pedigree = new Pedigree('cf');
    const grandpa = pedigree.addIndividual('M');
    const grandma = pedigree.addIndividual('F');
    pedigree.addPartnership(grandpa, grandma);

    const mother = pedigree.addIndividual('F');
    pedigree.addParentChild(grandpa, mother);
    pedigree.addParentChild(grandma, mother);

    const father = pedigree.addIndividual('M');
    pedigree.addPartnership(mother, father);

    const child = pedigree.addIndividual('M');
    child.setAffected(true);
    pedigree.addParentChild(mother, child);
    pedigree.addParentChild(father, child);

    pedigree.updateAllProbabilities();

    expect(mother.probabilities).toEqual([0, 0.5, 0.5, 0]);
    expect(father.probabilities).toEqual([0, 0.5, 0.5, 0]);
});

test('real siblings are conditioned to unaffected while hypothetical siblings keep recurrence risk', () => {
    const pedigree = new Pedigree('cf');
    const father = pedigree.addIndividual('M');
    const mother = pedigree.addIndividual('F');
    pedigree.addPartnership(father, mother);

    const affected = pedigree.addIndividual('F');
    affected.setAffected(true);
    pedigree.addParentChild(father, affected);
    pedigree.addParentChild(mother, affected);

    const realSibling = pedigree.addIndividual('M');
    pedigree.addParentChild(father, realSibling);
    pedigree.addParentChild(mother, realSibling);

    const hypotheticalSibling = pedigree.addIndividual('F');
    hypotheticalSibling.hypothetical = true;
    pedigree.addParentChild(father, hypotheticalSibling);
    pedigree.addParentChild(mother, hypotheticalSibling);

    pedigree.updateAllProbabilities();

    expect(realSibling.probabilities[0]).toBeCloseTo(1 / 3, 6);
    expect(realSibling.probabilities[1]).toBeCloseTo(1 / 3, 6);
    expect(realSibling.probabilities[2]).toBeCloseTo(1 / 3, 6);
    expect(realSibling.probabilities[3]).toBeCloseTo(0, 6);

    expect(hypotheticalSibling.probabilities[0]).toBeCloseTo(0.25, 6);
    expect(hypotheticalSibling.probabilities[1]).toBeCloseTo(0.25, 6);
    expect(hypotheticalSibling.probabilities[2]).toBeCloseTo(0.25, 6);
    expect(hypotheticalSibling.probabilities[3]).toBeCloseTo(0.25, 6);
});

test('three-generation PKU scenario preserves expected obligate-carrier structure', () => {
    const pedigree = readPedigree('scenarios/pku_three_generations.json');
    pedigree.updateAllProbabilities();

    const id5 = pedigree.individuals.find(ind => ind.id === 5);
    const id6 = pedigree.individuals.find(ind => ind.id === 6);
    const id9 = pedigree.individuals.find(ind => ind.id === 9);
    const id10 = pedigree.individuals.find(ind => ind.id === 10);

    expect(id5.probabilities).toEqual([0, 0.5, 0.5, 0]);
    expect(id6.probabilities).toEqual([0, 0.5, 0.5, 0]);
    expect(id9.probabilities[0]).toBeCloseTo(1 / 3, 6);
    expect(id9.probabilities[1]).toBeCloseTo(1 / 3, 6);
    expect(id9.probabilities[2]).toBeCloseTo(1 / 3, 6);
    expect(id9.probabilities[3]).toBeCloseTo(0, 6);
    expect(id10.probabilities[3]).toBeCloseTo(0.25, 6);
});
