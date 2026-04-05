import { describe, expect, it } from 'vitest';

import { getTodayAllDayRange } from '../../../src/shared/fallback-date';

describe('getTodayAllDayRange', () => {
  it('returns today and next day in Asia/Seoul', () => {
    const result = getTodayAllDayRange(
      'Asia/Seoul',
      new Date('2026-04-05T15:00:00.000Z'),
    );

    expect(result).toEqual({
      startDate: '2026-04-06',
      endDateExclusive: '2026-04-07',
    });
  });
});
