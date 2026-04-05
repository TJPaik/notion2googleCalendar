import { describe, expect, it } from 'vitest';
import { mapNotionPageToRecord } from '../../../src/adapters/notion/map-record';
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

describe('mapNotionPageToRecord', () => {
  it('maps title, date, and description from a Notion page', () => {
    const record = mapNotionPageToRecord(
      {
        object: 'page',
        id: 'page-1',
        created_time: '2026-04-01T00:00:00.000Z',
        last_edited_time: '2026-04-01T00:00:00.000Z',
        created_by: { object: 'user', id: 'user-1' },
        last_edited_by: { object: 'user', id: 'user-1' },
        cover: null,
        icon: null,
        parent: { type: 'database_id', database_id: 'database-1' },
        archived: false,
        in_trash: false,
        url: 'https://notion.so/page-1',
        public_url: null,
        properties: {
          이름: {
            id: 'title',
            type: 'title',
            title: [
              {
                type: 'text',
                plain_text: '회의',
                href: null,
                annotations: {
                  bold: false,
                  code: false,
                  color: 'default',
                  italic: false,
                  strikethrough: false,
                  underline: false,
                },
                text: { content: '회의', link: null },
              },
            ],
          },
          날짜: {
            id: 'date',
            type: 'date',
            date: {
              start: '2026-04-10',
              end: null,
              time_zone: null,
            },
          },
          설명: {
            id: 'desc',
            type: 'rich_text',
            rich_text: [
              {
                type: 'text',
                plain_text: '설명 텍스트',
                href: null,
                annotations: {
                  bold: false,
                  code: false,
                  color: 'default',
                  italic: false,
                  strikethrough: false,
                  underline: false,
                },
                text: { content: '설명 텍스트', link: null },
              },
            ],
          },
        },
      },
      config,
    );

    expect(record).toEqual({
      pageId: 'page-1',
      title: '회의',
      description: '설명 텍스트',
      date: {
        start: '2026-04-10',
        end: null,
        includesTime: false,
      },
      archived: false,
      deleted: false,
    });
  });
});
