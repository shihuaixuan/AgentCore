"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import {
  Cancel01Icon,
  LinkSquare01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";

import { Icon } from "@/components/atoms/Icon/Icon";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";

import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";

import { useDeviceAuthConnect } from "./useDeviceAuthConnect";

interface Props {
  provider: string;
  providerName: string;
  onSuccess: (credentials?: CredentialsMetaResponse) => void;
  scopes?: string[];
  /** Adds the scopes to this connection instead of making a new one. */
  credentialID?: string;
  onError?: (error: unknown) => void;
}

export function DeviceAuthConnectButton({
  provider,
  providerName,
  onSuccess,
  scopes,
  credentialID,
  onError,
}: Props) {
  const { t } = useTranslation();

  const { connect, cancel, phase, userCode, verificationUrl } =
    useDeviceAuthConnect({
      provider,
      onSuccess,
      scopes,
      credentialID,
      onError,
    });

  // `awaiting_user` spans the initiate round-trip, when there is no code and
  // no URL yet. Rendering the code panel then shows an empty box above a link
  // whose href="" resolves to the current page.
  if (phase === "awaiting_user" && !userCode) {
    return (
      <div className="flex flex-col gap-3">
        <Text variant="body" tone="secondary">
          {t(
            `Requesting a code from ${providerName}…`,
            `正在向 ${providerName} 请求代码…`,
          )}
        </Text>
        <div className="flex items-center gap-2 text-foreground-tertiary">
          <Icon icon={Loading03Icon} size={16} spin />
          <Text variant="small">
            {t("Starting device authorization…", "正在启动设备授权…")}
          </Text>
        </div>
      </div>
    );
  }

  if (phase === "idle" || phase === "error" || phase === "done") {
    return (
      <div className="flex flex-col gap-3">
        <Text variant="body" tone="secondary">
          {t(
            `${providerName} uses device authorization. Click below, then follow the link to approve access.`,
            `${providerName} 使用设备授权。请点击下方按钮，然后打开链接批准授权。`,
          )}
        </Text>
        <Button type="button" variant="primary" size="large" onClick={connect}>
          {t(`Connect ${providerName}`, `连接 ${providerName}`)}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Text variant="body" tone="secondary">
        {t(
          `Open the link below and enter the code to connect your ${providerName} account.`,
          `打开下方链接并输入代码，以连接您的 ${providerName} 账户。`,
        )}
      </Text>

      {/* The code is a live authorization code and the link's href can carry
          it too (verification_uri_complete), so PostHog skips the whole panel
          and Sentry masks the code, as it does all text. */}
      <div className="ph-no-capture flex flex-col gap-3 rounded-lg border border-border-base bg-surface-muted p-4">
        <div className="flex flex-col gap-1">
          <Text variant="small" tone="muted" weight="medium">
            {t("Your code", "您的代码")}
          </Text>
          <Text
            variant="heading-md"
            as="p"
            align="center"
            tone="emphasis"
            weight="medium"
            mono
            tracking="widest"
            className="select-all"
          >
            {userCode}
          </Text>
        </div>

        <a
          href={verificationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-action-hover px-4 py-2.5 text-body font-medium text-action-foreground transition-colors hover:bg-action"
        >
          {t(`Open ${providerName}`, `打开 ${providerName}`)}
          <Icon icon={LinkSquare01Icon} size={16} />
        </a>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground-tertiary">
          <Icon icon={Loading03Icon} size={16} spin />
          <Text variant="small">{t("Waiting for approval…", "等待批准…")}</Text>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="small"
          onClick={cancel}
          rightIcon={<Icon icon={Cancel01Icon} size={14} />}
        >
          {t("Cancel", "取消")}
        </Button>
      </div>
    </div>
  );
}
