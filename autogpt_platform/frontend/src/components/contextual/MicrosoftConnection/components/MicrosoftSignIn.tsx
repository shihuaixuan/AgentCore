"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { DeviceAuthConnectButton } from "@/components/contextual/DeviceAuth/DeviceAuthConnectButton";
import {
  MICROSOFT_PROVIDER,
  type MicrosoftSetupReason,
} from "@/lib/microsoft-setup";
import { MicrosoftAdminSetup } from "../MicrosoftAdminSetup";

interface Props {
  browserAvailable: boolean;
  scopes?: string[];
  loading: boolean;
  pending: boolean;
  recovery: MicrosoftSetupReason | null;
  onSignIn: () => void;
  onDeviceConnected: (credential?: CredentialsMetaResponse) => void;
  onDeviceError: (error: unknown) => void;
  onSkip?: () => void;
}

export function MicrosoftSignIn({
  browserAvailable,
  scopes,
  loading,
  pending,
  recovery,
  onSignIn,
  onDeviceConnected,
  onDeviceError,
  onSkip,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <Text variant="body">
        {t(
          "Connecting lets Otto read and send your email, manage your calendar and work with your OneDrive files when you ask. Work or school accounts can also add Teams chats, Microsoft 365 Copilot and Work IQ.",
          "连接后，Otto 可按您的要求读取和发送邮件、管理日历以及处理 OneDrive 文件。工作或学校账户还可添加 Teams 聊天、Microsoft 365 Copilot 和 Work IQ。",
        )}
      </Text>
      {browserAvailable ? (
        <Button
          variant="primary"
          loading={pending}
          disabled={loading || pending}
          onClick={onSignIn}
        >
          {t("Sign in with Microsoft", "使用 Microsoft 登录")}
        </Button>
      ) : (
        <DeviceAuthConnectButton
          provider={MICROSOFT_PROVIDER}
          providerName="Microsoft"
          scopes={scopes}
          onSuccess={onDeviceConnected}
          onError={onDeviceError}
        />
      )}
      {recovery && (
        <MicrosoftAdminSetup
          reason={recovery}
          // A sign-in code is tried again from its own button.
          onRetry={browserAvailable ? onSignIn : undefined}
        />
      )}
      {onSkip && (
        <Button variant="ghost" onClick={onSkip}>
          {t("Not now", "暂不")}
        </Button>
      )}
    </div>
  );
}
