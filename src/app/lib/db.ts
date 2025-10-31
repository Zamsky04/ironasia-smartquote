import { Pool } from 'pg';

declare global {
  var __pgPool__: Pool | undefined;
}

export function getPool() {
  if (!global.__pgPool__) {
    global.__pgPool__ = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return global.__pgPool__;
}
