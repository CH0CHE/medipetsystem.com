import type { Metadata } from "next";
import Image from "next/image";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export const metadata: Metadata = { title: "Cambiar contraseña" };

export default function ChangePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Image src="/logo-icono-sin-letras.png" alt="" width={48} height={48} className="size-12" />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Configura tu contraseña
            </h1>
            <p className="text-sm text-muted-foreground">
              Por seguridad, debes establecer una contraseña definitiva antes de continuar.
            </p>
          </div>
        </div>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
