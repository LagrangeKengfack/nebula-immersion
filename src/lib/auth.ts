import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type Role, type User } from "@/db/schema";

/**
 * Simulateur de rôle (autorisé par le sujet).
 * L'identité est un cookie httpOnly contenant l'id d'un utilisateur de démo.
 * Les autorisations sont vérifiées CÔTÉ SERVEUR à chaque action, comme avec une vraie auth :
 * remplacer ce fichier par NextAuth/Clerk ne changerait rien au reste du code.
 */
export const SESSION_COOKIE = "nebula_user";

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
});

export class AuthError extends Error {
  constructor(message = "Accès non autorisé.") {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Connectez-vous pour continuer.");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new AuthError("Vous n'avez pas les droits pour cette action.");
  return user;
}

export const requireStudent = () => requireRole("STUDENT");
export const requireCoach = () => requireRole("COACH");
export const requireAdmin = () => requireRole("ADMIN");

/** Comptes de démo proposés dans le sélecteur de rôle. */
export async function listDemoUsers() {
  return db.select({ id: users.id, name: users.name, role: users.role }).from(users).orderBy(users.role, users.name);
}

/** Pour les pages de l'espace coach : null si l'utilisateur n'est pas coach (le layout affiche le refus). */
export async function getCurrentCoach(): Promise<User | null> {
  const user = await getCurrentUser();
  return user?.role === "COACH" ? user : null;
}
