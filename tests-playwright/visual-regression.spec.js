import { test, expect } from '@playwright/test';
import { spawnSync } from 'child_process';

test.describe('Visual Regression', () => {
  test.beforeAll(() => {
    const build = spawnSync('node', ['build.js']);
    if (build.status !== 0) {
      throw new Error('Build failed');
    }
  });

  test('canvas renders empty state correctly', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');
    await page.waitForTimeout(500);

    const canvas = page.locator('#pedigreeCanvas');
    await expect(canvas).toHaveScreenshot('empty-canvas.png');
  });

  test('CF scenario renders correctly', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(1000);

    const canvas = page.locator('#pedigreeCanvas');
    await expect(canvas).toHaveScreenshot('cf-scenario.png');
  });

  test('SMA two affected siblings renders correctly', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    await page.locator('#exampleSelect').selectOption('SMA - Two Affected Siblings');
    await page.waitForTimeout(1000);

    const canvas = page.locator('#pedigreeCanvas');
    await expect(canvas).toHaveScreenshot('sma-two-affected.png');
  });

  test('PKU three generations renders correctly', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    await page.locator('#exampleSelect').selectOption('PKU - Three Generations');
    await page.waitForTimeout(1000);

    const canvas = page.locator('#pedigreeCanvas');
    await expect(canvas).toHaveScreenshot('pku-three-generations.png');
  });

  test('Hemochromatosis complex family renders correctly', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    await page.locator('#exampleSelect').selectOption('Hemochromatosis - Complex Family');
    await page.waitForTimeout(1000);

    const canvas = page.locator('#pedigreeCanvas');
    await expect(canvas).toHaveScreenshot('hemo-complex.png');
  });

  test('selected individual highlights correctly', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    // Select an individual
    await page.locator('#selectBtn').click();
    const position = await page.evaluate(() => {
      const ind = window.pedigreeChart.individuals[0];
      return { x: ind.x, y: ind.y };
    });
    await page.locator('#pedigreeCanvas').click({ position });
    await page.waitForTimeout(300);

    const canvas = page.locator('#pedigreeCanvas');
    await expect(canvas).toHaveScreenshot('selected-individual.png');
  });

  test('affected individual displays in red', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    await page.locator('#exampleSelect').selectOption('PKU - Simple Carrier Risk');
    await page.waitForTimeout(1000);

    const canvas = page.locator('#pedigreeCanvas');
    await expect(canvas).toHaveScreenshot('affected-individual-red.png');
  });

  test('hypothetical individual displays with dashed border', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(1000);

    const canvas = page.locator('#pedigreeCanvas');
    await expect(canvas).toHaveScreenshot('hypothetical-dashed.png');
  });

  test('full page screenshot - initial state', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('full-page-initial.png', { fullPage: true });
  });

  test('full page screenshot - with loaded scenario', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    await page.locator('#exampleSelect').selectOption('PKU - Three Generations');
    await page.waitForTimeout(1000);

    // Select an individual to show info panel
    await page.locator('#selectBtn').click();
    const position = await page.evaluate(() => {
      const ind = window.pedigreeChart.individuals[0];
      return { x: ind.x, y: ind.y };
    });
    await page.locator('#pedigreeCanvas').click({ position });
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('full-page-with-scenario.png', { fullPage: true });
  });

  test('info panel displays correctly', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    // Select an individual
    await page.locator('#selectBtn').click();
    const position = await page.evaluate(() => {
      const ind = window.pedigreeChart.individuals.find(i => !i.hypothetical && !i.affected);
      return ind ? { x: ind.x, y: ind.y } : null;
    });

    if (position) {
      await page.locator('#pedigreeCanvas').click({ position });
      await page.waitForTimeout(500);

      const infoPanel = page.locator('#infoPanel');
      await expect(infoPanel).toHaveScreenshot('info-panel.png');
    }
  });

  test('frequency table displays correctly for different conditions', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Test CF frequencies
    await page.locator('#conditionSelect').selectOption('cf');
    await page.waitForTimeout(300);
    let freqTable = page.locator('#frequencyTableBody');
    await expect(freqTable).toHaveScreenshot('freq-table-cf.png');

    // Test Hemochromatosis frequencies (highest)
    await page.locator('#conditionSelect').selectOption('hemo');
    await page.waitForTimeout(300);
    freqTable = page.locator('#frequencyTableBody');
    await expect(freqTable).toHaveScreenshot('freq-table-hemo.png');
  });
});
