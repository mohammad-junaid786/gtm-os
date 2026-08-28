import { z } from "zod";
const serverEnvironmentSchema = z.object({ DATABASE_URL: z.string().url().optional() });
const parsedEnvironment = serverEnvironmentSchema.safeParse({ DATABASE_URL: process.env.DATABASE_URL });
if (!parsedEnvironment.success) throw new Error(`Invalid server environment: ${parsedEnvironment.error.message}`);
export const env = parsedEnvironment.data;