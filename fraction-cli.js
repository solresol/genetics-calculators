#!/usr/bin/env node
import { probabilityToFraction } from './src/probability_fraction.js';

function main() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error('Usage: prob-fraction <probability>');
        process.exit(1);
    }
    const prob = parseFloat(args[0]);
    if (isNaN(prob)) {
        console.error('Invalid probability');
        process.exit(1);
    }
    try {
        const { numerator, denominator } = probabilityToFraction(prob);
        console.log(`${numerator}/${denominator}`);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
