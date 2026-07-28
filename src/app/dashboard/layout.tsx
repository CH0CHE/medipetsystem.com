import { redirect } from "next/navigation";
import { getServerAuthContext } from "@/lib/auth/server-session";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TenantHeader } from "@/components/layout/tenant-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getServerAuthContext("tenant");
  if (!ctx) redirect("/login");
  if (ctx.mustChangePassword) redirect("/change-password");

  return (
    <div className="flex min-h-screen bg-background">
      <TenantSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TenantHeader />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
