import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Membaca langsung dari DATABASE_URL di file .env
    url: process.env.DATABASE_URL as string,
  },
});
