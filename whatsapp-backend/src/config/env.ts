import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envValidationSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3014),

  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string().default('chatbot_crm_db'),

  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters.'),

  WA_ACCESS_TOKEN: z.string().min(10, 'Meta permanent access token is required.'),
  WA_PHONE_NUMBER_ID: z.string().min(5, 'Meta phone number ID is required.'),
  WA_VERIFY_TOKEN: z.string().min(4, 'Webhook verify token is required.')
});

const parsedEnvResult = envValidationSchema.safeParse({
  ...process.env,
  WA_ACCESS_TOKEN: process.env.WA_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN,
  WA_PHONE_NUMBER_ID: process.env.WA_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID,
  WA_VERIFY_TOKEN: process.env.WA_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN
});

if (!parsedEnvResult.success) {
  console.error('Fatal env validation failed:');
  console.error(JSON.stringify(parsedEnvResult.error.format(), null, 2));
  process.exit(1);
}

export const env = Object.freeze(parsedEnvResult.data);
