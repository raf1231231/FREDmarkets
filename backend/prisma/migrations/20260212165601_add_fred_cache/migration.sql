-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marketId" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "fredSeriesId" TEXT NOT NULL,
    "marketType" TEXT NOT NULL,
    "numOutcomes" INTEGER NOT NULL,
    "outcomeLabels" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "proposer" TEXT NOT NULL,
    "creator" TEXT,
    "tokenMint" TEXT NOT NULL,
    "vault" TEXT,
    "totalSetsMinted" BIGINT NOT NULL DEFAULT 0,
    "closesAt" DATETIME NOT NULL,
    "resolvesAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    "winningOutcome" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FredCache" (
    "seriesId" TEXT NOT NULL PRIMARY KEY,
    "observations" JSONB NOT NULL,
    "seriesInfo" JSONB,
    "lastFetched" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Market_marketId_key" ON "Market"("marketId");

-- CreateIndex
CREATE INDEX "Market_status_idx" ON "Market"("status");

-- CreateIndex
CREATE INDEX "Market_fredSeriesId_idx" ON "Market"("fredSeriesId");

-- CreateIndex
CREATE INDEX "FredCache_lastFetched_idx" ON "FredCache"("lastFetched");
