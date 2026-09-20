import { z } from "zod";

const serverEnvironmentSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  AI_PROVIDER: z.string().optional(),
  AI_MODEL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().optional(),
});

const parsedEnvironment = serverEnvironmentSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  AI_PROVIDER: process.env.AI_PROVIDER,
  AI_MODEL: process.env.AI_MODEL,
  AI_API_KEY: process.env.AI_API_KEY,
  AI_BASE_URL: process.env.AI_BASE_URL,
});

if (!parsedEnvironment.success) {
  throw new Error(`Invalid server environment: ${parsedEnvironment.error.message}`);
}

export const env = parsedEnvironment.data;