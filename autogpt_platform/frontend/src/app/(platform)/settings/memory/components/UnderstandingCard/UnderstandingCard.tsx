"use client";

import { AUTOPILOT_NAME } from "@/lib/branding";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { useState } from "react";
import { useUnderstandingCard } from "./useUnderstandingCard";

const LONG_VALUE_CHARS = 280;

export function UnderstandingCard() {
  const { t } = useTranslation();
  const {
    rows,
    isError,
    error,
    refetch,
    isConfirmOpen,
    setIsConfirmOpen,
    forget,
    isForgetting,
  } = useUnderstandingCard();

  if (isError)
    return (
      <ErrorCard
        responseError={error || undefined}
        context={t(
          `what ${AUTOPILOT_NAME} knows about your work`,
          `${AUTOPILOT_NAME} 对你工作的了解`,
        )}
        onRetry={refetch}
      />
    );
  if (!rows.length) return null;

  return (
    <section
      aria-labelledby="understanding-title"
      className="flex flex-col rounded-large border border-border-base bg-surface px-4 py-4 shadow-message-table"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col">
          <Text variant="body-medium" as="h2" id="understanding-title">
            {t(
              `What ${AUTOPILOT_NAME} knows about your work`,
              `${AUTOPILOT_NAME} 对你工作的了解`,
            )}
          </Text>
          <Text variant="small" as="span" tone="muted">
            {t(
              `From your onboarding and your chats. Every new chat with ${AUTOPILOT_NAME} starts with this.`,
              `来自你的引导设置和聊天。每次与 ${AUTOPILOT_NAME} 开始新聊天时都会参考这些内容。`,
            )}
          </Text>
        </div>
        <Dialog
          title={t(
            `Forget what ${AUTOPILOT_NAME} knows about your work`,
            `忘记 ${AUTOPILOT_NAME} 对你工作的了解`,
          )}
          styling={{ maxWidth: "440px" }}
          controlled={{ isOpen: isConfirmOpen, set: setIsConfirmOpen }}
        >
          <Dialog.Trigger>
            <Button variant="secondary" size="small">
              {t("Forget this", "忘记此项")}
            </Button>
          </Dialog.Trigger>
          <Dialog.Content>
            <div className="flex flex-col gap-4">
              <Text variant="small" as="p" tone="secondary">
                {t(
                  `${AUTOPILOT_NAME} stops starting new chats with this. Your recent memories stay.`,
                  `${AUTOPILOT_NAME} 将不再在新聊天中使用这些内容。近期记忆会保留。`,
                )}
              </Text>
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setIsConfirmOpen(false)}
                >
                  {t("Cancel", "取消")}
                </Button>
                <Button
                  variant="destructive"
                  size="small"
                  loading={isForgetting}
                  onClick={forget}
                >
                  {t("Forget", "忘记")}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog>
      </div>

      <dl className="mt-2 flex flex-col divide-y divide-separator">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5 py-2">
            <Text variant="small-medium" as="dt" tone="muted">
              {row.label}
            </Text>
            {row.values.map((value) => (
              <UnderstandingValue key={value} value={value} />
            ))}
          </div>
        ))}
      </dl>
    </section>
  );
}

function UnderstandingValue({ value }: { value: string }) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  // By code point, so the cut never splits an emoji's surrogate pair.
  const chars = Array.from(value);
  const isLong = chars.length > LONG_VALUE_CHARS;
  const shown =
    isLong && !isExpanded
      ? `${chars.slice(0, LONG_VALUE_CHARS).join("")}…`
      : value;

  return (
    <dd className="text-body whitespace-pre-line text-foreground-emphasis">
      {shown}
      {isLong ? (
        <button
          type="button"
          className="ml-1 text-foreground-tertiary underline"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? t("Show less", "收起") : t("Show all", "显示全部")}
        </button>
      ) : null}
    </dd>
  );
}
