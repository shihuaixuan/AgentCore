import { withRoleAccess } from "@/lib/withRoleAccess";
import { BlockCostEstimatesContent } from "./components/BlockCostEstimatesContent";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

function BlockCostEstimatesDashboard() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-heading font-bold">{t("Block Cost Estimates", "模块成本估算")}</h1>
          <p className="text-foreground-tertiary">
            {t("Aggregate per-block average credits-per-execution from historical CreditTransaction USAGE rows. Use this to seed", "根据历史 CreditTransaction USAGE 记录汇总每个模块的平均执行额度。可用此数据填充")}{" "}
            <code className="mx-1 text-caption">
              block_preflight_estimates.json
            </code>
            {t("so dynamic-cost blocks charge a sensible amount up front and post-flight reconciliation only settles a small delta.", "，让动态成本模块预先收取合理额度，并在执行后仅结算少量差额。")}
          </p>
        </div>
        <BlockCostEstimatesContent />
      </div>
    </div>
  );
}

export default async function BlockCostEstimatesDashboardPage() {
  const withAdminAccess = await withRoleAccess(["admin"]);
  const ProtectedDashboard = await withAdminAccess(BlockCostEstimatesDashboard);
  return <ProtectedDashboard />;
}
