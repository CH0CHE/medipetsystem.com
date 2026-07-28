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
import { OwnerCombobox } from "./owner-combobox";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import { createPetSchema, type CreatePetInput } from "@/modules/pets/application/dto/create-pet.schema";
import { updatePetSchema, type UpdatePetInput } from "@/modules/pets/application/dto/update-pet.schema";
import type { PetDetail } from "@/modules/pets/domain/entities";

const STATUS_OPTIONS = [
  { value: "ACTIVO", label: "Activo" },
  { value: "EN_OBSERVACION", label: "En observación" },
  { value: "HOSPITALIZADO", label: "Hospitalizado" },
  { value: "RECUPERADO", label: "Recuperado" },
  { value: "FALLECIDO", label: "Fallecido" },
];

export function PetForm({ pet }: { pet?: PetDetail }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const isEdit = !!pet;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreatePetInput & Partial<UpdatePetInput>>({
    resolver: zodResolver(isEdit ? updatePetSchema : createPetSchema),
    defaultValues: {
      ownerId: pet?.ownerId ?? "",
      name: pet?.name ?? "",
      species: pet?.species ?? "",
      breed: pet?.breed ?? "",
      sex: pet?.sex ?? undefined,
      birthDate: pet?.birthDate ? new Date(pet.birthDate).toISOString().slice(0, 10) : "",
      weightKg: pet?.weightKg ?? undefined,
      color: pet?.color ?? "",
      photoUrl: pet?.photoUrl ?? "",
      microchipNumber: pet?.microchipNumber ?? "",
      status: pet?.status ?? "ACTIVO",
      notes: pet?.notes ?? "",
    },
  });

  const sex = watch("sex");
  const status = watch("status");
  const ownerId = watch("ownerId");

  const onSubmit = async (values: CreatePetInput & Partial<UpdatePetInput>) => {
    setServerError(null);
    if (!isEdit && !ownerId) {
      setOwnerError("Selecciona un propietario.");
      return;
    }
    try {
      if (isEdit) {
        await apiRequest(`/api/crm/pets/${pet.petId}`, { method: "PATCH", body: values });
        toast.success("Paciente actualizado.");
      } else {
        await apiRequest("/api/crm/pets", { method: "POST", body: values });
        toast.success("Paciente creado.");
      }
      router.push("/dashboard/pacientes");
      router.refresh();
    } catch (error) {
      setServerError(error instanceof ApiClientError ? error.message : "No se pudo guardar el paciente.");
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

          <div className="space-y-2">
            <Label>Propietario</Label>
            {isEdit ? (
              <p className="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-foreground">
                {pet.ownerName}
              </p>
            ) : (
              <OwnerCombobox
                value={ownerId || null}
                onChange={(id) => {
                  setValue("ownerId", id);
                  setOwnerError(null);
                }}
                error={ownerError ?? errors.ownerId?.message}
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs font-medium text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="species">Especie</Label>
              <Input id="species" placeholder="Perro, gato, ave..." {...register("species")} />
              {errors.species && <p className="text-xs font-medium text-destructive">{errors.species.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="breed">Raza</Label>
              <Input id="breed" {...register("breed")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex">Sexo</Label>
              <Select value={sex} onValueChange={(v) => setValue("sex", v as "MACHO" | "HEMBRA")}>
                <SelectTrigger id="sex">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MACHO">Macho</SelectItem>
                  <SelectItem value="HEMBRA">Hembra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Fecha de nacimiento</Label>
              <Input id="birthDate" type="date" {...register("birthDate")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weightKg">Peso (kg)</Label>
              <Input id="weightKg" type="number" step="0.1" {...register("weightKg")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" {...register("color")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="microchipNumber">Microchip</Label>
              <Input id="microchipNumber" {...register("microchipNumber")} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="photoUrl">URL de fotografía</Label>
              <Input id="photoUrl" placeholder="https://..." {...register("photoUrl")} />
              {errors.photoUrl && <p className="text-xs font-medium text-destructive">{errors.photoUrl.message}</p>}
            </div>

            {isEdit && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select value={status} onValueChange={(v) => setValue("status", v as UpdatePetInput["status"])}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Input id="notes" {...register("notes")} />
                </div>
              </>
            )}
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear paciente"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
