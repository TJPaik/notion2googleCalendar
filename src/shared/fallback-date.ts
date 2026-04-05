export interface AllDayRange {
  startDate: string;
  endDateExclusive: string;
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getTodayAllDayRange(
  timezone: string,
  now: Date = new Date(),
): AllDayRange {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const startDate = formatter.format(now);

  return {
    startDate,
    endDateExclusive: addDays(startDate, 1),
  };
}
