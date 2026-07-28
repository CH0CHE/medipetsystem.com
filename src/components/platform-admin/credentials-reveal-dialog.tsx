"use client";

import { useRouter } from "next/navigation";
import { Copy, ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CreateTenantResult } from "@/modules/platform-admin/domain/entities";

function CredentialRow({
  label,
  username,
  password,
  testId,
}: {
  label: string;
  username: string;
  password: string;
  testId: string;
}) {
  const copy = async (value: string, what: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${what} copiado al portapapeles.`);
  };

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-sm text-foreground" data-testid={`${testId}-username`}>
            {username}
          </span>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => copy(username, "Usuario")}>
            <Copy className="size-3.5" />
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-sm text-foreground" data-testid={`${testId}-password`}>
            {password}
          </span>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => copy(password, "Contraseña")}>
            <Copy className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CredentialsRevealDialog({ tenant }: { tenant: CreateTenantResult }) {
  const router = useRouter();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.push("/platform-admin/dashboard/clientes");
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="size-5" />
            <DialogTitle>Cliente creado exitosamente</DialogTitle>
          </div>
          <DialogDescription>
            Código de tenant <Badge variant="mono">{tenant.tenantCode}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <p>Estas contraseñas no se volverán a mostrar. Cópialas y entrégalas de forma segura ahora.</p>
        </div>

        <div className="space-y-3">
          <CredentialRow
            label="Usuario Administrador"
            username={tenant.adminUsername}
            password={tenant.adminTemporaryPassword}
            testId="admin"
          />
          <CredentialRow
            label="Usuario Conector (soporte MediPet)"
            username={tenant.connectorUsername}
            password={tenant.connectorTemporaryPassword}
            testId="connector"
          />
        </div>

        <DialogFooter>
          <Button className="w-full" onClick={() => router.push("/platform-admin/dashboard/clientes")}>
            Ir al listado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
