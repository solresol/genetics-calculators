import { spawnSync } from 'child_process';
import path from 'path';

const isCi = process.env.CI === 'true';

export const SELENIUM_TIMEOUT_MS = isCi ? 90000 : 30000;
export const SCENARIO_LOAD_TIMEOUT_MS = isCi ? 20000 : 7000;
export const OPTIMIZATION_TIMEOUT_MS = isCi ? 40000 : 15000;

let distBuilt = false;

export function ensureBundleBuilt() {
  if (distBuilt) return;

  const build = spawnSync('node', ['build.js'], { encoding: 'utf8' });
  if (build.status !== 0) {
    throw new Error(
      `build.js failed with status ${build.status}\n${build.stdout || ''}\n${build.stderr || ''}`
    );
  }
  distBuilt = true;
}

export function getDistFileUrl() {
  return 'file://' + path.resolve('dist/pedigree_analyzer.html');
}

export async function waitForIndividuals(driver, minCount = 1, timeout = SCENARIO_LOAD_TIMEOUT_MS) {
  await driver.wait(async () => {
    const count = await driver.executeScript(
      'return (window.pedigreeChart && window.pedigreeChart.individuals && window.pedigreeChart.individuals.length) || 0;'
    );
    return count >= minCount;
  }, timeout);
}
