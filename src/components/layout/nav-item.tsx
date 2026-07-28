"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface NavItemData {
  label: string;
  href?: string;
  icon: LucideIcon;
  enabled: boolean;
}

export function NavItem({ label, href, icon: Icon, enabled }: NavItemData) {
  const pathname = usePathname();
  const isActive = enabled && href && pathname === href;

  const content = (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        enabled
          ? isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-foreground hover:bg-muted"
          : "cursor-not-allowed text-muted-foreground/60",
      )}
      aria-disabled={!enabled}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {!enabled && (
        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-semibold">
          Próximamente
        </Badge>
      )}
    </div>
  );

  if (!enabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{content}</div>
        </TooltipTrigger>
        <TooltipContent side="right">Disponible en una próxima fase</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link href={href!} aria-current={isActive ? "page" : undefined}>
      {content}
    </Link>
  );
}
