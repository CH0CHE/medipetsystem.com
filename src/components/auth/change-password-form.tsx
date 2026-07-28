"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import {
  buildChangePasswordSchema,
  type ChangePasswordInput,
} from "@/modules/auth/application/dto/change-password.schema";
import { DEFAULT_PASSWORD_POLICY, type PasswordPolicy } from "@/lib/security/password-policy";

export function ChangePasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: policy } = useQuery({
    queryKey: ["password-policy"],
    queryFn: () =>
      apiRequest<{ policy: PasswordPolicy }>("/api/settings/password-policy").then((r) => r.policy),
    // Si esta petición falla (ej. usuario sin tenant, como el Super Admin), se sigue usando el
    // default de la aplicación — la validación real y autoritativa ocurre en el servidor.
    retry: false,
  });

  const effectivePolicy = policy ?? DEFAULT_PASSWORD_POLICY;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(buildChangePasswordSchema(effectivePolicy)),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ChangePasswordInput) => {
    setServerError(null);
    try {
      await apiRequest("/api/auth/change-password", { method: "POST", body: values });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setServerError(error instanceof ApiClientError ? error.message : "No se pudo cambiar la contraseña.");
    }
  };

  const rules = [
    `mínimo ${effectivePolicy.minLength} caracteres`,
    effectivePolicy.requireUppercase && "mayúscula",
    effectivePolicy.requireLowercase && "minúscula",
    effectivePolicy.requireNumber && "número",
    effectivePolicy.requireSymbol && "símbolo",
  ].filter(Boolean);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Alert className="border-info/40 bg-info/10 text-info">
        <ShieldCheck className="size-4" />
        <AlertDescription className="text-foreground">Requisitos: {rules.join(", ")}.</AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="currentPassword">Contraseña temporal actual</Label>
        <Input id="currentPassword" type="password" autoComplete="current-password" {...register("currentPassword")} />
        {errors.currentPassword && (
          <p className="text-xs font-medium text-destructive">{errors.currentPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">Nueva contraseña</Label>
        <Input id="newPassword" type="password" autoComplete="new-password" {...register("newPassword")} />
        {errors.newPassword && <p className="text-xs font-medium text-destructive">{errors.newPassword.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
        <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
        {errors.confirmPassword && (
          <p className="text-xs font-medium text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Guardar y continuar
      </Button>
    </form>
  );
}
