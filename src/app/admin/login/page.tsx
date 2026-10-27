import { AdminLoginForm } from "@/components/admin-login-form";
import { redirect } from "next/navigation";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ email?: string; password?: string }> }) {
  const params = await searchParams;
  if (params.email || params.password) redirect("/admin/login");
  return <main className="shell section" style={{ maxWidth: 560 }}><p className="eyebrow">Restricted area</p><h1>Admin sign in</h1><p className="lede">Sign in with the administrator account configured in Supabase.</p><AdminLoginForm /></main>;
}

export const instant = false;
