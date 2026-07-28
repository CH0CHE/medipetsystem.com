import type { Metadata } from "next";
import Image from "next/image";
import { PulseLine } from "@/components/auth/pulse-line";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative flex h-40 shrink-0 items-center justify-center overflow-hidden bg-primary px-8 lg:h-auto lg:w-[55%] lg:justify-start lg:px-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(38,198,184,0.18),transparent_55%)]" />
        <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-icono-sin-letras.png"
              alt=""
              width={44}
              height={44}
              className="size-10 lg:size-11"
              priority
            />
            <span className="text-xl font-semibold text-primary-foreground">MediPet System</span>
          </div>
          <p className="hidden text-balance text-primary-foreground/80 lg:block">
            La plataforma integral para administrar tu clínica veterinaria: pacientes, expedientes,
            inventario, facturación y agenda — todo en un solo lugar.
          </p>
          <div className="hidden w-full text-secondary lg:block">
            <PulseLine className="h-16 w-full" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bienvenido de nuevo</h1>
            <p className="text-sm text-muted-foreground">
              Ingresa con tu usuario de clínica para continuar.
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
