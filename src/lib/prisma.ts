import { PrismaClient } from "@prisma/client";

/**
 * Глобальный синглтон PrismaClient.
 *
 * В dev-режиме Next.js перезагружает модули при каждом изменении кода (HMR),
 * и без кеша в `globalThis` каждый раз создавался бы новый PrismaClient со своим
 * пулом соединений, что быстро исчерпывает лимиты Supabase.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// В production модуль загружается один раз, кеш нужен только в dev
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
