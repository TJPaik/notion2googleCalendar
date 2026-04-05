import { type AppConfig, type RawEnv, validateEnv } from './schema';

export function parseEnv(rawEnv: RawEnv = process.env): AppConfig {
  const result = validateEnv(rawEnv);

  if (!result.ok) {
    throw new Error(
      `Invalid environment configuration:\n- ${result.errors.join('\n- ')}`,
    );
  }

  return result.config;
}
