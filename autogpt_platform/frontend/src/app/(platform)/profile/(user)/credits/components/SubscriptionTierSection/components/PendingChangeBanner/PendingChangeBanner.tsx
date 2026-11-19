import { Button } from "@/components/atoms/Button/Button";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { formatPendingDate, getTierLabel } from "../../helpers";

interface Props {
  currentTier: string;
  pendingTier: string;
  pendingEffectiveAt: Date | string | null | undefined;
  onKeepCurrent: () => void;
  isBusy: boolean;
}

export function PendingChangeBanner({
  currentTier,
  pendingTier,
  pendingEffectiveAt,
  onKeepCurrent,
  isBusy,
}: Props) {
  const { t, locale } = useTranslation();
  // Backend invariant: pending_tier_effective_at is always populated when
  // pending_tier is set. Bail early if the date is missing so the sentence
  // always reads with a date instead of a null-fallback branch.
  if (!pendingEffectiveAt) return null;

  const pendingLabel = getTierLabel(pendingTier, locale);
  const currentLabel = getTierLabel(currentTier, locale);
  const dateText = formatPendingDate(pendingEffectiveAt, locale);

  const isCancellation = pendingTier === "NO_TIER";

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-2 rounded-md border border-brand bg-accent-surface px-3 py-2 text-accent-strong sm:flex-row sm:items-center sm:justify-between"
    >
      <Text variant="body-tight" as="p" tone="inherit">
        {isCancellation ? (
          <>
            {t("Scheduled to cancel your subscription on", "计划于")}{" "}
            <Text variant="body-semibold-tight" as="span" tone="inherit">
              {dateText}
            </Text>
            {t(".", "取消订阅。")}
          </>
        ) : (
          <>
            {t("Scheduled to downgrade to", "计划降级至")}{" "}
            <Text variant="body-semibold-tight" as="span" tone="inherit">
              {pendingLabel}
            </Text>{" "}
            {t("on", "，生效日期：")}{" "}
            <Text variant="body-semibold-tight" as="span" tone="inherit">
              {dateText}
            </Text>
            .
          </>
        )}
      </Text>
      <Button
        variant="compact-outline"
        size="compact-sm"
        disabled={isBusy}
        onClick={onKeepCurrent}
      >
        {isBusy
          ? t("Cancelling...", "正在取消…")
          : t(`Keep ${currentLabel}`, `保留 ${currentLabel}`)}
      </Button>
    </div>
  );
}
