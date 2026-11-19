CREATE TABLE "ImportedChatConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "messageCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3),
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportedChatConversation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ImportedChatConversation_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ImportedChatConversation_userId_source_fingerprint_key"
    ON "ImportedChatConversation"("userId", "source", "fingerprint");
CREATE INDEX "ImportedChatConversation_userId_importedAt_id_idx"
    ON "ImportedChatConversation"("userId", "importedAt", "id");
