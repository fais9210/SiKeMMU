import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: "postgresql://postgres.dejrvrpxaaahgranlofj:KlRSK59vKLKxMJD7@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres",
  },
});