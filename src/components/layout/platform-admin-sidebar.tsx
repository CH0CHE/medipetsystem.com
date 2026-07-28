"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PLATFORM_ADMIN_NAV_GROUPS } from "./platform-admin-nav-data";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useUiStore } from "@/lib/store/ui-store";
import { cn } from "@/lib/utils";

function SidebarBody() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-pa-bg text-slate-100">
      <div className="flex items-center gap-2 px-4 py-5">
        <Image src="/logo-icono-sin-letras.png" alt="" width={30} height={30} className="size-[30px]" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">MediPet System</p>
          <p className="text-[11px] uppercase tracking-wider text-pa-turquoise">Staff Portal</p>
        </div>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {PLATFORM_ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = item.enabled && item.href && pathname === item.href;
                const Icon = item.icon;
                const content = (
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      item.enabled
                        ? isActive
                          ? "bg-pa-turquoise/15 text-pa-turquoise"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                        : "cursor-not-allowed text-slate-600",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {!item.enabled && (
                      <Badge className="border-transparent bg-white/5 px-1.5 py-0 text-[10px] font-semibold text-slate-400">
                        Próximamente
                      </Badge>
                    )}
                  </div>
                );

                if (!item.enabled) {
                  return (
                    <Tooltip key={item.label}>
                      <TooltipTrigger asChild>
                        <div>{content}</div>
                      </TooltipTrigger>
                      <TooltipContent side="right">Disponible en una próxima fase</TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <Link key={item.label} href={item.href!}>
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

export function PlatformAdminSidebar() {
  const { mobileNavOpen, setMobileNavOpen } = useUiStore();

  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block">
        <SidebarBody />
      </aside>
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 border-white/10 bg-pa-bg p-0">
          <SidebarBody />
        </SheetContent>
      </Sheet>
    </>
  );
}
