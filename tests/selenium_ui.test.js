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
  const service = new firefox.ServiceBuilder('/usr/local/bin/geckodriver');
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
