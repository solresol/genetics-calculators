export const populationFrequencies = {
    cf: {
        european_ancestry: 0.029,
        african_american: 0.0067,
        general: 0.025,
        custom1: 0.0,
        custom2: 0.0
    },
    sma: {
        european_ancestry: 0.017,
        african_american: 0.019,
        general: 0.018,
        custom1: 0.0,
        custom2: 0.0
    },
    tay: {
        european_ancestry: 0.0034,
        african_american: 0.0013,
        general: 0.002,
        custom1: 0.0,
        custom2: 0.0
    },
    pku: {
        european_ancestry: 0.02,
        african_american: 0.005,
        general: 0.015,
        custom1: 0.0,
        custom2: 0.0
    },
    hemo: {
        european_ancestry: 0.11,
        african_american: 0.014,
        general: 0.08,
        custom1: 0.0,
        custom2: 0.0
    }
};

export function getCarrierFrequency(condition, race) {
    return populationFrequencies[condition]?.[race] ?? null;
}
