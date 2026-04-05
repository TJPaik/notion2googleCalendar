import { describe, expect, it } from 'vitest';

import type { AppConfig } from '../../../src/config/schema';
import type { NotionRecord } from '../../../src/domain/notion-record';
import { buildCalendarEventInput } from '../../../src/sync/build-calendar-input';

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

describe('buildCalendarEventInput', () => {
  it('creates an all-day event for a date-only record', () => {
    const record: NotionRecord = {
      pageId: 'page-1',
      title: '하루 종일 일정',
      description: '설명',
      date: { start: '2026-04-10', end: null, includesTime: false },
      archived: false,
      deleted: false,
    };

    expect(buildCalendarEventInput(record, config)).toEqual({
      sourcePageId: 'page-1',
      sourceDatabaseId: 'database-1',
      title: '하루 종일 일정',
      description: '설명',
      date: {
        start: '2026-04-10',
        end: '2026-04-11',
        allDay: true,
      },
    });
  });

  it('creates a timed event when the Notion date includes time', () => {
    const record: NotionRecord = {
      pageId: 'page-2',
      title: '시간 있는 일정',
      description: null,
      date: {
        start: '2026-04-10T09:00:00+09:00',
        end: '2026-04-10T10:00:00+09:00',
        includesTime: true,
      },
      archived: false,
      deleted: false,
    };

    expect(buildCalendarEventInput(record, config)).toEqual({
      sourcePageId: 'page-2',
      sourceDatabaseId: 'database-1',
      title: '시간 있는 일정',
      description: null,
      date: {
        start: '2026-04-10T09:00:00+09:00',
        end: '2026-04-10T10:00:00+09:00',
        allDay: false,
      },
    });
  });

  it('falls back to today all-day when the Notion date is empty', () => {
    const record: NotionRecord = {
      pageId: 'page-3',
      title: '날짜 비어 있음',
      description: '설명',
      date: null,
      archived: false,
      deleted: false,
    };

    expect(
      buildCalendarEventInput(
        record,
        config,
        new Date('2026-04-05T15:00:00.000Z'),
      ),
    ).toEqual({
      sourcePageId: 'page-3',
      sourceDatabaseId: 'database-1',
      title: '날짜 비어 있음',
      description: '설명',
      date: {
        start: '2026-04-06',
        end: '2026-04-07',
        allDay: true,
      },
    });
  });
});
