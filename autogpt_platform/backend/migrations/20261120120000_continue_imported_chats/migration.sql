ALTER TABLE "ChatSession" ADD COLUMN "importedChatId" TEXT;

CREATE UNIQUE INDEX "ChatSession_importedChatId_organizationId_key"
    ON "ChatSession"("importedChatId", "organizationId");

ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_importedChatId_fkey"
    FOREIGN KEY ("importedChatId") REFERENCES "ImportedChatConversation"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
