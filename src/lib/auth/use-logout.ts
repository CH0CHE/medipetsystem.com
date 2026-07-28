"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api/client";

export function useLogout(portal: "tenant" | "platform-admin") {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const logoutPath = portal === "tenant" ? "/api/auth/logout" : "/api/platform-admin/auth/logout";
  const loginPath = portal === "tenant" ? "/login" : "/platform-admin/login";

  const logout = async () => {
    setLoggingOut(true);
    try {
      await apiRequest(logoutPath, { method: "POST", skipAuthRetry: true });
    } finally {
      router.push(loginPath);
      router.refresh();
    }
  };

  return { logout, loggingOut };
}
