"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { ReactNode } from "react";
import { format } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";

import type { APIKeyInfo } from "@/app/api/__generated__/models/aPIKeyInfo";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { SCOPE_API_VERSION } from "@/lib/api-key-scopes";

import { maskAPIKey } from "../APIKeyList/helpers";
import { humanizePermission } from "../CreateAPIKeyDialog/schema";

interface Props {
  open: boolean;
  apiKey: APIKeyInfo;
  onOpenChange: (open: boolean) => void;
}

export function APIKeyInfoDialog({ open, apiKey, onOpenChange }: Props) {
  const { t, locale } = useTranslation();
  const dateOptions = { locale: locale === "zh-CN" ? zhCN : enUS };
  return (
    <Dialog
      title={apiKey.name}
      styling={{ maxWidth: "30rem" }}
      controlled={{ isOpen: open, set: onOpenChange }}
    >
      <Dialog.Content>
        <div className="flex flex-col gap-4 px-1">
          <Section label={t("Key", "密钥")}>
            <code className="font-mono text-body text-foreground-emphasis">
              {maskAPIKey(apiKey.head, apiKey.tail)}
            </code>
          </Section>

          {apiKey.description && (
            <Section label={t("Description", "描述")}>
              <Text variant="body" tone="body">
                {apiKey.description}
              </Text>
            </Section>
          )}

          <Section label={t("Scopes", "权限范围")}>
            {apiKey.scopes.length === 0 ? (
              <Text variant="body" tone="muted">
                {t("No scopes", "无权限范围")}
              </Text>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {apiKey.scopes.map((scope) => (
                  <li
                    key={scope}
                    className="rounded-full bg-surface-hover px-2.5 py-1 text-caption text-foreground-body"
                  >
                    {humanizePermission(scope, locale)}
                    {SCOPE_API_VERSION[scope] === "v1" && (
                      <span className="text-foreground-secondary">
                        {" "}
                        {t("· v1 only", "· 仅 v1")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section label={t("Created", "创建时间")}>
            <Text variant="body" tone="body">
              {format(new Date(apiKey.created_at), "PPP p", dateOptions)}
            </Text>
          </Section>

          <Section label={t("Last used", "上次使用")}>
            <Text variant="body" tone="body">
              {apiKey.last_used_at
                ? format(new Date(apiKey.last_used_at), "PPP p", dateOptions)
                : t("Never used", "从未使用")}
            </Text>
          </Section>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Text variant="small-medium" as="span" tone="muted">
        {label}
      </Text>
      {children}
    </div>
  );
}
