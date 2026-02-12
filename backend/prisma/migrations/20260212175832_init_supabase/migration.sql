-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "marketId" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "fredSeriesId" TEXT NOT NULL,
    "marketType" TEXT NOT NULL,
    "numOutcomes" INTEGER NOT NULL,
    "outcomeLabels" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "proposer" TEXT NOT NULL,
    "creator" TEXT,
    "tokenMint" TEXT NOT NULL,
    "vault" TEXT,
    "totalSetsMinted" BIGINT NOT NULL DEFAULT 0,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "resolvesAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "winningOutcome" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FredCache" (
    "seriesId" TEXT NOT NULL,
    "observations" JSONB NOT NULL,
    "seriesInfo" JSONB,
    "lastFetched" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FredCache_pkey" PRIMARY KEY ("seriesId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Market_marketId_key" ON "Market"("marketId");

-- CreateIndex
CREATE INDEX "Market_status_idx" ON "Market"("status");

-- CreateIndex
CREATE INDEX "Market_fredSeriesId_idx" ON "Market"("fredSeriesId");

-- CreateIndex
CREATE INDEX "FredCache_lastFetched_idx" ON "FredCache"("lastFetched");
