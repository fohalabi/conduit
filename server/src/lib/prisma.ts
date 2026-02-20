import dotenv from 'dotenv';
// Load env vars FIRST
dotenv.config();

import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Now create pool AFTER env is loaded
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'conduit',
  user: 'conduit',
  password: 'conduit_password',
});

const adapter = new PrismaPg(pool);

// Initialize Prisma with adapter
const prisma = new PrismaClient({ adapter });

export default prisma;