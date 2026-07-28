"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import type { PasswordPolicy } from "@/lib/security/password-policy";

interface ToggleRow {
  key: keyof Pick<PasswordPolicy, "requireUppercase" | "requireLowercase" | "requireNumber" | "requireSymbol">;
  label: string;
}

const TOGGLES: ToggleRow[] = [
  { key: "requireUppercase", label: "Exigir al menos una mayúscula" },
  { key: "requireLowercase", label: "Exigir al menos una minúscula" },
  { key: "requireNumber", label: "Exigir al menos un número" },
  { key: "requireSymbol", label: "Exigir al menos un símbolo especial" },
];

export function PasswordPolicyForm() {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [draft, setDraft] = useState<PasswordPolicy | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["password-policy"],
    queryFn: () => apiRequest<{ policy: PasswordPolicy }>("/api/settings/password-policy").then((r) => r.policy),
  });

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (policy: PasswordPolicy) => apiRequest("/api/settings/password-policy", { method: "PUT", body: policy }),
    onSuccess: () => {
      toast.success("Política de contraseñas actualizada.");
      queryClient.invalidateQueries({ queryKey: ["password-policy"] });
    },
    onError: (error) => setServerError(error instanceof ApiClientError ? error.message : "No se pudo guardar la política."),
  });

  if (isLoading || !draft) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        {serverError && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="minLength">Longitud mínima</Label>
          <Input
            id="minLength"
            type="number"
            min={6}
            max={128}
            className="w-32"
            value={draft.minLength}
            onChange={(e) => setDraft({ ...draft, minLength: Number(e.target.value) })}
          />
        </div>

        <div className="space-y-3">
          {TOGGLES.map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between rounded-md border border-border p-3">
              <Label htmlFor={toggle.key} className="cursor-pointer">
                {toggle.label}
              </Label>
              <Switch
                id={toggle.key}
                checked={draft[toggle.key]}
                onCheckedChange={(checked) => setDraft({ ...draft, [toggle.key]: checked })}
              />
            </div>
          ))}
        </div>

        <Button
          size="lg"
          disabled={mutation.isPending}
          onClick={() => {
            setServerError(null);
            mutation.mutate(draft);
          }}
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Guardar cambios
        </Button>
      </CardContent>
    </Card>
  );
}
