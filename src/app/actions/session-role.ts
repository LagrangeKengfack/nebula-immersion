"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE } from "@/lib/auth";

/** Simulateur de rôle : « se connecter en tant que » un utilisateur de démo. */
export async function switchUser(formData: FormData) {
  const id = String(formData.get("userId") ?? "");
  const store = await cookies();
  if (!id) {
    store.delete(SESSION_COOKIE);
    redirect("/");
  }
  const [user] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, id)).limit(1);
  if (!user) redirect("/");
  store.set(SESSION_COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  redirect(user.role === "COACH" ? "/coach/programmes" : user.role === "ADMIN" ? "/admin" : "/programmes");
}
