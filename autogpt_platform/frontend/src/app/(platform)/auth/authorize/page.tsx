"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { Text } from "@/components/atoms/Text/Text";
import { Button } from "@/components/atoms/Button/Button";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner/LoadingSpinner";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import {
  postOauthAuthorize,
  useGetOauthGetOauthAppInfo,
} from "@/app/api/__generated__/endpoints/oauth/oauth";
import type { APIKeyPermission } from "@/app/api/__generated__/models/aPIKeyPermission";
import { getScopeDescription } from "@/lib/api-key-scopes";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { CheckmarkBadge01Icon, Image01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { ApiError } from "@/lib/autogpt-server-api/helpers";

export default function AuthorizePage() {
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();

  // Extract OAuth parameters from URL
  const clientID = searchParams.get("client_id");
  const redirectURI = searchParams.get("redirect_uri");
  const scope = searchParams.get("scope");
  const state = searchParams.get("state");
  const codeChallenge = searchParams.get("code_challenge");
  const codeChallengeMethod =
    searchParams.get("code_challenge_method") || "S256";
  const responseType = searchParams.get("response_type") || "code";

  // Parse requested scopes
  const requestedScopes = scope?.split(" ").filter(Boolean) || [];

  // Fetch application info using generated hook
  const {
    data: appInfoResponse,
    isLoading,
    error,
    refetch,
  } = useGetOauthGetOauthAppInfo(
    encodeURIComponent(clientID || ""),
    { redirect_uri: redirectURI },
    {
      query: {
        enabled: !!clientID && !!redirectURI,
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  );

  const appInfo = appInfoResponse?.status === 200 ? appInfoResponse.data : null;

  // Validate required parameters
  const missingParams: string[] = [];
  if (!clientID) missingParams.push("client_id");
  if (!redirectURI) missingParams.push("redirect_uri");
  if (!scope) missingParams.push("scope");
  if (!state) missingParams.push("state");
  if (!codeChallenge) missingParams.push("code_challenge");

  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authorizeError, setAuthorizeError] = useState<string | null>(null);

  async function handleApprove() {
    setIsAuthorizing(true);
    setAuthorizeError(null);

    try {
      // Call the backend /oauth/authorize POST endpoint
      // Returns JSON with redirect_url that we use to redirect the user
      const response = await postOauthAuthorize({
        client_id: clientID!,
        redirect_uri: redirectURI!,
        scopes: requestedScopes,
        state: state!,
        response_type: responseType,
        code_challenge: codeChallenge!,
        code_challenge_method: codeChallengeMethod as "S256" | "plain",
      });

      if (response.status === 200 && response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
      } else {
        setAuthorizeError(
          t(
            "Authorization failed: no redirect URL received",
            "授权失败：未收到重定向地址",
          ),
        );
        setIsAuthorizing(false);
      }
    } catch (err) {
      console.error("Authorization error:", err);
      setAuthorizeError(
        err instanceof Error
          ? err.message
          : t("Authorization failed", "授权失败"),
      );
      setIsAuthorizing(false);
    }
  }

  function handleDeny() {
    // appInfo loads only once the backend accepts redirectURI for this client
    if (!appInfo) return;
    const params = new URLSearchParams({
      error: "access_denied",
      error_description: "User denied access",
      state: state || "",
    });
    window.location.href = `${redirectURI}?${params.toString()}`;
  }

  // Show error if missing required parameters
  if (missingParams.length > 0) {
    return (
      <div className="flex h-full min-h-[85vh] flex-col items-center justify-center py-10">
        <AuthCard title={t("Invalid Request", "无效请求")}>
          <ErrorCard
            context={t("request parameters", "请求参数")}
            responseError={{
              message: t(
                `Missing required parameters: ${missingParams.join(", ")}`,
                `缺少必填参数：${missingParams.join("、")}`,
              ),
            }}
            hint={t(
              "Please contact the administrator of the app that sent you here.",
              "请联系发起此请求的应用管理员。",
            )}
            isOurProblem={false}
          />
        </AuthCard>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-full min-h-[85vh] flex-col items-center justify-center py-10">
        <AuthCard title={t("Loading...", "加载中…")}>
          <div className="flex flex-col items-center gap-4 py-8">
            <LoadingSpinner size="large" />
            <Text variant="body" tone="secondary" className="text-center">
              {t("Loading application information...", "正在加载应用信息…")}
            </Text>
          </div>
        </AuthCard>
      </div>
    );
  }

  // Unknown app or unregistered redirect_uri: never send the user to it
  if (error || !appInfo) {
    const redirectRejected = error instanceof ApiError && error.status === 400;
    return (
      <div className="flex h-full min-h-[85vh] flex-col items-center justify-center py-10">
        <AuthCard
          title={
            redirectRejected
              ? t("Invalid Request", "无效请求")
              : t("Application Not Found", "未找到应用")
          }
        >
          <ErrorCard
            context={t("application", "应用")}
            responseError={
              error
                ? error
                : {
                    message: t(
                      "The application you're trying to authorize could not be found or is disabled.",
                      "你要授权的应用不存在或已被停用。",
                    ),
                  }
            }
            onRetry={refetch}
          />
        </AuthCard>
      </div>
    );
  }

  // Validate that requested scopes are allowed by the app
  const invalidScopes = requestedScopes.filter(
    (s) => !appInfo.scopes.includes(s),
  );

  if (invalidScopes.length > 0) {
    return (
      <div className="flex h-full min-h-[85vh] flex-col items-center justify-center py-10">
        <AuthCard title={t("Invalid Scopes", "无效的权限范围")}>
          <ErrorCard
            context={t("scopes", "权限范围")}
            responseError={{
              message: t(
                `The application is requesting scopes it is not authorized for: ${invalidScopes.join(", ")}`,
                `该应用请求了未经许可的权限范围：${invalidScopes.join("、")}`,
              ),
            }}
            hint={t(
              "Please contact the administrator of the app that sent you here.",
              "请联系发起此请求的应用管理员。",
            )}
            isOurProblem={false}
          />
          <Button
            variant="secondary"
            onClick={handleDeny}
            className="mt-4 w-full"
          >
            {t("Return to Application", "返回应用")}
          </Button>
        </AuthCard>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[85vh] flex-col items-center justify-center py-10">
      <AuthCard title={t("Authorize Application", "授权应用")}>
        <div className="flex w-full flex-col gap-6">
          {/* App info */}
          <div className="flex flex-col items-center text-center">
            {/* App logo */}
            <div className="mb-4 flex size-16 items-center justify-center overflow-hidden rounded-xl border bg-surface-hover">
              {appInfo.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- an OAuth app logo can come from any host, which next/image only loads from listed ones
                <img
                  src={appInfo.logo_url}
                  alt={t(`${appInfo.name} logo`, `${appInfo.name} 标志`)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Icon icon={Image01Icon} tone="subtle" className="h-8 w-8" />
              )}
            </div>
            <Text variant="h4" className="mb-2">
              {appInfo.name}
            </Text>
            {appInfo.description && (
              <Text variant="body" tone="secondary">
                {appInfo.description}
              </Text>
            )}
          </div>

          {/* Permissions */}
          <div>
            <Text variant="body-medium" className="mb-3">
              {t(
                "This application is requesting permission to:",
                "此应用正在请求以下权限：",
              )}
            </Text>
            <ul className="space-y-2">
              {requestedScopes.map((scopeKey) => (
                <li key={scopeKey} className="flex items-start gap-3">
                  <Icon
                    icon={CheckmarkBadge01Icon}
                    tone="success"
                    className="mt-0.5"
                  />
                  <Text variant="body">
                    {getScopeDescription(
                      scopeKey as APIKeyPermission,
                      locale,
                    ) || scopeKey}
                  </Text>
                </li>
              ))}
            </ul>
          </div>

          {/* Error message */}
          {authorizeError && (
            <ErrorCard
              context={t("authorization", "授权")}
              responseError={{ message: authorizeError }}
            />
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={handleApprove}
              disabled={isAuthorizing}
              textSize="body-md"
              className="w-full"
            >
              {isAuthorizing
                ? t("Authorizing...", "授权中…")
                : t("Authorize", "授权")}
            </Button>
            <Button
              variant="secondary"
              onClick={handleDeny}
              disabled={isAuthorizing}
              textSize="body-md"
              className="w-full"
            >
              {t("Deny", "拒绝")}
            </Button>
          </div>

          {/* Warning */}
          <Text variant="small" tone="secondary" className="text-center">
            {t(
              "By authorizing, you allow this application to access your AutoGPT account with the permissions listed above.",
              "授权后，此应用将能够按上述权限访问你的 AutoGPT 账户。",
            )}
          </Text>
        </div>
      </AuthCard>
    </div>
  );
}
