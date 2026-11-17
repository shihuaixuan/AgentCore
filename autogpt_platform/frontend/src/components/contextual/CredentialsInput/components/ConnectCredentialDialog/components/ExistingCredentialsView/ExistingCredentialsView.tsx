"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { AutoGPTLogo } from "@/components/atoms/AutoGPTLogo/AutoGPTLogo";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { ProviderAvatar } from "@/components/contextual/IntegrationsPanel/components/ConnectServiceDialog/components/DetailView/ProviderAvatar";
import { Key01Icon, SecurityCheckIcon } from "@hugeicons/core-free-icons";
import type { ExistingCredential } from "../../helpers";

interface Props {
  provider: string;
  displayName: string;
  credentials: ExistingCredential[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  purpose?: "grant" | "choose" | "update";
}

// The step before the connect methods when the account already has a
// credential the expert lacks: pick which one to hand over. Mirrors the
// method radio cards so switching to Add new feels like the same dialog.
export function ExistingCredentialsView({
  provider,
  displayName,
  credentials,
  selectedId,
  onSelect,
  purpose = "grant",
}: Props) {
  const { t } = useTranslation();
  const TITLES = {
    grant: (name: string) =>
      t(`Give this expert access to ${name}`, `允许此专家访问 ${name}`),
    choose: (name: string) =>
      t(`Choose a ${name} account`, `选择 ${name} 账户`),
    update: (name: string) =>
      t(`Update a ${name} account`, `更新 ${name} 账户`),
  };

  const DESCRIPTIONS = {
    grant: t(
      "Your account is already connected, but this expert can't use it yet. Pick an account to share, or add a new one.",
      "账户已连接，但此专家尚无使用权限。请选择要共享的账户，或添加新账户。",
    ),
    choose: t(
      "You have more than one account connected. Pick the one this chat should use, or add a new one.",
      "您已连接多个账户。请选择此聊天使用的账户，或添加新账户。",
    ),
    update: t(
      "None of your connected accounts has the access this needs. Pick the one to sign in to again, or add a new one.",
      "已连接的账户均缺少所需权限。请选择一个账户重新登录，或添加新账户。",
    ),
  };

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex items-center justify-center gap-6">
        <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-surface shadow-lg ring-1 ring-separator">
          <AutoGPTLogo
            hideText
            className="absolute top-1/2 left-1/2 h-8 w-[4.4rem] -translate-x-[77%] -translate-y-1/2"
          />
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
          <ProviderAvatar id={provider} name={displayName} />
        </span>
      </div>

      <div className="flex flex-col gap-1.5 text-center">
        <Text variant="h3" tone="primary" className="!text-lead !leading-10">
          {TITLES[purpose](displayName)}
        </Text>
        <Text variant="body" tone="muted">
          {DESCRIPTIONS[purpose]}
        </Text>
      </div>

      <div
        role="radiogroup"
        aria-label={t("Account", "账户")}
        className="flex flex-col gap-1 rounded-2xl bg-surface-hover p-1.5"
      >
        {credentials.map((credential) => {
          const isSelected = credential.id === selectedId;
          return (
            <button
              key={credential.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(credential.id)}
              className={
                isSelected
                  ? "flex w-full items-center gap-3 rounded-xl bg-surface p-3 text-left shadow-sm"
                  : "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-surface/60"
              }
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface shadow-sm">
                <Icon
                  icon={
                    credential.type === "oauth2" ? SecurityCheckIcon : Key01Icon
                  }
                  size={22}
                  tone="body"
                />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Text
                  variant="body-semibold-tight"
                  as="span"
                  tone="primary"
                  className="truncate"
                >
                  {credential.title}
                </Text>
                <Text variant="small-tight" as="span" tone="muted">
                  {credential.type === "oauth2"
                    ? "OAuth"
                    : t("API key", "API 密钥")}
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
          );
        })}
      </div>
    </div>
  );
}
