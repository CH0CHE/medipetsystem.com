import type { IMetricsRepository } from "../domain/repositories";
import type { SaasMetrics } from "../domain/entities";

export class MetricsService {
  constructor(private readonly repository: IMetricsRepository) {}

  async getSaasMetrics(): Promise<SaasMetrics> {
    return this.repository.getSaasMetrics();
  }
}
