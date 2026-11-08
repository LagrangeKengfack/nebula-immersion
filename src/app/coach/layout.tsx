import { AccessDenied } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

// Garde d'accès pour tout l'espace coach. Les actions re-vérifient le rôle côté serveur.
export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "COACH") return <AccessDenied role="coach" />;
  return <>{children}</>;
}
