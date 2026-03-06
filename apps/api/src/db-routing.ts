import { readClient, writeClient } from "./db";

export type DbRoutingOptions = {
  preferPrimary?: boolean;
};

export const getDbClientForMethod = (method: string, options?: DbRoutingOptions) => {
  if (options?.preferPrimary) {
    return writeClient;
  }

  return method.toUpperCase() === "GET" ? readClient : writeClient;
};
