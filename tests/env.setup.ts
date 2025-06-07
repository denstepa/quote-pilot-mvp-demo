import { config } from 'dotenv';
import { join } from 'path';

// Load .env.test file for test environment
config({ path: join(__dirname, '..', '.env.test') });

// Set NODE_ENV to test if not already set
if (!process.env.NODE_ENV) {
  Object.assign(process.env, { NODE_ENV: 'test' });
} 