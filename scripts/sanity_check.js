import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sanityCheckPedigreeObject } from '../src/io.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scenariosDir = path.join(__dirname, '..', 'scenarios');

for (const file of fs.readdirSync(scenariosDir)) {
  if (!file.endsWith('.json')) continue;
  const filePath = path.join(scenariosDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  try {
    sanityCheckPedigreeObject(data);
    console.log(`✓ ${file}`);
  } catch (err) {
    console.error(`Sanity check failed for ${file}: ${err.message}`);
    process.exit(1);
  }
}
console.log('All scenario files passed sanity check');
