import type { calendar_v3 } from 'googleapis';
import { google } from 'googleapis';

import type { AppConfig } from '../../config/schema';
import type { CalendarEventInput } from '../../domain/calendar-event-input';
import { getGoogleAuthClient } from './auth';
import { toGoogleEventResource } from './map-event';

export interface GoogleCalendarAdapter {
  listManagedEvents(): Promise<Map<string, calendar_v3.Schema$Event>>;
  createEvent(input: CalendarEventInput): Promise<calendar_v3.Schema$Event>;
  updateEvent(
    eventId: string,
    input: CalendarEventInput,
  ): Promise<calendar_v3.Schema$Event>;
  deleteEvent(eventId: string): Promise<void>;
}

export interface CalendarEventsApi {
  list: (
    input: Record<string, unknown>,
  ) => Promise<{ data: calendar_v3.Schema$Events }>;
  insert: (
    input: Record<string, unknown>,
  ) => Promise<{ data: calendar_v3.Schema$Event }>;
  patch: (
    input: Record<string, unknown>,
  ) => Promise<{ data: calendar_v3.Schema$Event }>;
  delete: (input: Record<string, unknown>) => Promise<unknown>;
}

function getIdentityKey(event: calendar_v3.Schema$Event): string | null {
  const metadata = event.extendedProperties?.private;
  const pageId = metadata?.notionPageId;
  const databaseId = metadata?.notionDatabaseId;

  if (!pageId || !databaseId) {
    return null;
  }

  return `${databaseId}:${pageId}`;
}

export class GoogleCalendarClientAdapter implements GoogleCalendarAdapter {
  private readonly eventsApiPromise: Promise<CalendarEventsApi>;

  public constructor(
    private readonly config: AppConfig,
    eventsApiFactory?: () => Promise<CalendarEventsApi>,
  ) {
    this.eventsApiPromise = eventsApiFactory
      ? eventsApiFactory()
      : getGoogleAuthClient(config).then(async (auth) => {
          const calendar = google.calendar({ version: 'v3', auth });
          return calendar.events as CalendarEventsApi;
        });
  }

  public async listManagedEvents(): Promise<
    Map<string, calendar_v3.Schema$Event>
  > {
    const eventsApi = await this.eventsApiPromise;
    const managedEvents = new Map<string, calendar_v3.Schema$Event>();
    let nextPageToken: string | undefined;

    do {
      const response = await eventsApi.list({
        calendarId: this.config.googleCalendarId,
        maxResults: 250,
        privateExtendedProperty: [
          'source=notion',
          `notionDatabaseId=${this.config.notionDatabaseId}`,
        ],
        showDeleted: false,
        singleEvents: false,
        pageToken: nextPageToken,
      });

      for (const event of response.data.items ?? []) {
        const identityKey = getIdentityKey(event);
        if (identityKey) {
          managedEvents.set(identityKey, event);
        }
      }

      nextPageToken = response.data.nextPageToken ?? undefined;
    } while (nextPageToken);

    return managedEvents;
  }

  public async createEvent(
    input: CalendarEventInput,
  ): Promise<calendar_v3.Schema$Event> {
    const eventsApi = await this.eventsApiPromise;
    const response = await eventsApi.insert({
      calendarId: this.config.googleCalendarId,
      requestBody: toGoogleEventResource(input, this.config.timezone),
    });

    return response.data;
  }

  public async updateEvent(
    eventId: string,
    input: CalendarEventInput,
  ): Promise<calendar_v3.Schema$Event> {
    const eventsApi = await this.eventsApiPromise;
    const response = await eventsApi.patch({
      calendarId: this.config.googleCalendarId,
      eventId,
      requestBody: toGoogleEventResource(input, this.config.timezone),
    });

    return response.data;
  }

  public async deleteEvent(eventId: string): Promise<void> {
    const eventsApi = await this.eventsApiPromise;
    await eventsApi.delete({
      calendarId: this.config.googleCalendarId,
      eventId,
    });
  }
}
