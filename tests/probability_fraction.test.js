import { probabilityToFraction } from '../src/probability_fraction.js';
import { spawnSync } from 'child_process';

test('probabilityToFraction produces simple ratios', () => {
    expect(probabilityToFraction(0)).toEqual({ numerator: 0, denominator: 1 });
    expect(probabilityToFraction(1)).toEqual({ numerator: 1, denominator: 1 });
    expect(probabilityToFraction(0.5)).toEqual({ numerator: 1, denominator: 2 });
    expect(probabilityToFraction(0.50001)).toEqual({ numerator: 1, denominator: 2 });
    expect(probabilityToFraction(0.24999)).toEqual({ numerator: 1, denominator: 4 });
    expect(probabilityToFraction(0.025)).toEqual({ numerator: 1, denominator: 40 });
    expect(probabilityToFraction(0.66)).toEqual({ numerator: 2, denominator: 3 });
});

test('fraction-cli outputs fraction', () => {
    const result = spawnSync('node', ['fraction-cli.js', '0.66']);
    expect(result.status).toBe(0);
    expect(result.stdout.toString().trim()).toBe('2/3');
});
