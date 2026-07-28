import type { LeadListResult, LeadSource, LeadStatus } from "./entities";

export interface ILeadRepository {
  create(input: {
    fullName: string;
    email: string;
    phone: string | null;
    clinicName: string | null;
    message: string | null;
    source: LeadSource;
  }): Promise<string>;

  list(input: { status: LeadStatus | null; source: LeadSource | null; limit: number; offset: number }): Promise<LeadListResult>;

  updateStatus(id: string, status: LeadStatus, actorUserId: string): Promise<void>;
}
