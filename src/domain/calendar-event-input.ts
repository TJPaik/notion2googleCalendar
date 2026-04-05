export interface CalendarEventDate {
  start: string;
  end: string;
  allDay: boolean;
}

export interface CalendarEventInput {
  sourcePageId: string;
  sourceDatabaseId: string;
  title: string;
  description: string | null;
  date: CalendarEventDate;
}
