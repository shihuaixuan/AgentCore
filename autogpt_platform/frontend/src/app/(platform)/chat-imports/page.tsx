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
    <div
      className={`${HIDDEN_FROM_REPLAY} grid min-w-0 items-start gap-6 lg:grid-cols-2`}
    >
      <ImportPanel onSaved={archive.refreshArchive} />
      <ArchivePanel ownerID={ownerID} archive={archive} />
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
            "Keep a private, read-only copy of chats from WorkBuddy or Qianwen.",
            "将 WorkBuddy 或通义千问的对话保存为私有的只读副本。",
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
