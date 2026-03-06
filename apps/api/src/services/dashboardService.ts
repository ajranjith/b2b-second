import {
  AdminDashboardSchema,
  DealerDashboardSchema,
  type AdminDashboardDTO,
  type DealerDashboardDTO,
} from "@repo/lib";

import {
  fetchAdminDealerStats,
  fetchAdminImportStats,
  fetchAdminOrderStats,
  fetchAdminProductStats,
  fetchAdminRecentOrders,
  fetchDealerAccount,
  fetchDealerBackorderCount,
  fetchDealerNews,
  fetchDealerOrdersInProgressCount,
  fetchDealerRecentOrders,
  fetchDealerTierAssignments,
} from "../repositories/dashboardRepo";

const toIsoString = (value: Date | null) => (value ? value.toISOString() : null);

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfWeek = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

export async function getAdminDashboard(): Promise<AdminDashboardDTO> {
  const now = new Date();
  const today = startOfDay(now);
  const week = startOfWeek(now);
  const month = startOfMonth(now);

  const [dealers, orders, products, imports, recentOrders] = await Promise.all([
    fetchAdminDealerStats(),
    fetchAdminOrderStats(today, week, month),
    fetchAdminProductStats(),
    fetchAdminImportStats(today),
    fetchAdminRecentOrders(10),
  ]);

  const payload = {
    dealers,
    orders,
    products,
    imports: {
      ...imports,
      lastSuccessful: toIsoString(imports.lastSuccessful),
    },
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      orderNo: order.orderNo,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
      dealerAccount: order.dealerAccount,
    })),
  };

  return AdminDashboardSchema.parse(payload);
}

export async function getDealerDashboard(accountNo: string | null): Promise<DealerDashboardDTO> {
  const trimmedAccount = accountNo?.trim() ?? "";
  if (!trimmedAccount) {
    return DealerDashboardSchema.parse({
      stats: { backorders: 0, inProgress: 0 },
      account: {
        accountNo: null,
        companyName: null,
        status: null,
        defaultShippingMethod: null,
        tierGenuine: null,
        tierAftermarketEs: null,
        tierAftermarketBr: null,
      },
      recentOrders: [],
      news: [],
    });
  }

  const account = await fetchDealerAccount(trimmedAccount);
  if (!account) {
    return DealerDashboardSchema.parse({
      stats: { backorders: 0, inProgress: 0 },
      account: {
        accountNo: trimmedAccount,
        companyName: null,
        status: null,
        defaultShippingMethod: null,
        tierGenuine: null,
        tierAftermarketEs: null,
        tierAftermarketBr: null,
      },
      recentOrders: [],
      news: [],
    });
  }

  const [tiers, backorders, inProgress, recentOrders, newsBundle] = await Promise.all([
    fetchDealerTierAssignments(trimmedAccount),
    fetchDealerBackorderCount(trimmedAccount),
    fetchDealerOrdersInProgressCount(account.id),
    fetchDealerRecentOrders(account.id, 10),
    fetchDealerNews(5),
  ]);

  const tierMap = {
    gn: null as string | null,
    es: null as string | null,
    br: null as string | null,
  };

  tiers.forEach((tier) => {
    const key = tier.categoryCode.toLowerCase();
    if (key === "gn" || key === "es" || key === "br") {
      tierMap[key] = tier.netTier;
    }
  });

  const attachmentsByArticle = new Map<string, typeof newsBundle.attachments>();
  newsBundle.attachments.forEach((attachment) => {
    const list = attachmentsByArticle.get(attachment.articleId) ?? [];
    list.push(attachment);
    attachmentsByArticle.set(attachment.articleId, list);
  });

  const payload = {
    stats: {
      backorders,
      inProgress,
    },
    account: {
      accountNo: account.accountNo,
      companyName: account.companyName,
      status: account.status,
      defaultShippingMethod: account.defaultShippingMethod,
      tierGenuine: tierMap.gn,
      tierAftermarketEs: tierMap.es,
      tierAftermarketBr: tierMap.br,
    },
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      orderNo: order.orderNo,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      total: order.total,
    })),
    news: newsBundle.news.map((article) => ({
      id: article.id,
      type: article.type,
      title: article.title,
      bodyMd: article.bodyMd,
      endsAt: toIsoString(article.endsAt),
      attachments: (attachmentsByArticle.get(article.id) ?? []).map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
      })),
    })),
  };

  return DealerDashboardSchema.parse(payload);
}
