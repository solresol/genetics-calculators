#!/usr/bin/env node
import { readPedigree } from './src/io.js';
import { Optimizer } from './src/optimizer.js';

function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, 1 | t);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function setRandomSeed(seed) {
  const prng = mulberry32(seed >>> 0);
  Math.random = prng;
}


function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node cli.js <file> [seed] [iterations]');
    process.exit(1);
  }
  const file = args[0];
  const seed = args.length > 1 ? parseInt(args[1], 10) : Date.now();
  const iters = args.length > 2 ? parseInt(args[2], 10) : 10000;
  setRandomSeed(seed);
  const pedigree = readPedigree(file);
  pedigree.updateAllProbabilities();
  const optimizer = new Optimizer(pedigree);
  optimizer.run(iters);
  console.log('[Person]\t[Clear]\t[--------Carrier------]\t[Affected]');
  for (const ind of pedigree.individuals) {
    const clear = ind.probabilities[0].toFixed(4);
    const c1 = ind.probabilities[1];
    const c2 = ind.probabilities[2];
    const carrierTotal = c1 + c2;
    let carrierStr = `${c1.toFixed(4)}+${c2.toFixed(4)}=${carrierTotal.toFixed(4)}`;
    let affectedStr = ind.probabilities[3].toFixed(4);

    if (carrierTotal > 0.75) {
      carrierStr = `\x1b[33m${carrierStr}\x1b[0m`;
    }
    if (ind.probabilities[3] > 0.75) {
      affectedStr = `\x1b[31m${affectedStr}\x1b[0m`;
    }

    console.log(`${ind.id}\t${clear}\t${carrierStr}\t${affectedStr}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
