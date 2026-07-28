"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import {
  updateMarketingPlanSchema,
  type UpdateMarketingPlanInput,
} from "@/modules/content/application/dto/update-marketing-plan.schema";
import type { MarketingPlan } from "@/modules/content/domain/entities";

const REFRESH_PATH = "/api/platform-admin/auth/refresh";
const currency = (n: number) => `Q${n.toFixed(2)}`;

export function MarketingPlansEditor() {
  const [editing, setEditing] = useState<MarketingPlan | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["platform-admin", "content", "plans"],
    queryFn: () => apiRequest<{ plans: MarketingPlan[] }>("/api/platform-admin/content/plans", { refreshPath: REFRESH_PATH }),
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        {data?.plans.map((plan) => (
          <Card key={plan.id} className={plan.highlighted ? "border-secondary shadow-md" : undefined}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {plan.highlighted && (
                  <Badge variant="secondary">
                    <Star className="mr-1 size-3" /> Destacado
                  </Badge>
                )}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-semibold text-foreground">
                {currency(plan.price)}
                <span className="text-sm font-normal text-muted-foreground"> / {plan.billingPeriod}</span>
              </p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {plan.features.map((feature, i) => (
                  <li key={i}>• {feature}</li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => setEditing(plan)}>
                <Pencil className="size-4" /> Editar tarjeta
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          {editing && (
            <PlanEditForm
              plan={editing}
              onSaved={() => {
                queryClient.invalidateQueries({ queryKey: ["platform-admin", "content", "plans"] });
                setEditing(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PlanEditForm({ plan, onSaved }: { plan: MarketingPlan; onSaved: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateMarketingPlanInput>({
    resolver: zodResolver(updateMarketingPlanSchema),
    defaultValues: {
      name: plan.name,
      price: plan.price,
      billingPeriod: plan.billingPeriod,
      description: plan.description,
      features: plan.features,
      highlighted: plan.highlighted,
    },
  });

  const [featuresText, setFeaturesText] = useState(plan.features.join("\n"));
  const highlighted = watch("highlighted");

  useEffect(() => {
    setValue(
      "features",
      featuresText
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuresText]);

  const mutation = useMutation({
    mutationFn: (values: UpdateMarketingPlanInput) =>
      apiRequest(`/api/platform-admin/content/plans/${plan.id}`, { method: "PUT", body: values, refreshPath: REFRESH_PATH }),
    onSuccess: () => {
      toast.success("Tarjeta de precios actualizada.");
      onSaved();
    },
    onError: (error) => {
      setServerError(error instanceof ApiClientError ? error.message : "No se pudo guardar el cambio.");
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        setServerError(null);
        mutation.mutate(values);
      })}
      className="space-y-4"
      noValidate
    >
      <DialogHeader>
        <DialogTitle>Editar tarjeta: {plan.name}</DialogTitle>
        <DialogDescription>Estos cambios se reflejan de inmediato en la sección de precios del sitio público.</DialogDescription>
      </DialogHeader>

      {serverError && <p className="text-sm font-medium text-destructive">{serverError}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Precio (Q)</Label>
          <Input id="price" type="number" step="0.01" {...register("price")} />
          {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="billingPeriod">Periodo de facturación</Label>
        <Input id="billingPeriod" placeholder="mensual" {...register("billingPeriod")} />
        {errors.billingPeriod && <p className="text-xs text-destructive">{errors.billingPeriod.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" rows={2} {...register("description")} />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="features">Características (una por línea)</Label>
        <Textarea id="features" rows={5} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} />
        {errors.features && <p className="text-xs text-destructive">{errors.features.message as string}</p>}
      </div>

      <div className="flex items-center gap-2">
        <Switch id="highlighted" checked={highlighted} onCheckedChange={(v) => setValue("highlighted", v)} />
        <Label htmlFor="highlighted">Marcar como plan destacado</Label>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
          {(isSubmitting || mutation.isPending) && <Loader2 className="size-4 animate-spin" />}
          Guardar cambios
        </Button>
      </DialogFooter>
    </form>
  );
}
