import fs from 'fs/promises';
import { build } from 'esbuild';

async function bundle() {
  const jsResult = await build({
    entryPoints: ['script.js'],
    bundle: true,
    format: 'iife',
    minify: true,
    write: false,
  });
  const jsCode = jsResult.outputFiles[0].text;

  const html = await fs.readFile('pedigree_analyzer.html', 'utf8');
  const css = await fs.readFile('styles.css', 'utf8');

  let out = html.replace(
    '<link rel="stylesheet" href="styles.css">',
    `<style>${css}</style>`
  );
  out = out.replace(
    '<script type="module" src="script.js"></script>',
    `<script>${jsCode}</script>`
  );

  await fs.mkdir('dist', { recursive: true });
  await fs.writeFile('dist/pedigree_analyzer.html', out);
}

bundle().catch(err => {
  console.error(err);
  process.exit(1);
});
