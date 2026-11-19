import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

const FAILURE_MESSAGES: Readonly<Record<string, string>> = {
  "Unable to start trial checkout.": "无法开始试用结账。",
  "Unable to cancel your trial.": "无法取消试用。",
  "Unable to resume your trial.": "无法恢复试用。",
};

interface Failure {
  userID: string;
  message: string;
}

interface ReportArgs {
  userID: string;
  error: unknown;
  fallback: string;
}

export function useTrialFailure(userID: string | undefined) {
  const { t } = useTranslation();
  const [failure, setFailure] = useState<Failure | null>(null);

  function reportFailure({ userID, error, fallback }: ReportArgs) {
    const message = error instanceof Error ? error.message : fallback;
    setFailure({
      userID,
      message: t(message, FAILURE_MESSAGES[message] ?? message),
    });
  }

  return {
    error: failure && failure.userID === userID ? failure.message : null,
    clearFailure: () => setFailure(null),
    reportFailure,
  };
}
