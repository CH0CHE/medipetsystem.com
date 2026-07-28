import type { Metadata } from "next";
import { PasswordPolicyForm } from "@/components/settings/password-policy-form";

export const metadata: Metadata = { title: "Configuración" };

export default function ConfiguracionPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground">Política de complejidad de contraseñas de tu clínica.</p>
      </div>
      <PasswordPolicyForm />
    </div>
  );
}
