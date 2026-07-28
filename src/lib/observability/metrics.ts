/**
 * Contadores operacionales en memoria — Edge-safe, sin dependencia externa.
 *
 * Importante: Next.js ejecuta el middleware en el Edge Runtime y las API
 * routes normales en el runtime de Node — son dos sandboxes de JS distintos
 * que **no comparten memoria**, aunque corran dentro del mismo proceso del
 * servidor. Por eso estos contadores solo registran señales que se originan
 * en el propio middleware (Edge): requests totales y rechazos de rate limit.
 * `/api/metrics` (este mismo archivo) debe correr también en Edge
 * (`export const runtime = "edge"` en la ruta) para leer el mismo módulo que
 * incrementa el middleware — si corriera en Node, siempre leería contadores
 * en cero. Los errores 5xx (que sí se originan en código Node, ej. rutas que
 * usan Prisma) se registran vía `logError` (logs estructurados), no aquí —
 * un contador en memoria del lado Node tampoco sería visible desde este
 * mismo módulo compartido con el middleware.
 *
 * Igual límite honesto que el rate limiter (Fase 9): por instancia del
 * proceso, no agregado entre réplicas. El siguiente paso natural para escalar
 * horizontalmente es que un colector real (Prometheus remote-write, agente
 * de Datadog, etc.) scrapee `/api/metrics` de cada instancia.
 */
interface Counters {
  requestsTotal: number;
  rateLimitRejectionsTotal: number;
}

const counters: Counters = {
  requestsTotal: 0,
  rateLimitRejectionsTotal: 0,
};

export function incrementRequestCount(): void {
  counters.requestsTotal += 1;
}

export function incrementRateLimitRejection(): void {
  counters.rateLimitRejectionsTotal += 1;
}

export function getCounters(): Readonly<Counters> {
  return { ...counters };
}

export function resetCounters(): void {
  counters.requestsTotal = 0;
  counters.rateLimitRejectionsTotal = 0;
}

export function renderPrometheusMetrics(): string {
  return [
    "# TYPE medipet_http_requests_total counter",
    `medipet_http_requests_total ${counters.requestsTotal}`,
    "# TYPE medipet_rate_limit_rejections_total counter",
    `medipet_rate_limit_rejections_total ${counters.rateLimitRejectionsTotal}`,
    "",
  ].join("\n");
}
