import { Button } from "@/components/atoms/Button/Button";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { MaxUpgradeSummary } from "./MaxUpgradeSummary";
import type { useTierUpgradePreview } from "./useTierUpgradePreview";

interface Props {
  review: ReturnType<typeof useTierUpgradePreview>;
}

export function MaxUpgradeReview({ review }: Props) {
  const { t } = useTranslation();
  return (
    <div aria-live="polite">
      {review.isLoading && (
        <div className="space-y-3">
          <Text variant="small" tone="secondary">
            {t("Reviewing your charge…", "正在核对费用…")}
          </Text>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      )}
      {review.error && (
        <div
          role="alert"
          className="rounded-xl border border-warning-border bg-warning-surface p-4"
        >
          {/* oxlint-disable-next-line design-system/no-restyle -- caption copy at a 24px line height; no Text variant has it */}
          <Text variant="small" className="mb-3 leading-6">
            {review.error}
          </Text>
          <Button variant="secondary" size="small" onClick={review.retry}>
            {t("Retry review", "重新核对")}
          </Button>
        </div>
      )}
      {review.preview && <MaxUpgradeSummary preview={review.preview} />}
    </div>
  );
}
