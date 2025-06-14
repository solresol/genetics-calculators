import fs from 'fs';
import { spawnSync } from 'child_process';

test('build produces bundled HTML', () => {
  const result = spawnSync('node', ['build.js']);
  expect(result.status).toBe(0);

  const out = 'dist/pedigree_analyzer.html';
  expect(fs.existsSync(out)).toBe(true);
  const html = fs.readFileSync(out, 'utf8');
  expect(html).toMatch(/Genetic Pedigree Probability Analyzer/);
  expect(html).not.toMatch(/script\.js/);
  expect(html).not.toMatch(/styles\.css/);
});
