import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  if (user?.role === "COACH") redirect("/coach/programmes");
  if (user?.role === "ADMIN") redirect("/admin");
  redirect("/programmes");
}
