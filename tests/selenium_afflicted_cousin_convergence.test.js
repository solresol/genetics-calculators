import { jest } from '@jest/globals';
import { By } from 'selenium-webdriver';
import { buildHeadlessFirefoxDriver } from './selenium_driver.js';
import {
  ensureBundleBuilt,
  getDistFileUrl,
  OPTIMIZATION_TIMEOUT_MS,
  SELENIUM_TIMEOUT_MS,
  waitForIndividuals
} from './selenium_test_utils.js';

jest.setTimeout(SELENIUM_TIMEOUT_MS);

beforeAll(() => {
  ensureBundleBuilt();
});

test('afflicted cousin scenario stabilizes during continuous optimization', async () => {
  const driver = await buildHeadlessFirefoxDriver();

  try {
    const fileUrl = getDistFileUrl();
    await driver.get(fileUrl);

    const option = await driver.findElement(
      By.css('#scenarioSelect option[value="Hypothetical Child with Afflicted Cousin"]')
    );
    await option.click();
    await driver.findElement(By.id('loadScenarioBtn')).click();
    await waitForIndividuals(driver, 6);

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
    await driver.wait(async () => {
      const running = await driver.executeScript('return !!window.optimizer && window.optimizer.running;');
      return running === false;
    }, OPTIMIZATION_TIMEOUT_MS);

    const statusText = await driver.findElement(By.id('optStatus')).getText();
    expect(statusText).toBe('Converged');

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
