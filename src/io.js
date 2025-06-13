import fs from 'fs';
import { Pedigree } from './pedigree.js';

export function parsePedigreeObject(obj) {
    const condition = obj.condition || 'cf';
    const pedigree = new Pedigree(condition);
    const map = new Map();
    for (const info of obj.individuals) {
        const ind = pedigree.addIndividual(info.gender);
        map.set(info.id, ind);
        if (info.affected) ind.setAffected(true);
        if (info.race) ind.setRace(info.race, condition);
        if (info.hypothetical) ind.hypothetical = true;
        if (typeof info.x === 'number') ind.x = info.x;
        if (typeof info.y === 'number') ind.y = info.y;
    }
    for (const info of obj.individuals) {
        if (info.parents) {
            if (info.parents.length > 2) {
                throw new Error(`Individual ${info.id} has more than two parents`);
            }
            const child = map.get(info.id);
            if (info.parents[0]) {
                const p1 = map.get(info.parents[0]);
                if (!p1) throw new Error(`Missing parent ${info.parents[0]} for individual ${info.id}`);
                pedigree.addParentChild(p1, child);
            }
            if (info.parents[1]) {
                const p2 = map.get(info.parents[1]);
                if (!p2) throw new Error(`Missing parent ${info.parents[1]} for individual ${info.id}`);
                pedigree.addParentChild(p2, child);
            }
            if (info.parents.length === 2) {
                pedigree.addPartnership(map.get(info.parents[0]), map.get(info.parents[1]));
            }
        }
    }
    return pedigree;
}

export function readPedigree(filePath) {
    const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return parsePedigreeObject(json);
}

export function pedigreeToObject(pedigree, includeCoords = false) {
    const individuals = pedigree.individuals.map(ind => {
        const obj = {
            id: ind.id,
            gender: ind.gender,
        };
        if (ind.parents.length === 2) {
            obj.parents = [ind.parents[0].id, ind.parents[1].id];
        }
        if (ind.race) obj.race = ind.race;
        if (ind.affected) obj.affected = true;
        if (ind.hypothetical) obj.hypothetical = true;
        if (includeCoords) {
            if (typeof ind.x === 'number') obj.x = ind.x;
            if (typeof ind.y === 'number') obj.y = ind.y;
        }
        return obj;
    });
    return { condition: pedigree.condition, individuals };
}

export function writePedigree(pedigree, filePath, includeCoords = false) {
    const obj = pedigreeToObject(pedigree, includeCoords);
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
}
