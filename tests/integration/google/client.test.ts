import { describe, expect, it, vi } from 'vitest';
import { GoogleCalendarClientAdapter } from '../../../src/adapters/google/client';
import type { AppConfig } from '../../../src/config/schema';

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

describe('GoogleCalendarClientAdapter', () => {
  it('lists managed events keyed by notion identity', async () => {
    const adapter = new GoogleCalendarClientAdapter(config, async () => ({
      list: vi.fn(async () => ({
        data: {
          items: [
            {
              id: 'event-1',
              extendedProperties: {
                private: {
                  source: 'notion',
                  notionPageId: 'page-1',
                  notionDatabaseId: 'database-1',
                },
              },
            },
          ],
          nextPageToken: undefined,
        },
      })),
      insert: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    }));

    const managedEvents = await adapter.listManagedEvents();

    expect(managedEvents.get('database-1:page-1')?.id).toBe('event-1');
  });

  it('passes mapped payloads to create/update/delete operations', async () => {
    const insert = vi.fn(async (input) => ({ data: input.requestBody }));
    const patch = vi.fn(async (input) => ({ data: { id: input.eventId } }));
    const remove = vi.fn(async () => ({}));
    const adapter = new GoogleCalendarClientAdapter(config, async () => ({
      list: vi.fn(async () => ({
        data: { items: [], nextPageToken: undefined },
      })),
      insert,
      patch,
      delete: remove,
    }));

    await adapter.createEvent({
      sourcePageId: 'page-1',
      sourceDatabaseId: 'database-1',
      title: '생성 테스트',
      description: '설명',
      date: {
        start: '2026-04-10',
        end: '2026-04-11',
        allDay: true,
      },
    });
    await adapter.updateEvent('event-1', {
      sourcePageId: 'page-1',
      sourceDatabaseId: 'database-1',
      title: '수정 테스트',
      description: null,
      date: {
        start: '2026-04-10T09:00:00+09:00',
        end: '2026-04-10T10:00:00+09:00',
        allDay: false,
      },
    });
    await adapter.deleteEvent('event-1');

    expect(insert).toHaveBeenCalledTimes(1);
    expect(patch).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith({
      calendarId: 'calendar-1',
      eventId: 'event-1',
    });
  });
});
