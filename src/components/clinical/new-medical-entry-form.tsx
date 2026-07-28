"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import type { MedicalEntryType } from "@/modules/medical-records/domain/entities";

const TYPE_OPTIONS: { value: MedicalEntryType; label: string }[] = [
  { value: "CONSULTA", label: "Consulta" },
  { value: "VACUNA", label: "Vacuna" },
  { value: "CIRUGIA", label: "Cirugía" },
  { value: "HOSPITALIZACION", label: "Hospitalización" },
  { value: "MEDICAMENTO", label: "Medicamento" },
];

const today = () => new Date().toISOString().slice(0, 10);

export function NewMedicalEntryForm({ petId, onCreated }: { petId: string; onCreated: () => void }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<MedicalEntryType>("CONSULTA");
  const [entryDate, setEntryDate] = useState(today());
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Campos específicos por tipo
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [vaccineName, setVaccineName] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [procedureName, setProcedureName] = useState("");
  const [outcome, setOutcome] = useState("");
  const [admissionDate, setAdmissionDate] = useState(today());
  const [dischargeDate, setDischargeDate] = useState("");
  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const base = { entryDate, title, notes };
      const payload =
        type === "CONSULTA"
          ? { type, ...base, symptoms, diagnosis, treatment }
          : type === "VACUNA"
            ? { type, ...base, vaccineName, nextDueDate }
            : type === "CIRUGIA"
              ? { type, ...base, procedureName, outcome }
              : type === "HOSPITALIZACION"
                ? { type, ...base, admissionDate, dischargeDate }
                : { type, ...base, medicationName, dosage, frequency, startDate, endDate };

      return apiRequest(`/api/clinical/pets/${petId}/records`, { method: "POST", body: payload });
    },
    onSuccess: () => {
      toast.success("Entrada agregada al expediente.");
      queryClient.invalidateQueries({ queryKey: ["medical-entries", petId] });
      setTitle("");
      setNotes("");
      setSymptoms("");
      setDiagnosis("");
      setTreatment("");
      onCreated();
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "No se pudo guardar la entrada.");
    },
  });

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo de entrada</Label>
            <Select value={type} onValueChange={(v) => setType(v as MedicalEntryType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entryDate">Fecha</Label>
            <Input id="entryDate" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Título / resumen</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Chequeo anual" />
          </div>

          {type === "CONSULTA" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="symptoms">Síntomas</Label>
                <Input id="symptoms" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnóstico</Label>
                <Input id="diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="treatment">Tratamiento</Label>
                <Input id="treatment" value={treatment} onChange={(e) => setTreatment(e.target.value)} />
              </div>
            </>
          )}

          {type === "VACUNA" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="vaccineName">Vacuna</Label>
                <Input id="vaccineName" value={vaccineName} onChange={(e) => setVaccineName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextDueDate">Próxima dosis</Label>
                <Input id="nextDueDate" type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
              </div>
            </>
          )}

          {type === "CIRUGIA" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="procedureName">Procedimiento</Label>
                <Input id="procedureName" value={procedureName} onChange={(e) => setProcedureName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outcome">Resultado</Label>
                <Input id="outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} />
              </div>
            </>
          )}

          {type === "HOSPITALIZACION" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="admissionDate">Fecha de ingreso</Label>
                <Input id="admissionDate" type="date" value={admissionDate} onChange={(e) => setAdmissionDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dischargeDate">Fecha de alta</Label>
                <Input id="dischargeDate" type="date" value={dischargeDate} onChange={(e) => setDischargeDate(e.target.value)} />
              </div>
            </>
          )}

          {type === "MEDICAMENTO" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="medicationName">Medicamento</Label>
                <Input id="medicationName" value={medicationName} onChange={(e) => setMedicationName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosis</Label>
                <Input id="dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frecuencia</Label>
                <Input id="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Inicio</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fin</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </>
          )}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notas</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <Button
          type="button"
          disabled={!title || mutation.isPending}
          onClick={() => {
            setError(null);
            mutation.mutate();
          }}
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Agregar al expediente
        </Button>
      </CardContent>
    </Card>
  );
}
