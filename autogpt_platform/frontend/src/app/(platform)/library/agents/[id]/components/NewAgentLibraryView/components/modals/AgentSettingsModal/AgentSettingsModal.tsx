"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { Button } from "@/components/atoms/Button/Button";
import { Switch } from "@/components/atoms/Switch/Switch";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useAgentSafeMode } from "@/hooks/useAgentSafeMode";
import { useState } from "react";
import { Settings01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  agent: LibraryAgent;
  controlledOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AgentSettingsModal({
  agent,
  controlledOpen,
  onOpenChange,
}: Props) {
  const { t } = useTranslation();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalIsOpen;

  function setIsOpen(open: boolean) {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  }

  const {
    currentHITLSafeMode,
    showHITLToggle,
    handleHITLToggle,
    currentSensitiveActionSafeMode,
    showSensitiveActionToggle,
    handleSensitiveActionToggle,
    isPending,
    shouldShowToggle,
  } = useAgentSafeMode(agent);

  if (!shouldShowToggle) return null;

  return (
    <Dialog
      controlled={{ isOpen, set: setIsOpen }}
      styling={{ maxWidth: "600px", maxHeight: "90vh" }}
      title={t("Workflow Settings", "工作流设置")}
    >
      {controlledOpen === undefined && (
        <Dialog.Trigger>
          <Button
            variant="ghost"
            size="inline"
            // oxlint-disable-next-line design-system/no-restyle -- a text-link-like trigger; no Button size has 4px side padding at 36px tall
            className="m-0 h-9 px-1"
            aria-label={t("Workflow Settings", "工作流设置")}
          >
            <span className="contents text-foreground-secondary">
              <Icon icon={Settings01Icon} size={18} />
            </span>
            <Text variant="small">{t("Workflow Settings", "工作流设置")}</Text>
          </Button>
        </Dialog.Trigger>
      )}
      <Dialog.Content>
        <div className="space-y-6">
          {showHITLToggle && (
            <div className="flex w-full flex-col items-start gap-4 rounded-xl border border-separator bg-surface p-6">
              <div className="flex w-full items-start justify-between gap-4">
                <div className="flex-1">
                  <Text variant="large-semibold">
                    {t("Human-in-the-loop approval", "人工审批")}
                  </Text>
                  <Text variant="large" tone="primary" className="mt-1">
                    {t(
                      "The workflow will pause at human-in-the-loop blocks and wait for your review before continuing",
                      "工作流将在人工审批模块处暂停，等待你审核后再继续",
                    )}
                  </Text>
                </div>
                <Switch
                  checked={currentHITLSafeMode || false}
                  onCheckedChange={handleHITLToggle}
                  disabled={isPending}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          {showSensitiveActionToggle && (
            <div className="flex w-full flex-col items-start gap-4 rounded-xl border border-separator bg-surface p-6">
              <div className="flex w-full items-start justify-between gap-4">
                <div className="flex-1">
                  <Text variant="large-semibold">
                    {t("Sensitive action approval", "敏感操作审批")}
                  </Text>
                  <Text variant="large" tone="primary" className="mt-1">
                    {t(
                      "The workflow will pause at sensitive action blocks and wait for your review before continuing",
                      "工作流将在敏感操作模块处暂停，等待你审核后再继续",
                    )}
                  </Text>
                </div>
                <Switch
                  checked={currentSensitiveActionSafeMode}
                  onCheckedChange={handleSensitiveActionToggle}
                  disabled={isPending}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
