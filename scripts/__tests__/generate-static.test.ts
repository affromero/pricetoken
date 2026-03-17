import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const SCRIPT = join(__dirname, '..', 'generate-static.ts');

function runGenerator(args: string = '', env: Record<string, string> = {}): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(`npx tsx ${SCRIPT} ${args}`, {
      cwd: join(__dirname, '../..'),
      encoding: 'utf-8',
      env: { ...process.env, ...env },
      timeout: 30000,
    });
    return { stdout, exitCode: 0 };
  } catch (err) {
    const error = err as { stdout?: string; stderr?: string; status?: number };
    return { stdout: (error.stdout ?? '') + (error.stderr ?? ''), exitCode: error.status ?? 1 };
  }
}

describe('generate-static', () => {
  it('generates all 14 static files from registry YAML', () => {
    const result = runGenerator();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('text: 46 models');
    expect(result.stdout).toContain('tts: 64 models');
    expect(result.stdout).toContain('stt: 73 models');
    expect(result.stdout).toContain('avatar: 18 models');
    expect(result.stdout).toContain('image: 49 models');
    expect(result.stdout).toContain('video: 49 models');
    expect(result.stdout).toContain('music: 7 models');
  });

  it('--check passes when files are in sync', () => {
    // First generate, then check
    runGenerator();
    const result = runGenerator('--check');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('All static files match registry YAML');
  });

  it('--check fails when files differ', () => {
    // Generate files
    runGenerator();

    // Tamper with a generated file
    const tsPath = join(__dirname, '../../packages/sdk/src/static.ts');
    const original = readFileSync(tsPath, 'utf-8');
    writeFileSync(tsPath, original + '\n// tampered', 'utf-8');

    const result = runGenerator('--check');
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('MISMATCH');

    // Restore
    writeFileSync(tsPath, original, 'utf-8');
  });

  it('generated TS files contain DO NOT EDIT header', () => {
    runGenerator();
    const tsPath = join(__dirname, '../../packages/sdk/src/static.ts');
    const content = readFileSync(tsPath, 'utf-8');
    expect(content.startsWith('// DO NOT EDIT')).toBe(true);
  });

  it('generated Python files contain DO NOT EDIT header', () => {
    runGenerator();
    const pyPath = join(__dirname, '../../packages/sdk-python/src/pricetoken/static.py');
    const content = readFileSync(pyPath, 'utf-8');
    expect(content.startsWith('# DO NOT EDIT')).toBe(true);
  });

  it('generated files do not contain pricingUrl or fallbackUrls', () => {
    runGenerator();

    const tsFiles = ['static.ts', 'tts-static.ts', 'stt-static.ts', 'avatar-static.ts', 'static-image.ts', 'video-static.ts', 'music-static.ts'];
    for (const file of tsFiles) {
      const content = readFileSync(join(__dirname, '../../packages/sdk/src', file), 'utf-8');
      expect(content).not.toContain('pricingUrl');
      expect(content).not.toContain('fallbackUrls');
    }
  });

  it('output is deterministic (no timestamps)', () => {
    runGenerator();
    const first = readFileSync(join(__dirname, '../../packages/sdk/src/static.ts'), 'utf-8');

    runGenerator();
    const second = readFileSync(join(__dirname, '../../packages/sdk/src/static.ts'), 'utf-8');

    expect(first).toBe(second);
  });
});

describe('generate-static validation', () => {
  const registryDir = join(__dirname, '../../registry');
  let originalTextYaml: string;

  beforeEach(() => {
    originalTextYaml = readFileSync(join(registryDir, 'text.yaml'), 'utf-8');
  });

  afterEach(() => {
    writeFileSync(join(registryDir, 'text.yaml'), originalTextYaml, 'utf-8');
  });

  it('rejects YAML with missing required fields', () => {
    writeFileSync(join(registryDir, 'text.yaml'), `models:
  - modelId: test-model
    provider: test
`, 'utf-8');

    const result = runGenerator();
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('displayName is required');
  });

  it('rejects duplicate modelId within a modality', () => {
    writeFileSync(join(registryDir, 'text.yaml'), `models:
  - modelId: dupe-model
    provider: test
    displayName: Dupe 1
    inputPerMTok: 1
    outputPerMTok: 2
  - modelId: dupe-model
    provider: test
    displayName: Dupe 2
    inputPerMTok: 1
    outputPerMTok: 2
`, 'utf-8');

    const result = runGenerator();
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('duplicate modelId "dupe-model"');
  });

  it('rejects invalid modelId format', () => {
    writeFileSync(join(registryDir, 'text.yaml'), `models:
  - modelId: UPPER-CASE
    provider: test
    displayName: Test
    inputPerMTok: 1
    outputPerMTok: 2
`, 'utf-8');

    const result = runGenerator();
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('must be lowercase');
  });
});
