"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/molecules/Toast/use-toast";
import type { User } from "@/lib/auth/types";

const emailFormSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

function createEmailDefaultValues(user: { email?: string }) {
  return {
    email: user.email || "",
  };
}

// Better Auth owns the email change. For a verified user it emails a
// confirmation link to their CURRENT address and only applies the new email
// once that link is clicked (anti-takeover); for an unverified user the change
// applies immediately. Platform User.email (notifications / Stripe) then
// converges via the databaseHooks.user.update mirror in lib/auth/auth.ts — we
// deliberately do NOT write the platform email here, so it can never diverge to
// an unverified value.
async function requestEmailChange(email: string, fallback: string) {
  const response = await fetch("/api/auth/user", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || fallback);
  }

  return response.json();
}

export function useEmailForm({ user }: { user: User }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const defaultValues = createEmailDefaultValues(user);
  const currentEmail = user.email;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(
      emailFormSchema.extend({
        email: z
          .string()
          .min(1, t("Email is required", "请输入电子邮箱"))
          .email(
            t("Please enter a valid email address", "请输入有效的电子邮箱地址"),
          ),
      }),
    ),
    defaultValues,
    mode: "onSubmit",
  });

  async function onSubmit(values: z.infer<typeof emailFormSchema>) {
    if (values.email === user.email) return;

    setIsSubmitting(true);
    try {
      await requestEmailChange(
        values.email,
        t("Failed to update email", "邮箱更新失败"),
      );
      // Reset to the still-current address. On the verified path Better Auth
      // deliberately doesn't write the row until the link is clicked, so
      // `user.email` stays old — leaving the new value in the field would keep
      // the submit button enabled and fire another email on every click.
      form.reset({ email: currentEmail });
      toast(
        user.email_verified
          ? {
              title: t("Confirm your new email", "确认新邮箱"),
              description: t(
                "We sent a confirmation link to your current email address. Your email changes once you click it.",
                "我们已向当前邮箱发送确认链接。点击链接后，邮箱才会更改。",
              ),
            }
          : {
              title: t("Email updated", "邮箱已更新"),
              description: t(
                `Your email is now ${values.email}.`,
                `你的邮箱现已更改为 ${values.email}。`,
              ),
            },
      );
    } catch (error) {
      toast({
        title: t("Error updating email", "邮箱更新出错"),
        description:
          error instanceof Error
            ? error.message
            : t("Something went wrong", "出现了问题"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    form,
    onSubmit,
    isLoading: isSubmitting,
    currentEmail,
  };
}
