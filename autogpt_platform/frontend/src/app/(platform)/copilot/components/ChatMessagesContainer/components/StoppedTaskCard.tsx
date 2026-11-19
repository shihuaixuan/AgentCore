import { Text } from "@/components/atoms/Text/Text";
import { BulbIcon, SquareIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function StoppedTaskCard() {
  const { t } = useTranslation();
  return (
    <div className="my-2 flex items-start gap-3 rounded-xl border border-border-base/70 bg-surface p-4 shadow-sm duration-500 animate-in fade-in fill-mode-both slide-in-from-bottom-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-small bg-accent-surface">
        <Icon icon={SquareIcon} size={16} tone="brand" />
      </div>
      <div className="min-w-0 flex-1">
        <Text tone="primary" variant="body-medium">
          {t("Task stopped", "任务已停止")}
        </Text>
        <Text
          tone="secondary"
          variant="body-sm-medium-inherit"
          weight="normal"
          className="mt-1"
        >
          {t(
            "The response above is incomplete. You can ask to continue or type something new.",
            "上方回复尚未完成。你可以要求继续，或输入新消息。",
          )}
        </Text>
        <div className="mt-2.5 flex items-center gap-1.5">
          <Icon icon={BulbIcon} size={14} tone="brand" className="shrink-0" />
          <Text tone="secondary" variant="small">
            {t(
              "Try “continue” or type something new.",
              "试试输入“继续”，或输入新消息。",
            )}
          </Text>
        </div>
      </div>
    </div>
  );
}
