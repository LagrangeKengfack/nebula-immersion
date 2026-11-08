import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL manquante. Copiez .env.example vers .env et renseignez votre chaîne de connexion.");
}

// Pilote HTTP de Neon : sans connexion persistante, idéal pour les fonctions serverless de Vercel.
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle({ client: sql, schema, casing: "snake_case" });
export type Db = typeof db;
