import { useToast } from "@/components/molecules/Toast/use-toast";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useCaptureMarketingPrompt } from "@/hooks/useCaptureMarketingPrompt";
import {
  getAuthDeepLink,
  sanitizeAuthNext,
  withAuthTracking,
} from "@/lib/auth-redirect";
import { providerCallbackPath } from "@/lib/auth/provider-callback";
import { useAuth } from "@/lib/auth/hooks/useAuth";
import { setMarketingOptOutFlag } from "@/services/analytics/marketing-opt-out-cookie";
import { trackSignupMarketingOptOut } from "@/services/analytics/signup-analytics";
import { environment } from "@/services/environment";
import { LoginProvider, signupFormSchema } from "@/types/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { signup as signupAction } from "./actions";
import { isTeamEmail } from "@/lib/auth/team-email";
import { usernameSignupEnabled } from "@/lib/auth/local-username";
import { clearImpersonationEverywhere } from "@/lib/impersonation";
import { useAuthPageTranslation } from "../useAuthPageTranslation";

export function useSignupPage() {
  const { t } = useTranslation();
  const { translateMessage } = useAuthPageTranslation();
  useCaptureMarketingPrompt();

  const { user, isUserLoading, isLoggedIn } = useAuth();
  const [hasInitializedAuth, setHasInitializedAuth] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<LoginProvider | null>(
    null,
  );
  const [showNotAllowedModal, setShowNotAllowedModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(
    null,
  );
  const isCloudEnv = environment.isCloud();
  const loadingResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(false);

  // Same-origin redirect target; off-site values are dropped so a crafted
  // `/signup?next=https://phishing.site` cannot redirect users elsewhere.
  const rawNext = searchParams.get("next");
  const nextUrl = getAuthDeepLink(rawNext);
  // Round trips (Google, the verification email) carry the whole safe `next`;
  // /auth/callback decides from it, tracking params included.
  const safeNext = sanitizeAuthNext(rawNext);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (loadingResetTimer.current) clearTimeout(loadingResetTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!isUserLoading) {
      setHasInitializedAuth(true);
    }
  }, [isUserLoading]);

  // Only honour explicit `?next=` deep links here. OnboardingProvider handles
  // the default landing for users who are already signed in.
  useEffect(() => {
    if (isLoggedIn && !isSigningUp && nextUrl) {
      router.replace(nextUrl);
    }
  }, [isLoggedIn, isSigningUp, nextUrl, router]);

  const form = useForm<
    z.input<typeof signupFormSchema>,
    unknown,
    z.output<typeof signupFormSchema>
  >({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      marketingOptOut: false,
    },
  });

  function handleToggleMarketingOptOut() {
    if (isSigningUp) return;
    const optOut = !form.getValues("marketingOptOut");
    form.setValue("marketingOptOut", optOut, { shouldDirty: true });
    if (optOut) trackSignupMarketingOptOut();
  }

  async function handleProviderSignup(provider: LoginProvider) {
    setLoadingProvider(provider);
    setIsSigningUp(true);
    // Leftover impersonation (expired admin session, pre-fix cookie) would 403 a non-admin.
    clearImpersonationEverywhere();

    try {
      // Include next URL in OAuth flow if present
      const fullCallbackUrl = `${window.location.origin}${providerCallbackPath(provider, safeNext)}`;

      setMarketingOptOutFlag(form.getValues("marketingOptOut") ?? false);

      const response = await fetch("/api/auth/login/with-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, redirectTo: fullCallbackUrl }),
      });

      if (!response.ok) {
        const { error } = await response.json();

        if (error === "not_allowed") {
          setShowNotAllowedModal(true);
          setIsSigningUp(false);
          return;
        }

        throw new Error(
          error || t("Failed to start OAuth flow", "无法启动第三方登录"),
        );
      }

      const { url } = await response.json();
      if (url) window.location.href = url as string;
    } catch (error) {
      setLoadingProvider(null);
      setIsSigningUp(false);
      toast({
        title:
          error instanceof Error
            ? translateMessage(error.message)
            : t("Failed to start OAuth flow", "无法启动第三方登录"),
        variant: "destructive",
      });
    }
  }

  async function handleSignup(data: z.output<typeof signupFormSchema>) {
    // The server action records this signup's choice; the cookie is only for
    // the Google round trip. Clear it so neither this choice nor one left from
    // an abandoned Google attempt is applied to a later Google sign-in.
    setMarketingOptOutFlag(false);
    setIsLoading(true);

    if (isTeamEmail(data.email)) {
      toast({
        title: t(
          "Please use Google SSO to create an account using an AutoGPT email.",
          "使用 AutoGPT 团队邮箱时，请通过 Google 单点登录注册账户。",
        ),
        variant: "default",
      });

      setIsLoading(false);
      return;
    }

    setIsSigningUp(true);
    clearImpersonationEverywhere();

    try {
      const result = await signupAction(
        data.email,
        data.password,
        data.confirmPassword,
        data.marketingOptOut,
        safeNext,
      );

      if (!result.success) {
        if (result.error === "user_already_exists") {
          setFeedback(
            usernameSignupEnabled()
              ? t("Username already taken", "此用户名已被使用")
              : t("User with this email already exists", "此邮箱已注册"),
          );
          setIsSigningUp(false);
          return;
        }
        if (result.error === "not_allowed") {
          if (usernameSignupEnabled())
            setFeedback(
              t(
                "Registration is restricted on this instance.",
                "此实例已限制新账号注册。",
              ),
            );
          else setShowNotAllowedModal(true);
          setIsSigningUp(false);
          return;
        }

        toast({
          title: translateMessage(
            result.error || t("Signup failed", "注册失败"),
          ),
          variant: "destructive",
        });
        setIsSigningUp(false);
        return;
      }

      if (result.verificationRequired) {
        // There is no session yet, so the action recorded nothing. The emailed
        // link carries the refusal and lands on /auth/callback, which records
        // it with the terms.
        setVerificationEmail(result.email);
        setIsLoading(false);
        setIsSigningUp(false);
        return;
      }

      // Prefer an explicit deep link, then the server's default landing.
      const redirectTo =
        nextUrl || withAuthTracking(result.next || "/", rawNext);
      router.replace(redirectTo);
    } catch (error) {
      setIsLoading(false);
      setIsSigningUp(false);
      toast({
        title:
          error instanceof Error
            ? translateMessage(error.message)
            : t("Unexpected error during signup", "注册时发生意外错误"),
        variant: "destructive",
      });
    } finally {
      if (loadingResetTimer.current) clearTimeout(loadingResetTimer.current);
      // A signup that settles after unmount must not leave a timer behind.
      if (isMounted.current) {
        loadingResetTimer.current = setTimeout(() => {
          setIsLoading(false);
        }, 3000);
      }
    }
  }

  function handleStartAgain() {
    setVerificationEmail(null);
    form.resetField("email");
  }

  return {
    form,
    feedback,
    nextUrl: safeNext,
    verificationEmail,
    isLoggedIn: !!user,
    hasInitializedAuth,
    isLoading,
    isGoogleLoading: loadingProvider === "google",
    isMicrosoftLoading: loadingProvider === "microsoft",
    isMicrosoftEnabled: environment.isMicrosoftLoginEnabled(),
    isSigningUp,
    isCloudEnv,
    isUserLoading,
    showNotAllowedModal,
    optedOut: form.watch("marketingOptOut") ?? false,
    handleSubmit: form.handleSubmit(handleSignup),
    handleToggleMarketingOptOut,
    handleCloseNotAllowedModal: () => setShowNotAllowedModal(false),
    handleProviderSignup,
    handleStartAgain,
  };
}
