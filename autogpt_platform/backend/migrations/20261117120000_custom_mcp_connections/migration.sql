CREATE TABLE "CustomMCPConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "serverUrl" TEXT NOT NULL,
    "authType" TEXT NOT NULL,
    "credentialId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomMCPConnection_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CustomMCPConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CustomMCPConnection_userId_idx" ON "CustomMCPConnection"("userId");
