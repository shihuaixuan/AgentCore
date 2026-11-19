import { Button } from "@/components/atoms/Button/Button";
import { AUTOPILOT_NAME } from "@/components/molecules/AutopilotAvatar/helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  rejectAll: {
    count: number;
    confirming: boolean;
    onAsk: () => void;
    onCancel: () => void;
    onConfirm: () => void;
  } | null;
  // Shown once something is answered and something still waits.
  onContinue: (() => void) | null;
  busy: boolean;
}

export function QueueFooter({ rejectAll, onContinue, busy }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-separator bg-surface-muted/60 px-4 py-2 text-body">
      {rejectAll?.confirming ? (
        <>
          <span role="alert" className="text-foreground-body">
            {t(
              `Reject all ${rejectAll.count}? ${AUTOPILOT_NAME} will be told none of them ran.`,
              `拒绝全部 ${rejectAll.count} 项？将告知 ${AUTOPILOT_NAME} 这些操作均未执行。`,
            )}
          </span>
          <Button
            size="xs"
            variant="primary"
            shape="pill"
            disabled={busy}
            onClick={rejectAll.onConfirm}
          >
            {t("Reject all", "全部拒绝")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            shape="pill"
            onClick={rejectAll.onCancel}
          >
            {t("Cancel", "取消")}
          </Button>
        </>
      ) : rejectAll ? (
        <Button
          variant="link"
          size="inline"
          disabled={busy}
          onClick={rejectAll.onAsk}
        >
          {t(
            `Reject all ${rejectAll.count}…`,
            `拒绝全部 ${rejectAll.count} 项…`,
          )}
        </Button>
      ) : null}
      {onContinue && !rejectAll?.confirming && (
        <Button
          type="button"
          size="small"
          variant="secondary"
          className="ml-auto min-w-0"
          disabled={busy}
          onClick={onContinue}
        >
          {t("Close and continue", "关闭并继续")}
        </Button>
      )}
    </div>
  );
}
