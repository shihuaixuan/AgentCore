"use client";

import { AUTOPILOT_NAME } from "@/lib/branding";
import { AuthMarketingPanel } from "@/components/auth/AuthSplitLayout/AuthMarketingPanel";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  BrainIcon,
  SecurityCheckIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export function SignupMarketingPanel() {
  const { t } = useTranslation();
  return (
    <AuthMarketingPanel
      headingLines={[
        t("Your ambition", "你的抱负"),
        <span key="line-2">
          {t("deserves ", "值得拥有")}
          <span className="text-brand">{t("a team.", "一支团队。")}</span>
        </span>,
      ]}
      description={t(
        `Hire AI experts who research, write, sell and take work off your plate. ${AUTOPILOT_NAME}, your Head of AI, hands out the jobs and reports back to you.`,
        `聘用 AI 专家，帮你调研、写作、销售并分担工作。${AUTOPILOT_NAME} 是你的 AI 负责人，负责分配任务并向你汇报。`,
      )}
      footerText={t(
        "Connects with the tools you already use",
        "连接你已经在用的工具",
      )}
      items={[
        {
          icon: <Icon icon={UserGroupIcon} size={20} />,
          title: t("A specialist for every job", "每项工作都有专属专家"),
          description: t(
            "Experts for research, content, sales and more, ready to work in minutes.",
            "调研、内容、销售等领域的专家，几分钟内即可开始工作。",
          ),
        },
        {
          icon: <Icon icon={BrainIcon} size={20} />,
          title: t("They learn your way", "他们会学习你的方式"),
          description: t(
            "Show them how you like things done once. They remember.",
            "只需告诉他们一次你的做事方式，他们就会记住。",
          ),
        },
        {
          icon: <Icon icon={SecurityCheckIcon} size={20} />,
          title: t("You stay in charge", "你始终掌握决定权"),
          description: t(
            "You decide when they check with you first, and their work stays yours.",
            "由你决定哪些事情需要事先确认，所有工作成果都属于你。",
          ),
        },
      ]}
    />
  );
}
