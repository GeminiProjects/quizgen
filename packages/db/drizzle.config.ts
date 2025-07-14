import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.NEON_POSTGRES_URL;

if (!databaseUrl) {
	throw new Error("NEON_POSTGRES_URL is required");
}

export default defineConfig({
	out: "./drizzle",
	schema: "./src/schema/",
	dialect: "postgresql",
	casing: "snake_case",
	dbCredentials: { url: databaseUrl },
});
