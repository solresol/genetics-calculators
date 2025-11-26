import { test, expect } from '@playwright/test';
import { spawnSync } from 'child_process';
import path from 'path';

test.describe('Genetic Conditions', () => {
  test.beforeAll(() => {
    const build = spawnSync('node', ['build.js']);
    if (build.status !== 0) {
      throw new Error('Build failed');
    }
  });

  test('CF scenario loads and displays correctly', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load the CF scenario
    const select = page.locator('#exampleSelect');
    await select.selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    // Verify condition is set to CF
    const conditionSelect = page.locator('#conditionSelect');
    expect(await conditionSelect.inputValue()).toBe('cf');

    // Check that individuals were loaded
    const individualCount = await page.evaluate(() => window.pedigreeChart.individuals.length);
    expect(individualCount).toBe(4);
  });

  test('SMA scenario loads and displays correctly', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    const select = page.locator('#exampleSelect');
    await select.selectOption('SMA - Two Affected Siblings');
    await page.waitForTimeout(500);

    // Verify condition is set to SMA
    const conditionSelect = page.locator('#conditionSelect');
    expect(await conditionSelect.inputValue()).toBe('sma');

    // Check that individuals were loaded (5 total: 2 parents, 2 affected, 1 hypothetical)
    const individualCount = await page.evaluate(() => window.pedigreeChart.individuals.length);
    expect(individualCount).toBe(5);

    // Check that two individuals are affected
    const affectedCount = await page.evaluate(() =>
      window.pedigreeChart.individuals.filter(i => i.affected).length
    );
    expect(affectedCount).toBe(2);
  });

  test('SMA African American scenario uses correct carrier frequency', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    const select = page.locator('#exampleSelect');
    await select.selectOption('SMA - African American Family');
    await page.waitForTimeout(500);

    // Verify condition is SMA
    const conditionSelect = page.locator('#conditionSelect');
    expect(await conditionSelect.inputValue()).toBe('sma');

    // Verify individuals have african_american race
    const races = await page.evaluate(() =>
      window.pedigreeChart.individuals
        .filter(i => !i.parents || i.parents.length === 0)
        .map(i => i.race)
    );
    expect(races).toContain('african_american');

    // Check the carrier frequency in the table for african_american
    const freqCell = page.locator('#frequencyTableBody tr:has-text("african_american") input');
    const frequency = await freqCell.inputValue();
    expect(parseFloat(frequency)).toBe(0.019); // SMA carrier frequency for African Americans
  });

  test('Tay-Sachs scenario loads correctly', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    const select = page.locator('#exampleSelect');
    await select.selectOption('Tay-Sachs - European Ancestry');
    await page.waitForTimeout(500);

    // Verify condition is Tay-Sachs
    const conditionSelect = page.locator('#conditionSelect');
    expect(await conditionSelect.inputValue()).toBe('tay');

    // Verify individuals have european_ancestry race
    const races = await page.evaluate(() =>
      window.pedigreeChart.individuals
        .filter(i => !i.parents || i.parents.length === 0)
        .map(i => i.race)
    );
    expect(races).toContain('european_ancestry');

    // Check the carrier frequency for european_ancestry
    const freqCell = page.locator('#frequencyTableBody tr:has-text("european_ancestry") input');
    const frequency = await freqCell.inputValue();
    expect(parseFloat(frequency)).toBe(0.0034); // Tay-Sachs carrier frequency
  });

  test('PKU three-generation scenario loads correctly', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    const select = page.locator('#exampleSelect');
    await select.selectOption('PKU - Three Generations');
    await page.waitForTimeout(500);

    // Verify condition is PKU
    const conditionSelect = page.locator('#conditionSelect');
    expect(await conditionSelect.inputValue()).toBe('pku');

    // Check that 10 individuals were loaded
    const individualCount = await page.evaluate(() => window.pedigreeChart.individuals.length);
    expect(individualCount).toBe(10);

    // Verify one affected individual
    const affectedCount = await page.evaluate(() =>
      window.pedigreeChart.individuals.filter(i => i.affected).length
    );
    expect(affectedCount).toBe(1);

    // Verify one hypothetical individual
    const hypotheticalCount = await page.evaluate(() =>
      window.pedigreeChart.individuals.filter(i => i.hypothetical).length
    );
    expect(hypotheticalCount).toBe(1);
  });

  test('Hemochromatosis scenario loads correctly', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    const select = page.locator('#exampleSelect');
    await select.selectOption('Hemochromatosis - Complex Family');
    await page.waitForTimeout(500);

    // Verify condition is hemochromatosis
    const conditionSelect = page.locator('#conditionSelect');
    expect(await conditionSelect.inputValue()).toBe('hemo');

    // Check carrier frequency (should be higher than other conditions)
    const freqCell = page.locator('#frequencyTableBody tr:has-text("european_ancestry") input');
    const frequency = await freqCell.inputValue();
    expect(parseFloat(frequency)).toBe(0.11); // Hemochromatosis has highest carrier frequency

    // Verify 10 individuals loaded
    const individualCount = await page.evaluate(() => window.pedigreeChart.individuals.length);
    expect(individualCount).toBe(10);
  });

  test('switching genetic conditions updates carrier frequencies', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    const conditionSelect = page.locator('#conditionSelect');
    const freqCell = page.locator('#frequencyTableBody tr:has-text("general") input');

    // Check CF frequency
    await conditionSelect.selectOption('cf');
    await page.waitForTimeout(200);
    let frequency = await freqCell.inputValue();
    expect(parseFloat(frequency)).toBe(0.025);

    // Switch to SMA
    await conditionSelect.selectOption('sma');
    await page.waitForTimeout(200);
    frequency = await freqCell.inputValue();
    expect(parseFloat(frequency)).toBe(0.018);

    // Switch to Tay-Sachs
    await conditionSelect.selectOption('tay');
    await page.waitForTimeout(200);
    frequency = await freqCell.inputValue();
    expect(parseFloat(frequency)).toBe(0.002);

    // Switch to PKU
    await conditionSelect.selectOption('pku');
    await page.waitForTimeout(200);
    frequency = await freqCell.inputValue();
    expect(parseFloat(frequency)).toBe(0.015);

    // Switch to Hemochromatosis
    await conditionSelect.selectOption('hemo');
    await page.waitForTimeout(200);
    frequency = await freqCell.inputValue();
    expect(parseFloat(frequency)).toBe(0.08);
  });

  test('PKU simple carrier risk scenario', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    const select = page.locator('#exampleSelect');
    await select.selectOption('PKU - Simple Carrier Risk');
    await page.waitForTimeout(500);

    // Should have 3 individuals: 2 parents, 1 affected child
    const individualCount = await page.evaluate(() => window.pedigreeChart.individuals.length);
    expect(individualCount).toBe(3);

    // Parents should both be inferred as carriers
    const parents = await page.evaluate(() =>
      window.pedigreeChart.individuals.filter(i => !i.parents || i.parents.length === 0)
    );
    expect(parents.length).toBe(2);
  });
});
