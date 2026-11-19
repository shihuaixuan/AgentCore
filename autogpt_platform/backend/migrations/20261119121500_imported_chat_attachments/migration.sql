CREATE TABLE "ImportedChatAttachment" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    CONSTRAINT "ImportedChatAttachment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ImportedChatAttachment_conversationId_fkey" FOREIGN KEY ("conversationId")
        REFERENCES "ImportedChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ImportedChatAttachment_conversation_name_sha256_key"
    ON "ImportedChatAttachment"("conversationId", "name", "sha256");
