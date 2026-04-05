import { describe, expect, it, vi } from 'vitest';
import type { GoogleCalendarAdapter } from '../../../src/adapters/google/client';
import type { NotionAdapter } from '../../../src/adapters/notion/client';
import type { AppConfig } from '../../../src/config/schema';
import type { NotionRecord } from '../../../src/domain/notion-record';
import { runSync } from '../../../src/sync/run-sync';

const config: AppConfig = {
  notionToken: 'secret_notion',
  notionDatabaseId: 'database-1',
  notionTitleProperty: '이름',
  notionDateProperty: '날짜',
  notionDescriptionProperty: '설명',
  googleCalendarId: 'calendar-1',
  googleAuth: {
    type: 'installed_app',
    credentialsPath: 'credentials/client.json',
    tokenPath: 'credentials/token.json',
  },
  timezone: 'Asia/Seoul',
};

const activeRecord: NotionRecord = {
  pageId: 'page-1',
  title: '활성 일정',
  description: '설명',
  date: { start: '2026-04-10', end: null, includesTime: false },
  archived: false,
  deleted: false,
};

const deletedRecord: NotionRecord = {
  pageId: 'page-2',
  title: '삭제 일정',
  description: null,
  date: { start: '2026-04-11', end: null, includesTime: false },
  archived: true,
  deleted: true,
};

describe('runSync', () => {
  it('summarizes dry-run decisions without mutating Google', async () => {
    const notionAdapter: NotionAdapter = {
      fetchRecords: async () => [activeRecord, deletedRecord],
    };
    const googleAdapter: GoogleCalendarAdapter = {
      listManagedEvents: async () =>
        new Map([
          [
            'database-1:page-2',
            {
              id: 'event-2',
              summary: '삭제 일정',
              start: { date: '2026-04-11' },
              end: { date: '2026-04-12' },
            },
          ],
        ]),
      createEvent: vi.fn(),
      updateEvent: vi.fn(),
      deleteEvent: vi.fn(),
    };

    const summary = await runSync(notionAdapter, googleAdapter, config, {
      write: false,
      now: new Date('2026-04-05T15:00:00.000Z'),
    });

    expect(summary.mode).toBe('dry-run');
    expect(summary.counts).toEqual({
      create: 1,
      update: 0,
      delete: 1,
      noop: 0,
    });
    expect(googleAdapter.createEvent).not.toHaveBeenCalled();
    expect(googleAdapter.deleteEvent).not.toHaveBeenCalled();
  });

  it('applies write-mode decisions to the Google adapter', async () => {
    const createEvent = vi.fn(async () => ({ id: 'event-1' }));
    const notionAdapter: NotionAdapter = {
      fetchRecords: async () => [activeRecord],
    };
    const googleAdapter: GoogleCalendarAdapter = {
      listManagedEvents: async () => new Map(),
      createEvent,
      updateEvent: vi.fn(),
      deleteEvent: vi.fn(),
    };

    const summary = await runSync(notionAdapter, googleAdapter, config, {
      write: true,
      now: new Date('2026-04-05T15:00:00.000Z'),
    });

    expect(summary.counts.create).toBe(1);
    expect(createEvent).toHaveBeenCalledTimes(1);
  });
});
