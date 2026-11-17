CREATE TABLE "MCPMarketplaceEntry" (
    "name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MCPMarketplaceEntry_pkey" PRIMARY KEY ("name")
);
