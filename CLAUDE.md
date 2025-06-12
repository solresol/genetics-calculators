# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Install dependencies:**
```bash
npm install
```

**Run tests:**
```bash
NODE_OPTIONS=--experimental-vm-modules npm test
```

**Run a single test file:**
```bash
NODE_OPTIONS=--experimental-vm-modules npx jest tests/pedigree.test.js
```

## Architecture Overview

This is a genetics calculator application designed to help genetic counselors learn probability calculations for hereditary conditions. The application consists of:

### Core Architecture
- **Frontend**: HTML5 canvas-based pedigree drawing interface (`pedigree_analyzer.html`)
- **Backend Logic**: ES6 modules in `/src/` directory using probability calculations
- **Testing**: Jest-based test suite with ES modules support

### Key Components

**Pedigree System** (`src/pedigree.js`):
- Manages family tree structures with individuals and relationships
- Handles parent-child and partnership connections
- Calculates negative log-likelihood for optimization

**Individual Modeling** (`src/individual.js`):
- Represents people in pedigrees with genotype probabilities
- Supports affected/unaffected status and population-based carrier frequencies
- Implements Mendelian probability calculations from parent genotypes

**Population Genetics** (`src/population.js`):
- Contains carrier frequency data for different genetic conditions (CF, SMA, Tay-Sachs, PKU, Hemochromatosis)
- Supports population-specific frequencies (European ancestry, African American, general population)

**Optimization Engine** (`src/optimizer.js`):
- Uses simulated annealing to find maximum likelihood estimates
- Optimizes genotype probabilities given observed affected/unaffected individuals
- Temperature-based acceptance criteria with cooling schedule

### Genetic Conditions Supported
- Cystic Fibrosis (CF)
- Spinal Muscular Atrophy (SMA) 
- Tay-Sachs Disease
- Phenylketonuria (PKU)
- Hemochromatosis

### Technical Notes
- Uses ES6 modules (`"type": "module"` in package.json)
- Requires `--experimental-vm-modules` flag for Jest testing
- Canvas-based interactive pedigree drawing with drag-and-drop functionality
- Probability calculations use 4-state genotype representation: [neg/neg, neg/pos, pos/neg, pos/pos]

### Child Creation Workflow
The "Add Child" button allows creating children for selected parent pairs:
1. Select two individuals as parents (they will be partnered automatically)
2. Choose child gender (M/F) with input validation
3. Specify if child is hypothetical (unborn/potential) or real
4. Child probabilities are automatically calculated from parents using Mendelian inheritance
5. Hypothetical children are visually distinguished (dashed borders) and excluded from likelihood calculations

### Optimization Engine
Uses simulated annealing with several improvements:
- **Increased step size**: `changeAmount = 0.05` (increased from 0.01) for more meaningful probability changes
- **Adaptive cooling**: Temperature reduction adapts based on progress:
  - Fast progress (< 100 iterations without improvement): Normal cooling rate (0.995)
  - Slow progress (100-500 iterations): Slower cooling (0.9995)  
  - No progress (> 500 iterations): Minimal cooling (0.9999) to maintain exploration
- **Proper likelihood calculation**: Hypothetical children excluded from optimization target
- Both accepted and rejected moves increment no-improvement counter for better convergence detection