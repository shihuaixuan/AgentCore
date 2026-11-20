"use client";

import { Text } from "@/components/atoms/Text/Text";
import { useAuth } from "@/lib/auth/hooks/useAuth";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { HIDDEN_FROM_REPLAY } from "@/lib/replay-privacy";
import { ArchivePanel } from "./components/ArchivePanel";
import { ImportPanel } from "./components/ImportPanel";
import { useArchive } from "./useArchive";

function ArchiveWorkspace({ ownerID }: { ownerID: string }) {
  const archive = useArchive(ownerID);
  return (
    <div className={`${HIDDEN_FROM_REPLAY} flex min-w-0 flex-col gap-6`}>
      <ArchivePanel ownerID={ownerID} archive={archive} />
      <ImportPanel ownerID={ownerID} onSaved={archive.refreshArchive} />
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
            "Browse your saved WorkBuddy and QwenWork chats, or copy one to your chat list to continue.",
            "查看已归档的 WorkBuddy 和千问办公对话，也可以同步到会话列表继续提问。",
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
