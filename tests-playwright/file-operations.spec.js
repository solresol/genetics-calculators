import { test, expect } from '@playwright/test';
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';

test.describe('File Operations', () => {
  test.beforeAll(() => {
    const build = spawnSync('node', ['build.js']);
    if (build.status !== 0) {
      throw new Error('Build failed');
    }
  });

  test('can load scenario from file', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load file
    const fileInput = page.locator('#loadFileInput');
    const scenarioPath = path.resolve('scenarios/hypothetical_child_with_afflicted_sibling.json');
    await fileInput.setInputFiles(scenarioPath);
    await page.waitForTimeout(500);

    // Verify individuals loaded
    const count = await page.evaluate(() => window.pedigreeChart.individuals.length);
    expect(count).toBe(4);
  });

  test('loaded scenario preserves coordinates', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    const fileInput = page.locator('#loadFileInput');
    const scenarioPath = path.resolve('scenarios/hypothetical_child_with_afflicted_sibling.json');
    await fileInput.setInputFiles(scenarioPath);
    await page.waitForTimeout(500);

    // Check coordinates of individual with ID 1
    const coords = await page.evaluate(() => {
      const ind = window.pedigreeChart.individuals.find(i => i.id === 1);
      return ind ? { x: ind.x, y: ind.y } : null;
    });

    expect(coords.x).toBe(100);
    expect(coords.y).toBe(100);
  });

  test('save produces valid JSON', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load a scenario
    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    // Trigger save (this creates a download)
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#saveBtn').click();
    const download = await downloadPromise;

    // Save to temp file
    const tempPath = path.join(process.cwd(), 'temp-save-test.json');
    await download.saveAs(tempPath);

    // Verify file is valid JSON
    const content = fs.readFileSync(tempPath, 'utf8');
    const data = JSON.parse(content); // Should not throw

    // Verify structure
    expect(data).toHaveProperty('condition');
    expect(data).toHaveProperty('individuals');
    expect(Array.isArray(data.individuals)).toBe(true);
    expect(data.individuals.length).toBe(4);

    // Clean up
    fs.unlinkSync(tempPath);
  });

  test('save-load roundtrip preserves data', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load a scenario
    await page.locator('#exampleSelect').selectOption('SMA - Two Affected Siblings');
    await page.waitForTimeout(500);

    // Get original data
    const originalData = await page.evaluate(() => {
      return {
        condition: window.pedigreeChart.condition,
        individualCount: window.pedigreeChart.individuals.length,
        affectedCount: window.pedigreeChart.individuals.filter(i => i.affected).length,
        hypotheticalCount: window.pedigreeChart.individuals.filter(i => i.hypothetical).length
      };
    });

    // Save
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#saveBtn').click();
    const download = await downloadPromise;
    const tempPath = path.join(process.cwd(), 'temp-roundtrip.json');
    await download.saveAs(tempPath);

    // Clear
    await page.locator('#clearBtn').click();
    await page.waitForTimeout(200);

    // Reload
    const fileInput = page.locator('#loadFileInput');
    await fileInput.setInputFiles(tempPath);
    await page.waitForTimeout(500);

    // Get reloaded data
    const reloadedData = await page.evaluate(() => {
      return {
        condition: window.pedigreeChart.condition,
        individualCount: window.pedigreeChart.individuals.length,
        affectedCount: window.pedigreeChart.individuals.filter(i => i.affected).length,
        hypotheticalCount: window.pedigreeChart.individuals.filter(i => i.hypothetical).length
      };
    });

    // Verify data matches
    expect(reloadedData).toEqual(originalData);

    // Clean up
    fs.unlinkSync(tempPath);
  });

  test('save preserves modified coordinates', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load a scenario
    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    // Move an individual
    await page.locator('#selectBtn').click();
    const canvas = page.locator('#pedigreeCanvas');
    const initialPos = await page.evaluate(() => {
      const ind = window.pedigreeChart.individuals[0];
      return { x: ind.x, y: ind.y, id: ind.id };
    });

    await canvas.hover({ position: { x: initialPos.x, y: initialPos.y } });
    await page.mouse.down();
    await page.mouse.move(initialPos.x + 100, initialPos.y + 50);
    await page.mouse.up();
    await page.waitForTimeout(200);

    // Get new coordinates
    const newPos = await page.evaluate((id) => {
      const ind = window.pedigreeChart.individuals.find(i => i.id === id);
      return { x: ind.x, y: ind.y };
    }, initialPos.id);

    // Save
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#saveBtn').click();
    const download = await downloadPromise;
    const tempPath = path.join(process.cwd(), 'temp-coords.json');
    await download.saveAs(tempPath);

    // Clear and reload
    await page.locator('#clearBtn').click();
    await page.waitForTimeout(200);
    const fileInput = page.locator('#loadFileInput');
    await fileInput.setInputFiles(tempPath);
    await page.waitForTimeout(500);

    // Check coordinates were preserved
    const loadedPos = await page.evaluate((id) => {
      const ind = window.pedigreeChart.individuals.find(i => i.id === id);
      return { x: ind.x, y: ind.y };
    }, initialPos.id);

    expect(loadedPos.x).toBe(newPos.x);
    expect(loadedPos.y).toBe(newPos.y);

    // Clean up
    fs.unlinkSync(tempPath);
  });

  test('example dropdown loads all predefined scenarios', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    const select = page.locator('#exampleSelect');
    const options = await select.locator('option').allTextContents();

    // Should have multiple scenarios
    expect(options.length).toBeGreaterThan(2);

    // Check for our new scenarios
    expect(options.some(o => o.includes('SMA'))).toBe(true);
    expect(options.some(o => o.includes('Tay-Sachs'))).toBe(true);
    expect(options.some(o => o.includes('PKU'))).toBe(true);
    expect(options.some(o => o.includes('Hemochromatosis'))).toBe(true);
  });

  test('loading scenario with partnerships preserves relationships', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Cousin');
    await page.waitForTimeout(500);

    // Check that partnerships were created
    const partnerships = await page.evaluate(() => {
      return window.pedigreeChart.individuals.filter(i =>
        i.is_sexual_partner_of && i.is_sexual_partner_of.length > 0
      ).length;
    });

    expect(partnerships).toBeGreaterThan(0);
  });

  test('loading scenario sets correct condition', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load SMA scenario
    await page.locator('#exampleSelect').selectOption('SMA - Two Affected Siblings');
    await page.waitForTimeout(500);

    const condition = await page.locator('#conditionSelect').inputValue();
    expect(condition).toBe('sma');

    // Load PKU scenario
    await page.locator('#exampleSelect').selectOption('PKU - Three Generations');
    await page.waitForTimeout(500);

    const newCondition = await page.locator('#conditionSelect').inputValue();
    expect(newCondition).toBe('pku');
  });
});
