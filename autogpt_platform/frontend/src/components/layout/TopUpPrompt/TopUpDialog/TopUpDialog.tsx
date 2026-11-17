"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import Link from "next/link";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import {
  TOP_UP_QUESTION,
  TopUpQuestion,
} from "@/components/organisms/FeedbackPrompts/TopUpQuestion";

import { TopUpForm } from "../TopUpForm/TopUpForm";
import { useTopUpDialog } from "./useTopUpDialog";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // "out-of-credits" is the reactive nudge shown when the balance hits zero;
  // "add-credits" is the same form opened deliberately from the wallet.
  variant?: "out-of-credits" | "add-credits";
}

export function TopUpDialog({
  isOpen,
  onClose,
  variant = "out-of-credits",
}: Props) {
  const { t } = useTranslation();
  const isOutOfCredits = variant === "out-of-credits";
  const dialog = useTopUpDialog({ onClose });

  function handleOpenChange(open: boolean) {
    if (!open) dialog.close();
  }

  return (
    <Dialog
      title={
        dialog.isAsking ? (
          TOP_UP_QUESTION
        ) : isOutOfCredits ? (
          <span className="inline-flex items-center gap-2">
            <span className="flex text-orange-foreground">
              <Icon
                aria-hidden
                icon={Alert02Icon}
                className="h-[1.125rem] w-[1.125rem]"
              />
            </span>
            {t("You're out of automation credits", "自动化额度已用完")}
          </span>
        ) : (
          t("Add automation credits", "添加自动化额度")
        )
      }
      styling={{ maxWidth: "28rem" }}
      controlled={{ isOpen, set: handleOpenChange }}
    >
      <Dialog.Content>
        {dialog.isAsking ? (
          <TopUpQuestion
            onReason={dialog.pickReason}
            onSubmit={dialog.answer}
          />
        ) : (
          <>
            <TopUpOffer isOutOfCredits={isOutOfCredits} />
            {isOutOfCredits ? (
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="small"
                  loading={dialog.isClaiming}
                  disabled={dialog.isClaiming}
                  onClick={dialog.notNow}
                >
                  {t("Not now", "暂不充值")}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </Dialog.Content>
    </Dialog>
  );
}

interface OfferProps {
  isOutOfCredits: boolean;
}

function TopUpOffer({ isOutOfCredits }: OfferProps) {
  const { t } = useTranslation();
  return (
    <>
      <Text variant="large">
        {isOutOfCredits
          ? t(
              "Top up to keep your workflows and experts running. You can also ",
              "充值即可继续运行工作流和专家。你也可以",
            )
          : t(
              "Credits are used to run your workflows and experts. You can also ",
              "额度用于运行工作流和专家。你也可以",
            )}
        <Link href="/settings/billing" className="underline">
          {t(
            "enable auto-refill in billing settings",
            "在账单设置中启用自动充值",
          )}
        </Link>
        .
      </Text>
      <TopUpForm submitLabel={t("Top up", "充值")} />
    </>
  );
}
