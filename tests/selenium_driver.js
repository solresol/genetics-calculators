import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Builder } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

function isExecutable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function toBinaryPath(value) {
  if (!value) return null;
  if (value.endsWith('/geckodriver') || value.endsWith(path.sep + 'geckodriver')) {
    return value;
  }
  return path.join(value, 'geckodriver');
}

function assertSupportsWebSocketPort(binaryPath) {
  const result = spawnSync(binaryPath, ['--help'], { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    throw new Error(`Failed to execute geckodriver at ${binaryPath}`);
  }
  if (!result.stdout.includes('--websocket-port')) {
    const version = spawnSync(binaryPath, ['--version'], { encoding: 'utf8' });
    const versionLine = version.stdout.split('\n')[0].trim();
    throw new Error(
      `Incompatible geckodriver at ${binaryPath}${versionLine ? ` (${versionLine})` : ''}. ` +
      'This Selenium version requires geckodriver support for --websocket-port.'
    );
  }
}

export function resolveGeckodriverPath() {
  const explicitEnv = [process.env.GECKODRIVER, process.env.GECKOWEBDRIVER]
    .map(toBinaryPath)
    .filter(Boolean);
  for (const candidate of explicitEnv) {
    if (isExecutable(candidate)) {
      assertSupportsWebSocketPort(candidate);
      return candidate;
    }
  }

  const candidates = [
    '/opt/local/bin/geckodriver',
    '/usr/local/bin/geckodriver'
  ];
  for (const candidate of candidates) {
    if (isExecutable(candidate)) {
      assertSupportsWebSocketPort(candidate);
      return candidate;
    }
  }

  throw new Error(
    'geckodriver not found. Set GECKODRIVER (binary path) or GECKOWEBDRIVER (directory), ' +
    'or install geckodriver into /opt/local/bin or /usr/local/bin.'
  );
}

export async function buildHeadlessFirefoxDriver() {
  const options = new firefox.Options();
  options.addArguments('-headless');
  const service = new firefox.ServiceBuilder(resolveGeckodriverPath());
  return new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .setFirefoxService(service)
    .build();
}
