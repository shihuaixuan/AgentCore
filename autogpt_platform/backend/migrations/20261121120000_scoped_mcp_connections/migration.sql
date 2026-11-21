ALTER TABLE "CustomMCPConnection"
    ADD COLUMN "organizationId" TEXT REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD COLUMN "connectorId" TEXT,
    ADD COLUMN "methodId" TEXT,
    ADD COLUMN "definitionVersion" INTEGER,
    ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1 CHECK ("revision" > 0),
    ADD CONSTRAINT "CustomMCPConnection_catalog_binding_check" CHECK (
        ("connectorId" IS NULL AND "methodId" IS NULL AND "definitionVersion" IS NULL) OR
        ("connectorId" IS NOT NULL AND "methodId" IS NOT NULL AND "definitionVersion" IS NOT NULL AND "definitionVersion" > 0 AND "organizationId" IS NOT NULL)
    );

CREATE INDEX "CustomMCPConnection_userId_organizationId_idx" ON "CustomMCPConnection"("userId", "organizationId");

CREATE TABLE "ExpertMCPConnectionGrant" (
    "expertId" TEXT NOT NULL REFERENCES "Expert"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "connectionId" TEXT NOT NULL REFERENCES "CustomMCPConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("expertId", "connectionId")
);
CREATE INDEX "ExpertMCPConnectionGrant_connectionId_idx" ON "ExpertMCPConnectionGrant"("connectionId");
