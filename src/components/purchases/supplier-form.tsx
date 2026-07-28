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
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import { createSupplierSchema, type CreateSupplierInput } from "@/modules/purchases/application/dto/create-supplier.schema";

export function SupplierForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateSupplierInput>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: { name: "", taxId: "", phone: "", email: "", address: "", notes: "" },
  });

  const onSubmit = async (values: CreateSupplierInput) => {
    setServerError(null);
    try {
      await apiRequest("/api/purchases/suppliers", { method: "POST", body: values });
      toast.success("Proveedor creado.");
      router.push("/dashboard/compras/proveedores");
      router.refresh();
    } catch (error) {
      setServerError(error instanceof ApiClientError ? error.message : "No se pudo guardar el proveedor.");
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
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs font-medium text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">NIT / DPI</Label>
              <Input id="taxId" {...register("taxId")} />
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
            Crear proveedor
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
