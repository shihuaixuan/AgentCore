"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";

import { formatChoicePrice } from "./helpers";
import type { PaymentPage } from "./useTrialPlanRequest";

interface Props {
  page: PaymentPage | null;
  onClose: () => void;
}

export function ConfirmWithBankDialog({ page, onClose }: Props) {
  const { t, locale } = useTranslation();
  return (
    <Dialog
      title={t("Confirm with your bank", "向银行确认")}
      styling={{ maxWidth: "28rem", minWidth: "auto" }}
      controlled={{
        isOpen: page !== null,
        set: (open) => {
          if (!open) onClose();
        },
      }}
    >
      <Dialog.Content>
        {page ? (
          <Text variant="body">
            {t(
              `Your bank wants to confirm the ${formatChoicePrice(page.plan)} payment for ${page.plan.label}. Pay on Stripe's secure page and ${page.plan.label} starts right away. Until then your trial stays as it is.`,
              `你的银行需要确认 ${page.plan.label} 的 ${formatChoicePrice(page.plan, locale)} 付款。在 Stripe 的安全页面付款后，${page.plan.label} 将立即生效。在此之前，你的试用保持不变。`,
            )}
          </Text>
        ) : null}
        <Dialog.Footer>
          <Button variant="outline" onClick={onClose}>
            {t("Done", "完成")}
          </Button>
          {page ? (
            <Button
              as="NextLink"
              variant="primary"
              href={page.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("Pay on Stripe", "在 Stripe 付款")}
            </Button>
          ) : null}
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
