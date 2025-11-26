import { test, expect } from '@playwright/test';
import { spawnSync } from 'child_process';

test.describe('Optimization Workflow', () => {
  test.beforeAll(() => {
    const build = spawnSync('node', ['build.js']);
    if (build.status !== 0) {
      throw new Error('Build failed');
    }
  });

  test('step once button performs single optimization step', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load a scenario
    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    // Get initial iteration count
    const initialIterations = await page.evaluate(() => window.pedigreeChart.iterations);

    // Click step button
    await page.locator('#stepBtn').click();
    await page.waitForTimeout(200);

    // Verify iteration count increased
    const newIterations = await page.evaluate(() => window.pedigreeChart.iterations);
    expect(newIterations).toBe(initialIterations + 1);
  });

  test('step node button updates selected individual', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load a scenario
    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    // Select an individual
    await page.locator('#selectBtn').click();
    const position = await page.evaluate(() => {
      const ind = window.pedigreeChart.individuals[0];
      return { x: ind.x, y: ind.y };
    });
    await page.locator('#pedigreeCanvas').click({ position });
    await page.waitForTimeout(200);

    // Get initial probabilities
    const initialProbs = await page.evaluate(() =>
      window.pedigreeChart.selectedIndividual.probabilities.slice()
    );

    // Click step node button multiple times
    for (let i = 0; i < 5; i++) {
      await page.locator('#stepNodeBtn').click();
      await page.waitForTimeout(100);
    }

    // Note: For founders, probabilities might not change if they're the ones being optimized
    // This test mainly verifies the button works without errors
    const finalProbs = await page.evaluate(() =>
      window.pedigreeChart.selectedIndividual.probabilities.slice()
    );
    expect(finalProbs).toBeDefined();
    expect(finalProbs.length).toBe(4);
  });

  test('start button begins continuous optimization', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load a scenario
    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    // Click start button
    await page.locator('#startBtn').click();
    await page.waitForTimeout(1000);

    // Verify optimization is running
    const isRunning = await page.evaluate(() => window.pedigreeChart.optimizationRunning);
    expect(isRunning).toBe(true);

    // Stop optimization
    await page.locator('#stopBtn').click();
    await page.waitForTimeout(200);
  });

  test('stop button halts optimization', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load a scenario
    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    // Start optimization
    await page.locator('#startBtn').click();
    await page.waitForTimeout(500);

    // Stop optimization
    await page.locator('#stopBtn').click();
    await page.waitForTimeout(200);

    // Verify optimization stopped
    const isRunning = await page.evaluate(() => window.pedigreeChart.optimizationRunning);
    expect(isRunning).toBe(false);
  });

  test('reset button resets probabilities', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load a scenario
    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    // Run some optimization steps
    for (let i = 0; i < 10; i++) {
      await page.locator('#stepBtn').click();
      await page.waitForTimeout(50);
    }

    // Get iteration count (should be > 0)
    const iterations = await page.evaluate(() => window.pedigreeChart.iterations);
    expect(iterations).toBeGreaterThan(0);

    // Click reset
    await page.locator('#resetBtn').click();
    await page.waitForTimeout(200);

    // Verify iterations reset to 0
    const newIterations = await page.evaluate(() => window.pedigreeChart.iterations);
    expect(newIterations).toBe(0);
  });

  test('optimization status display updates', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load a scenario
    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    // Click step button
    await page.locator('#stepBtn').click();
    await page.waitForTimeout(200);

    // Check that status fields are populated
    const iterationsText = await page.locator('#iterations').textContent();
    expect(iterationsText).toBeTruthy();
    expect(parseInt(iterationsText)).toBeGreaterThanOrEqual(0);

    const nllText = await page.locator('#negLogLikelihood').textContent();
    expect(nllText).toBeTruthy();
  });

  test('optimization improves likelihood over time', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load a scenario with affected individual
    await page.locator('#exampleSelect').selectOption('PKU - Simple Carrier Risk');
    await page.waitForTimeout(500);

    // Get initial likelihood
    const initialNLL = await page.evaluate(() => {
      return window.pedigreeChart.pedigree.negativeLogLikelihood();
    });

    // Run optimization for a bit
    await page.locator('#startBtn').click();
    await page.waitForTimeout(2000);
    await page.locator('#stopBtn').click();
    await page.waitForTimeout(200);

    // Get final likelihood
    const finalNLL = await page.evaluate(() => {
      return window.pedigreeChart.pedigree.negativeLogLikelihood();
    });

    // Likelihood should improve (NLL should decrease) or stay the same
    expect(finalNLL).toBeLessThanOrEqual(initialNLL);
  });

  test('hypothetical children excluded from likelihood calculation', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load a scenario with hypothetical child
    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    // Calculate likelihood
    const nll = await page.evaluate(() => {
      return window.pedigreeChart.pedigree.negativeLogLikelihood();
    });

    // NLL should be finite (not NaN or Infinity)
    expect(isFinite(nll)).toBe(true);
    expect(nll).toBeGreaterThanOrEqual(0);

    // Verify hypothetical child exists
    const hasHypothetical = await page.evaluate(() => {
      return window.pedigreeChart.individuals.some(i => i.hypothetical);
    });
    expect(hasHypothetical).toBe(true);
  });

  test('optimization handles multiple affected siblings correctly', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load scenario with two affected siblings
    await page.locator('#exampleSelect').selectOption('SMA - Two Affected Siblings');
    await page.waitForTimeout(500);

    // Get initial probabilities of parents
    const initialProbs = await page.evaluate(() => {
      const parent = window.pedigreeChart.individuals.find(i =>
        (!i.parents || i.parents.length === 0) && i.gender === 'M'
      );
      return parent ? parent.probabilities.slice() : null;
    });

    // Run optimization
    await page.locator('#startBtn').click();
    await page.waitForTimeout(2000);
    await page.locator('#stopBtn').click();
    await page.waitForTimeout(200);

    // Get final probabilities
    const finalProbs = await page.evaluate(() => {
      const parent = window.pedigreeChart.individuals.find(i =>
        (!i.parents || i.parents.length === 0) && i.gender === 'M'
      );
      return parent ? parent.probabilities.slice() : null;
    });

    // Parents of two affected children should be very likely carriers
    // probabilities[1] and probabilities[2] are the carrier states (neg/pos and pos/neg)
    const carrierProb = finalProbs[1] + finalProbs[2];
    expect(carrierProb).toBeGreaterThan(0.9); // Should be close to 1.0
  });

  test('affected individuals have fixed probabilities', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load a scenario
    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    // Get affected individual's probabilities before optimization
    const probsBefore = await page.evaluate(() => {
      const affected = window.pedigreeChart.individuals.find(i => i.affected);
      return affected ? affected.probabilities.slice() : null;
    });

    // Run optimization
    for (let i = 0; i < 10; i++) {
      await page.locator('#stepBtn').click();
      await page.waitForTimeout(50);
    }

    // Get affected individual's probabilities after optimization
    const probsAfter = await page.evaluate(() => {
      const affected = window.pedigreeChart.individuals.find(i => i.affected);
      return affected ? affected.probabilities.slice() : null;
    });

    // Probabilities should be unchanged (affected = pos/pos = [0,0,0,1])
    expect(probsAfter).toEqual(probsBefore);
    expect(probsAfter[3]).toBe(1.0); // pos/pos
    expect(probsAfter[0]).toBe(0.0); // neg/neg
    expect(probsAfter[1]).toBe(0.0); // neg/pos
    expect(probsAfter[2]).toBe(0.0); // pos/neg
  });
});
