import { ReportService } from "./application/report.service";
import { reportRepository } from "./infrastructure/report.repository";

export const reportService = new ReportService(reportRepository);

export * from "./domain/entities";
export * from "./domain/permissions";
export { dateRangeQuerySchema, type DateRangeQuery } from "./application/dto/date-range.schema";
