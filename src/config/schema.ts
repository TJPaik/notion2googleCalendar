export interface RawEnv {
  [key: string]: string | undefined;
}

export interface RefreshTokenAuthConfig {
  type: 'refresh_token';
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface InstalledAppAuthConfig {
  type: 'installed_app';
  credentialsPath: string;
  tokenPath: string;
}

export type GoogleAuthConfig = RefreshTokenAuthConfig | InstalledAppAuthConfig;

export interface AppConfig {
  notionToken: string;
  notionDatabaseId: string;
  notionTitleProperty: string;
  notionDateProperty: string;
  notionDescriptionProperty: string;
  googleCalendarId: string;
  googleAuth: GoogleAuthConfig;
  timezone: string;
}

const DEFAULTS = {
  notionTitleProperty: '이름',
  notionDateProperty: '날짜',
  notionDescriptionProperty: '설명',
  timezone: 'Asia/Seoul',
  googleOAuthTokenPath: 'credentials/google-oauth-token.json',
} as const;

const REQUIRED_KEYS = [
  'NOTION_TOKEN',
  'NOTION_DATABASE_ID',
  'GOOGLE_CALENDAR_ID',
] as const;

type ValidationResult =
  | {
      ok: true;
      config: AppConfig;
    }
  | {
      ok: false;
      errors: string[];
    };

function mustGet(rawEnv: RawEnv, key: (typeof REQUIRED_KEYS)[number]): string {
  const value = rawEnv[key]?.trim();

  if (!value) {
    throw new Error(`${key} is required after validation`);
  }

  return value;
}

function getGoogleAuthConfig(rawEnv: RawEnv): GoogleAuthConfig | null {
  const refreshToken = rawEnv.GOOGLE_REFRESH_TOKEN?.trim();
  const clientId = rawEnv.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = rawEnv.GOOGLE_CLIENT_SECRET?.trim();

  if (refreshToken && clientId && clientSecret) {
    return {
      type: 'refresh_token',
      clientId,
      clientSecret,
      refreshToken,
    };
  }

  const credentialsPath = rawEnv.GOOGLE_OAUTH_CREDENTIALS_PATH?.trim();
  const tokenPath =
    rawEnv.GOOGLE_OAUTH_TOKEN_PATH?.trim() || DEFAULTS.googleOAuthTokenPath;

  if (credentialsPath) {
    return {
      type: 'installed_app',
      credentialsPath,
      tokenPath,
    };
  }

  return null;
}

export function validateEnv(rawEnv: RawEnv): ValidationResult {
  const errors = REQUIRED_KEYS.filter((key) => !rawEnv[key]?.trim()).map(
    (key) => `${key} is required`,
  );

  const googleAuth = getGoogleAuthConfig(rawEnv);

  if (!googleAuth) {
    errors.push(
      'Google auth is required: provide GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN, or GOOGLE_OAUTH_CREDENTIALS_PATH',
    );
  }

  if (errors.length > 0 || !googleAuth) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    config: {
      notionToken: mustGet(rawEnv, 'NOTION_TOKEN'),
      notionDatabaseId: mustGet(rawEnv, 'NOTION_DATABASE_ID'),
      notionTitleProperty:
        rawEnv.NOTION_TITLE_PROPERTY?.trim() || DEFAULTS.notionTitleProperty,
      notionDateProperty:
        rawEnv.NOTION_DATE_PROPERTY?.trim() || DEFAULTS.notionDateProperty,
      notionDescriptionProperty:
        rawEnv.NOTION_DESCRIPTION_PROPERTY?.trim() ||
        DEFAULTS.notionDescriptionProperty,
      googleCalendarId: mustGet(rawEnv, 'GOOGLE_CALENDAR_ID'),
      googleAuth,
      timezone: rawEnv.TIMEZONE?.trim() || DEFAULTS.timezone,
    },
  };
}
