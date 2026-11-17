"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import {
  getGetV2GetSessionComputerQueryKey,
  useGetV2GetSessionComputer,
  usePostV2StartSessionDesktop,
} from "@/app/api/__generated__/endpoints/chat/chat";
import { okData } from "@/app/api/helpers";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { desktopStreamRenderer } from "@/components/contextual/OutputRenderers/renderers/DesktopStreamRenderer";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useCopilotUIStore } from "../../../store";
import { desktopStartFailure } from "./desktopStartFailure";

interface Props {
  sessionId: string;
}

interface PillProps {
  tone: "on" | "off" | "none";
  label: string;
}

function Pill({ tone, label }: PillProps) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-caption font-medium",
        tone === "on"
          ? "bg-success-surface text-success-foreground"
          : tone === "off"
            ? "bg-surface-hover text-foreground-secondary"
            : "bg-surface-muted text-foreground-tertiary",
      )}
    >
      {label}
    </span>
  );
}

export function ComputerPanelContent({ sessionId }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const stream = useCopilotUIStore((s) => s.artifactPanel.computer);
  const registerComputerStream = useCopilotUIStore(
    (s) => s.registerComputerStream,
  );

  const computerQuery = useGetV2GetSessionComputer(sessionId, {
    query: {
      select: (res) => okData(res) ?? null,
      refetchInterval: 15_000,
    },
  });
  const computer = computerQuery.data ?? null;

  const { mutate: startDesktop, isPending } = usePostV2StartSessionDesktop({
    mutation: {
      onSuccess: (res) => {
        const next = okData(res);
        if (next) {
          registerComputerStream({
            url: next.url,
            sandbox_id: next.sandbox_id,
            provider: next.provider ?? "e2b",
          });
        }
        queryClient.invalidateQueries({
          queryKey: getGetV2GetSessionComputerQueryKey(sessionId),
        });
      },
      onError: (error) => {
        toast({
          title: t("Could not open the desktop", "无法打开桌面"),
          description: desktopStartFailure(error),
          variant: "destructive",
        });
      },
    },
  });

  const isExpert = computer?.owner_kind === "expert";
  const box = computer?.box ?? null;
  const machineLabel = !box
    ? t("None", "无")
    : box.state === "running"
      ? t("Running", "运行中")
      : t("Suspended", "已暂停");
  const machineTone = !box ? "none" : box.state === "running" ? "on" : "off";
  const screenOn = computer?.screen_on === true;
  const actionLabel = stream
    ? t("Refresh", "刷新")
    : screenOn
      ? t("Open desktop", "打开桌面")
      : t("Turn on screen", "开启屏幕");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border-base bg-surface px-3 py-2">
        <div className="flex items-center gap-3 text-body">
          <span className="flex items-center gap-1.5">
            <span className="text-foreground-tertiary">
              {t("Machine", "计算机")}
            </span>
            <Pill tone={machineTone} label={machineLabel} />
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-foreground-tertiary">
              {t("Screen", "屏幕")}
            </span>
            <Pill
              tone={!box ? "none" : screenOn ? "on" : "off"}
              label={
                !box
                  ? t("None", "无")
                  : screenOn
                    ? t("On", "已开启")
                    : t("Off", "已关闭")
              }
            />
          </span>
        </div>
        <Button
          variant="secondary"
          size="small"
          loading={isPending}
          disabled={computer != null && !computer.e2b_active}
          onClick={() => startDesktop({ sessionId })}
        >
          {actionLabel}
        </Button>
      </div>

      {stream ? (
        <div data-testid="session-desktop-stream">
          {desktopStreamRenderer.render({ kind: "desktop_stream", ...stream })}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-base p-6 text-center">
          <Text variant="small-medium">
            {t("Screen is not on this panel yet", "此面板尚未显示屏幕")}
          </Text>
          <Text tone="muted" variant="small" className="max-w-xs">
            {isExpert
              ? t(
                  "This chat runs on the expert's own computer. Turn on its screen to watch it work in a real browser, or ask for one in the chat.",
                  "此对话在专家自己的计算机上运行。开启屏幕即可查看其在真实浏览器中的操作，也可以在对话中请求开启。",
                )
              : t(
                  "Turn on this chat's screen to watch it work in a real browser, or ask for one in the chat. It is the same machine your commands run in.",
                  "开启此对话的屏幕即可查看其在真实浏览器中的操作，也可以在对话中请求开启。你的命令也在这台计算机上运行。",
                )}
          </Text>
        </div>
      )}

      {computer && !computer.e2b_active ? (
        <Text tone="warning" variant="small">
          {t(
            "Cloud sandboxes are not configured on this deployment.",
            "此部署尚未配置云沙箱。",
          )}
        </Text>
      ) : null}
    </div>
  );
}
