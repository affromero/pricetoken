import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sdkRequire = createRequire(path.resolve('packages/sdk/package.json'));
const { build } = sdkRequire('tsup');
const { nodeFileTrace } = require('next/dist/compiled/@vercel/nft');
const root = process.cwd();
const output = path.join(root, '.next/runtime-tools');
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });

// Seeds import only static pricing data and Prisma. Bundle their TypeScript at
// build time so deployments never download a launcher or compiler.
const seeds = ['seed', 'seed-video', 'seed-avatar', 'seed-tts', 'seed-stt', 'seed-music'];
await build({
  entry: seeds.map((name) => `scripts/${name}.ts`),
  outDir: path.join(output, 'scripts'),
  format: ['cjs'],
  outExtension: () => ({ js: '.cjs' }),
  platform: 'node',
  target: 'node22',
  bundle: true,
  splitting: false,
  external: ['@prisma/client'],
  dts: false,
  sourcemap: false,
});

const entries = [require.resolve('prisma/build/index.js'), require.resolve('@prisma/client')];
const { fileList } = await nodeFileTrace(entries, { base: root, processCwd: root });
for (const relative of fileList) {
  const source = path.resolve(root, relative);
  if (!source.startsWith(`${root}${path.sep}`))
    throw new Error('Runtime trace escaped the build root');
  if (!(await fs.stat(source)).isFile()) continue;
  const destination = path.join(output, relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(source, destination);
}
// Prisma selects platform engines dynamically. Keep the engines installed from
// the lockfile and the client generated for this image's Linux architecture.
for (const relative of ['node_modules/@prisma/engines', 'node_modules/.prisma/client']) {
  await fs.cp(path.join(root, relative), path.join(output, relative), { recursive: true });
}
