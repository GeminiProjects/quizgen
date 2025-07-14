import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl = process.env.NEON_POSTGRES_URL;

if (!databaseUrl) {
	throw new Error("NEON_POSTGRES_URL is required");
}

export const db = drizzle(neon(databaseUrl), { casing: "snake_case" });
