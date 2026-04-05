import type {
  PageObjectResponse,
  PartialPageObjectResponse,
  RichTextItemResponse,
  TitlePropertyItemObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';

import type { AppConfig } from '../../config/schema';
import type { NotionDateValue, NotionRecord } from '../../domain/notion-record';

function isFullPage(
  page: PageObjectResponse | PartialPageObjectResponse,
): page is PageObjectResponse {
  return 'properties' in page;
}

function getPlainText(
  items: Array<RichTextItemResponse | TitlePropertyItemObjectResponse>,
): string {
  return items
    .map((item) =>
      'plain_text' in item ? item.plain_text : item.title.plain_text,
    )
    .join('')
    .trim();
}

function readTextProperty(
  page: PageObjectResponse,
  propertyName: string,
): string | null {
  const property = page.properties[propertyName];

  if (!property) {
    return null;
  }

  if (property.type === 'title') {
    return getPlainText(property.title);
  }

  if (property.type === 'rich_text') {
    return getPlainText(property.rich_text);
  }

  return null;
}

function readDateProperty(
  page: PageObjectResponse,
  propertyName: string,
): NotionDateValue | null {
  const property = page.properties[propertyName];

  if (!property || property.type !== 'date' || !property.date) {
    return null;
  }

  const { start, end, time_zone: timeZone } = property.date;
  const includesTime = start.includes('T') || Boolean(timeZone);

  return {
    start,
    end,
    includesTime,
  };
}

export function mapNotionPageToRecord(
  page: PageObjectResponse | PartialPageObjectResponse,
  config: AppConfig,
): NotionRecord {
  if (!isFullPage(page)) {
    throw new Error(
      'Partial Notion page responses are not supported in the sync flow',
    );
  }

  return {
    pageId: page.id,
    title: readTextProperty(page, config.notionTitleProperty) || '(untitled)',
    description: readTextProperty(page, config.notionDescriptionProperty),
    date: readDateProperty(page, config.notionDateProperty),
    archived: page.archived,
    deleted: page.in_trash,
  };
}
