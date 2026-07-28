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
import { createProductSchema, type CreateProductInput } from "@/modules/inventory/application/dto/create-product.schema";
import { updateProductSchema, type UpdateProductInput } from "@/modules/inventory/application/dto/update-product.schema";
import type { ProductDetail } from "@/modules/inventory/domain/entities";

export function ProductForm({ product }: { product?: ProductDetail }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductInput & Partial<UpdateProductInput>>({
    resolver: zodResolver(isEdit ? updateProductSchema : createProductSchema),
    defaultValues: {
      sku: product?.sku ?? "",
      internalCode: product?.internalCode ?? "",
      name: product?.name ?? "",
      category: product?.category ?? "",
      costPrice: product?.costPrice ?? 0,
      salePrice: product?.salePrice ?? 0,
      minStock: product?.minStock ?? 0,
    },
  });

  const onSubmit = async (values: CreateProductInput & Partial<UpdateProductInput>) => {
    setServerError(null);
    try {
      if (isEdit) {
        await apiRequest(`/api/inventory/products/${product.productId}`, { method: "PATCH", body: values });
        toast.success("Producto actualizado.");
      } else {
        await apiRequest("/api/inventory/products", { method: "POST", body: values });
        toast.success("Producto creado.");
      }
      router.push("/dashboard/inventario");
      router.refresh();
    } catch (error) {
      setServerError(error instanceof ApiClientError ? error.message : "No se pudo guardar el producto.");
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
            {!isEdit && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" {...register("sku")} />
                  {errors.sku && <p className="text-xs font-medium text-destructive">{errors.sku.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internalCode">Código interno</Label>
                  <Input id="internalCode" {...register("internalCode")} />
                </div>
              </>
            )}

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs font-medium text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Input id="category" {...register("category")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStock">Existencia mínima</Label>
              <Input id="minStock" type="number" {...register("minStock")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPrice">Costo</Label>
              <Input id="costPrice" type="number" step="0.01" {...register("costPrice")} />
              {errors.costPrice && <p className="text-xs font-medium text-destructive">{errors.costPrice.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salePrice">Precio</Label>
              <Input id="salePrice" type="number" step="0.01" {...register("salePrice")} />
              {errors.salePrice && <p className="text-xs font-medium text-destructive">{errors.salePrice.message}</p>}
            </div>
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear producto"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
