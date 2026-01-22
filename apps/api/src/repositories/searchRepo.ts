import { readClient } from "../db";

export type SearchResultItem = {
  productId: string;
  productCode: string;
  description: string;
  partType: string;
  freeStock: number | null;
  net1Price: number | null;
  supersededBy: string | null;
  supersessionDepth: number | null;
  aliases: string[] | null;
};

export async function searchProducts(query: string, limit = 20, offset = 0) {
  const likeQuery = `%${query}%`;

  const rows = await readClient.query<SearchResultItem>(
    `
      SELECT
        p.id AS "productId",
        p."productCode",
        p.description,
        p."partType",
        pc."freeStock",
        pc."net1Price",
        sr."latestPartNo" AS "supersededBy",
        sr.depth AS "supersessionDepth",
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT pa."aliasValue") FILTER (WHERE pa."aliasValue" IS NOT NULL), NULL) AS aliases
      FROM "Product" p
      LEFT JOIN "ProductCatalog" pc ON pc."productCode" = p."productCode"
      LEFT JOIN "SupersessionResolved" sr ON sr."originalPartNo" = p."productCode"
      LEFT JOIN "ProductAlias" pa ON pa."productId" = p.id
      WHERE p."isActive" = true
        AND (p."productCode" ILIKE $1 OR p.description ILIKE $1)
      GROUP BY
        p.id,
        p."productCode",
        p.description,
        p."partType",
        pc."freeStock",
        pc."net1Price",
        sr."latestPartNo",
        sr.depth
      ORDER BY p."productCode" ASC
      LIMIT $2 OFFSET $3;
    `,
    [likeQuery, limit, offset],
  );

  return rows.rows;
}
