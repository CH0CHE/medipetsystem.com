import { QuoteService } from "./application/quote.service";
import { InvoiceService } from "./application/invoice.service";
import { quoteRepository } from "./infrastructure/quote.repository";
import { invoiceRepository } from "./infrastructure/invoice.repository";

export const quoteService = new QuoteService(quoteRepository);
export const invoiceService = new InvoiceService(invoiceRepository);

export * from "./domain/entities";
export * from "./domain/permissions";
export { documentItemSchema, type DocumentItemInput } from "./application/dto/document-item.schema";
export { createQuoteSchema, type CreateQuoteInput } from "./application/dto/create-quote.schema";
export { createInvoiceSchema, type CreateInvoiceInput } from "./application/dto/create-invoice.schema";
export { registerPaymentSchema, type RegisterPaymentInput } from "./application/dto/register-payment.schema";
export { createAdjustmentSchema, type CreateAdjustmentInput } from "./application/dto/create-adjustment.schema";
export { listQuotesQuerySchema, type ListQuotesQuery } from "./application/dto/list-quotes.schema";
export { listInvoicesQuerySchema, type ListInvoicesQuery } from "./application/dto/list-invoices.schema";
