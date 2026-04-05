import { describe, expect, it } from 'vitest';

import type { NotionRecord } from '../../../src/domain/notion-record';

describe('NotionRecord contract', () => {
  it('keeps the fields needed by later lanes', () => {
    const record: NotionRecord = {
      pageId: 'page-1',
      title: '일정 제목',
      description: '설명',
      date: {
        start: '2026-04-10',
        end: null,
        includesTime: false,
      },
      archived: false,
      deleted: false,
    };

    expect(record.pageId).toBe('page-1');
    expect(record.title).toBe('일정 제목');
    expect(record.date?.includesTime).toBe(false);
    expect(record.deleted).toBe(false);
  });
});
