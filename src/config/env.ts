import { loadDotEnvFile } from './env-file';
import { type AppConfig, type RawEnv, validateEnv } from './schema';

export function parseEnv(rawEnv: RawEnv = process.env): AppConfig {
  const mergedEnv: RawEnv = {
    ...loadDotEnvFile(),
    ...rawEnv,
  };

  const result = validateEnv(mergedEnv);

  if (!result.ok) {
    throw new Error(
      `Invalid environment configuration:\n- ${result.errors.join('\n- ')}`,
    );
  }

  return result.config;
}
