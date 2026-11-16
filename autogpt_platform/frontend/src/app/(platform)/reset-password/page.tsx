"use client";
import { Button } from "@/components/atoms/Button/Button";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useAuthTranslation } from "@/components/auth/useAuthTranslation";
import { Input } from "@/components/atoms/Input/Input";
import { AuthCard } from "@/components/auth/AuthCard";
import { CookieSettingsLink } from "@/components/molecules/CookieSettingsLink/CookieSettingsLink";
import { ExpiredLinkMessage } from "@/components/auth/ExpiredLinkMessage";
import { FormField } from "@/components/molecules/Form/Form";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner/LoadingSpinner";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { changePasswordFormSchema, sendEmailFormSchema } from "@/types/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { changePassword, sendResetEmail } from "./actions";

function ResetPasswordContent() {
  const { t } = useTranslation();
  const { translateAuthMessage } = useAuthTranslation();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [showExpiredMessage, setShowExpiredMessage] = useState(false);

  // Better Auth's reset link lands here with `?token=`; its presence decides
  // whether we show the "set new password" form or the "request email" form.
  const resetToken = searchParams.get("token");

  useEffect(() => {
    const error = searchParams.get("error");
    const errorCode = searchParams.get("error_code");
    const errorDescription = searchParams.get("error_description");

    if (error || errorCode) {
      // Check if this is an expired/used link error
      // Avoid broad checks like "invalid" which can match unrelated errors
      const descLower = errorDescription?.toLowerCase() || "";
      const isExpiredOrUsed =
        error === "link_expired" ||
        error === "INVALID_TOKEN" ||
        error === "invalid_token" ||
        errorCode === "otp_expired" ||
        descLower.includes("expired") ||
        descLower.includes("already") ||
        descLower.includes("used");

      if (isExpiredOrUsed) {
        setShowExpiredMessage(true);
        // Also show a toast with the error detail for debugging
        if (errorDescription) {
          toast({
            title: t("Link Expired", "链接已过期"),
            description: errorDescription,
            variant: "destructive",
          });
        }
      } else {
        // Show toast for other errors
        const errorMessage =
          errorDescription ||
          error ||
          t("Password reset failed", "密码重置失败");
        toast({
          title: t("Password Reset Failed", "密码重置失败"),
          description: errorMessage,
          variant: "destructive",
        });
      }

      // Clear all error params from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      newUrl.searchParams.delete("error_code");
      newUrl.searchParams.delete("error_description");
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, toast, router, t]);

  const sendEmailForm = useForm<z.infer<typeof sendEmailFormSchema>>({
    resolver: zodResolver(sendEmailFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const changePasswordForm = useForm<z.infer<typeof changePasswordFormSchema>>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSendEmail = useCallback(
    async (data: z.infer<typeof sendEmailFormSchema>) => {
      setIsLoading(true);

      if (!(await sendEmailForm.trigger())) {
        setIsLoading(false);
        return;
      }

      const error = await sendResetEmail(data.email);
      setIsLoading(false);
      if (error) {
        toast({
          title: t("Error", "错误"),
          description: error,
          variant: "destructive",
        });
        return;
      }
      setDisabled(true);
      toast({
        title: t("Check your email", "请查收邮件"),
        description: t(
          "If an account exists for this address, we've sent a reset link.",
          "如果此邮箱已注册，我们已发送密码重置链接。",
        ),
        variant: "default",
      });
    },
    [sendEmailForm, toast, t],
  );

  function handleShowEmailForm() {
    setShowExpiredMessage(false);
  }

  const onChangePassword = useCallback(
    async (data: z.infer<typeof changePasswordFormSchema>) => {
      if (!resetToken) return;

      setIsLoading(true);

      if (!(await changePasswordForm.trigger())) {
        setIsLoading(false);
        return;
      }

      const error = await changePassword(data.password, resetToken);
      setIsLoading(false);
      if (error) {
        toast({
          title: t("Error", "错误"),
          description: error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: t("Success", "成功"),
        description: t(
          "Password changed successfully. Redirecting to login.",
          "密码修改成功，正在跳转到登录页。",
        ),
        variant: "default",
      });
    },
    [changePasswordForm, resetToken, toast, t],
  );

  // Show expired link message if detected
  if (showExpiredMessage && !resetToken) {
    return (
      <div className="flex h-full min-h-[85vh] w-full flex-col items-center justify-center">
        <AuthCard title={t("Reset Password", "重置密码")}>
          <ExpiredLinkMessage onRequestNewLink={handleShowEmailForm} />
        </AuthCard>
        <CookieSettingsLink className="mt-6" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[85vh] w-full flex-col items-center justify-center">
      <AuthCard title={t("Reset Password", "重置密码")}>
        {resetToken ? (
          <form
            onSubmit={changePasswordForm.handleSubmit(onChangePassword)}
            className="flex w-full flex-col gap-1"
          >
            <FormProvider {...changePasswordForm}>
              <FormField
                control={changePasswordForm.control}
                name="password"
                render={({ field }) => (
                  <Input
                    id={field.name}
                    label={t("Password", "密码")}
                    type="password"
                    placeholder="••••••••••••••••"
                    error={
                      translateAuthMessage(
                        changePasswordForm.formState.errors.password?.message,
                      ) ?? undefined
                    }
                    {...field}
                  />
                )}
              />
              <FormField
                control={changePasswordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <Input
                    id={field.name}
                    label={t("Confirm Password", "确认密码")}
                    type="password"
                    placeholder="••••••••••••••••"
                    error={
                      translateAuthMessage(
                        changePasswordForm.formState.errors.confirmPassword
                          ?.message,
                      ) ?? undefined
                    }
                    {...field}
                  />
                )}
              />

              <Button
                variant="primary"
                loading={isLoading}
                type="submit"
                className="mt-6 w-full"
              >
                {isLoading
                  ? t("Updating password...", "正在更新密码…")
                  : t("Update password", "更新密码")}
              </Button>
            </FormProvider>
          </form>
        ) : (
          <form
            onSubmit={sendEmailForm.handleSubmit(onSendEmail)}
            className="flex w-full flex-col gap-1"
          >
            <FormProvider {...sendEmailForm}>
              <FormField
                control={sendEmailForm.control}
                name="email"
                render={({ field }) => (
                  <Input
                    id={field.name}
                    label={t("Email", "邮箱")}
                    placeholder="m@example.com"
                    type="email"
                    error={
                      translateAuthMessage(
                        sendEmailForm.formState.errors.email?.message,
                      ) ?? undefined
                    }
                    {...field}
                  />
                )}
              />

              <Button
                variant="primary"
                loading={isLoading}
                disabled={disabled}
                type="submit"
                className="mt-6 w-full"
              >
                {t("Send reset email", "发送重置邮件")}
              </Button>
            </FormProvider>
          </form>
        )}
      </AuthCard>
      <CookieSettingsLink className="mt-6" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[80vh] items-center justify-center">
          <LoadingSpinner
            variant="circle"
            className="size-16"
            aria-hidden="true"
          />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
