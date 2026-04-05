import type { calendar_v3 } from 'googleapis';

import type { CalendarEventInput } from '../../domain/calendar-event-input';
import { buildIdentity } from './event-identity';

export function toGoogleEventResource(
  input: CalendarEventInput,
  timezone: string,
): calendar_v3.Schema$Event {
  const identity = buildIdentity({
    pageId: input.sourcePageId,
    databaseId: input.sourceDatabaseId,
  });

  if (input.date.allDay) {
    return {
      summary: input.title,
      description: input.description ?? undefined,
      start: { date: input.date.start },
      end: { date: input.date.end },
      extendedProperties: { private: identity },
    };
  }

  return {
    summary: input.title,
    description: input.description ?? undefined,
    start: {
      dateTime: input.date.start,
      timeZone: timezone,
    },
    end: {
      dateTime: input.date.end,
      timeZone: timezone,
    },
    extendedProperties: { private: identity },
  };
}
