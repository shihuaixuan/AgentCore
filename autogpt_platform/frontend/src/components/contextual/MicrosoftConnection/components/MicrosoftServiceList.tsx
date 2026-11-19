"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { MicrosoftAccessCheck } from "@/app/api/__generated__/models/microsoftAccessCheck";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import {
  getMicrosoftServicePurpose,
  getMicrosoftStatusLabel,
} from "@/lib/microsoft-setup";
import { canAllow } from "../helpers";

interface Props {
  check?: MicrosoftAccessCheck;
  checking: boolean;
  /** Microsoft refused the check, for a reason shown next to the list. */
  refused?: boolean;
  browserAvailable: boolean;
  onAllow: (scopes: string[]) => void;
}

export function MicrosoftServiceList({
  check,
  checking,
  refused,
  browserAvailable,
  onAllow,
}: Props) {
  const { locale, t } = useTranslation();
  if (!check) {
    if (refused && !checking) return null;
    return (
      <Text variant="small" tone="muted" role="status">
        {checking
          ? t(
              "Checking what this account can use…",
              "正在检查此账号可使用的服务…",
            )
          : t(
              "Couldn't check this account. Try again in a moment.",
              "无法检查此账号，请稍后重试。",
            )}
      </Text>
    );
  }

  return (
    <ul
      aria-label={t("Microsoft services", "Microsoft 服务")}
      aria-live="polite"
      className="flex flex-col divide-y divide-separator rounded-lg border border-border-base"
    >
      {check.capabilities.map((item) => (
        <li
          key={item.service}
          className="flex items-center justify-between gap-3 px-3 py-2"
        >
          <div className="flex min-w-0 flex-col">
            <Text variant="body-medium">{item.name}</Text>
            <Text variant="small" tone="muted">
              {getMicrosoftServicePurpose(item.service, locale)}
            </Text>
            <Text variant="small" tone="body">
              {getMicrosoftStatusLabel(item.status, locale)}
            </Text>
          </div>
          {browserAvailable && canAllow(item) ? (
            <Button
              size="small"
              variant="secondary"
              aria-label={t(`Allow ${item.name}`, `允许 ${item.name}`)}
              onClick={() => onAllow(item.scopes ?? [])}
            >
              {t("Allow", "允许")}
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
