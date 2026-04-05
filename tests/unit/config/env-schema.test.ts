import { describe, expect, it } from 'vitest';

import { validateEnv } from '../../../src/config/schema';

const validEnv = {
  NOTION_TOKEN: 'secret_notion',
  NOTION_DATABASE_ID: 'database-1',
  GOOGLE_CALENDAR_ID: 'calendar-1',
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret',
  GOOGLE_REFRESH_TOKEN: 'refresh-token',
};

describe('validateEnv', () => {
  it('rejects missing required values', () => {
    const result = validateEnv({});

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('expected validation failure');
    }

    expect(result.errors).toContain('NOTION_TOKEN is required');
    expect(result.errors).toContain(
      'Google auth is required: provide GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN, or GOOGLE_OAUTH_CREDENTIALS_PATH',
    );
  });

  it('accepts refresh-token auth and fills defaults', () => {
    const result = validateEnv(validEnv);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('expected validation success');
    }

    expect(result.config.googleAuth.type).toBe('refresh_token');
    expect(result.config.notionTitleProperty).toBe('이름');
    expect(result.config.notionDateProperty).toBe('날짜');
    expect(result.config.notionDescriptionProperty).toBe('설명');
    expect(result.config.timezone).toBe('Asia/Seoul');
  });

  it('accepts installed-app auth with credential paths', () => {
    const result = validateEnv({
      NOTION_TOKEN: 'secret_notion',
      NOTION_DATABASE_ID: 'database-1',
      GOOGLE_CALENDAR_ID: 'calendar-1',
      GOOGLE_OAUTH_CREDENTIALS_PATH: 'credentials/client.json',
      GOOGLE_OAUTH_TOKEN_PATH: 'credentials/token.json',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('expected validation success');
    }

    expect(result.config.googleAuth).toEqual({
      type: 'installed_app',
      credentialsPath: 'credentials/client.json',
      tokenPath: 'credentials/token.json',
    });
  });
});
