#!/usr/bin/env node
import { readPedigree, writePedigree } from './src/io.js';
import { autoLayout } from './src/layout.js';

function main() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error('Usage: node layout-cli.js <input> [output]');
        process.exit(1);
    }
    const input = args[0];
    const output = args[1] || input;

    const pedigree = readPedigree(input);
    autoLayout(pedigree);
    writePedigree(pedigree, output, true);
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
