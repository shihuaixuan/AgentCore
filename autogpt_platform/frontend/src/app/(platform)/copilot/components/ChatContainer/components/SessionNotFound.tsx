import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { AppSidebarTrigger } from "@/components/layout/AppSidebar/components/AppSidebarTrigger/AppSidebarTrigger";
import { BubbleChatBlockedIcon } from "@hugeicons/core-free-icons";
import { parseAsString, useQueryState } from "nuqs";

export function SessionNotFound() {
  const { t } = useTranslation();
  const [, setSessionId] = useQueryState("sessionId", parseAsString);
  const [, setExpertId] = useQueryState("expertId", parseAsString);

  function handleNewChat() {
    setSessionId(null);
    // Otherwise the ?expertId= deep-link adoption drops the user into that
    // expert's latest thread instead of a new chat.
    setExpertId(null);
  }

  return (
    <div className="relative flex h-full min-h-0 w-full items-center justify-center bg-surface px-6">
      {/* An open chat's thread chip owns the mobile sidebar button; this
          screen has no chip, so it brings its own. */}
      <AppSidebarTrigger className="absolute top-5 left-4 rounded-full border border-border-base bg-surface shadow-md hover:bg-surface-hover md:hidden" />
      <div
        role="status"
        className="flex max-w-md flex-col items-center gap-3 text-center"
      >
        <Icon icon={BubbleChatBlockedIcon} size={28} tone="muted" />
        <Text variant="large-medium" as="h2">
          {t(
            "This chat isn't available on this account",
            "此账户无法访问该对话",
          )}
        </Text>
        <Text variant="body" tone="muted">
          {t(
            "It may belong to another account you use, or it no longer exists.",
            "该对话可能属于你的另一个账户，或已被删除。",
          )}
        </Text>
        <Button
          type="button"
          variant="secondary"
          size="small"
          className="mt-2"
          onClick={handleNewChat}
        >
          {t("Start a new chat", "开始新对话")}
        </Button>
      </div>
    </div>
  );
}
