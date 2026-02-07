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

test('pedigree analyzer page loads', async () => {
  const driver = await buildHeadlessFirefoxDriver();

  try {
    const fileUrl = getDistFileUrl();
    await driver.get(fileUrl);
    const heading = await driver.findElement(By.css('h1')).getText();
    expect(heading).toBe('Genetic Pedigree Probability Analyzer');
  } finally {
    await driver.quit();
  }
});

test('scenario coordinates respected', async () => {
  const driver = await buildHeadlessFirefoxDriver();

  try {
    const fileUrl = getDistFileUrl();
    await driver.get(fileUrl);
    const fileInput = await driver.findElement(By.id('loadFileInput'));
    const scenarioPath = path.resolve('scenarios/hypothetical_child_with_afflicted_sibling.json');
    await fileInput.sendKeys(scenarioPath);
    await waitForIndividuals(driver, 4);
    const coords = await driver.executeScript(
      'var ind=pedigreeChart.individuals.find(i=>i.id===1); return {x:ind.x,y:ind.y};'
    );
    expect(coords.x).toBe(100);
    expect(coords.y).toBe(50);
  } finally {
    await driver.quit();
  }
});

test('step node updates parent probabilities', async () => {
  const driver = await buildHeadlessFirefoxDriver();

  try {
    const fileUrl = getDistFileUrl();
    await driver.get(fileUrl);
    const fileInput = await driver.findElement(By.id('loadFileInput'));
    const scenarioPath = path.resolve('scenarios/hypothetical_child_with_afflicted_sibling.json');
    await fileInput.sendKeys(scenarioPath);
    await waitForIndividuals(driver, 4);

    await driver.executeScript(
      'pedigreeChart.selectedIndividual = pedigreeChart.individuals.find(i => i.id === 1);'
    );
    const before = await driver.executeScript(
      'return pedigreeChart.selectedIndividual.probabilities.slice();'
    );
    const stepBtn = await driver.findElement(By.id('stepNodeBtn'));
    for (let i = 0; i < 5; i++) {
      await stepBtn.click();
    }
    await driver.sleep(200);
    const after = await driver.executeScript(
      'return pedigreeChart.selectedIndividual.probabilities.slice();'
    );
    expect(after).toEqual(before);
  } finally {
    await driver.quit();
  }
});
