import { withRoleAccess } from "@/lib/withRoleAccess";
import { Suspense } from "react";
import { ExecutionAnalyticsForm } from "./components/ExecutionAnalyticsForm";
import { getServerTranslation } from "@/lib/i18n/server";

async function ExecutionAnalyticsDashboard() {
  const { t } = await getServerTranslation();
  return (
    <div className="mx-auto p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-heading font-bold">{t("Execution Analytics", "执行分析")}</h1>
            <p className="text-foreground-tertiary">
              {t("Generate missing activity summaries and success scores for agent executions", "为工作流执行生成缺失的活动摘要和成功评分")}
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-lead font-semibold">
            {t("Execution Analytics & Accuracy Monitoring", "执行分析与准确性监控")}
          </h2>
          <p className="mb-6 text-foreground-secondary">
            {t("Generate missing activity summaries and success scores for agent executions. After generation, accuracy trends and alerts will automatically be displayed to help monitor agent health over time.", "生成缺失的活动摘要和成功评分。生成后将自动显示准确性趋势和告警，帮助持续监控工作流健康状态。")}
          </p>

          <Suspense
            fallback={<div className="py-10 text-center">{t("Loading...", "正在加载...")}</div>}
          >
            <ExecutionAnalyticsForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default async function ExecutionAnalyticsPage() {
  "use server";
  const withAdminAccess = await withRoleAccess(["admin"]);
  const ProtectedExecutionAnalyticsDashboard = await withAdminAccess(
    ExecutionAnalyticsDashboard,
  );
  return <ProtectedExecutionAnalyticsDashboard />;
}
