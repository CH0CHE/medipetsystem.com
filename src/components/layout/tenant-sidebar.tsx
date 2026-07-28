"use client";

import Image from "next/image";
import { NavItem } from "./nav-item";
import { TENANT_NAV_GROUPS } from "./tenant-nav-data";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useUiStore } from "@/lib/store/ui-store";

function SidebarBody() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <Image src="/logo-icono-sin-letras.png" alt="" width={32} height={32} className="size-8" />
        <span className="font-semibold text-foreground">MediPet System</span>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {TENANT_NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavItem key={item.label} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

export function TenantSidebar() {
  const { mobileNavOpen, setMobileNavOpen } = useUiStore();

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
        <SidebarBody />
      </aside>
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarBody />
        </SheetContent>
      </Sheet>
    </>
  );
}
