import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Panel MediPet Admin" };

export default function PlatformAdminOverviewPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Panel MediPet Admin</h1>
        <p className="text-sm text-muted-foreground">
          Administración de clientes (clínicas), planes y soporte de la plataforma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex size-11 items-center justify-center rounded-xl bg-pa-bg/10 text-pa-turquoise">
            <Building2 className="size-5" />
          </div>
          <CardTitle className="mt-3">Clientes</CardTitle>
          <CardDescription>
            Alta, baja y suspensión de clínicas. Al crear un cliente se generan automáticamente sus
            usuarios ADMIN y CONECTOR.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/platform-admin/dashboard/clientes">
              Ir al listado de clientes <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
