"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import type { ReactNode } from "react";
import { useCheckMCPConnection } from "./useCheckMCPConnection";

interface Props {
  serverURL: string;
  actions?: ReactNode;
}

export function PublicMCPPanel({ serverURL, actions }: Props) {
  const { t } = useTranslation();

  const { check, isPending, toolCount, error } =
    useCheckMCPConnection(serverURL);
  return (
    <div className="flex flex-col gap-4">
      <Input
        id="public-mcp-server-url"
        label={t("Server URL", "服务器 URL")}
        type="url"
        value={serverURL}
        readOnly
      />
      <Text variant="small" tone="secondary">
        {t(
          "This server can be used without connecting an account.",
          "无需连接账户即可使用此服务器。",
        )}
      </Text>
      {toolCount !== null && (
        <Text variant="body" role="status">
          {toolCount === 0
            ? t(
                "Connected, but this server returned no tools.",
                "已连接，但此服务器未返回任何工具。",
              )
            : t(
                `${toolCount} ${toolCount === 1 ? "tool" : "tools"} available.`,
                `有 ${toolCount} 个可用工具。`,
              )}
        </Text>
      )}
      {toolCount !== null && (
        <Text variant="small" tone="secondary">
          {t(
            "This service needs no sign-in, so nothing was saved. Add it to a workflow or ask an expert to use it.",
            "此服务无需登录，因此未保存任何内容。将其添加到工作流，或请专家使用它。",
          )}
        </Text>
      )}
      {error && (
        <Text variant="small" role="alert" tone="error-strong">
          {error}
        </Text>
      )}
      <div className="flex items-center justify-end gap-2">
        {actions}
        <Button
          variant="primary"
          size="small"
          onClick={check}
          loading={isPending}
        >
          {t("Check connection", "检查连接")}
        </Button>
      </div>
    </div>
  );
}
