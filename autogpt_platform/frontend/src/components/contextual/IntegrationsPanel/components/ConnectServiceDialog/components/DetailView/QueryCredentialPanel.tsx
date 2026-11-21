"use client";

import type { ReactNode } from "react";
import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import type { ProviderMetadata } from "@/app/api/__generated__/models/providerMetadata";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Select } from "@/components/atoms/Select/Select";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { noPasswordManager } from "./helpers";
import { useQueryCredential } from "./useQueryCredential";

type Props = {
  catalogID: string;
  server: NonNullable<ProviderMetadata["mcp_server"]>;
  serviceName: string;
  onSuccess: (credential: CredentialsMetaResponse) => void;
  actions?: ReactNode;
};

export function QueryCredentialPanel({
  catalogID,
  server,
  serviceName,
  onSuccess,
  actions,
}: Props) {
  const { t } = useTranslation();
  const state = useQueryCredential(catalogID, server, onSuccess);
  return (
    <div className="flex flex-col gap-4">
      {state.choicesFailed && (
        <Button
          variant="secondary"
          size="small"
          onClick={() => void state.retryChoices()}
        >
          {t("Retry loading existing connections", "重新加载已有连接")}
        </Button>
      )}
      {state.choices.length > 0 && (
        <>
          <Select
            id="existing-mcp-query-connection"
            label={t(
              `Existing ${serviceName} connection`,
              `已有${serviceName}连接`,
            )}
            aria-label={t(
              `Existing ${serviceName} connection`,
              `已有${serviceName}连接`,
            )}
            placeholder={t("Choose a connection", "选择连接")}
            value={state.selectedID}
            onValueChange={state.select}
            disabled={state.saving}
            options={state.choices.map((row) => ({
              value: row.id,
              label: `${row.server_url} · ${row.id}`,
            }))}
            hint={t(
              `Choose only a connection created for ${serviceName}. Existing grants will continue to use it.`,
              `仅选择为「${serviceName}」创建的连接。原有授权将继续使用该连接。`,
            )}
          />
          <Button
            variant="secondary"
            size="small"
            disabled={!state.canBind}
            onClick={state.save}
          >
            {t(
              `Use existing connection for ${serviceName}`,
              `为「${serviceName}」使用已有连接`,
            )}
          </Button>
        </>
      )}
      <Input
        id="mcp-query-credential-url"
        label={t(`${serviceName} API Key URL`, `${serviceName} API Key 链接`)}
        type="password"
        value={state.value}
        onChange={(event) => state.change(event.target.value)}
        disabled={state.saving}
        spellCheck={false}
        {...noPasswordManager}
        autoComplete="new-password"
        hint={t(
          `Paste the complete credential URL from the ${serviceName} provider, including its query credential.`,
          `请粘贴 ${serviceName} 服务商提供的完整凭据链接（包括查询参数凭据）。`,
        )}
      />
      {state.failed && (
        <Text as="p" role="alert" variant="small" tone="error-strong">
          {t(
            "Could not save this connection. Check the endpoint and credential, then try again.",
            "未能保存连接。请检查服务地址和凭据后重试。",
          )}
        </Text>
      )}
      <div className="flex items-center justify-end gap-2">
        {actions}
        <Button
          variant="primary"
          size="small"
          onClick={state.save}
          disabled={!state.canSave}
          loading={state.saving}
        >
          {t("Save API key", "保存 API Key")}
        </Button>
      </div>
    </div>
  );
}
