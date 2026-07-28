import { Building2, CreditCard, LineChart, LifeBuoy, ScrollText } from "lucide-react";
import type { NavItemData } from "./nav-item";
import type { NavGroup } from "./tenant-nav-data";

export const PLATFORM_ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    title: "MediPet Admin",
    items: [
      { label: "Clientes", href: "/platform-admin/dashboard/clientes", icon: Building2, enabled: true },
      { label: "Planes", icon: CreditCard, enabled: false },
      { label: "Métricas SaaS", icon: LineChart, enabled: false },
      { label: "Soporte", icon: LifeBuoy, enabled: false },
      { label: "Auditoría", icon: ScrollText, enabled: false },
    ] satisfies NavItemData[],
  },
];
