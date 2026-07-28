export interface UserSummary {
  id: string;
  tenantId: string | null;
  branchId: string | null;
  username: string;
  status: "ACTIVE" | "DISABLED" | "LOCKED";
  roles: string[];
}
