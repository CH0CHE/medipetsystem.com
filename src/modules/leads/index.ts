import { LeadService } from "./application/lead.service";
import { leadRepository } from "./infrastructure/lead.repository";

export const leadService = new LeadService(leadRepository);

export * from "./domain/entities";
export * from "./domain/permissions";
export { createLeadSchema, type CreateLeadInput } from "./application/dto/create-lead.schema";
export { listLeadsQuerySchema, type ListLeadsQuery } from "./application/dto/list-leads-query.schema";
export { updateLeadStatusSchema, type UpdateLeadStatusInput } from "./application/dto/update-lead-status.schema";
