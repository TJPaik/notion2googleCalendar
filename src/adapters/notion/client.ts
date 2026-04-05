import { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

import type { AppConfig } from '../../config/schema';
import type { NotionRecord } from '../../domain/notion-record';
import { mapNotionPageToRecord } from './map-record';

interface QueryResponseLike {
  results: Array<{ object: string }>;
  has_more: boolean;
  next_cursor: string | null;
}

interface NotionQueryableClient {
  dataSources?: {
    query: (input: {
      data_source_id: string;
      start_cursor?: string;
    }) => Promise<QueryResponseLike>;
  };
  databases?: {
    query?: (input: {
      database_id: string;
      start_cursor?: string;
    }) => Promise<QueryResponseLike>;
  };
}

export interface NotionAdapter {
  fetchRecords(): Promise<NotionRecord[]>;
}

export class NotionClientAdapter implements NotionAdapter {
  private readonly queryableClient: NotionQueryableClient;

  public constructor(
    private readonly config: AppConfig,
    client: Client = new Client({ auth: config.notionToken }),
  ) {
    this.queryableClient = client as Client & NotionQueryableClient;
  }

  public async fetchRecords(): Promise<NotionRecord[]> {
    const pages = await this.queryAllPages();
    return pages.map((page) => mapNotionPageToRecord(page, this.config));
  }

  private async queryAllPages(): Promise<PageObjectResponse[]> {
    const pages: PageObjectResponse[] = [];
    let nextCursor: string | undefined;

    do {
      const response = await this.queryOnce(nextCursor);
      const currentPages = response.results.filter(
        (result): result is PageObjectResponse => result.object === 'page',
      );

      pages.push(...currentPages);
      nextCursor = response.has_more
        ? (response.next_cursor ?? undefined)
        : undefined;
    } while (nextCursor);

    return pages;
  }

  private async queryOnce(startCursor?: string): Promise<QueryResponseLike> {
    const commonInput = startCursor ? { start_cursor: startCursor } : {};

    // Notion's SDK surface has changed over time from `databases.query(...)`
    // to `dataSources.query(...)`. We probe the available method here so the
    // adapter stays compatible while keeping that compatibility detail out of
    // the sync engine.
    if (this.queryableClient.dataSources?.query) {
      return this.queryableClient.dataSources.query({
        data_source_id: this.config.notionDatabaseId,
        ...commonInput,
      });
    }

    if (this.queryableClient.databases?.query) {
      return this.queryableClient.databases.query({
        database_id: this.config.notionDatabaseId,
        ...commonInput,
      });
    }

    throw new Error('This Notion SDK version does not expose a query method');
  }
}
