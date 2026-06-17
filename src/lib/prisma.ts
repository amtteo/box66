import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";

const RETRYABLE_CODES = new Set(["P1001", "P1002", "P2024"]);
const MAX_QUERY_ATTEMPTS = 4;

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example → .env and fill in Supabase Connect strings.",
    );
  }
  return url;
}

/** Add Supabase-friendly timeouts; pgbouncer only for transaction pooler (6543). */
function withPoolerParams(url: string): string {
  const [base, query = ""] = url.split("?", 2);
  const params = new URLSearchParams(query);
  const defaults: [string, string][] = [
    ["connect_timeout", "30"],
    ["pool_timeout", "30"],
  ];
  if (/:6543(\/|$)/.test(base)) {
    defaults.unshift(["pgbouncer", "true"]);
  }
  for (const [key, value] of defaults) {
    if (!params.has(key)) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

function isRetryableDbError(error: unknown): boolean {
  return (
    error instanceof PrismaClientKnownRequestError &&
    RETRYABLE_CODES.has(error.code)
  );
}

function retryDelayMs(attempt: number): number {
  return 400 * attempt;
}

type PrismaGlobal = typeof globalThis & {
  __box66Prisma?: PrismaClient;
  __box66PgPool?: Pool;
  __box66DatabaseUrl?: string;
};

const globalForPrisma = globalThis as PrismaGlobal;

function createPgPool(connectionString: string): Pool {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 30_000,
    keepAlive: true,
  });
  pool.on("error", (err) => {
    console.error("[prisma] idle pg pool client error:", err.message);
  });
  return pool;
}

function withTransientDbRetries(client: PrismaClient): PrismaClient {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          let lastError: unknown;
          for (let attempt = 1; attempt <= MAX_QUERY_ATTEMPTS; attempt++) {
            try {
              return await query(args);
            } catch (error) {
              lastError = error;
              if (!isRetryableDbError(error) || attempt === MAX_QUERY_ATTEMPTS) {
                throw error;
              }
              await new Promise((resolve) =>
                setTimeout(resolve, retryDelayMs(attempt)),
              );
            }
          }
          throw lastError;
        },
      },
    },
  }) as unknown as PrismaClient;
}

function createPrismaClient(): PrismaClient {
  const connectionString = withPoolerParams(requireDatabaseUrl());

  if (
    globalForPrisma.__box66Prisma &&
    globalForPrisma.__box66DatabaseUrl === connectionString
  ) {
    return globalForPrisma.__box66Prisma;
  }

  void globalForPrisma.__box66PgPool?.end().catch(() => {});

  const pool = createPgPool(connectionString);
  const adapter = new PrismaPg(pool);
  const client = withTransientDbRetries(
    new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    }),
  );

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.__box66Prisma = client;
    globalForPrisma.__box66PgPool = pool;
    globalForPrisma.__box66DatabaseUrl = connectionString;
  }

  return client;
}

export const prisma = createPrismaClient();
