import type { CreditTransactionType } from "@/lib/autogpt-server-api";
import { withRoleAccess } from "@/lib/withRoleAccess";
import { Suspense } from "react";
import { AdminUserGrantHistory } from "./components/AdminUserGrantHistory";
import { ExportCopilotUsageButton } from "./components/ExportCopilotUsageButton";
import { ExportCreditTransactionsButton } from "./components/ExportCreditTransactionsButton";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

type SpendingDashboardPageSearchParams = {
  page?: string;
  status?: string;
  search?: string;
};

function SpendingDashboard({
  searchParams,
}: {
  searchParams: SpendingDashboardPageSearchParams;
}) {
  const { t } = useTranslation();
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1;
  const search = searchParams.search;
  const status = searchParams.status as CreditTransactionType | undefined;

  return (
    <div className="mx-auto p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-heading font-bold">{t("User Spending", "用户消费")}</h1>
            <p className="text-foreground-tertiary">
              {t("Manage user spending balances", "管理用户消费余额")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportCreditTransactionsButton />
            <ExportCopilotUsageButton />
          </div>
        </div>

        <Suspense
          key={`${page}-${status}-${search}`}
          fallback={
            <div className="py-10 text-center">{t("Loading submissions...", "正在加载提交内容...")}</div>
          }
        >
          <AdminUserGrantHistory
            initialPage={page}
            initialStatus={status}
            initialSearch={search}
          />
        </Suspense>
      </div>
    </div>
  );
}

export default async function SpendingDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SpendingDashboardPageSearchParams>;
}) {
  "use server";
  const withAdminAccess = await withRoleAccess(["admin"]);
  const ProtectedSpendingDashboard = await withAdminAccess(SpendingDashboard);
  return <ProtectedSpendingDashboard searchParams={await searchParams} />;
}
