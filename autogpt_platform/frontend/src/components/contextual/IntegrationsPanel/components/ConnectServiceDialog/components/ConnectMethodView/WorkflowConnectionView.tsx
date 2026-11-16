"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Text } from "@/components/atoms/Text/Text";

import { Button } from "@/components/atoms/Button/Button";
import { credentialService } from "@/components/contextual/CredentialsInput/service-identity";
import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import { ProviderAvatar } from "../DetailView/ProviderAvatar";
import type { ApiKeyConnectFormValues } from "../DetailView/schema";
import { AuthType, type ConnectableProvider } from "../../helpers";
import type { UseFormReturn } from "react-hook-form";
import { InlineApiKeyForm } from "./InlineApiKeyForm";
import { ServiceKeyForm } from "./ServiceKeyForm";

export interface WorkflowConnectOptions {
  onSignIn: () => void;
  isConnecting: boolean;
  service?: ReturnType<typeof credentialService>;
}

interface Props {
  provider: ConnectableProvider;
  options: WorkflowConnectOptions;
  form: UseFormReturn<ApiKeyConnectFormValues>;
  onApiKeySubmit: (values: ApiKeyConnectFormValues) => void;
  onConnected: (credential?: CredentialsMetaResponse) => void;
}

export function WorkflowConnectionView({
  provider,
  options,
  form,
  onApiKeySubmit,
  onConnected,
}: Props) {
  const { t } = useTranslation();

  const hasSignIn = provider.supportedAuthTypes.includes(AuthType.oauth2);
  const hasKey = provider.supportedAuthTypes.includes(AuthType.api_key);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-separator p-3">
        <ProviderAvatar
          id={provider.iconId ?? provider.id}
          name={provider.name}
        />
      </div>
      <div>
        <h3 className="text-lead font-medium text-foreground-strong">
          {t(`Connect ${provider.name}`, `连接 ${provider.name}`)}
        </h3>
        <Text variant="body-tight" tone="muted" className="mt-2">
          {t(
            "Choose the account Otto should use for this workflow.",
            "选择 Otto 应为此工作流使用的账户。",
          )}
        </Text>
      </div>
      {hasSignIn ? (
        <>
          <div className="rounded-xl bg-surface-muted p-4 text-body text-foreground-tertiary">
            {t(
              `Review the requested access on ${provider.name}'s sign-in page before connecting.`,
              `连接前，请在 ${provider.name} 的登录页面上查看请求的权限。`,
            )}
          </div>
          <Button
            variant="primary"
            size="small"
            loading={options.isConnecting}
            disabled={options.isConnecting}
            onClick={options.onSignIn}
          >
            {options.isConnecting
              ? t("Connecting…", "正在连接…")
              : t(
                  `Continue with ${provider.name}`,
                  `使用 ${provider.name} 继续`,
                )}
          </Button>
          <Text variant="small-tight" tone="muted" className="text-center">
            {t(
              "Sign in on the app's own page, then return here.",
              "在应用自身的页面上登录，然后返回此处。",
            )}
          </Text>
          {hasKey && (
            <details className="border-t border-separator pt-4">
              <summary className="cursor-pointer text-body text-foreground-tertiary">
                {t("Use an API key instead", "改用 API 密钥")}
              </summary>
              <div className="mt-4 space-y-3">
                <InlineApiKeyForm
                  form={form}
                  providerName={provider.name}
                  onSubmit={onApiKeySubmit}
                />
                <Button
                  variant="primary"
                  size="small"
                  loading={options.isConnecting}
                  disabled={!form.formState.isValid || options.isConnecting}
                  onClick={form.handleSubmit(onApiKeySubmit)}
                >
                  {t("Save and connect", "保存并连接")}
                </Button>
              </div>
            </details>
          )}
        </>
      ) : options.service ? (
        <ServiceKeyForm
          provider={provider.id}
          service={options.service}
          onConnected={onConnected}
        />
      ) : null}
    </div>
  );
}
