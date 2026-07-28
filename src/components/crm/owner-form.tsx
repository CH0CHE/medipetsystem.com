"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import { createOwnerSchema, type CreateOwnerInput } from "@/modules/owners/application/dto/create-owner.schema";
import { updateOwnerSchema, type UpdateOwnerInput } from "@/modules/owners/application/dto/update-owner.schema";
import type { OwnerDetail } from "@/modules/owners/domain/entities";

export function OwnerForm({ owner }: { owner?: OwnerDetail }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = !!owner;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateOwnerInput>({
    resolver: zodResolver(isEdit ? updateOwnerSchema : createOwnerSchema),
    defaultValues: {
      fullName: owner?.fullName ?? "",
      documentId: owner?.documentId ?? "",
      phone: owner?.phone ?? "",
      email: owner?.email ?? "",
      address: owner?.address ?? "",
      notes: owner?.notes ?? "",
      financialStatus: owner?.financialStatus ?? "SOLVENTE",
    },
  });

  const financialStatus = watch("financialStatus");

  const onSubmit = async (values: CreateOwnerInput | UpdateOwnerInput) => {
    setServerError(null);
    try {
      if (isEdit) {
        await apiRequest(`/api/crm/owners/${owner.ownerId}`, { method: "PATCH", body: values });
        toast.success("Propietario actualizado.");
      } else {
        await apiRequest("/api/crm/owners", { method: "POST", body: values });
        toast.success("Propietario creado.");
      }
      router.push("/dashboard/propietarios");
      router.refresh();
    } catch (error) {
      setServerError(error instanceof ApiClientError ? error.message : "No se pudo guardar el propietario.");
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input id="fullName" {...register("fullName")} />
              {errors.fullName && <p className="text-xs font-medium text-destructive">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentId">DPI / NIT</Label>
              <Input id="documentId" {...register("documentId")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...register("phone")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
            </div>

            {isEdit && (
              <div className="space-y-2">
                <Label htmlFor="financialStatus">Estado financiero</Label>
                <Select
                  value={financialStatus}
                  onValueChange={(v) => setValue("financialStatus", v as UpdateOwnerInput["financialStatus"])}
                >
                  <SelectTrigger id="financialStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOLVENTE">Solvente</SelectItem>
                    <SelectItem value="MOROSO">Moroso</SelectItem>
                    <SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" {...register("address")} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Input id="notes" {...register("notes")} />
            </div>
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear propietario"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
