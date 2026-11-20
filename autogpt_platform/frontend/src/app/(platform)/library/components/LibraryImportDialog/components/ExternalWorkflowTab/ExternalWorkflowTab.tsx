"use client";
import { AUTOPILOT_NAME } from "@/lib/branding";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { FileInput } from "@/components/atoms/FileInput/FileInput";
import { Input } from "@/components/atoms/Input/Input";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner/LoadingSpinner";
import { TabsLineContent } from "@/components/molecules/TabsLine/TabsLine";
import { useExternalWorkflowTab } from "./useExternalWorkflowTab";

const N8N_EXAMPLES = [
  { label: "Build Your First AI Agent", url: "https://n8n.io/workflows/6270" },
  { label: "Interactive AI Chat Agent", url: "https://n8n.io/workflows/5819" },
];

type ExternalWorkflowTabProps = {
  importWorkflow: ReturnType<typeof useExternalWorkflowTab>;
};

export default function ExternalWorkflowTab({
  importWorkflow,
}: ExternalWorkflowTabProps) {
  const { t } = useTranslation();
  return (
    <TabsLineContent value="platform">
      <p className="mb-4 text-body text-foreground-tertiary">
        {t(
          `Upload a workflow exported from n8n, Make.com, Zapier, or any other platform. ${AUTOPILOT_NAME} will convert it into an AutoGPT workflow for you.`,
          `上传从 n8n、Make.com、Zapier 或其他平台导出的工作流，${AUTOPILOT_NAME} 会将其转换为 AutoGPT 工作流。`,
        )}
      </p>
      <FileInput
        mode="base64"
        value={importWorkflow.fileValue}
        onChange={importWorkflow.setFileValue}
        accept=".json,application/json"
        placeholder={t(
          "Workflow file (n8n, Make.com, Zapier, ...)",
          "工作流文件（n8n、Make.com、Zapier 等）",
        )}
        maxFileSize={10 * 1024 * 1024}
        showStorageNote={false}
        className="mt-2 mb-4"
      />
      <Button
        type="button"
        variant="primary"
        className="w-full"
        disabled={!importWorkflow.fileValue || importWorkflow.isSubmitting}
        onClick={() => importWorkflow.submitWithMode("file")}
      >
        {importWorkflow.submittingMode === "file" ? (
          <div className="flex items-center gap-2">
            <LoadingSpinner size="small" />
            <span>{t("Importing...", "正在导入…")}</span>
          </div>
        ) : (
          t(`Import to ${AUTOPILOT_NAME}`, `导入至 ${AUTOPILOT_NAME}`)
        )}
      </Button>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-surface-active" />
        <span className="text-caption text-foreground-subtle">
          {t("or import from URL", "或通过链接导入")}
        </span>
        <div className="h-px flex-1 bg-surface-active" />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {N8N_EXAMPLES.map((p) => (
          <button
            key={p.label}
            type="button"
            disabled={importWorkflow.isSubmitting}
            onClick={() => importWorkflow.setUrlValue(p.url)}
            className="rounded-full border border-border-base px-3 py-1 text-caption text-foreground-secondary hover:border-brand hover:text-brand-hover disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>
      <Input
        id="template-url"
        value={importWorkflow.urlValue}
        onChange={(e) => importWorkflow.setUrlValue(e.target.value)}
        label={t("Workflow URL", "工作流链接")}
        placeholder="https://n8n.io/workflows/1234"
        className="mb-4 w-full"
      />
      <Button
        type="button"
        variant="primary"
        className="w-full"
        disabled={!importWorkflow.urlValue || importWorkflow.isSubmitting}
        onClick={() => importWorkflow.submitWithMode("url")}
      >
        {importWorkflow.submittingMode === "url" ? (
          <div className="flex items-center gap-2">
            <LoadingSpinner size="small" />
            <span>{t("Importing...", "正在导入…")}</span>
          </div>
        ) : (
          t("Import from URL", "通过链接导入")
        )}
      </Button>
    </TabsLineContent>
  );
}
