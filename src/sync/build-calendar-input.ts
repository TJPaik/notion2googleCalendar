import type { AppConfig } from '../config/schema';
import type { CalendarEventInput } from '../domain/calendar-event-input';
import type { NotionRecord } from '../domain/notion-record';
import { addOneDayToIsoDate } from '../shared/date';
import { getTodayAllDayRange } from '../shared/fallback-date';

function buildDateRange(
  record: NotionRecord,
  timezone: string,
  now: Date,
): CalendarEventInput['date'] {
  if (!record.date?.start) {
    const fallback = getTodayAllDayRange(timezone, now);
    return {
      start: fallback.startDate,
      end: fallback.endDateExclusive,
      allDay: true,
    };
  }

  if (!record.date.includesTime) {
    const endDate = record.date.end ?? addOneDayToIsoDate(record.date.start);
    return {
      start: record.date.start,
      end: endDate,
      allDay: true,
    };
  }

  return {
    start: record.date.start,
    end: record.date.end ?? record.date.start,
    allDay: false,
  };
}

export function buildCalendarEventInput(
  record: NotionRecord,
  config: AppConfig,
  now: Date = new Date(),
): CalendarEventInput {
  return {
    sourcePageId: record.pageId,
    sourceDatabaseId: config.notionDatabaseId,
    title: record.title,
    description: record.description,
    date: buildDateRange(record, config.timezone, now),
  };
}
