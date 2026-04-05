import { readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';

import type { AppConfig, InstalledAppAuthConfig } from '../../config/schema';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

type GoogleOAuthClient = InstanceType<typeof google.auth.OAuth2>;

async function ensureDirectoryExists(filePath: string): Promise<void> {
  const { mkdir } = await import('node:fs/promises');
  await mkdir(dirname(filePath), { recursive: true });
}

function buildRefreshTokenClient(config: AppConfig): GoogleOAuthClient {
  if (config.googleAuth.type !== 'refresh_token') {
    throw new Error('Refresh-token auth config is required for this code path');
  }

  const client = new google.auth.OAuth2(
    config.googleAuth.clientId,
    config.googleAuth.clientSecret,
  );

  client.setCredentials({ refresh_token: config.googleAuth.refreshToken });
  return client;
}

async function buildInstalledAppClient(
  authConfig: InstalledAppAuthConfig,
): Promise<GoogleOAuthClient> {
  const authenticatedClient = await authenticate({
    scopes: SCOPES,
    keyfilePath: authConfig.credentialsPath,
  });

  await ensureDirectoryExists(authConfig.tokenPath);
  await writeFile(
    authConfig.tokenPath,
    JSON.stringify(authenticatedClient.credentials, null, 2),
  );

  return authenticatedClient as unknown as GoogleOAuthClient;
}

async function readInstalledAppToken(
  authConfig: InstalledAppAuthConfig,
): Promise<GoogleOAuthClient | null> {
  try {
    const tokenJson = await readFile(authConfig.tokenPath, 'utf8');
    const credentialsJson = await readFile(authConfig.credentialsPath, 'utf8');
    const credentials = JSON.parse(credentialsJson) as {
      installed?: {
        client_id: string;
        client_secret: string;
        redirect_uris: string[];
      };
    };
    const installed = credentials.installed;

    if (!installed) {
      throw new Error(
        'credentials file must contain an installed app configuration',
      );
    }

    const client = new google.auth.OAuth2(
      installed.client_id,
      installed.client_secret,
      installed.redirect_uris[0],
    );

    client.setCredentials(JSON.parse(tokenJson));
    return client;
  } catch {
    return null;
  }
}

export async function getGoogleAuthClient(
  config: AppConfig,
): Promise<GoogleOAuthClient> {
  if (config.googleAuth.type === 'refresh_token') {
    return buildRefreshTokenClient(config);
  }

  const existingTokenClient = await readInstalledAppToken(config.googleAuth);
  if (existingTokenClient) {
    return existingTokenClient;
  }

  return buildInstalledAppClient(config.googleAuth);
}
