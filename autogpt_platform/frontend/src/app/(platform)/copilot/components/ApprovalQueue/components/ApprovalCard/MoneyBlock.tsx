"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import type { ApprovalSpend } from "../../helpers";
import { Text } from "@/components/atoms/Text/Text";

interface Props {
  spend: ApprovalSpend;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function dollars(microdollars: number) {
  return usd.format(microdollars / 1_000_000);
}

export function MoneyBlock({ spend }: Props) {
  const { t } = useTranslation();
  const share =
    spend.ceiling > 0 ? Math.min(1, spend.spent / spend.ceiling) : 1;
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border-base px-3 py-2.5 text-body tabular-nums">
      <div className="flex justify-between gap-3 text-foreground-tertiary">
        <span>{t("This step", "此步骤")}</span>
        <span className="text-foreground-strong">
          {t(
            `about ${dollars(spend.estimate)}`,
            `约 ${dollars(spend.estimate)}`,
          )}
        </span>
      </div>
      <div className="flex justify-between gap-3 text-foreground-tertiary">
        <span>{t("Spent in this chat", "此对话已花费")}</span>
        <span className="text-foreground-strong">
          {t(
            `${dollars(spend.spent)} of ${dollars(spend.ceiling)}`,
            `${dollars(spend.spent)} / ${dollars(spend.ceiling)}`,
          )}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={t(
          "Spent of this chat's ceiling",
          "此对话预算上限的已用金额",
        )}
        aria-valuenow={Math.round(share * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1 overflow-hidden rounded-full bg-surface-hover"
      >
        <div
          className="h-full rounded-full bg-warning"
          style={{ width: `${share * 100}%` }}
        />
      </div>
      <Text variant="small-tight" tone="muted">
        {t(
          `Approving runs this step and adds ${dollars(spend.unit)} to this chat's ceiling.`,
          `批准后将执行此步骤，并将此对话的预算上限增加 ${dollars(spend.unit)}。`,
        )}
      </Text>
    </div>
  );
}
