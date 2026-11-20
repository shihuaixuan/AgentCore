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
  serviceName: string;
  onSuccess: (credential: CredentialsMetaResponse) => void;
  actions?: ReactNode;
};

export function DingTalkKeyURLPanel({
  serviceName,
  onSuccess,
  actions,
}: Props) {
  const { t } = useTranslation();
  const { value, change, canSave, save, saving, failed } =
    useDingTalkKeyURL(onSuccess);

  return (
    <div className="flex flex-col gap-4">
      <Input
        id="dingtalk-key-url"
        label={t(`${serviceName} API Key URL`, `${serviceName} API Key 链接`)}
        type="password"
        value={value}
        onChange={(event) => change(event.target.value)}
        disabled={saving}
        spellCheck={false}
        {...noPasswordManager}
        autoComplete="new-password"
        hint={t(
          `Paste the full API Key URL from the ${serviceName} page in the DingTalk marketplace, including its key parameter.`,
          `请从钉钉市场的「${serviceName}」页面复制完整的 API Key 链接（含 key 参数），不要使用其他服务的链接。`,
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
