import type { Metadata } from "next";
import Image from "next/image";
import { ShieldAlert } from "lucide-react";
import { PlatformAdminLoginForm } from "@/components/auth/platform-admin-login-form";

export const metadata: Metadata = { title: "MediPet Staff Portal" };

export default function PlatformAdminLoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-pa-bg px-6 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,184,166,0.12),transparent_60%)]" />
      <div className="relative z-10 w-full max-w-sm animate-fade-up rounded-2xl border border-white/10 bg-pa-surface/60 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Image src="/logo-icono-sin-letras.png" alt="" width={40} height={40} className="size-10" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-pa-turquoise">
              MediPet Staff Portal
            </p>
            <h1 className="mt-1 text-xl font-semibold text-white">Acceso restringido</h1>
          </div>
        </div>

        <div className="mb-6 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <p>Acceso exclusivo para personal autorizado de MediPet System. Todas las acciones son auditadas.</p>
        </div>

        <PlatformAdminLoginForm />
      </div>
    </div>
  );
}
