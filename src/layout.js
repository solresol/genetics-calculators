export function autoLayout(pedigree, options = {}) {
    const xSpacing = options.xSpacing || 120;
    const ySpacing = options.ySpacing || 100;

    const levelMap = new Map();
    const queue = [];

    for (const ind of pedigree.individuals) {
        if (ind.parents.length === 0) {
            levelMap.set(ind, 0);
            queue.push(ind);
        }
    }

    while (queue.length) {
        const ind = queue.shift();
        const level = levelMap.get(ind);
        for (const child of ind.children) {
            const childLevel = level + 1;
            if (!levelMap.has(child) || childLevel > levelMap.get(child)) {
                levelMap.set(child, childLevel);
                queue.push(child);
            }
        }
    }

    const groups = new Map();
    for (const [ind, lvl] of levelMap.entries()) {
        if (!groups.has(lvl)) groups.set(lvl, []);
        groups.get(lvl).push(ind);
    }

    const levels = Array.from(groups.keys()).sort((a, b) => a - b);
    for (const lvl of levels) {
        const inds = groups.get(lvl);
        inds.sort((a, b) => a.id - b.id);

        // keep partners adjacent
        const ordered = [];
        const used = new Set();
        for (const ind of inds) {
            if (used.has(ind)) continue;
            if (ind.partner && inds.includes(ind.partner)) {
                ordered.push(ind, ind.partner);
                used.add(ind);
                used.add(ind.partner);
            } else {
                ordered.push(ind);
                used.add(ind);
            }
        }

        let x = 0;
        for (const ind of ordered) {
            ind.x = x;
            ind.y = lvl * ySpacing;
            x += xSpacing;
        }
    }
}
