"use client";

import { useGetOauthGetOauthAppInfo } from "@/app/api/__generated__/endpoints/oauth/oauth";
import { okData } from "@/app/api/helpers";
import { Button } from "@/components/atoms/Button/Button";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner/LoadingSpinner";
import { Text } from "@/components/atoms/Text/Text";
import { AuthCard } from "@/components/auth/AuthCard";
import { CredentialsInput } from "@/components/contextual/CredentialsInput/CredentialsInput";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { CREDENTIALS_TYPES } from "@/lib/autogpt-server-api";
import type {
  BlockIOCredentialsSubSchema,
  CredentialsMetaInput,
} from "@/lib/autogpt-server-api";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { CircleIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

/**
 * Provider configuration for the setup wizard.
 *
 * Query parameters:
 * - `providers`: base64-encoded JSON array of { provider, scopes? } objects
 * - `client_id`: The requesting application's OAuth client ID
 * - `redirect_uri`: Where to redirect after completion; must be one of the
 *   application's registered redirect URIs
 * - `state`: Anti-CSRF token
 *
 * Example `providers` JSON:
 * [
 *   { "provider": "google", "scopes": ["https://www.googleapis.com/auth/gmail.readonly"] },
 *   { "provider": "github", "scopes": ["repo"] }
 * ]
 *
 * Example URL:
 * /auth/integrations/setup-wizard?client_id=...&providers=W3sicHJvdmlkZXIiOiJnb29nbGUifV0=&redirect_uri=...
 */
interface ProviderConfig {
  provider: string;
  scopes?: string[];
}

function createSchemaFromProviderConfig(
  config: ProviderConfig,
): BlockIOCredentialsSubSchema {
  return {
    type: "object",
    properties: {},
    credentials_provider: [config.provider],
    // Accept any credential type; the shared list is build-time total.
    credentials_types: [...CREDENTIALS_TYPES],
    credentials_scopes: config.scopes,
    discriminator: undefined,
    discriminator_mapping: undefined,
    discriminator_values: undefined,
  };
}

function toDisplayName(provider: string): string {
  // Convert snake_case or kebab-case to Title Case
  return provider
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function parseProvidersParam(providersParam: string): ProviderConfig[] {
  try {
    // Decode base64 and parse JSON
    const decoded = atob(providersParam);
    const parsed = JSON.parse(decoded);

    if (!Array.isArray(parsed)) {
      console.warn("providers parameter is not an array");
      return [];
    }

    return parsed.filter(
      (item): item is ProviderConfig =>
        typeof item === "object" &&
        item !== null &&
        typeof item.provider === "string",
    );
  } catch (error) {
    console.warn("Failed to parse providers parameter:", error);
    return [];
  }
}

export default function IntegrationSetupWizardPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  // Extract query parameters
  // `providers` is a base64-encoded JSON array of { provider, scopes?: string[] } objects
  const clientID = searchParams.get("client_id");
  const providersParam = searchParams.get("providers");
  const redirectURI = searchParams.get("redirect_uri");
  const state = searchParams.get("state");

  const {
    data: appInfo,
    isLoading,
    error,
  } = useGetOauthGetOauthAppInfo(
    encodeURIComponent(clientID || ""),
    { redirect_uri: redirectURI },
    { query: { enabled: !!clientID && !!redirectURI, select: okData } },
  );

  // Parse providers from base64-encoded JSON
  const providerConfigs = useMemo<ProviderConfig[]>(() => {
    if (!providersParam) return [];
    return parseProvidersParam(providersParam);
  }, [providersParam]);

  // Track selected credentials for each provider
  const [selectedCredentials, setSelectedCredentials] = useState<
    Record<string, CredentialsMetaInput | undefined>
  >({});

  // Track if we've already redirected
  const hasRedirectedRef = useRef(false);

  // Check if all providers have credentials
  const isAllComplete = useMemo(() => {
    if (providerConfigs.length === 0) return false;
    return providerConfigs.every(
      (config) => selectedCredentials[config.provider],
    );
  }, [providerConfigs, selectedCredentials]);

  // Handle credential selection
  const handleCredentialSelect = (
    provider: string,
    credential?: CredentialsMetaInput,
  ) => {
    setSelectedCredentials((prev) => ({
      ...prev,
      [provider]: credential,
    }));
  };

  // Handle completion - redirect back to client
  const handleComplete = () => {
    if (!appInfo || hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;

    const params = new URLSearchParams({
      success: "true",
    });
    if (state) {
      params.set("state", state);
    }

    window.location.href = `${redirectURI}?${params.toString()}`;
  };

  // Handle cancel - redirect back to client with error
  const handleCancel = () => {
    if (!appInfo || hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;

    const params = new URLSearchParams({
      error: "user_cancelled",
      error_description: "User cancelled the integration setup",
    });
    if (state) {
      params.set("state", state);
    }

    window.location.href = `${redirectURI}?${params.toString()}`;
  };

  // Validate required parameters
  const missingParams: string[] = [];
  if (!clientID) missingParams.push("client_id");
  if (!providersParam) missingParams.push("providers");
  if (!redirectURI) missingParams.push("redirect_uri");

  if (missingParams.length > 0) {
    return (
      <div className="flex h-full min-h-[85vh] flex-col items-center justify-center py-10">
        <AuthCard title={t("Invalid Request", "无效请求")}>
          <ErrorCard
            context={t("request details", "请求详情")}
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

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[85vh] flex-col items-center justify-center py-10">
        <AuthCard title={t("Loading...", "加载中…")}>
          <div className="flex flex-col items-center gap-4 py-8">
            <LoadingSpinner size="large" />
          </div>
        </AuthCard>
      </div>
    );
  }

  // appInfo loads only once the backend accepts redirectURI for this client
  if (error || !appInfo) {
    return (
      <div className="flex h-full min-h-[85vh] flex-col items-center justify-center py-10">
        <AuthCard title={t("Invalid Request", "无效请求")}>
          <ErrorCard
            context={t("application", "应用")}
            responseError={
              error
                ? error
                : { message: t("Application not found", "未找到应用") }
            }
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

  if (providerConfigs.length === 0) {
    return (
      <div className="flex h-full min-h-[85vh] flex-col items-center justify-center py-10">
        <AuthCard title={t("Invalid Request", "无效请求")}>
          <ErrorCard
            context={t("providers", "服务提供方")}
            responseError={{
              message: t("No providers specified", "未指定服务提供方"),
            }}
            hint={t(
              "Please contact the administrator of the app that sent you here.",
              "请联系发起此请求的应用管理员。",
            )}
            isOurProblem={false}
          />
          <Button
            variant="secondary"
            onClick={handleCancel}
            className="mt-4 w-full"
          >
            {t("Cancel", "取消")}
          </Button>
        </AuthCard>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[85vh] flex-col items-center justify-center py-10">
      <AuthCard title={t("Connect Your Accounts", "连接你的账户")}>
        <div className="flex w-full flex-col gap-6">
          <Text variant="body" tone="secondary" className="text-center">
            <strong>{appInfo.name}</strong>
            {t(
              " is requesting you to connect the following integrations to your AutoGPT account.",
              " 请求将以下集成连接到你的 AutoGPT 账户。",
            )}
          </Text>

          {/* Provider credentials list */}
          <div className="space-y-4">
            {providerConfigs.map((config) => {
              const schema = createSchemaFromProviderConfig(config);
              const isSelected = !!selectedCredentials[config.provider];

              return (
                <div
                  key={config.provider}
                  className="relative rounded-xl border border-border-base bg-surface p-4"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <div className="relative size-8">
                      <Image
                        src={`/integrations/${config.provider}.png`}
                        alt={t(
                          `${config.provider} icon`,
                          `${config.provider} 图标`,
                        )}
                        fill
                        className="object-contain group-disabled:opacity-50"
                      />
                    </div>
                    <Text className="mx-1" variant="large-medium">
                      {toDisplayName(config.provider)}
                    </Text>
                    <div className="grow"></div>
                    {isSelected ? (
                      <Icon icon={Tick02Icon} size={20} tone="success" />
                    ) : (
                      <Icon icon={CircleIcon} size={20} tone="disabled" />
                    )}
                    {isSelected && (
                      <Text variant="small" tone="success">
                        {t("Connected", "已连接")}
                      </Text>
                    )}
                  </div>

                  <CredentialsInput
                    schema={schema}
                    selectedCredentials={selectedCredentials[config.provider]}
                    onSelectCredentials={(credMeta) =>
                      handleCredentialSelect(config.provider, credMeta)
                    }
                    showTitle={false}
                    className="mb-0"
                  />
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={handleComplete}
              disabled={!isAllComplete}
              textSize="body-md"
              className="w-full"
            >
              {isAllComplete
                ? t("Continue", "继续")
                : t(
                    `Connect ${providerConfigs.length - Object.values(selectedCredentials).filter(Boolean).length} more`,
                    `还需连接 ${providerConfigs.length - Object.values(selectedCredentials).filter(Boolean).length} 项`,
                  )}
            </Button>
            <Button
              variant="secondary"
              onClick={handleCancel}
              textSize="body-md"
              className="w-full"
            >
              {t("Cancel", "取消")}
            </Button>
          </div>

          <Text variant="small" tone="secondary" className="text-center">
            {t("Manage your integrations in ", "管理集成请前往：")}
            <Link
              href="/marketplace/connectors?view=mine"
              target="_blank"
              className="text-brand-hover underline hover:text-accent-strong"
            >
              {t("Marketplace → My connections", "市场 → 我的连接")}
            </Link>
            {t(".", "。")}
          </Text>
        </div>
      </AuthCard>
    </div>
  );
}
