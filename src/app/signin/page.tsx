import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/server/session";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata = { title: "Organiser sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage() {
  if (await isAdminSession()) redirect("/admin");
  return <AdminLoginForm />;
}
