"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { BRAND_NAME } from "@/lib/branding";

import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import { AutoGPTLogo } from "@/components/atoms/AutoGPTLogo/AutoGPTLogo";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { DeviceAuthConnectButton } from "@/components/contextual/DeviceAuth/DeviceAuthConnectButton";
import { McpFirstPanel } from "@/components/contextual/IntegrationsPanel/components/ConnectServiceDialog/components/DetailView/McpFirstPanel";
import { ProviderAvatar } from "@/components/contextual/IntegrationsPanel/components/ConnectServiceDialog/components/DetailView/ProviderAvatar";
import type { ApiKeyConnectFormValues } from "@/components/contextual/IntegrationsPanel/components/ConnectServiceDialog/components/DetailView/schema";
import { UnsupportedNotice } from "@/components/contextual/IntegrationsPanel/components/ConnectServiceDialog/components/DetailView/UnsupportedNotice";
import {
  AuthType,
  getSignInFallbackLabel,
  type AuthMethod,
  type ConnectableProvider,
} from "@/components/contextual/IntegrationsPanel/components/ConnectServiceDialog/helpers";
import type { UseFormReturn } from "react-hook-form";
import { InlineApiKeyForm } from "./InlineApiKeyForm";
import { InlineHostScopedForm } from "./InlineHostScopedForm";
import { InlineUserPasswordForm } from "./InlineUserPasswordForm";
import {
  WorkflowConnectionView,
  type WorkflowConnectOptions,
} from "./WorkflowConnectionView";
import {
  GlobeIcon,
  Key01Icon,
  SecurityCheckIcon,
  SmartPhone01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";

interface Props {
  workflowConnect?: WorkflowConnectOptions;
  provider: ConnectableProvider;
  selectedMethod: AuthMethod | null;
  onSelectMethod: (method: AuthMethod | null) => void;
  apiKeyForm: UseFormReturn<ApiKeyConnectFormValues>;
  onApiKeySubmit: (values: ApiKeyConnectFormValues) => void;
  /** The host the requesting block will call, when one is in scope. */
  hostScopedHost?: string;
  /** A method that completes inside this view rather than through the
   *  panel footer's Continue: device auth, host-scoped, user/password. */
  onInlineConnectSuccess: (credential?: CredentialsMetaResponse) => void;
  /** Offers the vendor's own sign-in beside the block methods. The host
   *  owns which side shows, since the sign-in carries its own Back. */
  mcpSignIn?: {
    showNative: boolean;
    onShowNativeChange: (showNative: boolean) => void;
    onBack: () => void;
  };
}

export const METHOD_ORDER: AuthMethod[] = [
  AuthType.oauth2,
  AuthType.device_code,
  AuthType.api_key,
  AuthType.user_password,
  AuthType.host_scoped,
];

// The connect step behind a provider click: logo pair and method radio cards.
// Form methods expand their inputs inline as
// an accordion; OAuth is driven by the panel footer's Continue.
export function ConnectMethodView({
  workflowConnect,
  provider,
  selectedMethod,
  onSelectMethod,
  apiKeyForm,
  onApiKeySubmit,
  hostScopedHost,
  onInlineConnectSuccess,
  mcpSignIn,
}: Props) {
  const { t } = useTranslation();
  const METHOD_COPY: Record<
    AuthMethod,
    {
      label: string;
      description: string;
      icon: IconSvgElement;
      recommended?: boolean;
    }
  > = {
    [AuthType.oauth2]: {
      label: "OAuth",
      description: t("One-click secure access.", "一键安全连接。"),
      icon: SecurityCheckIcon,
      recommended: true,
    },
    [AuthType.api_key]: {
      label: t("API Key", "API 密钥"),
      description: t(
        "Paste your token for a custom setup.",
        "粘贴令牌以进行自定义设置。",
      ),
      icon: Key01Icon,
    },
    [AuthType.user_password]: {
      label: t("Username & password", "用户名和密码"),
      description: t("Sign in with account credentials.", "使用账户凭据登录。"),
      icon: UserIcon,
    },
    [AuthType.host_scoped]: {
      label: t("Website access", "网站访问"),
      description: t(
        "Paste a key or headers used only for one website.",
        "粘贴仅用于一个网站的密钥或请求头。",
      ),
      icon: GlobeIcon,
    },
    [AuthType.device_code]: {
      label: t("Device auth", "设备授权"),
      description: t(
        "Approve on your phone with a short code.",
        "使用短代码在手机上批准授权。",
      ),
      icon: SmartPhone01Icon,
    },
  };

  const methods = METHOD_ORDER.filter((method) =>
    provider.supportedAuthTypes.includes(method),
  );
  const offersMcp = Boolean(provider.mcpServer && mcpSignIn);
  const showMcp = offersMcp && !mcpSignIn?.showNative;

  function handleUseSignIn() {
    onSelectMethod(null);
    mcpSignIn?.onShowNativeChange(false);
  }

  if (workflowConnect)
    return (
      <WorkflowConnectionView
        provider={provider}
        options={workflowConnect}
        form={apiKeyForm}
        onApiKeySubmit={onApiKeySubmit}
        onConnected={onInlineConnectSuccess}
      />
    );

  return (
    // `m` + a local provider, so this renders both standalone and inside
    // the copilot tool chain's strict LazyMotion, which rejects `motion`.
    <LazyMotion features={domAnimation}>
      <div className="flex flex-col gap-5 pt-2">
        <div className="flex items-center justify-center gap-6">
          <span className="flex size-20 items-center justify-center rounded-full bg-surface shadow-lg ring-1 ring-separator">
            <AutoGPTLogo alt="" className="size-12" />
          </span>
          <span aria-hidden className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 9 }, (_, dot) => (
              <span
                key={dot}
                className="h-1 w-1 rounded-full bg-accent-strong/30"
              />
            ))}
          </span>
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-surface shadow-lg ring-1 ring-separator">
            <ProviderAvatar
              id={provider.iconId ?? provider.id}
              name={provider.name}
            />
          </span>
        </div>

        <div className="flex flex-col gap-1.5 text-center">
          <Text variant="h3" tone="primary" className="!text-lead !leading-10">
            {showMcp
              ? t(`Connect ${provider.name}`, `连接 ${provider.name}`)
              : t(
                  `Connect ${BRAND_NAME.en} to ${provider.name}`,
                  `将${BRAND_NAME.zh}连接到 ${provider.name}`,
                )}
          </Text>
          {showMcp ? null : (
            <Text variant="body" tone="muted">
              {t(
                `Choose how you'd like to connect your ${provider.name} account.`,
                `选择连接 ${provider.name} 账户的方式。`,
              )}
            </Text>
          )}
        </div>

        {showMcp && provider.mcpServer ? (
          <McpFirstPanel
            catalogID={provider.mcpCatalogID}
            server={provider.mcpServer}
            serviceName={provider.name}
            nativeMethods={methods}
            onUseNative={() => mcpSignIn?.onShowNativeChange(true)}
            onSuccess={onInlineConnectSuccess}
            onBack={mcpSignIn?.onBack}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 rounded-2xl bg-surface-hover p-1.5">
              {methods.map((method) => {
                const copy = METHOD_COPY[method];
                const isSelected = selectedMethod === method;
                const hasInlineForm = method !== AuthType.oauth2;
                return (
                  <div
                    key={method}
                    className={
                      isSelected ? "rounded-xl bg-surface shadow-sm" : ""
                    }
                  >
                    <button
                      type="button"
                      onClick={() => onSelectMethod(method)}
                      className={
                        isSelected
                          ? "flex w-full items-center gap-3 rounded-xl p-3 text-left"
                          : "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-surface/60"
                      }
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface shadow-sm">
                        <Icon icon={copy.icon} size={22} tone="body" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex items-center gap-2">
                          <Text
                            variant="body-semibold-tight"
                            as="span"
                            tone="primary"
                          >
                            {copy.label}
                          </Text>
                          {copy.recommended && (
                            <span className="rounded-md bg-accent-surface px-1.5 py-0.5 text-tiny leading-inherit font-semibold tracking-wide text-accent-strong">
                              {t("RECOMMENDED", "推荐")}
                            </span>
                          )}
                        </span>
                        <Text variant="small-tight" as="span" tone="muted">
                          {copy.description}
                        </Text>
                      </span>
                      <span
                        aria-hidden
                        className={
                          isSelected
                            ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-brand"
                            : "h-5 w-5 shrink-0 rounded-full border-2 border-border-base"
                        }
                      >
                        {isSelected && (
                          <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                        )}
                      </span>
                    </button>
                    {/* Form methods open in place: the card grows to reveal the
                      inputs, submit included — no separate step. */}
                    <AnimatePresence initial={false}>
                      {isSelected && hasInlineForm && (
                        <m.div
                          key="form"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3">
                            {method === AuthType.api_key ? (
                              <InlineApiKeyForm
                                form={apiKeyForm}
                                providerName={provider.name}
                                onSubmit={onApiKeySubmit}
                              />
                            ) : method === AuthType.device_code ? (
                              <DeviceAuthConnectButton
                                provider={provider.id}
                                providerName={provider.name}
                                onSuccess={onInlineConnectSuccess}
                              />
                            ) : method === AuthType.host_scoped ? (
                              <InlineHostScopedForm
                                provider={provider.id}
                                host={hostScopedHost}
                                onSuccess={onInlineConnectSuccess}
                              />
                            ) : method === AuthType.user_password ? (
                              <InlineUserPasswordForm
                                provider={provider.id}
                                providerName={provider.name}
                                onSuccess={onInlineConnectSuccess}
                              />
                            ) : (
                              <UnsupportedNotice providerName={provider.name} />
                            )}
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
            {offersMcp ? (
              <Button variant="ghost" size="small" onClick={handleUseSignIn}>
                {getSignInFallbackLabel(provider, t)}
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </LazyMotion>
  );
}
