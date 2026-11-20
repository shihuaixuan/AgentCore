"use client";

import { FormProvider } from "react-hook-form";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useAuthTranslation } from "@/components/auth/useAuthTranslation";
import { FormField } from "@/components/molecules/Form/Form";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Link } from "@/components/atoms/Link/Link";
import { Text } from "@/components/atoms/Text/Text";
import AuthFeedback from "@/components/auth/AuthFeedback";
import { CheckYourInbox } from "@/components/auth/CheckYourInbox/CheckYourInbox";
import { EmailNotAllowedModal } from "@/components/auth/EmailNotAllowedModal";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { MicrosoftOAuthButton } from "@/components/auth/MicrosoftOAuthButton";
import { AuthDivider } from "@/components/auth/AuthSplitLayout/AuthDivider";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout/AuthSplitLayout";
import { MobileWarningBanner } from "@/components/auth/MobileWarningBanner";
import { environment } from "@/services/environment";
import { useSearchParams } from "next/navigation";
import { LoadingSignup } from "./components/LoadingSignup";
import { SignupLegalLine } from "./components/SignupLegalLine";
import { SignupMarketingPanel } from "./components/SignupMarketingPanel";
import { useSignupPage } from "./useSignupPage";
import { usernameSignupEnabled } from "@/lib/auth/local-username";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  const { t } = useTranslation();
  const usernames = usernameSignupEnabled();
  const { translateAuthMessage } = useAuthTranslation();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");
  const loginHref = nextUrl
    ? `/login?next=${encodeURIComponent(nextUrl)}`
    : "/login";

  const {
    form,
    feedback,
    nextUrl: safeNextUrl,
    verificationEmail,
    isLoggedIn,
    hasInitializedAuth,
    isLoading,
    isGoogleLoading,
    isMicrosoftLoading,
    isMicrosoftEnabled,
    isSigningUp,
    isCloudEnv,
    showNotAllowedModal,
    optedOut,
    handleSubmit,
    handleToggleMarketingOptOut,
    handleProviderSignup,
    handleCloseNotAllowedModal,
    handleStartAgain,
  } = useSignupPage();

  if (!hasInitializedAuth || isLoggedIn) {
    return <LoadingSignup />;
  }

  if (verificationEmail) {
    return (
      <AuthSplitLayout marketing={<SignupMarketingPanel />}>
        <CheckYourInbox
          email={verificationEmail}
          reason="signup"
          next={safeNextUrl}
          marketingOptOut={optedOut}
          onBack={handleStartAgain}
        />
      </AuthSplitLayout>
    );
  }

  const confirmPasswordError = form.formState.errors.confirmPassword?.message;

  return (
    <AuthSplitLayout marketing={<SignupMarketingPanel />}>
      <div className="mb-8">
        <Text variant="h3" as="h1" tone="primary">
          {t("Create your account", "创建账户")}
        </Text>
        <Text variant="body" tone="muted" className="mt-1">
          {t("Already a member?", "已有账户？")}{" "}
          <Link href={loginHref} variant="secondary">
            {t("Log in", "登录")}
          </Link>
        </Text>
      </div>

      <FormProvider {...form}>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-1">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <Input
                id={field.name}
                label={usernames ? t("Username", "用户名") : t("Email", "邮箱")}
                placeholder={
                  usernames
                    ? t("Choose a username", "设置用户名")
                    : "name@company.com"
                }
                type={usernames ? "text" : "email"}
                autoComplete={usernames ? "username" : "email"}
                error={
                  translateAuthMessage(form.formState.errors.email?.message) ??
                  undefined
                }
                {...field}
              />
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <Input
                id={field.name}
                label={t("Password", "密码")}
                placeholder={t("Create a password", "设置密码")}
                type="password"
                autoComplete="new-password"
                error={
                  translateAuthMessage(
                    form.formState.errors.password?.message,
                  ) ?? undefined
                }
                {...field}
              />
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <Input
                id={field.name}
                label={t("Confirm Password", "确认密码")}
                placeholder={t("Confirm your password", "请再次输入密码")}
                type="password"
                autoComplete="new-password"
                error={translateAuthMessage(confirmPasswordError) ?? undefined}
                {...field}
              />
            )}
          />
          <Button
            variant="primary"
            loading={isLoading}
            disabled={isGoogleLoading || isMicrosoftLoading}
            type="submit"
            className="mt-6 w-full"
          >
            {isLoading ? t("Signing up...", "正在注册…") : t("Sign up", "注册")}
          </Button>
        </form>

        {isCloudEnv || isMicrosoftEnabled ? (
          <>
            <AuthDivider />
            <div className="flex w-full flex-col gap-3">
              {isCloudEnv ? (
                <GoogleOAuthButton
                  onClick={() => handleProviderSignup("google")}
                  isLoading={isGoogleLoading}
                  disabled={isLoading || isMicrosoftLoading}
                />
              ) : null}
              {isMicrosoftEnabled ? (
                <MicrosoftOAuthButton
                  onClick={() => handleProviderSignup("microsoft")}
                  isLoading={isMicrosoftLoading}
                  disabled={isLoading || isGoogleLoading}
                />
              ) : null}
            </div>
          </>
        ) : null}

        <SignupLegalLine
          optedOut={optedOut}
          onToggle={handleToggleMarketingOptOut}
          disabled={isSigningUp}
        />

        <AuthFeedback
          type="signup"
          message={feedback}
          isError={!!feedback}
          behaveAs={environment.getBehaveAs()}
        />
      </FormProvider>

      <MobileWarningBanner />
      <EmailNotAllowedModal
        isOpen={showNotAllowedModal}
        onClose={handleCloseNotAllowedModal}
      />
    </AuthSplitLayout>
  );
}
