"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";

import {
  AuthType,
  type AuthMethod,
  type ConnectableProvider,
} from "../../helpers";
import { ApiKeyConnectForm } from "./ApiKeyConnectForm";
import { DeviceAuthConnectButton } from "@/components/contextual/DeviceAuth/DeviceAuthConnectButton";
import { ChatGPTConnectExplainer } from "./ChatGPTConnectExplainer";
import { InlineHostScopedForm } from "../ConnectMethodView/InlineHostScopedForm";
import { InlineUserPasswordForm } from "../ConnectMethodView/InlineUserPasswordForm";
import { OAuthConnectButton } from "./OAuthConnectButton";
import { UnsupportedNotice } from "./UnsupportedNotice";

const TAB_LABEL: Record<AuthMethod, string> = {
  [AuthType.oauth2]: "OAuth",
  [AuthType.api_key]: "API key", // pragma: allowlist secret
  [AuthType.user_password]: "User / password", // pragma: allowlist secret
  [AuthType.host_scoped]: "Host",
  [AuthType.device_code]: "Device auth",
};

interface Props {
  method: AuthMethod;
  provider: ConnectableProvider;
  onSuccess: (credential?: CredentialsMetaResponse) => void;
}

export function MethodPanel({ method, provider, onSuccess }: Props) {
  const { t } = useTranslation();

  const authProvider = getAuthProvider(provider, method);
  if (method === AuthType.oauth2) {
    const isChatGPT = authProvider === "codex";
    return (
      <div className="flex flex-col gap-4">
        {isChatGPT && <ChatGPTConnectExplainer />}
        <OAuthConnectButton
          provider={authProvider}
          providerName={isChatGPT ? "ChatGPT" : provider.name}
          buttonLabel={
            isChatGPT
              ? t("Sign in with ChatGPT", "使用 ChatGPT 登录")
              : undefined
          }
          termsNotice={isChatGPT ? "OpenAI" : undefined}
          onSuccess={onSuccess}
        />
      </div>
    );
  }
  if (method === AuthType.api_key) {
    return (
      <ApiKeyConnectForm
        provider={authProvider}
        providerName={provider.name}
        onSuccess={onSuccess}
      />
    );
  }
  if (method === AuthType.device_code) {
    return (
      <DeviceAuthConnectButton
        provider={provider.id}
        providerName={provider.name}
        onSuccess={onSuccess}
      />
    );
  }
  if (method === AuthType.host_scoped) {
    return (
      <InlineHostScopedForm provider={provider.id} onSuccess={onSuccess} />
    );
  }
  if (method === AuthType.user_password) {
    return (
      <InlineUserPasswordForm
        provider={provider.id}
        providerName={provider.name}
        onSuccess={onSuccess}
      />
    );
  }
  return (
    <UnsupportedNotice
      providerName={provider.name}
      detail={t(
        `${TAB_LABEL[method]} sign-in for ${provider.name} is not yet wired up in this dialog.`,
        `此对话框尚未支持 ${provider.name} 的${getAuthMethodLabel(provider, method, (_english, chinese) => chinese)}登录。`,
      )}
    />
  );
}

export function getAuthProvider(
  provider: ConnectableProvider,
  method: AuthMethod,
): string {
  return provider.authProviderByType?.[method] ?? provider.id;
}

export function getAuthMethodLabel(
  provider: ConnectableProvider,
  method: AuthMethod,
  t: (english: string, chinese: string) => string = (english) => english,
): string {
  if (
    method === AuthType.oauth2 &&
    getAuthProvider(provider, method) === "codex"
  ) {
    return "ChatGPT";
  }
  const chinese = {
    oauth2: "OAuth",
    api_key: "API 密钥",
    user_password: "用户名 / 密码",
    host_scoped: "主机",
    device_code: "设备授权",
  };
  return t(TAB_LABEL[method], chinese[method]);
}

export { TAB_LABEL };
