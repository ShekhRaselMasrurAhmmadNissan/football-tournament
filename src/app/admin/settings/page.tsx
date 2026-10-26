import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/server/session";
import { readTournament } from "@/lib/server/tournament-store";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata = { title: "Admin · Settings" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  if (!(await isAdminSession())) redirect("/signin");
  const data = await readTournament();
  return <AdminDashboard initial={data} initialTab="settings" />;
}
