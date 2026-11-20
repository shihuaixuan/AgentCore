ALTER TABLE "ChatSession" ADD COLUMN "importedSourceKey" TEXT;

UPDATE "ChatSession" AS session
SET "importedSourceKey" = archive."source" || ':' || archive."fingerprint"
FROM "ImportedChatConversation" AS archive
WHERE session."importedChatId" = archive."id"
  AND session."userId" = archive."userId"
  AND archive."source" IN ('workbuddy', 'qwenwork');

CREATE UNIQUE INDEX "ChatSession_owner_org_imported_source_key"
    ON "ChatSession"("userId", "organizationId", "importedSourceKey");
