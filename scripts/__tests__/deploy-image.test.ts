import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const revision = 'a'.repeat(40);
const digest = `registry.example/pricetoken@sha256:${'b'.repeat(64)}`;
const oldImage = `sha256:${'c'.repeat(64)}`;
const newImage = `sha256:${'d'.repeat(64)}`;
let directory: string;

function executable(name: string, source: string) {
  writeFileSync(path.join(directory, 'bin', name), source, { mode: 0o755 });
}

beforeEach(() => {
  directory = mkdtempSync(path.join(tmpdir(), 'pricetoken-deploy-'));
  mkdirSync(path.join(directory, 'bin'));
  writeFileSync(path.join(directory, '.env'), 'PORT=3001\n');
  executable('flock', '#!/bin/sh\nexit 0\n');
  executable('sleep', '#!/bin/sh\nexit 0\n');
  executable(
    'curl',
    `#!/usr/bin/env node
process.stdout.write(JSON.stringify({status:'ok',database:'connected',redis:'connected'}));
`
  );
  executable(
    'docker',
    `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
const command = args.join(' ');
fs.appendFileSync(process.env.OPERATIONS, JSON.stringify(args)+'\\n');
const state = process.env.OPERATIONS + '.image';
if (command === 'inspect --format {{.Image}} pricetoken-web-1') {
  process.stdout.write(fs.existsSync(state) ? fs.readFileSync(state, 'utf8') : '${oldImage}');
} else if (command === 'inspect pricetoken-web-1') {
  process.stdout.write(JSON.stringify([{Config:{Env:['PORT=3001']},Mounts:[],HostConfig:{PortBindings:{}}}]));
} else if (command.includes('pg_database_size')) process.stdout.write('1024');
else if (command.startsWith('image inspect')) {
  process.stdout.write(command.includes('revision') ? '${revision}' : command.includes('Architecture') ? 'amd64' : '${newImage}');
} else if (command.includes('config --format json')) {
  process.stdout.write(JSON.stringify({services:{web:{environment:{PORT:process.env.SETTINGS_CHANGE ? '3002' : '3001'},ports:process.env.PORT_CHANGE ? [{target:3001,published:'3002',host_ip:'127.0.0.1'}] : []}}}));
} else if (command.includes('schema.prisma') && !command.includes('db push')) {
  process.stdout.write(command.startsWith('run ') && process.env.SCHEMA_CHANGE ? 'new schema' : 'same schema');
} else if (command.includes('pg_dump')) process.stdout.write('backup');
else if (command.startsWith('container inspect')) process.exit(1);
else if (command.includes(' up ')) {
  const override = args.filter((value) => value.endsWith('/image.json'))[0];
  const image = JSON.parse(fs.readFileSync(override)).services.web.image;
  fs.writeFileSync(state, image.startsWith('sha256:') ? image : '${newImage}');
} else if (command.includes('runtime-tools/scripts/seed.cjs') && process.env.SEED_FAILURE) process.exit(1);
`
  );
  writeFileSync(
    path.join(directory, 'checker.py'),
    `import os, sys
with open(os.environ['OPERATIONS'], 'a') as output:
    output.write('CHECK ' + sys.argv[1] + '\\n')
sys.exit(1 if os.environ.get('FAIL_PHASE') == sys.argv[1] else 0)
`
  );
});

afterEach(() => rmSync(directory, { recursive: true, force: true }));

function deploy(extra: Record<string, string> = {}, expanded = '1000') {
  const result = spawnSync(
    'bash',
    [
      path.resolve('scripts/deploy-image.sh'),
      directory,
      revision,
      digest,
      expanded,
      '500',
      'https://example.test/health',
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${path.join(directory, 'bin')}:${process.env.PATH}`,
        OPERATIONS: path.join(directory, 'operations'),
        PRODUCTION_CAPACITY_CHECKER: path.join(directory, 'checker.py'),
        PRODUCTION_DEPLOY_LOCK_FILE: path.join(directory, 'lock'),
        PRODUCTION_IMAGE_RETENTION_DIR: path.join(directory, 'retention'),
        ...extra,
      },
    }
  );
  const operations = (() => {
    try {
      return readFileSync(path.join(directory, 'operations'), 'utf8');
    } catch {
      return '';
    }
  })();
  return { ...result, operations };
}

describe('immutable image deployment', () => {
  it('rejects unknown image size before contacting Docker', () => {
    const result = deploy({}, '0');
    expect(result.status).not.toBe(0);
    expect(result.operations).toBe('');
  });

  it('leaves the running stack unchanged when import capacity is insufficient', () => {
    const result = deploy({ FAIL_PHASE: 'before-import' });
    expect(result.status).not.toBe(0);
    expect(result.operations).not.toContain('"pull"');
    expect(result.operations).not.toContain('"up"');
  });

  it('stops after a pull consumes the reserved capacity', () => {
    const result = deploy({ FAIL_PHASE: 'before-switch' });
    expect(result.status).not.toBe(0);
    expect(result.operations).toContain('"pull"');
    expect(result.operations).not.toContain('pg_dump');
    expect(result.operations).not.toContain('"up"');
  });

  it('rejects unreviewed schema changes before migrations or replacement', () => {
    const result = deploy({ SCHEMA_CHANGE: '1' });
    expect(result.status).not.toBe(0);
    expect(result.operations).not.toContain('"push"');
    expect(result.operations).not.toContain('"up"');
  });

  it('rejects changed runtime credentials or settings before mutation', () => {
    const result = deploy({ SETTINGS_CHANGE: '1' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Runtime settings differ');
    expect(result.operations).not.toContain('pg_dump');
  });

  it('preserves a backup and both image identities on successful deployment', () => {
    const result = deploy();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain(`Deployed ${revision}`);
    expect(result.operations.indexOf('pg_restore')).toBeLessThan(
      result.operations.indexOf('"push"')
    );
    expect(
      JSON.parse(readFileSync(path.join(directory, 'retention/pricetoken.json'), 'utf8'))
    ).toEqual({ protected_images: [oldImage, newImage] });
  });

  it('rejects changed published ports before replacing the application', () => {
    const result = deploy({ PORT_CHANGE: '1' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Runtime mounts or ports differ');
    expect(result.operations).not.toContain('"up"');
  });

  it('restores the previous image and retains the database when seeding fails', () => {
    const result = deploy({ SEED_FAILURE: '1' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('previous image verified healthy');
    expect(readFileSync(path.join(directory, 'operations.image'), 'utf8')).toBe(oldImage);
    expect(result.operations).not.toContain('"prune"');
  });
});
