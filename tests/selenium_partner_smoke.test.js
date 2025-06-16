import { jest } from '@jest/globals';
import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import { spawnSync } from 'child_process';
import path from 'path';

jest.setTimeout(30000);

test('partner link added when child has two parents', async () => {
  const build = spawnSync('node', ['build.js']);
  expect(build.status).toBe(0);

  const options = new firefox.Options();
  options.addArguments('-headless');
  const service = new firefox.ServiceBuilder('/usr/local/bin/geckodriver');
  const driver = await new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .setFirefoxService(service)
    .build();

  try {
    const fileUrl = 'file://' + path.resolve('dist/pedigree_analyzer.html');
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
