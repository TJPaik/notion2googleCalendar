import { getGoogleAuthClient } from '../adapters/google/auth';
import { GoogleCalendarClientAdapter } from '../adapters/google/client';
import { NotionClientAdapter } from '../adapters/notion/client';
import { parseEnv } from '../config/env';
import type { SyncRunSummary } from '../sync/run-sync';
import { runSync } from '../sync/run-sync';

export interface CliArgs {
  write: boolean;
  json: boolean;
  initAuth: boolean;
}

export function parseCliArgs(args: string[]): CliArgs {
  return {
    write: args.includes('--write'),
    json: args.includes('--json'),
    initAuth: args.includes('--init-auth'),
  };
}

export function renderSyncSummary(summary: SyncRunSummary): string {
  const lines = [
    `mode: ${summary.mode}`,
    `create: ${summary.counts.create}`,
    `update: ${summary.counts.update}`,
    `delete: ${summary.counts.delete}`,
    `noop: ${summary.counts.noop}`,
    '',
    'details:',
    ...summary.results.map(
      (result) =>
        `- [${result.action}] ${result.title} (${result.pageId}) :: ${result.reason}`,
    ),
  ];

  return lines.join('\n');
}

export async function executeSyncCli(
  args: string[] = process.argv.slice(2),
  rawEnv = process.env,
): Promise<number> {
  const cliArgs = parseCliArgs(args);
  const config = parseEnv(rawEnv);

  if (cliArgs.initAuth) {
    await getGoogleAuthClient(config);
    const message =
      config.googleAuth.type === 'installed_app'
        ? `Google OAuth token ready at ${config.googleAuth.tokenPath}`
        : 'Google refresh-token auth is already configured via environment variables';

    console.log(message);
    return 0;
  }

  const notionAdapter = new NotionClientAdapter(config);
  const googleAdapter = new GoogleCalendarClientAdapter(config);
  const summary = await runSync(notionAdapter, googleAdapter, config, {
    write: cliArgs.write,
  });

  if (cliArgs.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(renderSyncSummary(summary));
  }

  return 0;
}

if (require.main === module) {
  executeSyncCli().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
}
