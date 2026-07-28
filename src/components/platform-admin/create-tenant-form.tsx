"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import {
  createTenantSchema,
  type CreateTenantInput,
} from "@/modules/platform-admin/application/dto/create-tenant.schema";
import type { CreateTenantResult } from "@/modules/platform-admin/domain/entities";
import { CredentialsRevealDialog } from "./credentials-reveal-dialog";

export function CreateTenantForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateTenantResult | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTenantInput>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: { clinicName: "", branchName: "", plan: "BASIC" },
  });

  const plan = watch("plan");

  const onSubmit = async (values: CreateTenantInput) => {
    setServerError(null);
    try {
      const result = await apiRequest<{ tenant: CreateTenantResult }>("/api/platform-admin/tenants", {
        method: "POST",
        body: values,
        refreshPath: "/api/platform-admin/auth/refresh",
      });
      setCreated(result.tenant);
    } catch (error) {
      setServerError(error instanceof ApiClientError ? error.message : "No se pudo crear la clínica.");
    }
  };

  if (created) {
    return <CredentialsRevealDialog tenant={created} />;
  }

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="clinicName">Nombre de la clínica</Label>
            <Input id="clinicName" placeholder="Clínica Veterinaria ABC" {...register("clinicName")} />
            {errors.clinicName && <p className="text-xs font-medium text-destructive">{errors.clinicName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="branchName">Sucursal inicial</Label>
            <Input id="branchName" placeholder="Central" {...register("branchName")} />
            {errors.branchName && <p className="text-xs font-medium text-destructive">{errors.branchName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Plan</Label>
            <Select value={plan} onValueChange={(v) => setValue("plan", v as CreateTenantInput["plan"])}>
              <SelectTrigger id="plan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BASIC">Básico</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Crear clínica
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
