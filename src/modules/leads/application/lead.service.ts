import type { ILeadRepository } from "../domain/repositories";
import type { LeadListResult, LeadStatus } from "../domain/entities";
import type { CreateLeadInput } from "./dto/create-lead.schema";
import type { ListLeadsQuery } from "./dto/list-leads-query.schema";

function emptyToNull(value: string | undefined): string | null {
  return value ? value : null;
}

export class LeadService {
  constructor(private readonly repository: ILeadRepository) {}

  async createLead(input: CreateLeadInput): Promise<string> {
    return this.repository.create({
      fullName: input.fullName,
      email: input.email,
      phone: emptyToNull(input.phone),
      clinicName: emptyToNull(input.clinicName),
      message: emptyToNull(input.message),
      source: input.source,
    });
  }

  async listLeads(query: ListLeadsQuery): Promise<LeadListResult> {
    return this.repository.list({
      status: query.status ?? null,
      source: query.source ?? null,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
  }

  async updateLeadStatus(id: string, status: LeadStatus, actorUserId: string): Promise<void> {
    await this.repository.updateStatus(id, status, actorUserId);
  }
}
