import { jest } from '@jest/globals';
import { Builder, By } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import { spawnSync } from 'child_process';
import path from 'path';

jest.setTimeout(30000);

test('pedigree analyzer page loads', async () => {
  const build = spawnSync('node', ['build.js']);
  expect(build.status).toBe(0);

  const options = new firefox.Options();
  options.addArguments('-headless');
  const geckodriverPath = process.env.GECKOWEBDRIVER
    ? path.join(process.env.GECKOWEBDRIVER, 'geckodriver')
    : '/usr/local/bin/geckodriver';
  const service = new firefox.ServiceBuilder(geckodriverPath);
  const driver = await new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .setFirefoxService(service)
    .build();

  try {
    const fileUrl = 'file://' + path.resolve('dist/pedigree_analyzer.html');
    await driver.get(fileUrl);
    const heading = await driver.findElement(By.css('h1')).getText();
    expect(heading).toBe('Genetic Pedigree Probability Analyzer');
  } finally {
    await driver.quit();
  }
});

test('scenario coordinates respected', async () => {
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
    const fileInput = await driver.findElement(By.id('loadFileInput'));
    const scenarioPath = path.resolve('scenarios/hypothetical_child_with_afflicted_sibling.json');
    await fileInput.sendKeys(scenarioPath);
    await driver.sleep(500);
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
    const fileInput = await driver.findElement(By.id('loadFileInput'));
    const scenarioPath = path.resolve('scenarios/hypothetical_child_with_afflicted_sibling.json');
    await fileInput.sendKeys(scenarioPath);
    await driver.sleep(500);

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
    expect(after).not.toEqual(before);
  } finally {
    await driver.quit();
  }
});
