export function autoLayout(pedigree, options = {}) {
    const xSpacing = options.xSpacing || 120;
    const ySpacing = options.ySpacing || 100;
    const canvasHeight = options.canvasHeight;

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

    // Build depth map from leaf nodes upward for y positioning
    const depthMap = new Map();
    for (const ind of pedigree.individuals) {
        if (ind.children.length === 0) {
            depthMap.set(ind, 1);
        }
    }

    while (depthMap.size < pedigree.individuals.length) {
        let changed = false;
        for (const ind of pedigree.individuals) {
            if (depthMap.has(ind)) continue;
            if (ind.children.every(c => depthMap.has(c))) {
                const d = Math.max(...ind.children.map(c => depthMap.get(c))) + 1;
                depthMap.set(ind, d);
                changed = true;
            }
        }
        if (!changed) break;
    }

    const Y = Math.max(...depthMap.values());
    const spacing = typeof canvasHeight === 'number' ? canvasHeight / (Y + 1) : ySpacing;

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
            const d = depthMap.get(ind) || 1;
            ind.y = ((Y - d) + 0.5) * spacing;
            x += xSpacing;
        }
    }
}
