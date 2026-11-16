"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { cn } from "@/lib/utils";
import { ArrowLeft01Icon, Logout03Icon } from "@hugeicons/core-free-icons";
import { ProgressBar } from "./components/ProgressBar";
import { ProgressError } from "./components/ProgressError";
import { StepIndicator } from "./components/StepIndicator";
import { orderedSteps } from "./progress";
import { AccessStep } from "./steps/AccessStep/AccessStep";
import { BrainDumpStep } from "./steps/BrainDumpStep/BrainDumpStep";
import { ConnectStep } from "./steps/ConnectStep/ConnectStep";
import { IntroStep } from "./steps/IntroStep/IntroStep";
import { PreparingStep } from "./steps/PreparingStep";
import { RoleStep } from "./steps/RoleStep";
import { PlanTrialStep } from "./steps/SubscriptionStep/PlanTrialStep";
import { useOnboardingWizardStore } from "./store";
import { useOnboardingPage } from "./useOnboardingPage";

export default function OnboardingPage() {
  const { t } = useTranslation();
  const {
    currentStep,
    isLoading,
    handlePreparingComplete,
    isPaymentEnabled,
    isSelfHostConnectEnabled,
    canHireTeam,
    steps,
    preparingStep,
    totalSteps,
    trialConfirmation,
    paidConfirmation,
    progressError,
    progressConflict,
    retryProgress,
    completionError,
  } = useOnboardingPage();
  const prevStep = useOnboardingWizardStore((s) => s.prevStep);
  const isStepBusy = useOnboardingWizardStore((s) => s.isStepBusy);

  if (isLoading && paidConfirmation.error)
    return (
      <ErrorCard
        context={t("your payment", "付款")}
        responseError={{ message: paidConfirmation.error }}
        onRetry={paidConfirmation.retry}
      />
    );
  if (isLoading && paidConfirmation.pending)
    return (
      <Text variant="body" role="status">
        {t("Confirming your subscription…", "正在确认订阅…")}
      </Text>
    );
  if (isLoading)
    return !trialConfirmation.ready ? (
      <Text variant="body" role="status">
        {t(
          "Confirming your trial and card setup…",
          "正在确认试用及银行卡设置…",
        )}
      </Text>
    ) : progressError ? (
      <ProgressError
        message={progressError}
        conflict={progressConflict}
        retry={retryProgress}
      />
    ) : (
      <Text variant="body" role="status">
        {t("Loading your setup…", "正在加载设置…")}
      </Text>
    );

  // ProgressBar + StepIndicator track only the user-interactive steps.
  // PreparingStep is a transition view that hides both indicators.
  const showDots = currentStep <= totalSteps;
  // Back is hidden on the first content step
  // and while the current step is mid-flight (brain dump processing) — there
  // is nothing coherent to go back to. Read from the layout so it tracks
  // buildStepLayout rather than a hardcoded position.
  const firstContentStep = steps[orderedSteps(steps)[0]]!;
  const showBack =
    currentStep > firstContentStep && currentStep <= totalSteps && !isStepBusy;
  const showProgressBar = currentStep <= totalSteps;
  const showLogout = currentStep <= totalSteps;

  return (
    <div className="flex min-h-screen w-full flex-col items-center">
      {progressError && (
        <ProgressError
          message={progressError}
          conflict={progressConflict}
          retry={retryProgress}
        />
      )}
      {completionError && (
        <ErrorCard
          context={t("your account setup", "账户设置")}
          responseError={{ message: completionError }}
          onRetry={handlePreparingComplete}
        />
      )}
      {trialConfirmation.error ? (
        <ErrorCard
          context={t("your trial", "试用")}
          responseError={{ message: trialConfirmation.error }}
          onRetry={trialConfirmation.retry}
        />
      ) : null}
      {showProgressBar && (
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      )}

      {showBack && (
        <Button
          type="button"
          variant="toggle"
          size="xs"
          onClick={prevStep}
          leadingIcon={ArrowLeft01Icon}
          className="absolute top-6 left-6"
        >
          {t("Back", "返回")}
        </Button>
      )}

      <div
        className={cn(
          "flex w-full min-w-0 flex-1 items-center justify-center",
          currentStep === steps.subscription
            ? "pt-3 pb-8 lg:pb-2"
            : "pt-16 pb-8",
        )}
      >
        {currentStep === steps.access && <AccessStep />}
        {currentStep === steps.team && <IntroStep slide="team" />}
        {currentStep === steps.autopilot && <IntroStep slide="autopilot" />}
        {currentStep === steps.role && <RoleStep />}
        {currentStep === steps.painPoints && <BrainDumpStep />}
        {isSelfHostConnectEnabled && currentStep === steps.connect && (
          <ConnectStep />
        )}
        {currentStep === steps.subscription && (
          <PlanTrialStep hasPaywall={isPaymentEnabled} />
        )}
        {currentStep === preparingStep && (
          <PreparingStep
            onComplete={handlePreparingComplete}
            canHire={canHireTeam}
          />
        )}
      </div>

      {showDots && (
        <div
          className={
            currentStep === steps.subscription ? "pb-8 lg:pb-4" : "pb-8"
          }
        >
          <StepIndicator totalSteps={totalSteps} currentStep={currentStep} />
        </div>
      )}

      {showLogout && (
        <Button
          as="NextLink"
          href="/logout"
          variant="toggle"
          size="xs"
          leadingIcon={Logout03Icon}
          className="absolute bottom-6 left-6"
        >
          {t("Log out", "退出登录")}
        </Button>
      )}
    </div>
  );
}
