"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@/lib/auth/types";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useState } from "react";
import { toast } from "@/components/molecules/Toast/use-toast";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";

type EmailFormValues = { email: string };

async function updateEmailViaAuthAPI(email: string, locale: Locale = "en") {
  const response = await fetch("/api/auth/user", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error ??
        (locale === "zh-CN" ? "无法更新邮箱" : "Failed to update email"),
    );
  }

  return response.json();
}

export function useAccountCard({ user }: { user: User }) {
  const { t, locale } = useTranslation();
  const currentEmail = user.email ?? "";
  const emailSchema = z.object({
    email: z
      .string()
      .min(1, t("Email is required", "请输入邮箱"))
      .email(t("Enter a valid email address", "请输入有效的邮箱地址")),
  });

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: currentEmail },
    mode: "onChange",
  });

  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  async function onSubmitEmail(values: EmailFormValues): Promise<boolean> {
    if (values.email === currentEmail) return false;

    // Route the change only through Better Auth. A verified user approves it via
    // a confirmation link sent to their CURRENT address (anti-takeover); an
    // unverified user's change applies immediately. Platform User.email
    // converges via the databaseHooks.user.update mirror in lib/auth/auth.ts —
    // writing it here in parallel would let it diverge to an unverified value.
    // Mirrors EmailForm.
    setIsUpdatingEmail(true);
    try {
      await updateEmailViaAuthAPI(values.email, locale);
      // Reset to the still-current address: on the verified path the row isn't
      // written until the link is clicked, so leaving the new value in the
      // field would let every further click send another email. Mirrors
      // EmailForm.
      emailForm.reset({ email: currentEmail });
      toast(
        user.email_verified
          ? {
              title: t("Confirm your new email", "请确认新邮箱"),
              description: t(
                "We sent a confirmation link to your current email address. Your email changes once you click it.",
                "我们已向你当前的邮箱发送确认链接。点击链接后，邮箱地址才会更改。",
              ),
              variant: "success",
            }
          : {
              title: t("Email updated", "邮箱已更新"),
              description: t(
                `Your email is now ${values.email}.`,
                `你的邮箱现已更改为 ${values.email}。`,
              ),
              variant: "success",
            },
      );
      return true;
    } catch (err) {
      toast({
        title: t("Couldn't update email", "无法更新邮箱"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdatingEmail(false);
    }
  }

  return {
    emailForm,
    onSubmitEmail,
    isUpdatingEmail,
    currentEmail,
  };
}
