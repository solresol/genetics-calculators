/**
 * Population genetics module - Carrier frequency data for autosomal recessive conditions
 *
 * This module contains empirical carrier frequencies from population genetics studies.
 * Frequencies vary significantly by ancestry due to founder effects and genetic drift.
 *
 * @module population
 */

/**
 * Carrier frequencies for 5 autosomal recessive genetic conditions
 *
 * Each condition has frequencies for different population groups:
 * - european_ancestry: Individuals of European descent (including Ashkenazi Jewish as proxy)
 * - african_american: African American population
 * - general: Mixed or unspecified population
 * - custom1, custom2: User-defined custom populations (default 0.0)
 *
 * Frequencies represent the proportion of the population with genotype neg/pos or pos/neg
 * (one normal allele and one disease allele).
 *
 * @type {Object<string, Object<string, number>>}
 *
 * @property {Object} cf - Cystic Fibrosis (CFTR gene)
 * @property {number} cf.european_ancestry - 2.9% carrier frequency
 * @property {number} cf.african_american - 0.67% carrier frequency
 * @property {number} cf.general - 2.5% carrier frequency
 *
 * @property {Object} sma - Spinal Muscular Atrophy (SMN1 gene)
 * @property {number} sma.european_ancestry - 1.7% carrier frequency
 * @property {number} sma.african_american - 1.9% carrier frequency
 * @property {number} sma.general - 1.8% carrier frequency
 *
 * @property {Object} tay - Tay-Sachs Disease (HEXA gene)
 * @property {number} tay.european_ancestry - 0.34% carrier frequency (proxy for Ashkenazi Jewish ~3.4%)
 * @property {number} tay.african_american - 0.13% carrier frequency
 * @property {number} tay.general - 0.2% carrier frequency
 *
 * @property {Object} pku - Phenylketonuria (PAH gene)
 * @property {number} pku.european_ancestry - 2.0% carrier frequency
 * @property {number} pku.african_american - 0.5% carrier frequency
 * @property {number} pku.general - 1.5% carrier frequency
 *
 * @property {Object} hemo - Hemochromatosis (HFE gene)
 * @property {number} hemo.european_ancestry - 11.0% carrier frequency (highest)
 * @property {number} hemo.african_american - 1.4% carrier frequency
 * @property {number} hemo.general - 8.0% carrier frequency
 */
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

/**
 * Retrieve carrier frequency for a specific condition and population
 *
 * @param {string} condition - Condition code ('cf', 'sma', 'tay', 'pku', 'hemo')
 * @param {string} race - Population identifier ('european_ancestry', 'african_american', 'general', 'custom1', 'custom2')
 * @returns {number|null} - Carrier frequency (0.0 to 1.0) or null if not found
 *
 * @example
 * getCarrierFrequency('cf', 'european_ancestry') // returns 0.029 (2.9%)
 * getCarrierFrequency('hemo', 'european_ancestry') // returns 0.11 (11%)
 * getCarrierFrequency('invalid', 'general') // returns null
 */
export function getCarrierFrequency(condition, race) {
    return populationFrequencies[condition]?.[race] ?? null;
}
