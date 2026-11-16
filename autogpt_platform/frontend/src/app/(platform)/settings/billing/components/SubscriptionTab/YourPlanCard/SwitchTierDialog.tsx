"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { formatCents } from "../../../helpers";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { formatUpgradeAmount } from "./MaxUpgradeSummary";
import { MaxUpgradeReview } from "./MaxUpgradeReview";
import type { useTierUpgradePreview } from "./useTierUpgradePreview";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  targetTierLabel: string;
  body: string;
  isSaving: boolean;
  onConfirm: () => void;
  title?: string;
  confirmLabel?: string;
  priceCents?: number;
  billingCycle?: "monthly" | "yearly";
  usageCarriesOver?: boolean;
  usageMultiplier?: number;
  upgradeReview?: ReturnType<typeof useTierUpgradePreview>;
}

export function SwitchTierDialog({
  isOpen,
  onOpenChange,
  targetTierLabel,
  body,
  isSaving,
  onConfirm,
  title,
  confirmLabel,
  priceCents,
  billingCycle = "monthly",
  usageCarriesOver = false,
  usageMultiplier,
  upgradeReview,
}: Props) {
  const { t } = useTranslation();
  const preview = upgradeReview?.preview;
  const reviewing = upgradeReview?.required;
  const cannotConfirm = isSaving || (reviewing && !preview);
  const action = preview
    ? t(
        `Pay ${formatUpgradeAmount(preview.amount_due, preview.currency)} and upgrade`,
        `支付 ${formatUpgradeAmount(preview.amount_due, preview.currency)} 并升级`,
      )
    : (confirmLabel ??
      t(`Upgrade to ${targetTierLabel}`, `升级至 ${targetTierLabel}`));
  return (
    <Dialog
      variant="compact"
      title={
        <div className="space-y-2 pr-7">
          <Text variant="small" tone="muted">
            {title
              ? t("Your subscription", "你的订阅")
              : t(`Upgrade to ${targetTierLabel}`, `升级至 ${targetTierLabel}`)}
          </Text>
          <Text
            variant="h3-tracking-tight"
            as="span"
            // oxlint-disable-next-line design-system/no-restyle -- the dialog title sits on a 32px line under its eyebrow
            className="block leading-8"
          >
            {title ??
              t(`Upgrade to ${targetTierLabel}`, `升级至 ${targetTierLabel}`)}
          </Text>
        </div>
      }
      styling={{ maxWidth: "520px" }}
      controlled={{ isOpen, set: onOpenChange }}
    >
      <Dialog.Content>
        {usageCarriesOver && (
          <Text variant="body" tone="secondary" className="mb-5">
            {usageMultiplier
              ? t(
                  `${usageMultiplier} times the usage of Pro and priority support.`,
                  `享受 Pro ${usageMultiplier} 倍的用量和优先支持。`,
                )
              : t(
                  "More room for demanding work and priority support.",
                  "获得更多用量，满足高负载工作需求，并享受优先支持。",
                )}
          </Text>
        )}
        {reviewing ? (
          <MaxUpgradeReview review={upgradeReview} />
        ) : (
          <>
            {priceCents !== undefined && (
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3 rounded-2xl border border-border-base bg-surface-muted p-5">
                <Text variant="large-medium">AutoGPT {targetTierLabel}</Text>
                <div>
                  <Text variant="h3" as="span">
                    {formatCents(priceCents)}
                  </Text>
                  <Text variant="small" as="span" tone="secondary">
                    {" "}
                    /{" "}
                    {billingCycle === "yearly"
                      ? t("year", "年")
                      : t("month", "月")}
                  </Text>
                </div>
              </div>
            )}
            <Text variant="body" as="span" tone="body">
              {body}
            </Text>
          </>
        )}
        {usageCarriesOver && (
          <div className="mt-4 rounded-xl bg-surface-muted p-4">
            <Text
              variant="small"
              tone="secondary"
              // oxlint-disable-next-line design-system/no-restyle -- the carry-over note is set at a 24px line height; no Text variant has it
              className="leading-6"
            >
              {t(
                `You can keep going once payment goes through. What you’ve already used counts toward Max’s limit${usageMultiplier ? `, which is ${usageMultiplier} times as high as Pro’s.` : "."}`,
                `支付成功后即可继续使用。已使用的用量会计入 Max 的额度${usageMultiplier ? `，该额度是 Pro 的 ${usageMultiplier} 倍。` : "。"}`,
              )}
            </Text>
          </div>
        )}
        <Dialog.Footer
          className={
            // oxlint-disable-next-line design-system/no-restyle -- the carry-over footer stacks its two buttons
            usageCarriesOver ? "flex-col items-stretch gap-2" : undefined
          }
        >
          {usageCarriesOver ? (
            <>
              <ConfirmButton
                label={action}
                disabled={cannotConfirm}
                isSaving={isSaving}
                onConfirm={onConfirm}
              />
              <Button
                type="button"
                variant="ghost"
                size="large"
                className="w-full"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                {t("Keep Pro", "保留 Pro")}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="large"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                {t("Cancel", "取消")}
              </Button>
              <ConfirmButton
                label={action}
                disabled={cannotConfirm}
                isSaving={isSaving}
                onConfirm={onConfirm}
              />
            </>
          )}
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}

function ConfirmButton({
  label,
  disabled,
  isSaving,
  onConfirm,
}: {
  label: string;
  disabled?: boolean;
  isSaving: boolean;
  onConfirm: () => void;
}) {
  return (
    <Button
      type="button"
      variant="primary"
      size="large"
      className="w-full"
      onClick={onConfirm}
      disabled={disabled}
      loading={isSaving}
    >
      {label}
    </Button>
  );
}
