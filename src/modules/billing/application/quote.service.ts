import type { IQuoteRepository } from "../domain/repositories";
import type { DocumentStatus, QuoteDetail, QuoteListResult } from "../domain/entities";
import type { CreateQuoteInput } from "./dto/create-quote.schema";

function emptyToNull(value: string | undefined): string | null {
  return value ? value : null;
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function requiredDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Fecha inválida.");
  return date;
}

export class QuoteService {
  constructor(private readonly repository: IQuoteRepository) {}

  async createQuote(tenantId: string, branchId: string, input: CreateQuoteInput, actorUserId: string): Promise<string> {
    return this.repository.create({
      tenantId,
      ownerId: input.ownerId,
      branchId,
      issueDate: requiredDate(input.issueDate),
      expiryDate: parseDate(input.expiryDate),
      items: input.items,
      notes: emptyToNull(input.notes),
      actorUserId,
    });
  }

  async listQuotes(
    tenantId: string,
    query: { ownerId?: string; status?: DocumentStatus; page: number; pageSize: number },
  ): Promise<QuoteListResult> {
    return this.repository.list({
      tenantId,
      ownerId: query.ownerId ?? null,
      status: query.status ?? null,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
  }

  async getQuote(tenantId: string, quoteId: string): Promise<QuoteDetail | null> {
    return this.repository.get(tenantId, quoteId);
  }
}
