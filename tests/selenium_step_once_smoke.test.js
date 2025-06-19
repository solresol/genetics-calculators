import { jest } from '@jest/globals';
import { Builder, By } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import { spawnSync } from 'child_process';
import path from 'path';

jest.setTimeout(30000);

test('step node updates genotype table', async () => {
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

    const fileInput = await driver.findElement(By.id('loadFileInput'));
    const scenarioPath = path.resolve('scenarios/hypothetical_child_with_afflicted_sibling.json');
    await fileInput.sendKeys(scenarioPath);
    await driver.sleep(500);

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
