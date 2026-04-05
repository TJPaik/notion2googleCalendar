import type { calendar_v3 } from 'googleapis';

import type { CalendarEventInput } from '../domain/calendar-event-input';
import type { SyncDecision } from '../domain/sync-decision';

function getEventDateSignature(event: calendar_v3.Schema$Event): string {
  if (event.start?.date && event.end?.date) {
    return `all-day:${event.start.date}:${event.end.date}`;
  }

  return `timed:${event.start?.dateTime ?? ''}:${event.end?.dateTime ?? ''}`;
}

function getInputDateSignature(input: CalendarEventInput): string {
  if (input.date.allDay) {
    return `all-day:${input.date.start}:${input.date.end}`;
  }

  return `timed:${input.date.start}:${input.date.end}`;
}

export function reconcileEvent(
  existingEvent: calendar_v3.Schema$Event | null,
  input: CalendarEventInput,
  sourceRecordDeleted: boolean,
): SyncDecision {
  if (sourceRecordDeleted) {
    return existingEvent
      ? { action: 'delete', reason: 'source record was deleted or archived' }
      : { action: 'noop', reason: 'deleted source has no managed event' };
  }

  if (!existingEvent) {
    return {
      action: 'create',
      reason: 'no managed event exists for the source record',
    };
  }

  const sameTitle = (existingEvent.summary ?? '') === input.title;
  const sameDescription =
    (existingEvent.description ?? '') === (input.description ?? '');
  const sameDate =
    getEventDateSignature(existingEvent) === getInputDateSignature(input);

  if (sameTitle && sameDescription && sameDate) {
    return {
      action: 'noop',
      reason: 'managed event already matches the normalized source record',
    };
  }

  return {
    action: 'update',
    reason: 'managed event differs from the normalized source record',
  };
}
