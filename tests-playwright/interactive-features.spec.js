import { test, expect } from '@playwright/test';
import { spawnSync } from 'child_process';

test.describe('Interactive Features', () => {
  test.beforeAll(() => {
    const build = spawnSync('node', ['build.js']);
    if (build.status !== 0) {
      throw new Error('Build failed');
    }
  });

  test('can add a male individual', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Click "Add Male" button
    await page.locator('#addMaleBtn').click();

    // Click on canvas to add individual
    const canvas = page.locator('#pedigreeCanvas');
    await canvas.click({ position: { x: 200, y: 200 } });
    await page.waitForTimeout(200);

    // Verify individual was added
    const count = await page.evaluate(() => window.pedigreeChart.individuals.length);
    expect(count).toBe(1);

    // Verify gender
    const gender = await page.evaluate(() => window.pedigreeChart.individuals[0].gender);
    expect(gender).toBe('M');
  });

  test('can add a female individual', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Click "Add Female" button
    await page.locator('#addFemaleBtn').click();

    // Click on canvas to add individual
    const canvas = page.locator('#pedigreeCanvas');
    await canvas.click({ position: { x: 300, y: 200 } });
    await page.waitForTimeout(200);

    // Verify individual was added
    const count = await page.evaluate(() => window.pedigreeChart.individuals.length);
    expect(count).toBe(1);

    // Verify gender
    const gender = await page.evaluate(() => window.pedigreeChart.individuals[0].gender);
    expect(gender).toBe('F');
  });

  test('can select an individual by clicking', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load a scenario
    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    // Switch to select mode
    await page.locator('#selectBtn').click();

    // Get position of first individual
    const position = await page.evaluate(() => {
      const ind = window.pedigreeChart.individuals[0];
      return { x: ind.x, y: ind.y };
    });

    // Click on the individual
    const canvas = page.locator('#pedigreeCanvas');
    await canvas.click({ position });
    await page.waitForTimeout(200);

    // Verify selection
    const isSelected = await page.evaluate(() => window.pedigreeChart.selectedIndividual !== null);
    expect(isSelected).toBe(true);

    // Info panel should show individual details
    const infoPanelVisible = await page.locator('#infoPanel').isVisible();
    expect(infoPanelVisible).toBe(true);
  });

  test('right-click toggles affected status', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load a scenario
    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    // Find an unaffected individual
    const unaffectedPos = await page.evaluate(() => {
      const ind = window.pedigreeChart.individuals.find(i => !i.affected && !i.hypothetical);
      return ind ? { x: ind.x, y: ind.y, id: ind.id } : null;
    });

    if (unaffectedPos) {
      // Right-click on the individual
      const canvas = page.locator('#pedigreeCanvas');
      await canvas.click({ button: 'right', position: { x: unaffectedPos.x, y: unaffectedPos.y } });
      await page.waitForTimeout(300);

      // Check if affected status changed
      const isAffected = await page.evaluate((id) => {
        const ind = window.pedigreeChart.individuals.find(i => i.id === id);
        return ind?.affected;
      }, unaffectedPos.id);

      expect(isAffected).toBe(true);
    }
  });

  test('can drag and drop individual', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load a scenario
    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    // Switch to select mode
    await page.locator('#selectBtn').click();

    // Get initial position
    const initialPos = await page.evaluate(() => {
      const ind = window.pedigreeChart.individuals[0];
      return { x: ind.x, y: ind.y, id: ind.id };
    });

    // Drag individual to new position
    const canvas = page.locator('#pedigreeCanvas');
    await canvas.hover({ position: { x: initialPos.x, y: initialPos.y } });
    await page.mouse.down();
    await page.mouse.move(initialPos.x + 100, initialPos.y + 50);
    await page.mouse.up();
    await page.waitForTimeout(200);

    // Check new position
    const newPos = await page.evaluate((id) => {
      const ind = window.pedigreeChart.individuals.find(i => i.id === id);
      return { x: ind.x, y: ind.y };
    }, initialPos.id);

    // Position should have changed
    expect(newPos.x).not.toBe(initialPos.x);
    expect(newPos.y).not.toBe(initialPos.y);
  });

  test('can clear all individuals', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load a scenario
    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    // Verify individuals were loaded
    let count = await page.evaluate(() => window.pedigreeChart.individuals.length);
    expect(count).toBeGreaterThan(0);

    // Click clear button
    await page.locator('#clearBtn').click();
    await page.waitForTimeout(200);

    // Verify all cleared
    count = await page.evaluate(() => window.pedigreeChart.individuals.length);
    expect(count).toBe(0);
  });

  test('delete mode removes individuals', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load a scenario
    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    const initialCount = await page.evaluate(() => window.pedigreeChart.individuals.length);

    // Switch to delete mode
    await page.locator('#deleteBtn').click();

    // Get position of an individual
    const position = await page.evaluate(() => {
      const ind = window.pedigreeChart.individuals[0];
      return { x: ind.x, y: ind.y };
    });

    // Click on individual to delete
    const canvas = page.locator('#pedigreeCanvas');
    await canvas.click({ position });
    await page.waitForTimeout(200);

    // Verify individual was deleted
    const newCount = await page.evaluate(() => window.pedigreeChart.individuals.length);
    expect(newCount).toBe(initialCount - 1);
  });

  test('mode buttons change active state', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Click Add Male button
    await page.locator('#addMaleBtn').click();
    let mode = await page.evaluate(() => window.pedigreeChart.mode);
    expect(mode).toBe('addMale');

    // Click Add Female button
    await page.locator('#addFemaleBtn').click();
    mode = await page.evaluate(() => window.pedigreeChart.mode);
    expect(mode).toBe('addFemale');

    // Click Select button
    await page.locator('#selectBtn').click();
    mode = await page.evaluate(() => window.pedigreeChart.mode);
    expect(mode).toBe('select');

    // Click Delete button
    await page.locator('#deleteBtn').click();
    mode = await page.evaluate(() => window.pedigreeChart.mode);
    expect(mode).toBe('delete');
  });

  test('info panel updates when individual selected', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Load a scenario
    await page.locator('#exampleSelect').selectOption('Hypothetical Child with Afflicted Sibling');
    await page.waitForTimeout(500);

    // Switch to select mode
    await page.locator('#selectBtn').click();

    // Get an individual's position and ID
    const individualInfo = await page.evaluate(() => {
      const ind = window.pedigreeChart.individuals[0];
      return { x: ind.x, y: ind.y, id: ind.id, gender: ind.gender };
    });

    // Click on the individual
    const canvas = page.locator('#pedigreeCanvas');
    await canvas.click({ position: { x: individualInfo.x, y: individualInfo.y } });
    await page.waitForTimeout(200);

    // Check info panel content
    const infoText = await page.locator('#infoPanel').textContent();
    expect(infoText).toContain('ID: ' + individualInfo.id);
    expect(infoText).toContain('Gender: ' + individualInfo.gender);
  });

  test('can change race for selected individual', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/dist/pedigree_analyzer.html');

    // Add a male individual
    await page.locator('#addMaleBtn').click();
    const canvas = page.locator('#pedigreeCanvas');
    await canvas.click({ position: { x: 200, y: 200 } });
    await page.waitForTimeout(200);

    // Select the individual
    await page.locator('#selectBtn').click();
    await canvas.click({ position: { x: 200, y: 200 } });
    await page.waitForTimeout(200);

    // Find and change race selector
    const raceSelect = page.locator('#raceSelect');
    await raceSelect.selectOption('european_ancestry');
    await page.waitForTimeout(200);

    // Verify race was updated
    const race = await page.evaluate(() => window.pedigreeChart.selectedIndividual.race);
    expect(race).toBe('european_ancestry');
  });
});
