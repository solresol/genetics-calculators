# genetics-calculators
Tools to assist genetic counsellors learn how to make calculations of probability

## Pedigree Probability Analyzer Goal

This project includes a web-based pedigree editor that estimates carrier
probabilities for each person in the chart. The user can:

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
