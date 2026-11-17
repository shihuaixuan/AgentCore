import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { useState } from "react";
import { useDuplicateGraph } from "../../hooks/useDuplicateGraph";
import { Cancel01Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export function ReadOnlyBanner() {
  const { t } = useTranslation();
  const { duplicate, isDuplicating, canDuplicate, isCheckingLibrary } =
    useDuplicateGraph();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  // Show the Duplicate CTA immediately while we look up the library agent, only
  // falling back to the "add to library" hint once we know it can't be forked.
  const showDuplicate = canDuplicate || isCheckingLibrary;

  return (
    <div
      data-id="read-only-banner"
      role="status"
      aria-live="polite"
      className="absolute top-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-surface px-4 py-2 shadow-lg select-none"
    >
      <div className="px-2">
        <Text variant="body" tone="body">
          {t(
            "You&apos;re viewing a read-only copy of this workflow.",
            "你正在查看此工作流的只读副本。",
          )}
          <br />
          {showDuplicate
            ? t("Duplicate it to make changes.", "创建副本后即可修改。")
            : t(
                "Add it to your library to enable duplication.",
                "添加到工作流库后即可创建副本。",
              )}
        </Text>
      </div>
      {showDuplicate && (
        <Button
          variant="primary"
          size="small"
          onClick={duplicate}
          loading={isDuplicating}
          disabled={!canDuplicate}
          leftIcon={<Icon icon={Copy01Icon} className="size-4" />}
        >
          {t("Duplicate", "创建副本")}
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsDismissed(true)}
        aria-label={t("Dismiss", "关闭")}
        title={t("Dismiss", "关闭")}
      >
        <Icon icon={Cancel01Icon} className="h-4 w-4" />
      </Button>
    </div>
  );
}
