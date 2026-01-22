import { AsyncLocalStorage } from "node:async_hooks";

const dbStorage = new AsyncLocalStorage<{ dbId: string }>();

export function runWithDbContext<T>(dbId: string, fn: () => T): T {
  return dbStorage.run({ dbId }, fn);
}

export function getCurrentDbId(): string | undefined {
  return dbStorage.getStore()?.dbId;
}
