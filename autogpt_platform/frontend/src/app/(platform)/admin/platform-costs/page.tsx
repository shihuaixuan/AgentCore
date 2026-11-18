import { withRoleAccess } from "@/lib/withRoleAccess";
import { Suspense } from "react";
import { PlatformCostContent } from "./components/PlatformCostContent";
import { getServerTranslation } from "@/lib/i18n/server";

type SearchParams = {
  start?: string;
  end?: string;
  provider?: string;
  user_id?: string;
  model?: string;
  block_name?: string;
  tracking_type?: string;
  graph_exec_id?: string;
  page?: string;
  tab?: string;
};

async function PlatformCostDashboard({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { t } = await getServerTranslation();
  return (
    <div className="mx-auto p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-heading font-bold">{t("Platform Costs", "平台成本")}</h1>
          <p className="text-foreground-tertiary">
            {t("Track real API costs incurred by system credentials across providers", "跟踪系统凭据在各服务提供商处产生的实际 API 成本")}
          </p>
        </div>

        <Suspense
          key={JSON.stringify(searchParams)}
          fallback={
            <div className="py-10 text-center">{t("Loading cost data...", "正在加载成本数据...")}</div>
          }
        >
          <PlatformCostContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

export default async function PlatformCostDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const withAdminAccess = await withRoleAccess(["admin"]);
  const ProtectedDashboard = await withAdminAccess(PlatformCostDashboard);
  return <ProtectedDashboard searchParams={await searchParams} />;
}
