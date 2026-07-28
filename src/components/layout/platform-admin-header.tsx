"use client";

import { Menu, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

export function PlatformAdminHeader() {
  const { setMobileNavOpen } = useUiStore();
  const { data: session, isLoading } = useSession("platform-admin");
  const { logout, loggingOut } = useLogout("platform-admin");

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNavOpen(true)}>
          <Menu className="size-5" />
        </Button>
        <span className="text-sm font-medium text-muted-foreground">Portal Administrativo MediPet</span>
      </div>

      {isLoading ? (
        <Skeleton className="h-9 w-32" />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-pa-bg/10 text-pa-turquoise">
                <ShieldCheck className="size-4" />
              </span>
              <span className="hidden text-sm font-medium text-foreground sm:block">{session?.username}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Super Admin MediPet</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={loggingOut} onClick={() => logout()}>
              <LogOut className="mr-2 size-4" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
