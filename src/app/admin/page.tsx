import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/server/session";
import { readTournament } from "@/lib/server/tournament-store";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata = { title: "Admin · Control room" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminSession())) redirect("/signin");
  const data = await readTournament();

  return <AdminDashboard initial={data} />;
}
