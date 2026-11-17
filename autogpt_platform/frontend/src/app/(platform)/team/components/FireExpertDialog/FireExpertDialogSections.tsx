"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import type { ReactNode } from "react";
import type { PauseItem } from "./helpers";

type PreviewProps = {
  expertName: string;
  automationLine: string;
  items: PauseItem[];
  isLoading: boolean;
  isError: boolean;
  isReady: boolean;
  onRetry: () => unknown;
};

type FooterProps = {
  expertName: string;
  isFiring: boolean;
  isPreviewLoading: boolean;
  onClose: () => void;
  onFire: () => void;
};

type PauseItemsPanelProps = {
  items: PauseItem[];
};

type FireLineProps = {
  children: ReactNode;
};

export function FireExpertPreview({
  expertName,
  automationLine,
  items,
  isLoading,
  isError,
  isReady,
  onRetry,
}: PreviewProps) {
  const { t } = useTranslation();
  function getAutomationLineText() {
    if (isLoading)
      return t("Checking what will pause…", "正在检查将暂停的任务…");
    if (isError)
      return t(
        "We couldn't preview what pauses, but you can still fire them.",
        "无法预览将暂停的任务，但你仍可解雇这位专家。",
      );
    return automationLine;
  }

  function handleRetry() {
    void onRetry();
  }

  return (
    <>
      <Text variant="body" tone="secondary">
        {t(
          `Here is exactly what happens when you fire ${expertName}.`,
          `解雇 ${expertName} 后将发生以下变化。`,
        )}
      </Text>
      <ul className="flex flex-col gap-2.5">
        <FireLine>
          {t(
            "Installed workflows stay in your library.",
            "已安装的工作流会保留在你的工作流库中。",
          )}
        </FireLine>
        <FireLine>{getAutomationLineText()}</FireLine>
        <FireLine>
          {t(
            "Any chat history stays available but read-only.",
            "所有聊天记录仍可查看，但将变为只读。",
          )}
        </FireLine>
        <FireLine>
          {t("Their work stays yours.", "这位专家的工作成果仍归你所有。")}
        </FireLine>
      </ul>
      {isError ? (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="small"
            onClick={handleRetry}
            data-testid="fire-preview-retry"
          >
            {t("Retry preview", "重新预览")}
          </Button>
        </div>
      ) : null}
      {isReady && items.length > 0 ? <PauseItemsPanel items={items} /> : null}
    </>
  );
}

function PauseItemsPanel({ items }: PauseItemsPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl bg-surface-muted px-3.5 py-3 ring-1 ring-border-base/80 ring-inset">
      <Text variant="small" tone="muted">
        {t("Pausing now", "即将暂停")}
      </Text>
      <ul className="mt-1 flex flex-col gap-0.5">
        {items.map((item) => (
          <Text
            key={item.id}
            variant="body"
            as="li"
            tone="secondary"
            className="truncate"
          >
            {item.name}
          </Text>
        ))}
      </ul>
    </div>
  );
}

export function FireExpertFooter({
  expertName,
  isFiring,
  isPreviewLoading,
  onClose,
  onFire,
}: FooterProps) {
  const { t } = useTranslation();
  return (
    <Dialog.Footer>
      <Button
        size="small"
        variant="secondary"
        disabled={isFiring}
        onClick={onClose}
      >
        {t("Keep", "保留")} {expertName}
      </Button>
      <Button
        size="small"
        variant="destructive"
        loading={isFiring}
        disabled={isPreviewLoading}
        onClick={onFire}
        data-testid="fire-expert-confirm"
      >
        {t(`Fire ${expertName}`, `解雇 ${expertName}`)}
      </Button>
    </Dialog.Footer>
  );
}

function FireLine({ children }: FireLineProps) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden
        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-border-strong"
      />
      <Text variant="body" tone="secondary">
        {children}
      </Text>
    </li>
  );
}
