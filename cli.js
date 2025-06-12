#!/usr/bin/env node
import fs from 'fs';
import { Pedigree } from './src/pedigree.js';
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

function parsePedigree(filePath) {
  const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const condition = json.condition || 'cf';
  const pedigree = new Pedigree(condition);
  const map = new Map();
  for (const info of json.individuals) {
    const ind = pedigree.addIndividual(info.gender);
    map.set(info.id, ind);
    if (info.affected) ind.setAffected(true);
    if (info.race) ind.setRace(info.race, condition);
    if (info.hypothetical) ind.hypothetical = true;
  }
  for (const info of json.individuals) {
    if (info.parents) {
      const child = map.get(info.id);
      if (info.parents[0]) {
        pedigree.addParentChild(map.get(info.parents[0]), child);
      }
      if (info.parents[1]) {
        pedigree.addParentChild(map.get(info.parents[1]), child);
      }
      if (info.parents.length === 2) {
        pedigree.addPartnership(map.get(info.parents[0]), map.get(info.parents[1]));
      }
    }
  }
  return pedigree;
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
  const pedigree = parsePedigree(file);
  pedigree.updateAllProbabilities();
  const optimizer = new Optimizer(pedigree);
  optimizer.run(iters);
  for (const ind of pedigree.individuals) {
    const probs = ind.probabilities.map(p => p.toFixed(4)).join('\t');
    console.log(`${ind.id}\t${probs}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
