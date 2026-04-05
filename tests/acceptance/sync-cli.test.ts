import { describe, expect, it } from 'vitest';

import { parseCliArgs, renderSyncSummary } from '../../src/cli/sync';

describe('sync CLI helpers', () => {
  it('parses dry-run, write, json, and init-auth flags', () => {
    expect(parseCliArgs([])).toEqual({
      write: false,
      json: false,
      initAuth: false,
    });

    expect(parseCliArgs(['--write', '--json', '--init-auth'])).toEqual({
      write: true,
      json: true,
      initAuth: true,
    });
  });

  it('renders a readable sync summary', () => {
    const output = renderSyncSummary({
      mode: 'dry-run',
      counts: { create: 1, update: 0, delete: 1, noop: 2 },
      results: [
        {
          pageId: 'page-1',
          title: '새 일정',
          action: 'create',
          reason: 'no managed event exists for the source record',
        },
      ],
    });

    expect(output).toContain('mode: dry-run');
    expect(output).toContain('create: 1');
    expect(output).toContain('[create] 새 일정 (page-1)');
  });
});
