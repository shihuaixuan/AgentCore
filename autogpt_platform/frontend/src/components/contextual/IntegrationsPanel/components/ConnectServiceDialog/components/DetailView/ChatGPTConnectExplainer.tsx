"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import {
  ArrowDataTransferHorizontalIcon,
  ShieldKeyIcon,
  SparklesIcon,
  Target02Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

import { useGetV2ListProviderModelTiers } from "@/app/api/__generated__/endpoints/chat/chat";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";

import { chatgptModelsSentence } from "./helpers";

interface Point {
  icon: IconSvgElement;
  title: string;
  body: string;
  withModels?: (models: string) => string;
}

/**
 * Linking a ChatGPT plan changes who pays for a run, so the four questions
 * that implies get answered on screen before the OAuth window opens rather
 * than after the user has committed.
 *
 * Says nothing about pausing and resuming a run at a provider limit, because
 * same-chat recovery is not built yet.
 *
 * It does name the models, from the catalog rather than from a literal here.
 * The connections list cannot answer that at this point -- the user has not
 * made this connection, so it is absent from their offers -- which is what
 * the provider-tiers endpoint exists for.
 */

export function ChatGPTConnectExplainer() {
  const { t } = useTranslation();
  const POINTS: Point[] = [
    {
      icon: ArrowDataTransferHorizontalIcon,
      title: t("What it does.", "连接用途。"),
      body: t(
        "Chats routed to ChatGPT run on your ChatGPT plan instead of AutoGPT credits. Every new chat starts on the connection you choose in Settings, and you can change it per conversation — nothing switches on its own.",
        "路由至 ChatGPT 的聊天通过您的 ChatGPT 套餐运行，无需消耗 AutoGPT 积分。每段新聊天都使用您在设置中选择的连接，您可以逐段对话更改，系统不会自动切换。",
      ),
    },
    {
      icon: Target02Icon,
      title: t("What it costs.", "使用费用。"),
      body: t(
        "Usage counts toward your ChatGPT plan's own limits. Those runs spend zero AutoGPT credits, and AutoGPT never adds a charge on top.",
        "使用量计入 ChatGPT 套餐自身的限额。这些运行不消耗 AutoGPT 积分，AutoGPT 也不会额外收费。",
      ),
    },
    {
      icon: SparklesIcon,
      title: t("What you get.", "可用能力。"),
      body: t(
        "The models your ChatGPT plan already includes, at no extra cost from AutoGPT.",
        "使用 ChatGPT 套餐已包含的模型，AutoGPT 不额外收费。",
      ),
      /** Replaced with the named models when the catalog can supply them. */
      withModels: (models: string) =>
        t(
          `${models}, at no extra cost from AutoGPT.`,
          `${models}，AutoGPT 不额外收费。`,
        ),
    },
    {
      icon: ShieldKeyIcon,
      title: t("Stay in control.", "始终由您掌控。"),
      body: t(
        "A chat stays on the connection it started with, so a run is never moved onto your AutoGPT credits without asking. Disconnect any time in Settings.",
        "聊天会继续使用开始时的连接，系统不会未经询问就转为消耗 AutoGPT 积分。您可以随时在设置中断开连接。",
      ),
    },
  ];
  const { data } = useGetV2ListProviderModelTiers({
    query: { refetchOnWindowFocus: false },
  });
  const models =
    data?.status === 200 ? chatgptModelsSentence(data.data.providers) : "";

  return (
    <div className="divide-y divide-border-base rounded-2xl border border-border-base bg-surface-muted">
      {POINTS.map((point) => (
        <div key={point.title} className="flex items-start gap-3 p-4">
          <span
            aria-hidden
            className="mt-[2px] flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-accent-surface text-brand"
          >
            <Icon icon={point.icon} size={14} />
          </span>
          <Text variant="small" tone="body">
            <span className="font-medium text-foreground-base">
              {point.title}
            </span>{" "}
            {models && point.withModels ? point.withModels(models) : point.body}
          </Text>
        </div>
      ))}
    </div>
  );
}
