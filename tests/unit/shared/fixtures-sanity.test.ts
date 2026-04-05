import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const fixtureNames = [
  'notion-row-date-only.json',
  'notion-row-dated-time.json',
  'notion-row-empty-date.json',
  'notion-row-deleted.json',
  'google-event-existing.json',
];

describe('fixture sanity', () => {
  it('loads every required fixture as valid JSON', () => {
    const parsedFixtures = fixtureNames.map((fixtureName) => {
      const raw = readFileSync(
        join(process.cwd(), 'tests/fixtures', fixtureName),
        'utf8',
      );
      return JSON.parse(raw);
    });

    expect(parsedFixtures).toHaveLength(fixtureNames.length);
    expect(parsedFixtures[0].properties.이름).toBe('날짜만 있는 일정');
  });
});
