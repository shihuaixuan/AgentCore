"use client";

import type { ReactNode } from "react";
import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { noPasswordManager } from "./helpers";
import { useDingTalkKeyURL } from "./useDingTalkKeyURL";

type Props = {
  onSuccess: (credential: CredentialsMetaResponse) => void;
  actions?: ReactNode;
};

export function DingTalkKeyURLPanel({ onSuccess, actions }: Props) {
  const { t } = useTranslation();
  const { value, change, canSave, save, saving, failed } =
    useDingTalkKeyURL(onSuccess);

  return (
    <div className="flex flex-col gap-4">
      <Input
        id="dingtalk-key-url"
        label={t("DingTalk Mail API Key URL", "钉钉邮箱 API Key 链接")}
        type="password"
        value={value}
        onChange={(event) => change(event.target.value)}
        disabled={saving}
        spellCheck={false}
        {...noPasswordManager}
        autoComplete="new-password"
        hint={t(
          "Paste the full Streamable HTTP URL from the API Key setup for DingTalk Mail, including its key parameter.",
          "粘贴钉钉邮箱 API Key 配置中的完整 Streamable HTTP 链接，包含 key 参数。",
        )}
      />
      {failed && (
        <Text as="p" role="alert" variant="small" tone="error-strong">
          {t(
            "Could not save this API key. Check the link and try again.",
            "未能保存 API Key。请检查链接后重试。",
          )}
        </Text>
      )}
      <div className="flex items-center justify-end gap-2">
        {actions}
        <Button
          variant="primary"
          size="small"
          onClick={save}
          disabled={!canSave}
          loading={saving}
        >
          {t("Save API key", "保存 API Key")}
        </Button>
      </div>
    </div>
  );
}
