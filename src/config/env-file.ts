import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { RawEnv } from './schema';

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

export function loadDotEnvFile(filePath = '.env'): RawEnv {
  const resolvedPath = resolve(process.cwd(), filePath);

  if (!existsSync(resolvedPath)) {
    return {};
  }

  const rawText = readFileSync(resolvedPath, 'utf8');
  const env: RawEnv = {};

  for (const line of rawText.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmedLine.indexOf('=');
    if (equalsIndex < 0) {
      continue;
    }

    const key = trimmedLine.slice(0, equalsIndex).trim();
    const value = trimmedLine.slice(equalsIndex + 1).trim();

    env[key] = stripWrappingQuotes(value);
  }

  return env;
}
