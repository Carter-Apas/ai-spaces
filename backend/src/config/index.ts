export { logger, type Logger } from "./logger.js";

export interface Config {
  port: number;
  anthropicApiKey: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
}

export const config: Config = {
  port: Number(process.env.PORT) || 3001,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || "",
};
