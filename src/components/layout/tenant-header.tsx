"use client";

import Link from "next/link";
import { Menu, Bell, ChevronDown, KeyRound, LogOut, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUiStore } from "@/lib/store/ui-store";
import { useSession } from "@/lib/auth/use-session";
import { useLogout } from "@/lib/auth/use-logout";

function initials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

export function TenantHeader() {
  const { setMobileNavOpen } = useUiStore();
  const { data: session, isLoading } = useSession("tenant");
  const { logout, loggingOut } = useLogout("tenant");

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNavOpen(true)}>
          <Menu className="size-5" />
        </Button>

        {isLoading ? (
          <Skeleton className="h-8 w-40" />
        ) : (
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary" variant="outline">
              {session?.tenantName}
            </Badge>
            <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground" disabled>
              <Building2 className="size-3.5" />
              {session?.branchName ?? "Sucursal"}
              <ChevronDown className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" disabled className="text-muted-foreground/60">
              <Bell className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notificaciones — próximamente</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-secondary/15 text-xs font-semibold text-secondary-hover">
                {session ? initials(session.username) : "··"}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium leading-none text-foreground">
                  {session?.username}
                </span>
                <span className="text-xs text-muted-foreground">{session?.roles[0]}</span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{session?.username}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/change-password">
                <KeyRound className="mr-2 size-4" /> Cambiar contraseña
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" disabled={loggingOut} onClick={() => logout()}>
              <LogOut className="mr-2 size-4" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
