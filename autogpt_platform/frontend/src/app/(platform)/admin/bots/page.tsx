import { withRoleAccess } from "@/lib/withRoleAccess";

import { BotsContent } from "./components/BotsContent";
import { getServerTranslation } from "@/lib/i18n/server";

async function BotsDashboard() {
  const { t } = await getServerTranslation();
  return (
    <div className="mx-auto p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-heading font-bold">{t("Bot Analytics", "机器人分析")}</h1>
          <p className="text-foreground-tertiary">
            Usage, reach and reliability across every live expert bot. No
            {t("Usage, reach and reliability across every live expert bot. No message content or user identity is collected — only aggregate counts and metrics.", "统计所有在线专家机器人的使用量、覆盖范围和可靠性。不收集消息内容或用户身份，只统计汇总数量和指标。")}
          </p>
        </div>

        <BotsContent />
      </div>
    </div>
  );
}

export default async function BotsPage() {
  const withAdminAccess = await withRoleAccess(["admin"]);
  const ProtectedDashboard = await withAdminAccess(BotsDashboard);
  return <ProtectedDashboard />;
}
