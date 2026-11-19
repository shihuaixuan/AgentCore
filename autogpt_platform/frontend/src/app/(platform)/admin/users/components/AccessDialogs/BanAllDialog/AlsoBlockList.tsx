"use client";

import { Text } from "@/components/atoms/Text/Text";
import { Alert, AlertDescription } from "@/components/molecules/Alert/Alert";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import type { AlsoBlockOption } from "./helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  options: AlsoBlockOption[];
  ticked: Set<string>;
  done: Set<string>;
  onToggle: (key: string) => void;
  alreadyBlockedDomain: string | null;
  ownIP: string | null;
}

export function AlsoBlockList({
  options,
  ticked,
  done,
  onToggle,
  alreadyBlockedDomain,
  ownIP,
}: Props) {
  const { t } = useTranslation();
  const blocksOwnIP = options.some(
    (option) =>
      option.kind === "IP" && option.value === ownIP && ticked.has(option.key),
  );

  if (options.length === 0 && !alreadyBlockedDomain) return null;

  return (
    <div className="flex flex-col gap-2">
      <Text variant="small-medium" tone="body">
        {t("Also block", "同时阻止")}
      </Text>
      {options.map((option) => (
        <label
          key={option.key}
          htmlFor={`also-block-${option.key}`}
          className="flex items-start gap-3"
        >
          <Checkbox
            id={`also-block-${option.key}`}
            className="mt-1"
            checked={ticked.has(option.key) || done.has(option.key)}
            disabled={option.isDisabled || done.has(option.key)}
            onCheckedChange={() => onToggle(option.key)}
          />
          <Text variant="body" as="span" tone="body">
            {t("Block", "阻止")}{" "}
            <span className="font-medium" translate="no">
              {option.label}
            </span>{" "}
            · {option.disabledReason ?? option.detail}
          </Text>
        </label>
      ))}
      {alreadyBlockedDomain ? (
        <Text variant="body" tone="muted">
          <span className="font-medium">{alreadyBlockedDomain}</span> ·{" "}
          {t("already blocked", "已阻止")}
        </Text>
      ) : null}
      {blocksOwnIP ? (
        <Alert variant="warning">
          <AlertDescription>
            {t(
              `You're signed in from ${ownIP}. You'd be refused at your next sign-in too.`,
              `你当前正从 ${ownIP} 登录。你的下次登录也会被拒绝。`,
            )}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
