"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import {
  buildTourPricingUrl,
  TOUR_DEMO_CLAIM_SECONDS,
  TOUR_GITHUB_URL,
} from "../../constants";
import { useTourEndCard } from "./useTourEndCard";
import { PlayIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function TourEndCard() {
  const { t } = useTranslation();
  const { handlePricingClick, handleSelfHostClick, handleWatchAnother } =
    useTourEndCard();

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border-base/70 bg-surface p-5 shadow-sm duration-500 animate-in fade-in slide-in-from-bottom-2 sm:p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-surface px-3 py-1 text-success-foreground">
          <Icon icon={Tick02Icon} className="size-3.5" />
          <Text variant="small-medium" tone="inherit">
            {t(
              `Workflow built & first run complete — ${TOUR_DEMO_CLAIM_SECONDS} seconds`,
              `工作流已创建，首次运行已完成 — ${TOUR_DEMO_CLAIM_SECONDS} 秒`,
            )}
          </Text>
        </span>
        <Text variant="h4" as="h3" tone="primary" className="mt-1">
          {t(
            `That took ${TOUR_DEMO_CLAIM_SECONDS} seconds.`,
            `只用了 ${TOUR_DEMO_CLAIM_SECONDS} 秒。`,
          )}
          <br />
          {t("Yours will too.", "你的工作流也可以。")}
        </Text>
        <Text variant="body" tone="muted">
          {t(
            "Same chat, your real tasks — hosted and running for you.",
            "同样的对话方式，处理你的真实任务 — 我们为你托管运行。",
          )}
        </Text>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <Button
          as="NextLink"
          href={buildTourPricingUrl("end_card")}
          target="_blank"
          rel="noopener noreferrer"
          variant="primary"
          onClick={handlePricingClick}
          // oxlint-disable-next-line design-system/no-restyle, design-system/no-arbitrary-values -- the end card CTA's violet glow, no shadow token or Button variant
          className="h-auto w-full shadow-[0_0_20px_-6px_rgba(124,58,237,0.6)]"
        >
          <span className="flex flex-col items-center">
            <span className="font-medium">
              {t("Make this workflow yours", "将此工作流用于你的任务")}
            </span>
            <span className="text-caption font-normal opacity-80">
              {t(
                "Start with Pro · $42.50/mo · cancel anytime",
                "从 Pro 开始 · $42.50/月 · 随时取消",
              )}
            </span>
          </span>
        </Button>
        <Button
          variant="secondary"
          onClick={handleWatchAnother}
          leftIcon={<Icon icon={PlayIcon} className="size-4" />}
          className="w-full"
        >
          {t("Watch another scenario", "观看其他场景")}
        </Button>
        <a
          href={TOUR_GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleSelfHostClick}
          className="mt-1 text-center text-body text-foreground-tertiary underline underline-offset-2 hover:text-foreground-body"
        >
          {t("or self-host free", "或免费自行部署")}
        </a>
      </div>
    </div>
  );
}
