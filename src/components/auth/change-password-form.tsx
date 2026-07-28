"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/modules/auth/application/dto/change-password.schema";
import { PASSWORD_POLICY } from "@/lib/security/password-policy";

export function ChangePasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
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
        <AlertDescription className="text-foreground">
          Mínimo {PASSWORD_POLICY.minLength} caracteres, con mayúscula, minúscula, número y símbolo.
        </AlertDescription>
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
