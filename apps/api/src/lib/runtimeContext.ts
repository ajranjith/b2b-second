import { AsyncLocalStorage } from "node:async_hooks";

export type Namespace = "A" | "D";
export type Role = "ADMIN" | "DEALER";

export type Envelope = {
  ns: Namespace;
  sid: string;
  role: Role;
  userId: string;
  path: string;
  requestId?: string;
};

const envelopeStore = new AsyncLocalStorage<Envelope>();
const dbIdStore = new AsyncLocalStorage<string>();

export function runWithEnvelope<T>(envelope: Envelope, fn: () => T): T {
  return envelopeStore.run(envelope, fn);
}

export function getEnvelopeOrThrow(): Envelope {
  const envelope = envelopeStore.getStore();
  if (!envelope) {
    throw new Error("EnvelopeMissing: No envelope in AsyncLocalStorage.");
  }
  return envelope;
}

export function getEnvelope(): Envelope | undefined {
  return envelopeStore.getStore();
}

export function runWithDbId<T>(dbId: string, fn: () => T): T {
  return dbIdStore.run(dbId, fn);
}

export function getDbIdOrThrow(): string {
  const dbId = dbIdStore.getStore();
  if (!dbId) {
    throw new Error("DbIdMissing: No dbId in AsyncLocalStorage.");
  }
  return dbId;
}

export function getDbId(): string | undefined {
  return dbIdStore.getStore();
}
