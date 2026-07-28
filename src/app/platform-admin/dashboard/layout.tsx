import { redirect } from "next/navigation";
import { getServerAuthContext } from "@/lib/auth/server-session";
import { PlatformAdminSidebar } from "@/components/layout/platform-admin-sidebar";
import { PlatformAdminHeader } from "@/components/layout/platform-admin-header";

export default async function PlatformAdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getServerAuthContext("platform-admin");
  if (!ctx || !ctx.isSuperAdmin) redirect("/platform-admin/login");

  return (
    <div className="flex min-h-screen bg-background">
      <PlatformAdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <PlatformAdminHeader />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
