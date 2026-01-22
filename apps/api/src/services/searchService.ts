import { searchProducts } from "../repositories/searchRepo";

export async function runDealerSearch(query: string, limit = 20, offset = 0) {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const rows = await searchProducts(trimmed, limit, offset);
  return rows.map((row) => ({
    productCode: row.productCode,
    description: row.description,
    partType: row.partType,
    freeStock: typeof row.freeStock === "number" ? row.freeStock : null,
    orderedOnDemand: row.freeStock === 0 || row.freeStock === null,
    supersededBy: row.supersededBy ?? null,
    supersessionDepth: row.supersessionDepth ?? null,
    replacementExists: Boolean(row.supersededBy),
    aliases: row.aliases ?? [],
    yourPrice: typeof row.net1Price === "string" ? Number(row.net1Price) : row.net1Price,
    priceSource: row.net1Price ? "net1" : null,
    tierCode: null,
  }));
}
