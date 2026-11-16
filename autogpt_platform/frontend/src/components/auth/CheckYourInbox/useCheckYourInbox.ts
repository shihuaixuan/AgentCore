import { useToast } from "@/components/molecules/Toast/use-toast";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { authClient } from "@/lib/auth/client";
import { getEmailVerificationCallbackURL } from "@/lib/auth/email-verification";
import {
  UNDELIVERABLE_EMAIL_CODE,
  UNDELIVERABLE_EMAIL_HINT,
  UNDELIVERABLE_EMAIL_TITLE,
} from "@/lib/auth/undeliverable-email";
import { useEffect, useState } from "react";
import {
  CHECK_YOUR_INBOX_HEADING_ID,
  RESEND_COOLDOWN_SECONDS,
} from "./helpers";

interface Args {
  email: string;
  next?: string | null;
  marketingOptOut?: boolean;
}

export function useCheckYourInbox({ email, next, marketingOptOut }: Args) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    document.getElementById(CHECK_YOUR_INBOX_HEADING_ID)?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleResend() {
    setIsResending(true);
    try {
      // Through the HTTP route rather than a server action so Better Auth's
      // per-IP rate limit applies.
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: getEmailVerificationCallbackURL({ next, marketingOptOut }),
      });
      if (error?.code === UNDELIVERABLE_EMAIL_CODE) {
        toast({
          title: UNDELIVERABLE_EMAIL_TITLE,
          description: UNDELIVERABLE_EMAIL_HINT,
          variant: "destructive",
        });
        return;
      }
      if (error) {
        showResendFailed(error.status === 429);
        return;
      }
    } catch {
      // A network failure throws instead of answering with an error.
      showResendFailed(false);
      return;
    } finally {
      setIsResending(false);
    }

    setCooldown(RESEND_COOLDOWN_SECONDS);
    toast({
      title: t(`Email sent to ${email}`, `邮件已发送至 ${email}`),
      variant: "success",
    });
  }

  function showResendFailed(rateLimited: boolean) {
    toast({
      title: t("We couldn't send the email", "邮件发送失败"),
      description: rateLimited
        ? t(
            "Too many attempts. Please try again in a few minutes.",
            "尝试次数过多，请几分钟后重试。",
          )
        : t("Please try again in a moment.", "请稍后重试。"),
      variant: "destructive",
    });
  }

  return {
    cooldown,
    isResending,
    canResend: cooldown <= 0 && !isResending,
    handleResend,
  };
}
