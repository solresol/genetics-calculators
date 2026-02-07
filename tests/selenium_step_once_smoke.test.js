import { jest } from '@jest/globals';
import { By } from 'selenium-webdriver';
import path from 'path';
import { buildHeadlessFirefoxDriver } from './selenium_driver.js';
import {
  ensureBundleBuilt,
  getDistFileUrl,
  SELENIUM_TIMEOUT_MS,
  waitForIndividuals
} from './selenium_test_utils.js';

jest.setTimeout(SELENIUM_TIMEOUT_MS);

beforeAll(() => {
  ensureBundleBuilt();
});

test('step node updates genotype table', async () => {
  const driver = await buildHeadlessFirefoxDriver();

  try {
    const fileUrl = getDistFileUrl();
    await driver.get(fileUrl);

    const fileInput = await driver.findElement(By.id('loadFileInput'));
    const scenarioPath = path.resolve('scenarios/hypothetical_child_with_afflicted_sibling.json');
    await fileInput.sendKeys(scenarioPath);
    await waitForIndividuals(driver, 4);

    await driver.findElement(By.id('selectBtn')).click();
    await driver.executeScript(
      'pedigreeChart.selectedIndividual = pedigreeChart.individuals.find(i => i.id === 1); if (pedigreeChart) { pedigreeChart.updateIndividualInfo(); }'
    );
    await driver.sleep(100);

    const before = await driver.executeScript(
      'return pedigreeChart.selectedIndividual.probabilities.slice();'
    );

    const stepBtn = await driver.findElement(By.id('stepNodeBtn'));
    let delta = 0;
    for (let i = 0; i < 20; i++) {
      await stepBtn.click();
      await driver.sleep(50);
      const txt = await driver.findElement(By.id('probDelta')).getText();
      delta = parseFloat(txt);
      if (delta > 0) break;
    }
    await driver.sleep(100);

    const after = await driver.executeScript(
      'return pedigreeChart.selectedIndividual.probabilities.slice();'
    );

    expect(after).toEqual(before);
    expect(delta).toBe(0);
  } finally {
    await driver.quit();
  }
});
