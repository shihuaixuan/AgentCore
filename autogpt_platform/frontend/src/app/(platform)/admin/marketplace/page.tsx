import { withRoleAccess } from "@/lib/withRoleAccess";
import { Suspense } from "react";
import type { SubmissionStatus } from "@/app/api/__generated__/models/submissionStatus";
import { AdminAgentsDataTable } from "./components/AdminAgentsDataTable";
import { AdminSkillSubmissions } from "./components/AdminSkillSubmissions";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

type MarketplaceAdminPageSearchParams = {
  page?: string;
  status?: SubmissionStatus;
  search?: string;
};

async function AdminMarketplaceDashboard({
  searchParams,
}: {
  searchParams: MarketplaceAdminPageSearchParams;
}) {
  const { t } = useTranslation();
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1;
  const status = searchParams.status;
  const search = searchParams.search;

  return (
    <div className="mx-auto p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-heading font-bold">{t("Marketplace Management", "市场管理")}</h1>
            <p className="text-foreground-tertiary">
              {t("Unified view for marketplace management and approval history", "市场管理与审核历史的统一视图")}
            </p>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="py-10 text-center">{t("Loading submissions...", "正在加载提交内容...")}</div>
          }
        >
          <AdminAgentsDataTable
            initialPage={page}
            initialStatus={status}
            initialSearch={search}
          />
        </Suspense>

        <div className="mt-6 flex flex-col gap-3">
          <h2 className="text-lead font-semibold">{t("Skill submissions", "技能提交")}</h2>
          <AdminSkillSubmissions />
        </div>
      </div>
    </div>
  );
}

export default async function AdminMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<MarketplaceAdminPageSearchParams>;
}) {
  "use server";
  const withAdminAccess = await withRoleAccess(["admin"]);
  const ProtectedAdminMarketplace = await withAdminAccess(
    AdminMarketplaceDashboard,
  );
  return <ProtectedAdminMarketplace searchParams={await searchParams} />;
}
