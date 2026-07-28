import Link from "next/link";
import type { Metadata } from "next";
import {
  Users,
  PawPrint,
  FileText,
  Package,
  Receipt,
  ShoppingCart,
  CalendarDays,
  BarChart3,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PulseLine } from "@/components/auth/pulse-line";
import { PricingSection } from "@/components/public/pricing-section";
import { BlogPreview } from "@/components/public/blog-preview";
import { FaqAccordion } from "@/components/public/faq-accordion";

export const metadata: Metadata = {
  title: "Software para clínicas veterinarias",
  description:
    "MediPet System centraliza pacientes, expedientes clínicos, inventario, facturación, compras, agenda y reportes de tu clínica veterinaria en una sola plataforma.",
};

const MODULES = [
  { icon: Users, title: "CRM y propietarios", description: "Historial de clientes, estado de cuenta y notas en un solo lugar." },
  { icon: PawPrint, title: "Pacientes", description: "Ficha completa de cada mascota: especie, raza, peso, microchip y estado." },
  { icon: FileText, title: "Expediente clínico", description: "Consultas, diagnósticos, vacunas, cirugías y adjuntos de laboratorio." },
  { icon: Package, title: "Inventario", description: "Control de existencias, lotes, vencimientos y alertas automáticas." },
  { icon: Receipt, title: "Facturación", description: "Cotizaciones, facturas y notas de crédito con descuento de stock automático." },
  { icon: ShoppingCart, title: "Compras", description: "Órdenes de compra y recepción con actualización automática de inventario." },
  { icon: CalendarDays, title: "Agenda médica", description: "Calendario de citas con recordatorios y confirmaciones." },
  { icon: BarChart3, title: "Reportes gerenciales", description: "Ventas, inventario, morosidad y rentabilidad exportables a PDF y Excel." },
  { icon: Building2, title: "Multi sucursal", description: "Administra varias sucursales y usuarios desde una sola cuenta." },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-primary px-6 py-20 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(38,198,184,0.22),transparent_55%)]" />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
          <span className="rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary">
            Plataforma SaaS veterinaria
          </span>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-primary-foreground sm:text-5xl">
            Todo tu hospital veterinario, en un solo sistema
          </h1>
          <p className="max-w-2xl text-balance text-primary-foreground/80 sm:text-lg">
            MediPet System centraliza pacientes, expedientes clínicos, inventario, facturación, compras, agenda y
            reportes gerenciales — multi sucursal y multi usuario, listo para escalar con tu clínica.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/demo">
                Solicitar demo <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link href="/precios">Ver precios</Link>
            </Button>
          </div>
          <div className="mt-4 w-full max-w-lg text-secondary">
            <PulseLine className="h-14 w-full" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Un sistema, todos los procesos de tu clínica
          </h2>
          <p className="mt-3 text-muted-foreground">
            Diseñado como producto SaaS enterprise, preparado para miles de clínicas y múltiples sucursales por
            cliente.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((mod) => (
            <div key={mod.title} className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <mod.icon className="size-5" />
              </div>
              <h3 className="font-semibold text-foreground">{mod.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{mod.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Planes para cada etapa de tu clínica</h2>
            <p className="mt-3 text-muted-foreground">Sin contratos forzosos. Cambia de plan cuando tu clínica crezca.</p>
          </div>
          <div className="mt-12">
            <PricingSection />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Del blog</h2>
            <p className="mt-2 text-muted-foreground">Noticias y novedades de MediPet System.</p>
          </div>
          <Link href="/blog" className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex">
            Ver todo <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <BlogPreview />
      </section>

      <section className="bg-card px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Preguntas frecuentes</h2>
          </div>
          <FaqAccordion limit={5} />
          <div className="mt-8 text-center">
            <Link href="/faq" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Ver todas las preguntas <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-2xl bg-primary px-8 py-14 text-center">
          <h2 className="text-balance text-2xl font-semibold text-primary-foreground sm:text-3xl">
            ¿Listo para digitalizar tu clínica veterinaria?
          </h2>
          <p className="max-w-xl text-primary-foreground/80">
            Agenda una demo con nuestro equipo y descubre cómo MediPet System se adapta a tu clínica.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/demo">
              Solicitar demo <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
