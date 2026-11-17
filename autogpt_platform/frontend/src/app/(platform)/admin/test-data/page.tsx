import { notFound } from "next/navigation";
import { withRoleAccess } from "@/lib/withRoleAccess";
import { GenerateTestDataButton } from "./components/GenerateTestDataButton";
import { Text } from "@/components/atoms/Text/Text";
import { isTestDataSurfaceEnabled } from "./helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

function TestDataDashboard() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <Text variant="h2" as="h1">
              {t("Test Data Generation", "测试数据生成")}
            </Text>
            <Text variant="body" tone="muted">
              {t("Generate sample data for testing and development", "生成用于测试和开发的示例数据")}
            </Text>
          </div>
        </div>

        <div className="rounded-lg border bg-surface p-6 shadow-sm">
          <Text variant="h4" as="h2" className="mb-4">
            {t("Generate Test Data", "生成测试数据")}
          </Text>
          <Text variant="body" className="mb-6" tone="secondary">
            {t("Use this tool to populate the database with sample test data. This is useful for development and testing purposes.", "使用此工具向数据库填充示例测试数据，便于开发和测试。")}
          </Text>

          <div className="mb-6">
            <Text variant="body-medium" className="mb-2">
              {t("Available Script Types:", "可用脚本类型：")}
            </Text>
            <ul className="list-inside list-disc space-y-2 text-foreground-secondary">
              <li>
                <Text variant="body" as="span">
                  <Text variant="body-medium" as="span">
                    {t("E2E Test Data:", "E2E 测试数据：")}
                  </Text>{" "}
                    {t("Creates up to 15 test users with graphs, library agents, presets, store submissions, and API 密钥。 Uses API functions for better compatibility.", "创建最多 15 个测试用户及其工作流、库中工作流、预设、市场提交和 API 密钥。使用 API 函数以获得更好的兼容性。")}
                </Text>
              </li>
              <li>
                <Text variant="body" as="span">
                  <Text variant="body-medium" as="span">
                    {t("Full Test Data:", "完整测试数据：")}
                  </Text>{" "}
                    {t("Creates 100+ users with comprehensive test data including agent blocks, nodes, executions, analytics, and more. Takes longer to complete.", "创建 100 多个用户及完整测试数据，包括模块、节点、执行记录、分析数据等，耗时较长。")}
                </Text>
              </li>
            </ul>
          </div>

          <GenerateTestDataButton />
        </div>

        <div className="rounded-lg border bg-surface-muted p-6">
          <Text variant="body-medium" className="mb-2" tone="body">
            {t("What data is created?", "会创建哪些数据？")}
          </Text>
          <div className="grid gap-4 text-body text-foreground-secondary md:grid-cols-2">
            <div>
              <Text variant="body-medium">{t("E2E Script:", "E2E 脚本：")}</Text>
              <ul className="mt-1 list-inside list-disc">
                <li>
                  <Text variant="small" as="span">
                    {t("Up to 15 test users", "最多 15 个测试用户")}
                  </Text>
                </li>
                <li>
                  <Text variant="small" as="span">
                    {t("15 graphs per user", "每个用户 15 个工作流")}
                  </Text>
                </li>
                <li>
                  <Text variant="small" as="span">
                    {t("Library agents", "库中工作流")}
                  </Text>
                </li>
                <li>
                  <Text variant="small" as="span">
                    {t("Agent presets", "工作流预设")}
                  </Text>
                </li>
                <li>
                  <Text variant="small" as="span">
                    {t("Store submissions", "市场提交")}
                  </Text>
                </li>
                <li>
                  <Text variant="small" as="span">
                    API keys
                  </Text>
                </li>
                <li>
                  <Text variant="small" as="span">
                    {t("Creator profiles", "创建者资料")}
                  </Text>
                </li>
              </ul>
            </div>
            <div>
              <Text variant="body-medium">{t("Full Script:", "完整脚本：")}</Text>
              <ul className="mt-1 list-inside list-disc">
                <li>
                  <Text variant="small" as="span">
                    {t("100 users", "100 个用户")}
                  </Text>
                </li>
                <li>
                  <Text variant="small" as="span">
                    {t("100 agent blocks", "100 个工作流模块")}
                  </Text>
                </li>
                <li>
                  <Text variant="small" as="span">
                    {t("Multiple graphs per user", "每个用户多个工作流")}
                  </Text>
                </li>
                <li>
                  <Text variant="small" as="span">
                    {t("Agent nodes and links", "工作流节点和连接")}
                  </Text>
                </li>
                <li>
                  <Text variant="small" as="span">
                    {t("Graph executions", "工作流执行记录")}
                  </Text>
                </li>
                <li>
                  <Text variant="small" as="span">
                    {t("Store listings and reviews", "市场列表和评价")}
                  </Text>
                </li>
                <li>
                  <Text variant="small" as="span">
                    {t("Analytics data", "分析数据")}
                  </Text>
                </li>
                <li>
                  <Text variant="small" as="span">
                    {t("Credit transactions", "积分交易记录")}
                  </Text>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function TestDataDashboardPage() {
  // The backend route only exists on local stacks, so the page 404s elsewhere
  // instead of rendering a button that can only ever return 403/404.
  if (!isTestDataSurfaceEnabled()) notFound();
  const withAdminAccess = await withRoleAccess(["admin"]);
  const ProtectedTestDataDashboard = await withAdminAccess(TestDataDashboard);
  return <ProtectedTestDataDashboard />;
}
