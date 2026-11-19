"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { credentialService } from "@/components/contextual/CredentialsInput/service-identity";
import { useId, useState } from "react";
import { useInlineConnectForm } from "./useInlineConnectForm";

interface Props {
  provider: string;
  service: NonNullable<ReturnType<typeof credentialService>>;
  onConnected: (credential?: CredentialsMetaResponse) => void;
}

export function ServiceKeyForm({ provider, service, onConnected }: Props) {
  const { t } = useTranslation();

  const keyID = useId();
  const [key, setKey] = useState("");
  const { submit, isPending } = useInlineConnectForm({
    provider,
    successTitle: t(
      `${service.name} connection saved`,
      `${service.name} 连接已保存`,
    ),
    failureTitle: t(
      `Couldn't connect ${service.name}`,
      `无法连接 ${service.name}`,
    ),
    onSuccess: onConnected,
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = key.trim();
    if (!token || isPending) return;
    void submit({
      provider,
      type: "host_scoped",
      title: service.name,
      host: service.host,
      headers: { Authorization: service.bearer ? `Bearer ${token}` : token },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2 rounded-xl bg-surface-muted p-4 text-body text-foreground-tertiary">
        <p>
          {t(
            `This workflow needs an API key for ${service.name}. Otto will use it only for requests to ${service.host}.`,
            `此工作流需要 ${service.name} 的 API 密钥。Otto 仅会在向 ${service.host} 发送请求时使用此密钥。`,
          )}
        </p>
        <p>
          {t(
            service.keyHelp ?? "",
            service.keyHelpChinese ?? service.keyHelp ?? "",
          )}
        </p>
      </div>
      <Input
        id={keyID}
        label={t("API key", "API 密钥")}
        type="password"
        autoComplete="new-password"
        spellCheck={false}
        value={key}
        onChange={(event) => setKey(event.target.value)}
      />
      <Button
        type="submit"
        variant="primary"
        size="small"
        className="w-full"
        loading={isPending}
        disabled={!key.trim() || isPending}
      >
        {isPending
          ? t("Connecting…", "连接中…")
          : t("Save and connect", "保存并连接")}
      </Button>
    </form>
  );
}
