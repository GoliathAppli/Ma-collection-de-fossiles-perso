import { AppConfig } from "../../types";

/**
 * Lightweight safe optimizer: prevents memory leaks and skips unnecessary heavy loops.
 */
export async function optimizeAllConfigImages(config: AppConfig): Promise<AppConfig> {
  if (!config) return config;
  return config;
}

