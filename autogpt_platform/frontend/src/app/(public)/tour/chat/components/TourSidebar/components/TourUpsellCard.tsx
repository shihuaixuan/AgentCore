"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { environment } from "@/services/environment";
import {
  ArrowRight02Icon,
  GithubIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { TOUR_GITHUB_URL } from "../../../constants";
import { trackTourCtaClick } from "../../../tracking";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

type Props = {
  surface: "tour" | "marketplace";
};

export function TourUpsellCard({ surface }: Props) {
  const { t } = useTranslation();
  const isCloud = environment.isCloud();

  function handleSignupClick() {
    trackTourCtaClick(isCloud ? "free-trial" : "signup", {
      placement: "sidebar-card",
      surface,
    });
  }

  function handleSelfHostClick() {
    trackTourCtaClick("self-host", { placement: "sidebar-card", surface });
  }

  return (
    <div className="flex flex-col gap-4 rounded-large border border-border-base bg-surface p-4 shadow-subtle">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-medium bg-accent-surface text-accent-strong">
          <Icon icon={SparklesIcon} size={18} aria-hidden />
        </span>
        <Text variant="eyebrow" tone="secondary">
          {isCloud ? t("Free trial", "免费试用") : t("Get started", "开始使用")}
        </Text>
      </div>
      <div className="space-y-1.5">
        <Text variant="h5" as="h2" tone="primary">
          {t("Your AI team starts here", "从这里组建你的 AI 团队")}
        </Text>
        <Text variant="body" tone="secondary">
          {t(
            "Build workflows and put AI experts to work on your everyday tasks.",
            "创建工作流，让 AI 专家帮你处理日常任务。",
          )}
        </Text>
      </div>
      <div className="flex flex-col gap-1">
        <Button
          as="NextLink"
          href="/signup"
          variant="primary"
          size="small"
          onClick={handleSignupClick}
          rightIcon={<Icon icon={ArrowRight02Icon} size={16} aria-hidden />}
          className="w-full"
        >
          {isCloud
            ? t("Start free trial", "开始免费试用")
            : t("Create account", "创建账户")}
        </Button>
        <Button
          as="NextLink"
          href={TOUR_GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          size="small"
          onClick={handleSelfHostClick}
          leftIcon={<Icon icon={GithubIcon} size={14} aria-hidden />}
          tone="secondary"
          // oxlint-disable-next-line design-system/no-restyle -- quiet 12px link; no Button size has caption text at this height
          className="w-full text-caption"
        >
          {t("Self-host instead", "自行部署")}
        </Button>
      </div>
    </div>
  );
}
