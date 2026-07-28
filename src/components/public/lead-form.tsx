"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import { createLeadSchema, type CreateLeadInput } from "@/modules/leads/application/dto/create-lead.schema";
import type { LeadSource } from "@/modules/leads/domain/entities";

export function LeadForm({ source, showClinicName }: { source: LeadSource; showClinicName?: boolean }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: { fullName: "", email: "", phone: "", clinicName: "", message: "", source },
  });

  if (submitted) {
    return (
      <Card className="max-w-xl">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <CheckCircle2 className="size-10 text-success" />
          <h3 className="text-lg font-semibold text-foreground">¡Gracias por escribirnos!</h3>
          <p className="text-sm text-muted-foreground">
            Nuestro equipo se pondrá en contacto contigo a la brevedad.
          </p>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = async (values: CreateLeadInput) => {
    setServerError(null);
    try {
      await apiRequest("/api/public/leads", { method: "POST", body: { ...values, source } });
      setSubmitted(true);
    } catch (error) {
      setServerError(error instanceof ApiClientError ? error.message : "No se pudo enviar el formulario. Intenta de nuevo.");
    }
  };

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input id="fullName" {...register("fullName")} />
            {errors.fullName && <p className="text-xs font-medium text-destructive">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono (opcional)</Label>
            <Input id="phone" {...register("phone")} />
          </div>

          {showClinicName && (
            <div className="space-y-1.5">
              <Label htmlFor="clinicName">Nombre de la clínica</Label>
              <Input id="clinicName" {...register("clinicName")} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="message">Mensaje (opcional)</Label>
            <Textarea id="message" rows={4} {...register("message")} />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Enviar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
