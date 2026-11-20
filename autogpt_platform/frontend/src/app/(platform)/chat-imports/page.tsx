"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { useAuth } from "@/lib/auth/hooks/useAuth";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { HIDDEN_FROM_REPLAY } from "@/lib/replay-privacy";
import { useState } from "react";
import { ArchivePanel } from "./components/ArchivePanel";
import { DirectorySyncPanel } from "./components/DirectorySyncPanel";
import { ImportPanel } from "./components/ImportPanel";
import { useArchive } from "./useArchive";

function ArchiveWorkspace({ ownerID }: { ownerID: string }) {
  const { t } = useTranslation();
  const archive = useArchive(ownerID);
  const [showManualImport, setShowManualImport] = useState(false);
  return (
    <div className={`${HIDDEN_FROM_REPLAY} flex min-w-0 flex-col gap-6`}>
      <DirectorySyncPanel ownerID={ownerID} />
      <ArchivePanel ownerID={ownerID} archive={archive} />
      <div className="space-y-3">
        <Button
          type="button"
          size="small"
          variant="secondary"
          aria-expanded={showManualImport}
          aria-controls="manual-chat-archive"
          onClick={() => setShowManualImport((open) => !open)}
        >
          {t("Archive individual chats and attachments", "手动归档会话与附件")}
        </Button>
        <div id="manual-chat-archive" hidden={!showManualImport}>
          <ImportPanel ownerID={ownerID} onSaved={archive.refreshArchive} />
        </div>
      </div>
    </div>
  );
}

export default function ChatImportsPage() {
  const { t } = useTranslation();
  const { user, isUserLoading } = useAuth();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-8 sm:py-10">
      <header className="flex flex-col gap-2">
        <Text variant="h2" as="h1">
          {t("Chat archive", "对话归档")}
        </Text>
        <Text variant="body" tone="secondary">
          {t(
            "Sync WorkBuddy and QwenWork history to Recent chats, or view previously saved conversations.",
            "将 WorkBuddy 和千问办公的历史对话同步到最近会话，也可以查看已有归档。",
          )}
        </Text>
      </header>
      {isUserLoading ? (
        <Text variant="body" role="status">
          {t("Loading archive…", "正在加载归档…")}
        </Text>
      ) : user ? (
        <ArchiveWorkspace key={user.id} ownerID={user.id} />
      ) : (
        <Text variant="body">
          {t("Sign in to access your archive.", "请登录后访问你的归档。")}
        </Text>
      )}
    </div>
  );
}
