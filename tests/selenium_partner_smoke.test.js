import { jest } from '@jest/globals';
import { By, until } from 'selenium-webdriver';
import { buildHeadlessFirefoxDriver } from './selenium_driver.js';
import { ensureBundleBuilt, getDistFileUrl, SELENIUM_TIMEOUT_MS } from './selenium_test_utils.js';

jest.setTimeout(SELENIUM_TIMEOUT_MS);

beforeAll(() => {
  ensureBundleBuilt();
});

test('partner link added when child has two parents', async () => {
  const driver = await buildHeadlessFirefoxDriver();

  try {
    const fileUrl = getDistFileUrl();
    await driver.get(fileUrl);

    const canvas = await driver.findElement(By.id('pedigreeCanvas'));

    // Add first male
    await driver.findElement(By.id('addMaleBtn')).click();
    await driver.actions().move({origin: canvas, x: 100, y: 100}).click().perform();

    // Add female
    await driver.findElement(By.id('addFemaleBtn')).click();
    await driver.actions().move({origin: canvas, x: 200, y: 100}).click().perform();

    // Add second male
    await driver.findElement(By.id('addMaleBtn')).click();
    await driver.actions().move({origin: canvas, x: 150, y: 200}).click().perform();

    // male1 parent of male2
    await driver.findElement(By.id('addRelationBtn')).click();
    await driver.actions().move({origin: canvas, x: 100, y: 100}).click().perform();
    await driver.actions().move({origin: canvas, x: 150, y: 200}).click().perform();
    await driver.wait(until.elementLocated(By.id('rel-parent')), 5000);
    await driver.findElement(By.id('rel-parent')).click();

    // female parent of male2
    await driver.actions().move({origin: canvas, x: 200, y: 100}).click().perform();
    await driver.actions().move({origin: canvas, x: 150, y: 200}).click().perform();
    await driver.wait(until.elementLocated(By.id('rel-parent')), 5000);
    await driver.findElement(By.id('rel-parent')).click();

    const partnerId = await driver.executeScript(
      'return window.pedigreeChart.individuals[0].partner && window.pedigreeChart.individuals[0].partner.id;'
    );
    expect(partnerId).toBe(2);
  } finally {
    await driver.quit();
  }
});
