export interface BranchSummary {
  id: string;
  tenantId: string;
  name: string;
  isMain: boolean;
  status: "ACTIVE" | "INACTIVE";
}
