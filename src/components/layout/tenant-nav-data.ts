import {
  LayoutDashboard,
  PawPrint,
  Users,
  FileText,
  Calendar,
  Package,
  Receipt,
  ShoppingCart,
  BarChart3,
  ShieldCheck,
  Building2,
  Settings,
} from "lucide-react";
import type { NavItemData } from "./nav-item";

export interface NavGroup {
  title: string;
  items: NavItemData[];
}

export const TENANT_NAV_GROUPS: NavGroup[] = [
  {
    title: "General",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, enabled: true }],
  },
  {
    title: "Clínica",
    items: [
      { label: "Pacientes", href: "/dashboard/pacientes", icon: PawPrint, enabled: true },
      { label: "Propietarios (CRM)", href: "/dashboard/propietarios", icon: Users, enabled: true },
      { label: "Expediente médico", href: "/dashboard/pacientes", icon: FileText, enabled: true },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { label: "Agenda", icon: Calendar, enabled: false },
      { label: "Inventario", href: "/dashboard/inventario", icon: Package, enabled: true },
      { label: "Facturación", href: "/dashboard/facturacion", icon: Receipt, enabled: true },
      { label: "Compras", href: "/dashboard/compras", icon: ShoppingCart, enabled: true },
    ],
  },
  {
    title: "Analítica",
    items: [{ label: "Reportes", href: "/dashboard/reportes", icon: BarChart3, enabled: true }],
  },
  {
    title: "Sistema",
    items: [
      { label: "Usuarios y roles", icon: ShieldCheck, enabled: false },
      { label: "Sucursales", icon: Building2, enabled: false },
      { label: "Configuración", href: "/dashboard/configuracion", icon: Settings, enabled: true },
    ],
  },
];
