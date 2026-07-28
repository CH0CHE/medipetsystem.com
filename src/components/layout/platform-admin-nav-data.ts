import { Building2, CreditCard, LineChart, LifeBuoy, ScrollText, Tags, Newspaper, HelpCircle, Inbox } from "lucide-react";
import type { NavItemData } from "./nav-item";
import type { NavGroup } from "./tenant-nav-data";

export const PLATFORM_ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    title: "MediPet Admin",
    items: [
      { label: "Clientes", href: "/platform-admin/dashboard/clientes", icon: Building2, enabled: true },
      { label: "Planes", href: "/platform-admin/dashboard/planes", icon: CreditCard, enabled: true },
      { label: "Métricas SaaS", href: "/platform-admin/dashboard/metricas", icon: LineChart, enabled: true },
      { label: "Soporte", href: "/platform-admin/dashboard/soporte", icon: LifeBuoy, enabled: true },
      { label: "Auditoría", href: "/platform-admin/dashboard/auditoria", icon: ScrollText, enabled: true },
    ] satisfies NavItemData[],
  },
  {
    title: "Portal Público",
    items: [
      { label: "Precios", href: "/platform-admin/dashboard/precios", icon: Tags, enabled: true },
      { label: "Blog", href: "/platform-admin/dashboard/blog", icon: Newspaper, enabled: true },
      { label: "FAQ", href: "/platform-admin/dashboard/faq", icon: HelpCircle, enabled: true },
      { label: "Leads", href: "/platform-admin/dashboard/leads", icon: Inbox, enabled: true },
    ] satisfies NavItemData[],
  },
];
