import { postV1SubmitOnboardingProfile } from "@/app/api/__generated__/endpoints/onboarding/onboarding";
import type { User } from "@/lib/auth/types";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useEffect, useRef, useState } from "react";
import { accountDisplayName, normalizeOnboardingProfile } from "./helpers";
import { useOnboardingWizardStore } from "./store";

const SAVE_ERROR =
  "We couldn't save your profile. Your answers are saved; please retry before continuing.";

export function useOnboardingProfile({
  user,
  enabled,
}: {
  user: User | null;
  enabled: boolean;
}) {
  const { t } = useTranslation();
  const userID = user?.id ?? null;
  const activeUserID = useRef(userID);
  activeUserID.current = userID;
  const submission = useRef<{
    key: string;
    abort: AbortController;
    promise: Promise<void>;
  } | null>(null);
  const [failure, setFailure] = useState<{
    userID: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    return () => {
      submission.current?.abort.abort();
      submission.current = null;
    };
  }, [userID]);

  useEffect(() => {
    if (enabled && accountDisplayName(user))
      void ensureSaved().catch(() => undefined);
  }, [enabled, user]);

  async function ensureSaved() {
    if (
      !enabled ||
      !userID ||
      activeUserID.current !== userID ||
      useOnboardingWizardStore.getState().userID !== userID
    ) {
      throw new Error("Your account changed. Please reload onboarding.");
    }
    const { role, painPoints } = normalizeOnboardingProfile(
      useOnboardingWizardStore.getState(),
    );
    const userName = accountDisplayName(user);
    if (!role.trim() || !userName) {
      setFailure({ userID, message: SAVE_ERROR });
      throw new Error(SAVE_ERROR);
    }
    const profile = {
      user_name: userName,
      user_role: role,
      pain_points: painPoints,
    };
    const key = JSON.stringify({ userID, profile });
    if (submission.current?.key === key) return submission.current.promise;
    submission.current?.abort.abort();
    const abort = new AbortController();
    setFailure(null);
    function isCurrent() {
      return (
        submission.current?.abort === abort &&
        !abort.signal.aborted &&
        activeUserID.current === userID &&
        useOnboardingWizardStore.getState().userID === userID
      );
    }
    async function save() {
      const result = await postV1SubmitOnboardingProfile(profile, {
        signal: abort.signal,
      });
      if (!isCurrent()) throw new Error("Your account changed.");
      if (result.status !== 200) throw new Error(SAVE_ERROR);
    }
    const promise = save().catch((error: unknown) => {
      if (isCurrent()) {
        submission.current = null;
        setFailure({ userID, message: SAVE_ERROR });
      }
      throw error;
    });
    submission.current = { key, abort, promise };
    return promise;
  }

  function localizeError(message: string) {
    switch (message) {
      case SAVE_ERROR:
        return t(message, "无法保存个人资料。回答已保存，请重试后再继续。");
      case "Your account changed. Please reload onboarding.":
        return t(message, "账户已更改，请重新加载首次使用向导。");
      case "Your account changed.":
        return t(message, "账户已更改。");
      default:
        return message;
    }
  }

  return {
    ensureSaved: async () => {
      try {
        await ensureSaved();
      } catch (error) {
        if (!(error instanceof Error)) throw error;
        const message = localizeError(error.message);
        if (message === error.message) throw error;
        throw new Error(message, { cause: error });
      }
    },
    error: failure?.userID === userID ? localizeError(failure.message) : null,
  };
}
