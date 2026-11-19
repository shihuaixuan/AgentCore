import { CredentialsType } from "@/lib/autogpt-server-api/types";
import {
  DiscordIcon,
  GithubIcon,
  Globe02Icon,
  GoogleIcon,
  Key01Icon,
  LockIcon,
  LockPasswordIcon,
  MediumIcon,
  NotionIcon,
  TwitterIcon,
} from "@hugeicons/core-free-icons";
import { createIconComponent } from "@/components/atoms/Icon/Icon";
import { z } from "zod";
import type { Locale } from "@/lib/i18n/locale";

export const fallbackIcon = createIconComponent(Key01Icon);
const globeIcon = createIconComponent(Globe02Icon);
const lockIcon = createIconComponent(LockIcon);
const lockPasswordIcon = createIconComponent(LockPasswordIcon);
const githubIcon = createIconComponent(GithubIcon);
const googleIcon = createIconComponent(GoogleIcon);
const notionIcon = createIconComponent(NotionIcon);
const discordIcon = createIconComponent(DiscordIcon);
const mediumIcon = createIconComponent(MediumIcon);
const twitterIcon = createIconComponent(TwitterIcon);

export const providerIcons: Partial<
  Record<string, React.FC<{ className?: string }>>
> = {
  aiml_api: fallbackIcon,
  anthropic: fallbackIcon,
  apollo: fallbackIcon,
  database: fallbackIcon,
  e2b: fallbackIcon,
  github: githubIcon,
  google: googleIcon,
  groq: fallbackIcon,
  http: fallbackIcon,
  notion: notionIcon,
  nvidia: fallbackIcon,
  discord: discordIcon,
  d_id: fallbackIcon,
  elevenlabs: fallbackIcon,
  google_maps: googleIcon,
  jina: fallbackIcon,
  ideogram: fallbackIcon,
  linear: fallbackIcon,
  medium: mediumIcon,
  mem0: fallbackIcon,
  ollama: fallbackIcon,
  openai: fallbackIcon,
  openweathermap: fallbackIcon,
  open_router: fallbackIcon,
  llama_api: fallbackIcon,
  pinecone: fallbackIcon,
  enrichlayer: fallbackIcon,
  slant3d: fallbackIcon,
  screenshotone: fallbackIcon,
  smtp: fallbackIcon,
  replicate: fallbackIcon,
  reddit: fallbackIcon,
  fal: fallbackIcon,
  revid: fallbackIcon,
  twitter: twitterIcon,
  unreal_speech: fallbackIcon,
  exa: fallbackIcon,
  hubspot: fallbackIcon,
  smartlead: fallbackIcon,
  todoist: fallbackIcon,
  zerobounce: fallbackIcon,
};

export type OAuthPopupResultMessage = { message_type: "oauth_popup_result" } & (
  | {
      success: true;
      code: string;
      state: string;
    }
  | {
      success: false;
      message: string;
    }
);

export function countSupportedTypes(
  supportsOAuth2: boolean,
  supportsApiKey: boolean,
  supportsUserPassword: boolean,
  supportsHostScoped: boolean,
  supportsDeviceCode: boolean = false,
): number {
  return [
    supportsOAuth2,
    supportsApiKey,
    supportsUserPassword,
    supportsHostScoped,
    supportsDeviceCode,
  ].filter(Boolean).length;
}

export function getSupportedTypes(
  supportsOAuth2: boolean,
  supportsApiKey: boolean,
  supportsUserPassword: boolean,
  supportsHostScoped: boolean,
  supportsDeviceCode: boolean = false,
): CredentialsType[] {
  const types: CredentialsType[] = [];
  if (supportsOAuth2) types.push("oauth2");
  if (supportsDeviceCode) types.push("device_code");
  if (supportsApiKey) types.push("api_key");
  if (supportsUserPassword) types.push("user_password");
  if (supportsHostScoped) types.push("host_scoped");
  return types;
}

const CREDENTIAL_TYPE_LABELS: Record<CredentialsType, string> = {
  oauth2: "OAuth",
  api_key: "API Key",
  user_password: "Password",
  host_scoped: "Headers",
  device_code: "Device Auth",
};

export function getCredentialTypeLabel(
  type: CredentialsType,
  t: (english: string, chinese: string) => string = (english) => english,
): string {
  const chinese = {
    oauth2: "OAuth",
    api_key: "API 密钥",
    user_password: "密码",
    host_scoped: "请求头",
    device_code: "设备授权",
  };
  return t(CREDENTIAL_TYPE_LABELS[type] ?? type, chinese[type] ?? type);
}

type CredentialIcon = React.FC<{ className?: string; size?: string | number }>;

export function getCredentialTypeIcon(
  type: CredentialsType,
  provider?: string,
): CredentialIcon {
  if (type === "oauth2" && provider) {
    return providerIcons[provider] ?? globeIcon;
  }
  if (type === "device_code" && provider) {
    return providerIcons[provider] ?? globeIcon;
  }
  if (type === "user_password") return lockPasswordIcon;
  if (type === "host_scoped") return lockIcon;
  return fallbackIcon;
}

export function getActionButtonText(
  supportsOAuth2: boolean,
  supportsApiKey: boolean,
  supportsUserPassword: boolean,
  supportsHostScoped: boolean,
  hasExistingCredentials: boolean,
  provider?: string,
  supportsDeviceCode: boolean = false,
  t: (english: string, chinese: string) => string = (english) => english,
): string {
  const multipleTypes =
    countSupportedTypes(
      supportsOAuth2,
      supportsApiKey,
      supportsUserPassword,
      supportsHostScoped,
      supportsDeviceCode,
    ) > 1;

  if (multipleTypes) {
    return hasExistingCredentials
      ? t("Add another credential", "添加其他凭据")
      : t("Add credential", "添加凭据");
  }

  if (provider === "codex" && supportsOAuth2) {
    return hasExistingCredentials
      ? t("Reconnect ChatGPT", "重新连接 ChatGPT")
      : t("Sign in with ChatGPT", "使用 ChatGPT 登录");
  }

  if (hasExistingCredentials) {
    if (supportsOAuth2) return t("Connect another account", "连接其他账户");
    if (supportsDeviceCode) return t("Connect another account", "连接其他账户");
    if (supportsApiKey) return t("Use a new API key", "使用新的 API 密钥");
    if (supportsUserPassword)
      return t("Add a new username and password", "添加新的用户名和密码");
    if (supportsHostScoped) return t("Update headers", "更新请求头");
    return t("Add new credentials", "添加新凭据");
  } else {
    if (supportsOAuth2) return t("Add account", "添加账户");
    if (supportsDeviceCode) return t("Add account", "添加账户");
    if (supportsApiKey) return t("Add API key", "添加 API 密钥");
    if (supportsUserPassword)
      return t("Add username and password", "添加用户名和密码");
    if (supportsHostScoped) return t("Add headers", "添加请求头");
    return t("Add credentials", "添加凭据");
  }
}

export function getCredentialDisplayName(
  credential: { title?: string | null; username?: string },
  displayName: string,
  t: (english: string, chinese: string) => string = (english) => english,
): string {
  return (
    (credential.title === "Manual Entry"
      ? t("Manual Entry", "手动输入")
      : credential.title) ||
    credential.username ||
    t(`Your ${displayName} account`, `您的 ${displayName} 账户`)
  );
}

export function getRemovedCredentialMessage(
  removedCredentialTitle: string,
  selectedCredential:
    | { id: string; title?: string | null; username?: string }
    | undefined,
  providerName: string,
  t: (english: string, chinese: string) => string = (english) => english,
): string {
  if (!selectedCredential?.id) {
    return t(
      `${removedCredentialTitle} was removed. Choose a connection to keep this workflow running.`,
      `${removedCredentialTitle} 已移除。请选择连接以继续运行此工作流。`,
    );
  }

  const replacement = getCredentialDisplayName(
    selectedCredential,
    providerName,
    t,
  );
  return t(
    `${removedCredentialTitle} was removed — now using ${replacement}.`,
    `${removedCredentialTitle} 已移除，现改用 ${replacement}。`,
  );
}

export function getMissingScopes(
  requiredScopes: string[],
  grantedScopes: string[] | null | undefined,
): string[] {
  const granted = new Set(grantedScopes ?? []);
  return requiredScopes.filter((scope) => !granted.has(scope));
}

export function getScopeShortfallMessage(
  missingScopes: string[],
  t: (english: string, chinese: string) => string = (english) => english,
): string {
  const plural = missingScopes.length > 1;
  return t(
    `The account connected, but the ${plural ? "permissions" : "permission"} ` +
      `${missingScopes.join(", ")} ${plural ? "were" : "was"} not granted. ` +
      `Reconnect and approve ${plural ? "them" : "it"} to use this account here.`,
    `账户已连接，但尚未授予以下权限：${missingScopes.join("、")}。请重新连接并批准所需权限，以便在此使用该账户。`,
  );
}

export const OAUTH_TIMEOUT_MS = 5 * 60 * 1000;
export const MASKED_KEY_LENGTH = 15;

export function isSystemCredential(credential: {
  title?: string | null;
  is_system?: boolean;
}): boolean {
  if (credential.is_system === true) return true;
  if (!credential.title) return false;
  const titleLower = credential.title.toLowerCase();
  return (
    titleLower.includes("system") ||
    titleLower.startsWith("use credits for") ||
    titleLower.includes("use credits")
  );
}

export function filterSystemCredentials<
  T extends { title?: string | null; is_system?: boolean },
>(credentials: T[]): T[] {
  return credentials.filter((cred) => !isSystemCredential(cred));
}

export function getSystemCredentials<
  T extends { title?: string | null; is_system?: boolean },
>(credentials: T[]): T[] {
  return credentials.filter((cred) => isSystemCredential(cred));
}

export type DeleteResult =
  | { deleted: true }
  | { deleted: false; need_confirmation: true; message: string };

export type DeleteState = {
  warningMessage: string | null;
  credentialToDelete: { id: string; title: string } | null;
  shouldUnselectCurrent: boolean;
};

export async function processCredentialDeletion(
  credentialToDelete: { id: string; title: string },
  selectedCredentialId: string | undefined,
  deleteCredentials: (id: string, force: boolean) => Promise<DeleteResult>,
  force: boolean,
): Promise<DeleteState> {
  const result = await deleteCredentials(credentialToDelete.id, force);

  if (result.deleted) {
    return {
      warningMessage: null,
      credentialToDelete: null,
      shouldUnselectCurrent: selectedCredentialId === credentialToDelete.id,
    };
  }

  if ("need_confirmation" in result && result.need_confirmation) {
    return {
      warningMessage:
        result.message || "This credential is in use. Force delete?",
      credentialToDelete,
      shouldUnselectCurrent: false,
    };
  }

  return {
    warningMessage: null,
    credentialToDelete,
    shouldUnselectCurrent: false,
  };
}

export function findExistingHostCredentials<
  T extends { type: string; id: string; host?: string },
>(credentials: T[], host: string): T[] {
  return credentials.filter(
    (c) => c.type === "host_scoped" && "host" in c && c.host === host,
  );
}

export function hasExistingHostCredential<
  T extends { type: string; host?: string },
>(credentials: T[], host: string): boolean {
  return credentials.some(
    (c) => c.type === "host_scoped" && "host" in c && c.host === host,
  );
}

// Mirrors SCOPE_RULES in backend/data/credential_scope.py: these providers'
// blocks connect to a server the workflow names, so a login's scope says which
// one, as <scheme>://host[:port].
const SERVER_SCOPE_SCHEMES: Record<string, { value: string; label: string }[]> =
  {
    smtp: [{ value: "smtp", label: "SMTP" }],
    database: [
      { value: "postgresql", label: "PostgreSQL" },
      { value: "mysql", label: "MySQL" },
      { value: "mssql", label: "Microsoft SQL Server" },
    ],
  };

export function getServerScopeSchemes(provider: string) {
  return SERVER_SCOPE_SCHEMES[provider] ?? null;
}

// The examples in the server messages, as in SCOPE_RULES.
const SERVER_EXAMPLES: Record<string, { host: string; port: number }> = {
  smtp: { host: "smtp.example.com", port: 587 },
  database: { host: "db.example.com", port: 5432 },
};

const SERVER_PATTERN =
  /^(\[[0-9a-fA-F:.]+\]|[A-Za-z0-9._-]+)(?::([0-9]{1,5}))?$/;

export function isValidServer(server: string) {
  const match = SERVER_PATTERN.exec(server.trim());
  if (!match) return false;
  if (match[2] === undefined) return true;
  const port = Number(match[2]);
  return port >= 1 && port <= 65535;
}

export function getInvalidServerMessage(
  provider: string,
  locale: Locale = "en",
) {
  const { host, port } = SERVER_EXAMPLES[provider] ?? SERVER_EXAMPLES.smtp;
  return locale === "zh-CN"
    ? `请输入有效的服务器地址，例如 ${host} 或 ${host}:${port}（端口范围为 1-65535）`
    : `Enter a valid server, like ${host} or ${host}:${port} (port 1-65535)`;
}

export function getServerFieldSchema(provider: string, locale: Locale = "en") {
  return z
    .string()
    .trim()
    .min(1, locale === "zh-CN" ? "请输入服务器地址" : "Server is required")
    .refine(isValidServer, getInvalidServerMessage(provider, locale));
}

export function buildServerScope(scheme: string, server: string) {
  return `${scheme}://${server.trim().toLowerCase()}`;
}

export type ActionTarget =
  | "type_selector"
  | "oauth"
  | "device_code"
  | "api_key"
  | "user_password"
  | "host_scoped"
  | null;

export function resolveActionTarget(
  hasMultipleCredentialTypes: boolean,
  supportsOAuth2: boolean,
  supportsApiKey: boolean,
  supportsUserPassword: boolean,
  supportsHostScoped: boolean,
  supportsDeviceCode: boolean = false,
): ActionTarget {
  if (hasMultipleCredentialTypes) return "type_selector";
  if (supportsOAuth2) return "oauth";
  if (supportsDeviceCode) return "device_code";
  if (supportsApiKey) return "api_key";
  if (supportsUserPassword) return "user_password";
  if (supportsHostScoped) return "host_scoped";
  return null;
}

export type HeaderPair = { key: string; value: string };

export function headerPairsToRecord(
  pairs: HeaderPair[],
): Record<string, string> {
  return pairs.reduce(
    (acc, pair) => {
      if (pair.key.trim() && pair.value.trim()) {
        acc[pair.key.trim()] = pair.value.trim();
      }
      return acc;
    },
    {} as Record<string, string>,
  );
}

export function addHeaderPairToList(pairs: HeaderPair[]): HeaderPair[] {
  return [...pairs, { key: "", value: "" }];
}

export function removeHeaderPairFromList(
  pairs: HeaderPair[],
  index: number,
): HeaderPair[] {
  if (pairs.length <= 1) return pairs;
  return pairs.filter((_, i) => i !== index);
}

export function updateHeaderPairInList(
  pairs: HeaderPair[],
  index: number,
  field: "key" | "value",
  value: string,
): HeaderPair[] {
  const newPairs = [...pairs];
  newPairs[index] = { ...newPairs[index], [field]: value };
  return newPairs;
}
