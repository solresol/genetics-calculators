# Genetics Calculators

Educational tools to help genetic counselors learn probability calculations for autosomal recessive genetic conditions.

## Quick Start

```bash
npm install
npm run build
open dist/pedigree_analyzer.html
```

Load an example scenario from the dropdown and click **Start** to see the optimizer find carrier probabilities!

## Overview

This project includes a web-based pedigree editor that estimates carrier
probabilities for each person in the chart using Mendelian genetics and population-specific carrier frequencies.

### Features

The user can:

* **Draw a pedigree** and mark individuals as affected or unaffected.
* **Specify race information** so that each founder defaults to the population
  carrier frequency for their race. If race is missing the interface prompts for
  it.
* **Select a disease model** (cystic fibrosis, spinal muscular atrophy, Tay
  Sachs disease, phenylketonuria or hemochromatosis) which populates a table of
  background carrier frequencies. Extra rows allow custom populations and
  baseline probabilities.
* **View genotype probabilities** beside each person: neg&#8209;neg,
  neg&#8209;pos, pos&#8209;neg and pos&#8209;pos. Affected individuals are fixed at
  `1.0` for pos&#8209;pos and `0.0` for the other states.
* **Add hypothetical children** between any two individuals to see the resulting
  probability distribution.
* **Load a pedigree from a JSON file** using the same format as the CLI.

The application repeatedly updates these probabilities to minimise the negative
log‑likelihood of the observed affected/unaffected pattern. The optimiser
randomly tweaks the probabilities for unaffected individuals and accepts or
rejects changes based on whether the overall cost improves. Progress is shown in
real time so that the user can stop or reset if convergence stalls.

### Optimisation algorithm

The objective is

```math
J = -\sum_{i} \log P(\text{phenotype}_i\mid \text{genotype}_i, \text{parents})
```

where affected individuals contribute the probability of `pos-pos` and
unaffected individuals contribute the sum of the other three genotype
probabilities. The optimisation loop works as follows:

1. **Select an unaffected founder** at random.
2. **Propose a small adjustment** to either the `neg-neg` probability or the
   symmetric carrier pair (`neg-pos`/`pos-neg`).
3. **Recalculate all descendants** using the new probabilities.
4. **Compute** the new negative log-likelihood.
5. **Accept or reject** the proposal – always accepting improvements and
   occasionally accepting worse solutions using a simulated annealing rule
   `\exp(-\Delta J / T)`.
6. **Cool the temperature** and repeat until thousands of iterations pass with
   no improvement.

## Development

Install dependencies and run the automated tests:

```bash
npm install
NODE_OPTIONS=--experimental-vm-modules npm test
```

To create a standalone version of the web interface run:

```bash
npm run build
```

This bundles all HTML, CSS and JavaScript into `dist/pedigree_analyzer.html`
which can be opened directly without a web server.

## Command Line Usage

Run the optimiser on a pedigree defined in a JSON file:

```bash
node cli.js pedigree.json 123 5000
```

This expects `pedigree.json` to contain a structure like:

```json
{
  "condition": "cf",
  "individuals": [
    {"id": 1, "gender": "M", "race": "general"},
    {"id": 2, "gender": "F", "race": "general"},
    {"id": 3, "gender": "M", "parents": [1,2], "affected": true},
    {"id": 4, "gender": "F", "parents": [1,2], "hypothetical": true}
  ]
}
```

Individuals may include a `hypothetical` flag to indicate that they are
not yet born. Such individuals are excluded from the likelihood
calculation but their genotype probabilities are computed from their
parents. The program prints a table of updated genotype probabilities
for each individual, including any hypothetical children.
Sample pedigrees that demonstrate these features can be found in the `scenarios` directory.
The web UI includes a **Load Example** drop‑down that loads these sample files without needing to upload them.

### JSON Pedigree Format

A pedigree file contains a `condition` and an array of `individuals`.  Each
individual can include the following properties:

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Unique identifier used for references. |
| `gender` | `'M'` or `'F'` | Sex of the individual. |
| `parents` | `[id,id]` | (optional) IDs of the parents. |
| `race` | string | (optional) Population used for base carrier frequency. |
| `affected` | boolean | (optional) Mark as affected. |
| `hypothetical` | boolean | (optional) Exclude from likelihood calculations. |
| `x`/`y` | number | (optional) Display coordinates for editors. |

Coordinates are optional and allow visual tools to store the layout of the
pedigree.  They are ignored by the optimiser but preserved when reading and
writing files.

---

## Supported Genetic Conditions

This application includes carrier frequency data for **5 autosomal recessive conditions**:

| Condition | Gene | General Population | European Ancestry | African American | Key Features |
|-----------|------|-------------------|-------------------|------------------|--------------|
| **Cystic Fibrosis (CF)** | CFTR | 2.5% | 2.9% | 0.67% | Lung and digestive issues; most common in Europeans |
| **Spinal Muscular Atrophy (SMA)** | SMN1 | 1.8% | 1.7% | 1.9% | Progressive muscle weakness; similar across populations |
| **Tay-Sachs Disease** | HEXA | 0.2% | 0.34%* | 0.13% | Neurodegeneration; higher in Ashkenazi Jewish (1:30) |
| **Phenylketonuria (PKU)** | PAH | 1.5% | 2.0% | 0.5% | Metabolic disorder; newborn screening standard |
| **Hemochromatosis** | HFE | 8.0% | 11.0% | 1.4% | Iron overload; most common genetic condition in Europeans |

\* European ancestry frequency used as proxy for Ashkenazi Jewish population (actual ~3.4%)

**Source**: Carrier frequencies from `src/population.js`, based on published population genetics data.

### Understanding These Numbers

The **carrier frequency** is the proportion of the population that has one normal and one disease allele (genotype −/+ or +/−).

For example, an 11% carrier frequency for Hemochromatosis in Europeans means:
- 11 out of 100 people are carriers
- ~1.2 out of 10,000 are affected (11% × 11% × 25% ≈ 0.012%)
- Two random Europeans have ~0.3% chance of both being carriers

See [GENETICS_TUTORIAL.md](GENETICS_TUTORIAL.md) for detailed explanations of carrier probabilities and Mendelian inheritance.

---

## Example Scenarios

The application includes **8 predefined scenarios** demonstrating different use cases:

### Basic Scenarios (CF)
1. **Hypothetical Child with Afflicted Sibling** - Classic recurrence risk calculation
2. **Hypothetical Child with Afflicted Cousin** - Extended family risk assessment

### Condition-Specific Scenarios
3. **SMA - Two Affected Siblings** - Multiple affected children, demonstrates certainty of carrier status
4. **SMA - African American Family** - Population-specific carrier frequencies
5. **Tay-Sachs - European Ancestry** - Higher carrier frequency in certain populations
6. **PKU - Three Generations** - Complex multi-generation pedigree
7. **PKU - Simple Carrier Risk** - Minimal scenario for understanding basics
8. **Hemochromatosis - Complex Family** - Largest carrier frequency (11% in Europeans)

### Loading Examples

In the web interface:
1. Use the **Load Example** dropdown menu
2. Select a scenario
3. Click **Start** to run optimization
4. Select individuals to view their carrier probabilities

Example files are also available in the `scenarios/` directory as JSON files.

---

## The 4-State Genotype Model

This application represents each individual's genotype as a **probability vector with 4 states**:

```
[P(−/−), P(−/+), P(+/−), P(+/+)]
```

Where:
- **−/−** (negative/negative): Both alleles normal - unaffected, non-carrier
- **−/+** (negative/positive): First allele normal, second disease - carrier (from first parent)
- **+/−** (positive/negative): First allele disease, second normal - carrier (from second parent)
- **+/+** (positive/positive): Both alleles disease - affected with condition

### Why Track −/+ and +/− Separately?

Although biologically equivalent (both are carriers), tracking parent-of-origin separately:
1. Simplifies Mendelian inheritance calculations
2. Maintains mathematical consistency when computing child probabilities
3. Should always be equal for individuals without specified parents (founders)

### Examples

**Affected individual** (known disease):
```
[0.0, 0.0, 0.0, 1.0]  ← 100% certain they have +/+
```

**Confirmed carrier** (e.g., parent of affected child):
```
[0.0, 0.5, 0.5, 0.0]  ← 100% certain they're a carrier
```

**Founder with population frequency** (CF in European, 2.9% carriers):
```
[0.9707, 0.0145, 0.0145, 0.0004]  ← Based on Hardy-Weinberg equilibrium
```

**Child of two confirmed carriers**:
```
[0.25, 0.25, 0.25, 0.25]  ← Classic Mendelian 25% risk
```

For detailed mathematics, see [GENETICS_TUTORIAL.md](GENETICS_TUTORIAL.md#the-4-state-genotype-model).

---

## Use Cases for Genetic Counselors

### 1. Recurrence Risk Calculation
**Scenario**: Couple has one child with PKU. What is the risk for another pregnancy?

**How to use**:
1. Load "PKU - Simple Carrier Risk" scenario
2. Note parents start at ~1.5% carrier frequency
3. Run optimization → both parents become 100% certain carriers
4. Add hypothetical child → shows 25% risk

### 2. Extended Family Risk Assessment
**Scenario**: Child has CF. What is the risk for the aunt's pregnancy?

**How to use**:
1. Load "Hypothetical Child with Afflicted Cousin" scenario
2. Individual 6 (affected cousin) establishes carrier status in parents
3. Individual 4 (aunt) is sibling of carrier parent
4. Optimization shows ~2/3 carrier probability for aunt (not 1/2, because unaffected)
5. Hypothetical child 8 shows ~0.5% risk (higher than population 0.0006%)

### 3. Population-Specific Risk
**Scenario**: Ashkenazi Jewish couple considering Tay-Sachs screening

**How to use**:
1. Load "Tay-Sachs - European Ancestry" scenario (using 0.34% as proxy)
2. If actual Ashkenazi frequency is 3.4%, manually update frequency table
3. Add hypothetical child between unrelated founders
4. Risk = 3.4% × 3.4% × 25% ≈ 0.03% (1 in 3,600) vs general population 1 in 250,000

### 4. Multi-Generation Pedigrees
**Scenario**: Affected individual in third generation, determining carrier status of grandparents

**How to use**:
1. Load "PKU - Three Generations" scenario
2. Run optimization
3. Observe how affected child in generation 3 affects grandparent probabilities
4. Note that both grandparents on one side must have at least one carrier

### 5. Teaching Mendelian Genetics
**Scenario**: Demonstrate why siblings of affected children have 2/3 carrier probability (not 1/2)

**How to use**:
1. Create simple pedigree: 2 parents + 1 affected child + 1 unaffected sibling
2. Run optimization
3. Show that parents are certain carriers [0, 0.5, 0.5, 0]
4. Show unaffected sibling is [0.333, 0.333, 0.333, 0] = 2/3 carrier probability
5. Explain: The 1/4 who would be +/+ are not observed (they're affected), so renormalize 3/4 → 1/3 + 1/3 + 1/3

---

## Testing

The project includes comprehensive test coverage with **both Jest (unit tests) and Playwright (E2E tests)**.

### Running Unit Tests

```bash
NODE_OPTIONS=--experimental-vm-modules npm test
```

Runs 17 Jest test files covering:
- Core probability calculations (`pedigree.test.js`, `carrier_parents.test.js`)
- Hypothetical individual handling (`hypothetical_child.test.js`)
- Optimization algorithms (`optimization_improvements.test.js`)
- Selenium-based UI tests (`selenium_*.test.js`)

### Running Playwright E2E Tests

```bash
npx playwright test
```

Runs comprehensive browser automation tests covering:
- **Basic UI**: All buttons, controls, and interface elements
- **Genetic Conditions**: All 5 conditions with realistic scenarios
- **Interactive Features**: Drag-and-drop, right-click, mode switching
- **Optimization**: Start/stop/step controls, likelihood improvements
- **File Operations**: Save/load, coordinate preservation, JSON validation
- **Visual Regression**: Canvas rendering, screenshots for comparison

View test results:
```bash
npx playwright show-report
```

### Playwright Test Browsers

Tests run on:
- ✅ Chromium (Chrome/Edge)
- ✅ Firefox
- ✅ WebKit (Safari)

---

## Troubleshooting

### Test Issues

**Problem**: Selenium tests fail with "geckodriver not found"

**Solution**:
```bash
# macOS
brew install geckodriver

# Linux
sudo apt-get install firefox-geckodriver

# Set custom path if needed
export GECKOWEBDRIVER=/path/to/geckodriver/directory
```

**Problem**: Playwright tests fail on first run

**Solution**: Install browsers:
```bash
npx playwright install
```

### Build Issues

**Problem**: `npm run build` fails

**Solution**: Ensure esbuild is installed:
```bash
npm install --save-dev esbuild
```

### Optimization Issues

**Problem**: Optimization never converges (runs indefinitely)

**Possible causes**:
1. Missing race information for founders → right-click individuals, select race
2. Conflicting constraints (e.g., marked wrong individual as affected)
3. Very large pedigree → may take thousands of iterations

**Solution**: Click **Reset** and verify all affected individuals are correctly marked.

**Problem**: Carrier probabilities don't match expected values

**Check**:
1. Are all affected individuals marked? (Right-click to toggle)
2. Is the correct genetic condition selected?
3. Is race/population set correctly for founders?
4. Has optimization run to convergence? ("no improvement" status)

### File Loading Issues

**Problem**: Scenario won't load from file

**Solution**: Verify JSON is valid:
```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('scenarios/yourfile.json')))"
```

Required fields: `condition`, `individuals` array with `id`, `gender` for each.

**Problem**: Coordinates not preserved after save/load

**Check**: Ensure you're using the **Save File** button, not browser "Save Page As" (which doesn't trigger the JSON generation).

### Canvas Display Issues

**Problem**: Individuals not visible on canvas

**Possible causes**:
1. Coordinates out of range (canvas is 800×600)
2. Browser zoom level
3. Canvas rendering not initialized

**Solution**: Use auto-layout:
```bash
node layout-cli.js input.json > output.json
```

---

## Documentation

- **[GENETICS_TUTORIAL.md](GENETICS_TUTORIAL.md)** - Comprehensive tutorial on genetics, probability calculations, and worked examples
- **[CLAUDE.md](CLAUDE.md)** - Development guide and architecture overview
- **[docs/script.js.md](docs/script.js.md)** - Detailed frontend code documentation
- **README.md** (this file) - Project overview and usage guide

---

## Contributing

This is an educational tool. Contributions welcome for:
- Additional genetic conditions with carrier frequency data
- New example scenarios demonstrating edge cases
- Improved optimization algorithms
- Better visual design
- Documentation improvements

Please ensure all tests pass before submitting PRs:
```bash
NODE_OPTIONS=--experimental-vm-modules npm test && npx playwright test
```

---

## License

See LICENSE file for details.

---

## Disclaimer

**This tool is for educational purposes only.** It is designed to help genetic counselors learn probability calculations and understand Mendelian inheritance patterns.

**Clinical genetic counseling must be performed by certified genetic counselors** using validated tools and current medical literature. Do not use this application for clinical decision-making.

Carrier frequency data is approximate and based on published population studies. Individual ancestry, consanguinity, and specific mutations may significantly affect actual risk.
