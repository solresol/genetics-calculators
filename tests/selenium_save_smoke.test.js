import { jest } from '@jest/globals';
import { By } from 'selenium-webdriver';
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { buildHeadlessFirefoxDriver } from './selenium_driver.js';

jest.setTimeout(30000);

function normalize(obj) {
  obj.individuals.sort((a,b) => a.id - b.id);
  for (const ind of obj.individuals) {
    if (Array.isArray(ind.is_sexual_partner_of)) {
      ind.is_sexual_partner_of.sort((a,b) => a - b);
    }
  }
  return obj;
}

test('load then save yields same file', async () => {
  const build = spawnSync('node', ['build.js']);
  expect(build.status).toBe(0);

  const driver = await buildHeadlessFirefoxDriver();

  try {
    const fileUrl = 'file://' + path.resolve('dist/pedigree_analyzer.html');
    await driver.get(fileUrl);
    const fileInput = await driver.findElement(By.id('loadFileInput'));
    const scenarioPath = path.resolve('scenarios/hypothetical_child_with_afflicted_sibling.json');
    await fileInput.sendKeys(scenarioPath);
    await driver.sleep(500);

    await driver.findElement(By.id('saveFileBtn')).click();
    await driver.wait(async () => {
      const data = await driver.executeScript('return window.lastSavedData;');
      return !!data;
    }, 5000);
    const data = await driver.executeScript('return window.lastSavedData;');

    const saved = normalize(JSON.parse(data));
    const original = normalize(JSON.parse(fs.readFileSync(scenarioPath, 'utf8')));
    expect(saved).toEqual(original);
  } finally {
    await driver.quit();
  }
});

test('updated coordinates are saved', async () => {
  const build = spawnSync('node', ['build.js']);
  expect(build.status).toBe(0);

  const driver = await buildHeadlessFirefoxDriver();

  try {
    const fileUrl = 'file://' + path.resolve('dist/pedigree_analyzer.html');
    await driver.get(fileUrl);
    const fileInput = await driver.findElement(By.id('loadFileInput'));
    const scenarioPath = path.resolve('scenarios/hypothetical_child_with_afflicted_sibling.json');
    await fileInput.sendKeys(scenarioPath);
    await driver.sleep(500);

    await driver.executeScript('var ind=window.pedigreeChart.individuals.find(i=>i.id===1); ind.x=300; ind.y=400; window.pedigreeChart.draw();');
    await driver.findElement(By.id('saveFileBtn')).click();
    await driver.wait(async () => {
      const data = await driver.executeScript('return window.lastSavedData;');
      return !!data;
    }, 5000);
    const data = await driver.executeScript('return window.lastSavedData;');
    const saved = JSON.parse(data);
    const ind = saved.individuals.find(i => i.id === 1);
    expect(ind.x).toBe(300);
    expect(ind.y).toBe(400);
  } finally {
    await driver.quit();
  }
});
