/**
 * Ventana deslizante en memoria, apta para Edge runtime (sin dependencias de
 * Node ni de Prisma). Cada instancia del proceso lleva su propio contador —
 * en un despliegue multi-instancia esto es una primera capa real contra
 * abuso/flood por IP, no un límite global exacto. Si el proyecto escala a
 * varias réplicas, el siguiente paso natural es respaldar `RateLimitStore` en
 * Redis/Upstash sin cambiar la firma de `checkRateLimit`.
 */
export interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export type RateLimitStore = Map<string, RateLimitEntry>;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function createRateLimitStore(): RateLimitStore {
  return new Map();
}

export function checkRateLimit(
  store: RateLimitStore,
  key: string,
  now: number,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    const retryAfterSeconds = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, retryAfterSeconds: 0 };
}
