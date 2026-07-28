"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import { loginSchema, type LoginInput } from "@/modules/auth/application/dto/login.schema";

export function PlatformAdminLoginForm() {
  const router = useRouter();
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
      await apiRequest("/api/platform-admin/auth/login", {
        method: "POST",
        body: values,
        skipAuthRetry: true,
      });
      router.push("/platform-admin/dashboard");
      router.refresh();
    } catch (error) {
      setServerError(error instanceof ApiClientError ? error.message : "No se pudo iniciar sesión.");
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
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="size-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="pa-username" className="text-slate-200">
          Usuario
        </Label>
        <Input
          id="pa-username"
          autoComplete="username"
          className="border-white/10 bg-white/5 text-slate-50 placeholder:text-slate-500 focus-visible:ring-pa-turquoise"
          {...register("username")}
        />
        {errors.username && <p className="text-xs font-medium text-red-400">{errors.username.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="pa-password" className="text-slate-200">
          Contraseña
        </Label>
        <Input
          id="pa-password"
          type="password"
          autoComplete="current-password"
          className="border-white/10 bg-white/5 text-slate-50 placeholder:text-slate-500 focus-visible:ring-pa-turquoise"
          {...register("password")}
        />
        {errors.password && <p className="text-xs font-medium text-red-400">{errors.password.message}</p>}
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="w-full bg-pa-turquoise text-[#04201c] hover:bg-pa-turquoise/90"
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Acceder al portal
      </Button>
    </form>
  );
}
