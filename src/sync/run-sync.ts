import type { calendar_v3 } from 'googleapis';
import type { GoogleCalendarAdapter } from '../adapters/google/client';
import type { NotionAdapter } from '../adapters/notion/client';
import type { AppConfig } from '../config/schema';
import type { NotionRecord } from '../domain/notion-record';
import type { SyncAction, SyncDecision } from '../domain/sync-decision';
import { buildCalendarEventInput } from './build-calendar-input';
import { reconcileEvent } from './reconcile';

export interface SyncRunOptions {
  write: boolean;
  now?: Date;
}

export interface SyncItemResult {
  pageId: string;
  title: string;
  action: SyncAction;
  reason: string;
}

export interface SyncRunSummary {
  mode: 'dry-run' | 'write';
  counts: Record<SyncAction, number>;
  results: SyncItemResult[];
}

function createCounts(): Record<SyncAction, number> {
  return {
    create: 0,
    update: 0,
    delete: 0,
    noop: 0,
  };
}

function getIdentityKey(config: AppConfig, record: NotionRecord): string {
  return `${config.notionDatabaseId}:${record.pageId}`;
}

async function applyDecision(
  decision: SyncDecision,
  adapter: GoogleCalendarAdapter,
  existingEvent: calendar_v3.Schema$Event | null,
  config: AppConfig,
  record: NotionRecord,
  now: Date,
): Promise<void> {
  if (decision.action === 'noop') {
    return;
  }

  if (decision.action === 'delete') {
    if (existingEvent?.id) {
      await adapter.deleteEvent(existingEvent.id);
    }
    return;
  }

  const input = buildCalendarEventInput(record, config, now);

  if (decision.action === 'create') {
    await adapter.createEvent(input);
    return;
  }

  if (!existingEvent?.id) {
    throw new Error('update action requires an existing Google event id');
  }

  await adapter.updateEvent(existingEvent.id, input);
}

export async function runSync(
  notionAdapter: NotionAdapter,
  googleAdapter: GoogleCalendarAdapter,
  config: AppConfig,
  options: SyncRunOptions,
): Promise<SyncRunSummary> {
  const now = options.now ?? new Date();
  const [records, managedEvents] = await Promise.all([
    notionAdapter.fetchRecords(),
    googleAdapter.listManagedEvents(),
  ]);

  const counts = createCounts();
  const results: SyncItemResult[] = [];

  for (const record of records) {
    const identityKey = getIdentityKey(config, record);
    const existingEvent = managedEvents.get(identityKey) ?? null;
    const decision = reconcileEvent(
      existingEvent,
      buildCalendarEventInput(record, config, now),
      record.archived || record.deleted,
    );

    counts[decision.action] += 1;
    results.push({
      pageId: record.pageId,
      title: record.title,
      action: decision.action,
      reason: decision.reason,
    });

    if (options.write) {
      await applyDecision(
        decision,
        googleAdapter,
        existingEvent,
        config,
        record,
        now,
      );
    }
  }

  return {
    mode: options.write ? 'write' : 'dry-run',
    counts,
    results,
  };
}
