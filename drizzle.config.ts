import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

const isNeonConnection = Boolean(process.env.DATABASE_URL);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: isNeonConnection
    ? {
        url: process.env.DATABASE_URL as string,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.SQL_HOST || "localhost",
        port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 5432,
        user: process.env.SQL_USER || "postgres",
        password: process.env.SQL_PASSWORD || "",
        database: process.env.SQL_DB_NAME || "madrasah_db",
        ssl: false,
      },
});
