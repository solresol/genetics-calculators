import { jest } from '@jest/globals';
import { By } from 'selenium-webdriver';
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

test('predefined scenario loads from dropdown', async () => {
  const driver = await buildHeadlessFirefoxDriver();

  try {
    const fileUrl = getDistFileUrl();
    await driver.get(fileUrl);
    const option = await driver.findElement(By.css('#scenarioSelect option[value="Hypothetical Child with Afflicted Sibling"]'));
    await option.click();
    await driver.findElement(By.id('loadScenarioBtn')).click();
    await waitForIndividuals(driver, 4);
    const count = await driver.executeScript('return window.pedigreeChart.individuals.length;');
    expect(count).toBe(4);
    const coords = await driver.executeScript(
      'var ind=pedigreeChart.individuals.find(i=>i.id===1); return {x:ind.x,y:ind.y};'
    );
    expect(coords.x).toBe(100);
    expect(coords.y).toBe(100);
  } finally {
    await driver.quit();
  }
});
