"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import { loginSchema, type LoginInput } from "@/modules/auth/application/dto/login.schema";

interface LoginResponse {
  user: { mustChangePassword: boolean };
}

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", rememberMe: false },
  });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      const result = await apiRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: values,
        skipAuthRetry: true,
      });
      router.push(result.user.mustChangePassword ? "/change-password" : "/dashboard");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : "No se pudo iniciar sesión. Intenta de nuevo.";
      setServerError(message);
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-5", shake && "animate-shake")}
      noValidate
    >
      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">Usuario</Label>
        <Input
          id="username"
          autoComplete="username"
          placeholder="0000001_ADMIN"
          {...register("username")}
        />
        {errors.username && <p className="text-xs font-medium text-destructive">{errors.username.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••"
            className="pr-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="rememberMe"
          type="checkbox"
          className="size-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
          {...register("rememberMe")}
        />
        <Label htmlFor="rememberMe" className="cursor-pointer font-normal text-muted-foreground">
          Recordarme en este equipo
        </Label>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Iniciar sesión
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        ¿Olvidaste tu contraseña? Contacta a tu administrador de clínica.
      </p>
    </form>
  );
}
