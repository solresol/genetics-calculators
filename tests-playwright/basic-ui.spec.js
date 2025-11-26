import { test, expect } from '@playwright/test';
import { spawnSync } from 'child_process';

test.describe('Basic UI', () => {
  test.beforeAll(() => {
    // Build the application before running tests
    const build = spawnSync('node', ['build.js']);
    if (build.status !== 0) {
      throw new Error('Build failed: ' + build.stderr?.toString());
    }
  });

  test('page loads with correct title', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    const heading = await page.locator('h1').textContent();
    expect(heading).toBe('Genetic Pedigree Probability Analyzer');
  });

  test('canvas is present and visible', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    const canvas = page.locator('#pedigreeCanvas');
    await expect(canvas).toBeVisible();

    // Check canvas dimensions
    const box = await canvas.boundingBox();
    expect(box?.width).toBe(800);
    expect(box?.height).toBe(600);
  });

  test('all mode buttons are present', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    await expect(page.locator('#selectBtn')).toBeVisible();
    await expect(page.locator('#addMaleBtn')).toBeVisible();
    await expect(page.locator('#addFemaleBtn')).toBeVisible();
    await expect(page.locator('#addRelationBtn')).toBeVisible();
    await expect(page.locator('#addChildBtn')).toBeVisible();
    await expect(page.locator('#deleteBtn')).toBeVisible();
  });

  test('optimization controls are present', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    await expect(page.locator('#startBtn')).toBeVisible();
    await expect(page.locator('#stepBtn')).toBeVisible();
    await expect(page.locator('#stepNodeBtn')).toBeVisible();
    await expect(page.locator('#stopBtn')).toBeVisible();
    await expect(page.locator('#resetBtn')).toBeVisible();
  });

  test('file operation buttons are present', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    await expect(page.locator('#clearBtn')).toBeVisible();
    await expect(page.locator('#loadFileInput')).toBeAttached();
    await expect(page.locator('#exampleSelect')).toBeVisible();
    await expect(page.locator('#saveBtn')).toBeVisible();
  });

  test('genetic condition selector displays all conditions', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    const conditionSelect = page.locator('#conditionSelect');
    await expect(conditionSelect).toBeVisible();

    const options = await conditionSelect.locator('option').allTextContents();
    expect(options).toContain('Cystic Fibrosis (CF)');
    expect(options).toContain('Spinal Muscular Atrophy (SMA)');
    expect(options).toContain('Tay Sachs');
    expect(options).toContain('Phenylketonuria (PKU)');
    expect(options).toContain('Hemochromatosis');
  });

  test('population frequency table is visible', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    const freqTable = page.locator('#frequencyTableBody');
    await expect(freqTable).toBeVisible();

    // Should have at least 3 rows (european_ancestry, african_american, general)
    const rows = await freqTable.locator('tr').count();
    expect(rows).toBeGreaterThanOrEqual(3);
  });

  test('status message area is present', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    await expect(page.locator('#statusMessage')).toBeAttached();
  });

  test('info panel is present', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    await expect(page.locator('#infoPanel')).toBeVisible();
  });
});
