"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import type { SessionContext } from "@/modules/auth/domain/entities";

export function useSession(portal: "tenant" | "platform-admin") {
  const path = portal === "tenant" ? "/api/auth/me" : "/api/platform-admin/auth/me";
  const refreshPath = portal === "tenant" ? "/api/auth/refresh" : "/api/platform-admin/auth/refresh";

  return useQuery({
    queryKey: ["session", portal],
    queryFn: () => apiRequest<{ user: SessionContext }>(path, { refreshPath }).then((r) => r.user),
  });
}
