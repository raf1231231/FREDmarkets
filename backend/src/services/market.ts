import { prisma } from "../lib/prisma";

interface ListMarketsParams {
  status?: string;
  page?: number;
  limit?: number;
}

export async function listMarkets(params: ListMarketsParams = {}) {
  const { status, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where = status ? { status } : {};

  const [markets, total] = await Promise.all([
    prisma.market.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.market.count({ where }),
  ]);

  return {
    markets: markets.map(serializeMarket),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getMarketById(id: string) {
  const market = await prisma.market.findUnique({ where: { id } });
  return market ? serializeMarket(market) : null;
}

function serializeMarket(market: any) {
  return {
    ...market,
    marketId: market.marketId.toString(),
    totalSetsMinted: market.totalSetsMinted.toString(),
    proposer: market.proposer,
  };
}
