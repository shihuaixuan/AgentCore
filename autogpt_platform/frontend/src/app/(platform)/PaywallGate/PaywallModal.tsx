"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useCanDeleteAccount } from "@/components/organisms/DeleteAccountFlow/useCanDeleteAccount";
import { SubscriptionPlans } from "@/components/organisms/SubscriptionPlans/SubscriptionPlans";
import { TrialCardContent } from "@/components/organisms/TrialCard/TrialCard";
import { PaymentRecoveryCard } from "@/components/organisms/UsageExperience/PaymentRecoveryCard";
import { cn } from "@/lib/utils";
import { usePaymentRecovery } from "@/services/usageExperience/usePaymentRecovery";
import { Logout03Icon } from "@hugeicons/core-free-icons";
import { SwitchTierDialog } from "../settings/billing/components/SubscriptionTab/YourPlanCard/SwitchTierDialog";
import { DeleteAccountButton } from "./components/DeleteAccountButton/DeleteAccountButton";
import { PausedSchedulesNotice } from "./components/PausedSchedulesNotice";
import { PaywallPlanChoices } from "./components/PaywallPlanChoices";
import { PaywallHeader } from "./components/PaywallHeader";
import { usePaywallModal } from "./usePaywallModal";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function PaywallModal() {
  const { t } = useTranslation();
  const {
    isLoading,
    plans,
    retryLoadPlans,
    isRetryingPlans,
    country,
    selectedCycle,
    setSelectedCycle,
    handleSelectPlan,
    isPending,
    selectedTier,
    pendingTier,
    pendingTierLabel,
    confirmPendingTier,
    cancelPendingTier,
    handleLogout,
    handleClose,
    trial,
    trialOffer,
    pausedWorkflowSchedules,
  } = usePaywallModal();
  const canDeleteAccount = useCanDeleteAccount();
  // The gate only opens this modal for accounts without a plan.
  const recovery = usePaymentRecovery("NO_TIER");

  return (
    <Dialog
      variant="compact"
      title={
        recovery.paymentFailed
          ? t("Your plan", "你的套餐")
          : t("Choose your plan", "选择套餐")
      }
      styling={{
        maxWidth: trialOffer && !recovery.paymentFailed ? "1120px" : "700px",
      }}
      controlled={{
        isOpen: true,
        set: (open) => {
          if (!open) handleClose();
        },
      }}
    >
      <Dialog.Content>
        <div className="relative flex w-full flex-col items-center gap-4 px-2 py-2">
          <div
            className={cn(
              "flex w-full justify-start",
              canDeleteAccount && "flex-wrap gap-1",
            )}
          >
            <Button
              variant="ghost-muted"
              size="small"
              onClick={handleLogout}
              leftIcon={<Icon icon={Logout03Icon} size={16} />}
            >
              {t("Log out", "退出登录")}
            </Button>
            {canDeleteAccount ? <DeleteAccountButton /> : null}
          </div>
          {recovery.paymentFailed ? (
            <>
              <PaymentRecoveryCard
                payment={recovery.payment}
                fallback={t(
                  "Update your payment method in billing to continue. Your chats, workflows and results are saved.",
                  "请前往账单设置更新付款方式以继续使用。你的对话、工作流和成果均已保存。",
                )}
              />
              <PausedSchedulesNotice count={pausedWorkflowSchedules} />
            </>
          ) : (
            <>
              <PaywallHeader />
              <PausedSchedulesNotice count={pausedWorkflowSchedules} />

              <div className="relative mt-2 w-full">
                {isLoading || trial.isLoading ? (
                  <div className="grid w-full grid-cols-1 gap-4 px-4 md:grid-cols-3 md:px-0">
                    <Skeleton className="h-[26rem] rounded-2xl" />
                    <Skeleton className="h-[26rem] rounded-2xl" />
                    <Skeleton className="h-[26rem] rounded-2xl" />
                  </div>
                ) : plans.length === 0 ? (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-center text-body text-foreground-tertiary">
                      {t(
                        "Subscriptions are temporarily unavailable. Please try again shortly.",
                        "订阅服务暂不可用，请稍后重试。",
                      )}
                    </p>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={retryLoadPlans}
                      loading={isRetryingPlans}
                    >
                      {t("Retry", "重试")}
                    </Button>
                  </div>
                ) : !trialOffer ? (
                  <div className="space-y-4">
                    <PaywallPlanChoices
                      plans={plans}
                      cycle={selectedCycle}
                      onCycle={setSelectedCycle}
                      onSelect={handleSelectPlan}
                      pending={isPending}
                      selectedTier={selectedTier}
                    />
                    {!trial.trial?.eligible && (
                      <TrialCardContent returnTo="billing" controller={trial} />
                    )}
                  </div>
                ) : (
                  <SubscriptionPlans
                    // The modal renders its own title above, so the organism
                    // contributes only the billing toggle.
                    header={null}
                    plans={plans}
                    country={country}
                    billing={selectedCycle}
                    onBillingChange={setSelectedCycle}
                    onSelectPlan={handleSelectPlan}
                    isUpdatingTier={isPending}
                    selectedPlan={selectedTier}
                    trialOffer={trialOffer}
                    onStartTrial={trial.startTrial}
                    isStartingTrial={trial.isStarting}
                    trialError={trial.error}
                    trialStatus={
                      !trialOffer && (
                        <TrialCardContent
                          returnTo="billing"
                          controller={trial}
                        />
                      )
                    }
                  />
                )}
              </div>
            </>
          )}
        </div>
        <Button variant="ghost" className="mt-3 w-full" onClick={handleClose}>
          {t("Back to billing", "返回账单")}
        </Button>
      </Dialog.Content>
      {pendingTier && pendingTierLabel ? (
        <SwitchTierDialog
          isOpen={pendingTier !== null}
          onOpenChange={(open) => {
            if (!open) cancelPendingTier();
          }}
          targetTierLabel={pendingTierLabel}
          title={t(
            `Switch to ${pendingTierLabel}?`,
            `切换至 ${pendingTierLabel}？`,
          )}
          confirmLabel={t(
            `Switch to ${pendingTierLabel}`,
            `切换至 ${pendingTierLabel}`,
          )}
          body={t(
            "Your current Stripe subscription will be modified — you may be charged or refunded the prorated difference. Continue?",
            "这将修改你当前的 Stripe 订阅，并可能按剩余时间补收或退还差价。是否继续？",
          )}
          isSaving={isPending}
          onConfirm={() => {
            void confirmPendingTier();
          }}
        />
      ) : null}
    </Dialog>
  );
}
