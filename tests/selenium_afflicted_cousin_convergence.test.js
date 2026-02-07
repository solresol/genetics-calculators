import { jest } from '@jest/globals';
import { By } from 'selenium-webdriver';
import { spawnSync } from 'child_process';
import path from 'path';
import { buildHeadlessFirefoxDriver } from './selenium_driver.js';

jest.setTimeout(45000);

test('afflicted cousin scenario stabilizes during continuous optimization', async () => {
  const build = spawnSync('node', ['build.js']);
  expect(build.status).toBe(0);

  const driver = await buildHeadlessFirefoxDriver();

  try {
    const fileUrl = 'file://' + path.resolve('dist/pedigree_analyzer.html');
    await driver.get(fileUrl);

    const option = await driver.findElement(
      By.css('#scenarioSelect option[value="Hypothetical Child with Afflicted Cousin"]')
    );
    await option.click();
    await driver.findElement(By.id('loadScenarioBtn')).click();
    await driver.sleep(500);

    await driver.executeScript(`
      window.__optTrace = [];
      const originalStep = window.optimizer.base.performSingleStep.bind(window.optimizer.base);
      window.optimizer.base.performSingleStep = function patchedStep() {
        const delta = originalStep();
        window.__optTrace.push({
          likelihood: window.optimizer.base.currentLikelihood,
          delta: Math.abs(delta || 0)
        });
        if (window.__optTrace.length > 5000) {
          window.__optTrace.shift();
        }
        return delta;
      };
    `);

    await driver.findElement(By.id('startOptBtn')).click();
    await driver.sleep(6000);
    await driver.findElement(By.id('stopOptBtn')).click();
    await driver.sleep(200);

    const stats = await driver.executeScript(`
      const trace = window.__optTrace || [];
      const recent = trace.slice(-100);
      const recentLikelihoods = recent.map(t => t.likelihood);
      const recentDeltas = recent.map(t => t.delta);
      const afflictedCousin = window.pedigreeChart.individuals.find(i => i.id === 6);
      return {
        points: trace.length,
        recentLikelihoodRange: Math.max(...recentLikelihoods) - Math.min(...recentLikelihoods),
        recentDeltaMax: Math.max(...recentDeltas),
        current: window.optimizer.base.currentLikelihood,
        best: window.optimizer.base.bestLikelihood,
        afflicted: afflictedCousin.affected,
        afflictedP3: afflictedCousin.probabilities[3]
      };
    `);

    expect(stats.points).toBeGreaterThan(100);
    expect(stats.recentLikelihoodRange).toBeLessThan(0.01);
    expect(stats.recentDeltaMax).toBeLessThan(0.01);
    expect(Math.abs(stats.current - stats.best)).toBeLessThan(1e-9);
    expect(stats.afflicted).toBe(true);
    expect(stats.afflictedP3).toBeCloseTo(1, 12);
  } finally {
    await driver.quit();
  }
});
