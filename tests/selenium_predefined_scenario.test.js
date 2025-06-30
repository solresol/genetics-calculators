import { jest } from '@jest/globals';
import { Builder, By } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import { spawnSync } from 'child_process';
import path from 'path';

jest.setTimeout(30000);

test('predefined scenario loads from dropdown', async () => {
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
    const option = await driver.findElement(By.css('#scenarioSelect option[value="Hypothetical Child with Afflicted Sibling"]'));
    await option.click();
    await driver.findElement(By.id('loadScenarioBtn')).click();
    await driver.sleep(500);
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
