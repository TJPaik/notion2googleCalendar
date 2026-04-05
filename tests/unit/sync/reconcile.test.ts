import { describe, expect, it } from 'vitest';

import type { CalendarEventInput } from '../../../src/domain/calendar-event-input';
import { reconcileEvent } from '../../../src/sync/reconcile';

const input: CalendarEventInput = {
  sourcePageId: 'page-1',
  sourceDatabaseId: 'database-1',
  title: '테스트 일정',
  description: '설명',
  date: {
    start: '2026-04-10',
    end: '2026-04-11',
    allDay: true,
  },
};

describe('reconcileEvent', () => {
  it('creates when no managed event exists', () => {
    expect(reconcileEvent(null, input, false)).toEqual({
      action: 'create',
      reason: 'no managed event exists for the source record',
    });
  });

  it('returns noop when the managed event already matches', () => {
    expect(
      reconcileEvent(
        {
          summary: '테스트 일정',
          description: '설명',
          start: { date: '2026-04-10' },
          end: { date: '2026-04-11' },
        },
        input,
        false,
      ),
    ).toEqual({
      action: 'noop',
      reason: 'managed event already matches the normalized source record',
    });
  });

  it('updates when the managed event differs', () => {
    expect(
      reconcileEvent(
        {
          summary: '이전 제목',
          description: '설명',
          start: { date: '2026-04-10' },
          end: { date: '2026-04-11' },
        },
        input,
        false,
      ),
    ).toEqual({
      action: 'update',
      reason: 'managed event differs from the normalized source record',
    });
  });

  it('deletes when the source record is deleted and the event exists', () => {
    expect(
      reconcileEvent(
        {
          id: 'event-1',
          summary: '테스트 일정',
          start: { date: '2026-04-10' },
          end: { date: '2026-04-11' },
        },
        input,
        true,
      ),
    ).toEqual({
      action: 'delete',
      reason: 'source record was deleted or archived',
    });
  });
});
