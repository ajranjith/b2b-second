import { AsyncLocalStorage } from "node:async_hooks";

export type DbScope = {
  dbId: string;
  allowedModels: readonly string[];
};

const dbStorage = new AsyncLocalStorage<DbScope>();

export function runWithDbContext<T>(scope: DbScope, fn: () => T): T {
  return dbStorage.run(scope, fn);
}

export function getCurrentDbScope(): DbScope | undefined {
  return dbStorage.getStore();
}

export function getCurrentDbId(): string | undefined {
  return dbStorage.getStore()?.dbId;
}
