"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { Select, SelectOption } from "@/components/atoms/Select/Select";
import { Text } from "@/components/atoms/Text/Text";
import { Alert } from "@/components/molecules/Alert/Alert";
import type { TestDataScriptType } from "@/app/api/__generated__/models/testDataScriptType";
import { useGenerateTestDataButton } from "./useGenerateTestDataButton";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

const scriptTypeOptions: SelectOption[] = [
  {
    value: "e2e",
    label:
      "E2E Test Data - up to 15 users with graphs, agents, and store submissions",
  },
  {
    value: "full",
    label: "Full Test Data - 100+ users with comprehensive data (takes longer)",
  },
];

export function GenerateTestDataButton() {
  const { t } = useTranslation();
  const {
    isDialogOpen,
    scriptType,
    setScriptType,
    result,
    isPending,
    openDialog,
    closeDialog,
    generate,
  } = useGenerateTestDataButton();

  return (
    <>
      <Button size="large" variant="primary" onClick={openDialog}>
        {t("Generate Test Data", "生成测试数据")}
      </Button>

      <Dialog
        title={t("Generate Test Data", "生成测试数据")}
        controlled={{
          isOpen: isDialogOpen,
          set: (open) => {
            if (!open) closeDialog();
          },
        }}
        styling={{ maxWidth: "32rem" }}
      >
        <Dialog.Content>
          <Text variant="body" className="mb-4" tone="secondary">
            {t("This will populate the database with sample test data including users, agents, graphs, store listings, and more.", "这会向数据库填充示例测试数据，包括用户、工作流、市场列表等。")}
          </Text>

          <div className="grid gap-4 py-4">
            <Select
              label={t("Script Type", "脚本类型")}
              id="scriptType"
              value={scriptType}
              onValueChange={(value) =>
                setScriptType(value as TestDataScriptType)
              }
              disabled={isPending}
              options={scriptTypeOptions}
            />

            <Alert variant="warning">
              <Text variant="small" as="span">
                <Text variant="small-medium" as="span">
                  {t("Warning:", "警告：")}
                </Text>{" "}
                {t("This will add significant data to your database. This endpoint is only available in local environments.", "这会向数据库添加大量数据，此接口仅在本地环境可用。")}
              </Text>
            </Alert>

            {result && (
              <Alert
                role="status"
                variant={result.success ? "default" : "error"}
              >
                <Text variant="small-medium">{result.message}</Text>
                {result.details && (
                  <ul className="mt-2 list-inside list-disc">
                    {Object.entries(result.details).map(([key, value]) => (
                      <li key={key}>
                        <Text variant="small" as="span">
                          {key.replace(/_/g, " ")}: {String(value)}
                        </Text>
                      </li>
                    ))}
                  </ul>
                )}
              </Alert>
            )}
          </div>

          <Dialog.Footer>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={isPending}
            >
              {t("Cancel", "取消")}
            </Button>
            <Button
              variant="primary"
              onClick={generate}
              disabled={isPending}
              loading={isPending}
            >
              {isPending ? t("Generating...", "正在生成...") : t("Generate Test Data", "生成测试数据")}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </>
  );
}
