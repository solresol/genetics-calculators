import fs from 'fs';
import { Pedigree } from './pedigree.js';

export function sanityCheckPedigreeObject(obj) {
    const map = new Map();
    // is_sexual_partner_of is a list, which might be a sad
    // reflection on modern morals, but it mirrors reality.
    for (const info of obj.individuals) {
        map.set(info.id, info);
    }

    for (const info of obj.individuals) {
        if (info.is_sexual_partner_of !== undefined) {
            if (!Array.isArray(info.is_sexual_partner_of)) {
                throw new Error(`is_sexual_partner_of for ${info.id} must be an array`);
            }
            for (const pid of info.is_sexual_partner_of) {
                const partner = map.get(pid);
                if (!partner) {
                    throw new Error(`Individual ${info.id} references missing partner ${pid}`);
                }
                if (!Array.isArray(partner.is_sexual_partner_of) || !partner.is_sexual_partner_of.includes(info.id)) {
                    throw new Error(`Partner link not reciprocal between ${info.id} and ${pid}`);
                }
            }
        }
    }

    for (const info of obj.individuals) {
        if (info.parents && info.parents.length === 2) {
            const [p1, p2] = info.parents;
            const p1info = map.get(p1);
            const p2info = map.get(p2);
            if (!p1info || !p2info) {
                throw new Error(`Missing parents for child ${info.id}`);
            }
            if (!Array.isArray(p1info.is_sexual_partner_of) ||
                !p1info.is_sexual_partner_of.includes(p2) ||
                !Array.isArray(p2info.is_sexual_partner_of) ||
                !p2info.is_sexual_partner_of.includes(p1)) {
                throw new Error(`Parents ${p1} and ${p2} of child ${info.id} must reference each other via is_sexual_partner_of`);
            }
        }
    }
}

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

    // partnerships from explicit links
    const added = new Set();
    for (const info of obj.individuals) {
        if (Array.isArray(info.is_sexual_partner_of)) {
            for (const pid of info.is_sexual_partner_of) {
                const ind1 = map.get(info.id);
                const ind2 = map.get(pid);
                const key = ind1 && ind2 ? `${Math.min(ind1.id, ind2.id)}-${Math.max(ind1.id, ind2.id)}` : null;
                if (ind1 && ind2 && !added.has(key)) {
                    pedigree.addPartnership(ind1, ind2);
                    added.add(key);
                }
            }
        } else if (info.is_sexual_partner_of !== undefined) {
            const ind1 = map.get(info.id);
            const ind2 = map.get(info.is_sexual_partner_of);
            const key = ind1 && ind2 ? `${Math.min(ind1.id, ind2.id)}-${Math.max(ind1.id, ind2.id)}` : null;
            if (ind1 && ind2 && !added.has(key)) {
                pedigree.addPartnership(ind1, ind2);
                added.add(key);
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
        const partners = pedigree.relations
            .filter(r => r.type === 'partner' && r.individuals.includes(ind))
            .map(r => r.individuals[0] === ind ? r.individuals[1].id : r.individuals[0].id);
        if (partners.length > 0) {
            obj.is_sexual_partner_of = partners;
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
