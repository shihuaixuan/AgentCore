"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";

import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";

import { useOAuthConnect } from "./useOAuthConnect";
import { LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  provider: string;
  providerName: string;
  buttonLabel?: string;
  /** Whose terms a linked run falls under, where that is not AutoGPT's. The
   *  sign-in window is a product ("ChatGPT") and the terms are a company's
   *  ("OpenAI"), so this is named separately rather than reusing the label
   *  on the button. */
  termsNotice?: string;
  onSuccess: (credential?: CredentialsMetaResponse) => void;
}

export function OAuthConnectButton({
  provider,
  providerName,
  buttonLabel,
  termsNotice,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const { connect, isPending } = useOAuthConnect({ provider, onSuccess });

  return (
    <div className="flex flex-col gap-3">
      <Text variant="body" tone="body">
        {t(
          `We'll open a ${providerName} sign-in window. Approve access there to finish connecting.`,
          `即将打开 ${providerName} 登录窗口。请在其中批准授权以完成连接。`,
        )}
      </Text>
      <Button
        type="button"
        variant="primary"
        size="large"
        onClick={connect}
        loading={isPending}
        rightIcon={<Icon icon={LinkSquare01Icon} size={18} />}
      >
        {buttonLabel ??
          t(`Continue with ${providerName}`, `使用 ${providerName} 继续`)}
      </Button>
      {termsNotice && (
        <Text variant="small" tone="muted">
          {t(
            `Linked runs are sent to ${termsNotice} under your own account and follow ${termsNotice}'s terms.`,
            `关联运行会通过您自己的账户发送给 ${termsNotice}，并遵循 ${termsNotice} 的条款。`,
          )}
        </Text>
      )}
    </div>
  );
}
