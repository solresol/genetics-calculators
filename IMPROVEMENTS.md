# IMPROVEMENTS.md

_Analysis dated 2026-07-11._

## What this project is

`genetics-calculators` is an educational, browser-based tool that helps genetic
counselors learn probability calculations for autosomal recessive conditions
(CF, SMA, Tay-Sachs, PKU, hemochromatosis). Users draw a pedigree on an HTML5
canvas (`pedigree_analyzer.html` / `script.js`), mark affected/unaffected
individuals, pick a disease model with population carrier frequencies, and the
app estimates per-person genotype probabilities. The estimation runs two engines:
an exact enumeration path (`src/inference.js`) and a founder optimiser using
simulated annealing (`src/optimizer.js`) plus a Powell method wrapper
(`src/optimjs.js`). There is also a Node CLI (`cli.js`, `layout-cli.js`,
`fraction-cli.js`) and an ES-module core in `src/`. The build is a small esbuild
bundle (`build.js`) that emits `dist/pedigree_analyzer.html`. The repo is a
Node/ES-module project (no Python, so no requirements.txt/uv concern here).
The tree is currently clean and recent commits are bug-fix focused (exact
pedigree inference, Hardy-Weinberg allele derivation, optimiser convergence),
suggesting the numerical core has been through a real correctness pass.

## Bugs & Fixes (highest priority)

- **Two probability engines, one source of truth risk.** `src/inference.js`
  (exact) and `src/optimizer.js` (simulated annealing) can disagree. Recent
  commits (`9fcb778`, `ddd8881`, `c7c1e2f`) were all fixes to reconcile them.
  Add a cross-check test that asserts, on every predefined scenario, that the
  optimiser result matches the exact-inference marginals within tolerance. This
  is the single most valuable regression guard for this codebase.
- **Duplicated logic between `script.js` (1475 lines) and `src/`.** The browser
  file is huge and almost certainly re-implements probability/layout logic that
  already lives in `src/pedigree.js`, `src/individual.js`, and `src/layout.js`.
  Any bug fixed in `src/` may silently NOT be fixed in `script.js`. Audit and
  make `script.js` a thin UI shell that imports the `src/` modules through the
  build, so there is one implementation of the genetics math.
- **Magic constants in the optimiser** (`coolingRate = 0.995`,
  `learningRate = 0.0001`, `temperature = 1.0` in `src/optimizer.js`) are
  undocumented and untuned. Document why these values, and add a convergence
  test that fails if a known scenario stops improving before reaching the exact
  answer (extends the existing `beab600` convergence work).

## Improvements

- Surface a "solved exactly / approximated" indicator in the UI so counselors
  know whether they are seeing the exact posterior (`isExactlySolved()` in
  `optimizer.js`) or an annealing estimate.
- Report probabilities as exact fractions where possible — the machinery already
  exists in `src/probability_fraction.js` and `fraction-cli.js` but does not
  appear surfaced in the main analyzer UI. Fractions are far more pedagogically
  useful than long decimals for this audience.
- Add X-linked and autosomal-dominant modes. The whole model is currently
  hard-wired to autosomal recessive; counselors will expect at least X-linked.

## Testing

- Strong existing coverage (Jest unit + Selenium + Playwright). But three
  overlapping browser suites (`tests/selenium_*`, `tests-playwright/`) is heavy
  and slow. Consolidate on Playwright and retire Selenium+geckodriver unless
  there is a specific reason to keep both — recent commits (`7353646`) show
  ongoing geckodriver maintenance pain.
- Add the exact-vs-optimiser equivalence test described above.
- Add numeric golden-value tests for each disease model's carrier frequency in
  `src/population.js` so a fat-fingered constant is caught immediately.

## Documentation

- `README.md` and `GENETICS_TUTORIAL.md` were recently corrected (`dc718e1`);
  keep worked-example numbers in a test fixture so docs and code cannot drift
  again — assert the README's cousin-risk figure in a test.
- Document the two-engine architecture (exact vs annealing) in `CLAUDE.md`; a
  newcomer cannot tell which path runs when.

## Security

- No committed secrets spotted in the source skimmed. Client-only app with no
  backend, so attack surface is low. Recommend adding a Content-Security-Policy
  meta tag to the generated `dist/pedigree_analyzer.html` since it is a
  self-contained page that could be hosted publicly.
- Run `npm audit` — `selenium-webdriver` and `esbuild` pin older ranges.

## Housekeeping / Modernization

- `node_modules` and `dist` appear in the working tree; confirm both are
  gitignored and that `dist/` is a build artifact, not checked in.
- CLI entry points (`cli.js`, `layout-cli.js`, `fraction-cli.js`) lack a
  `--help`/usage; add one.
- Consider TypeScript or at least JSDoc-checked types on `src/` — the
  probability code is exactly where a silent type coercion causes wrong numbers.

## Quick Wins

1. Add the exact-vs-optimiser equivalence test across all `predefined_scenarios.js`.
2. Surface exact-fraction output in the UI (code already exists).
3. Add `--help` to the three CLI binaries.
4. Add a CSP meta tag to `dist/pedigree_analyzer.html`.
5. Pin/refresh dev deps and run `npm audit fix`.
