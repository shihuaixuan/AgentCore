"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { TrialRejectionReason } from "@/app/api/__generated__/models/trialRejectionReason";
import { Text } from "@/components/atoms/Text/Text";
import { Button } from "@/components/atoms/Button/Button";
import { TrialTitle } from "./TrialTitle/TrialTitle";

interface Props {
  reason: TrialRejectionReason;
}

export function TrialRejection({ reason }: Props) {
  const { t } = useTranslation();
  const alreadyUsed = reason === "intro_offer_already_used";
  return (
    <div
      role="status"
      data-slot="trial-rejection"
      className="flex flex-col gap-3"
    >
      <TrialTitle>
        {alreadyUsed
          ? t(
              "This introductory offer has already been used",
              "已使用过此首次优惠",
            )
          : t(
              "We couldn’t verify your card for this trial",
              "无法为本次试用验证银行卡",
            )}
      </TrialTitle>
      <Text variant="body" tone="emphasis">
        {alreadyUsed
          ? t(
              "This card or account has already redeemed an introductory offer. Each card and account can use one introductory offer.",
              "此银行卡或账户已使用过首次优惠。每张卡和每个账户仅能使用一次首次优惠。",
            )
          : t(
              "Your card could not be verified for trial eligibility, so this trial was not activated.",
              "无法验证此银行卡的试用资格，因此未激活本次试用。",
            )}
      </Text>
      <Text variant="body" tone="emphasis">
        {t(
          "This trial will not convert to a paid subscription. You can choose a paid plan below. If you think this is a mistake, contact support.",
          "本次试用不会转为付费订阅。你可以在下方选择付费套餐。如有疑问，请联系客服。",
        )}
      </Text>
      <Button
        as="NextLink"
        href="https://discord.gg/autogpt"
        target="_blank"
        rel="noopener noreferrer"
        variant="outline"
        size="small"
        className="self-start"
      >
        {t("Contact support", "联系客服")}
      </Button>
    </div>
  );
}
