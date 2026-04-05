import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { loadDotEnvFile } from '../../../src/config/env-file';

const originalCwd = process.cwd();

afterEach(() => {
  process.chdir(originalCwd);
});

describe('loadDotEnvFile', () => {
  it('reads simple key-value pairs from .env', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'notion2googlecalendar-env-'));
    writeFileSync(
      join(tempDir, '.env'),
      [
        'NOTION_TOKEN=secret_123',
        'GOOGLE_CALENDAR_ID=test@group.calendar.google.com',
        'TIMEZONE=Asia/Seoul',
      ].join('\n'),
    );

    process.chdir(tempDir);

    expect(loadDotEnvFile()).toEqual({
      NOTION_TOKEN: 'secret_123',
      GOOGLE_CALENDAR_ID: 'test@group.calendar.google.com',
      TIMEZONE: 'Asia/Seoul',
    });
  });

  it('ignores comments and strips wrapping quotes', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'notion2googlecalendar-env-'));
    writeFileSync(
      join(tempDir, '.env'),
      [
        '# comment',
        'NOTION_DATABASE_ID="database-id"',
        "GOOGLE_OAUTH_CREDENTIALS_PATH='credentials/client.json'",
      ].join('\n'),
    );

    process.chdir(tempDir);

    expect(loadDotEnvFile()).toEqual({
      NOTION_DATABASE_ID: 'database-id',
      GOOGLE_OAUTH_CREDENTIALS_PATH: 'credentials/client.json',
    });
  });
});
