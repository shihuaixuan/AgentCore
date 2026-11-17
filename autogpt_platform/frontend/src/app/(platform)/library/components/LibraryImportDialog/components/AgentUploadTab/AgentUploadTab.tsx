"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { Button } from "@/components/atoms/Button/Button";
import { FileInput } from "@/components/atoms/FileInput/FileInput";
import { Input } from "@/components/atoms/Input/Input";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner/LoadingSpinner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/molecules/Form/Form";
import { TabsLineContent } from "@/components/molecules/TabsLine/TabsLine";
import { useLibraryUploadAgentDialog } from "../../../LibraryUploadAgentDialog/useLibraryUploadAgentDialog";

type AgentUploadTabProps = {
  upload: ReturnType<typeof useLibraryUploadAgentDialog>;
};

export default function AgentUploadTab({ upload }: AgentUploadTabProps) {
  const { t } = useTranslation();
  return (
    <TabsLineContent value="agent">
      <Text variant="body-tight" tone="muted" className="mb-4">
        {t(
          "Upload a previously exported AutoGPT workflow file (.json).",
          "上传之前导出的 AutoGPT 工作流文件（.json）。",
        )}
      </Text>
      <Form
        form={upload.form}
        onSubmit={upload.onSubmit}
        className="mx-1 flex flex-col justify-center"
      >
        <FormField
          control={upload.form.control}
          name="agentName"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  id={field.name}
                  label={t("Workflow name", "工作流名称")}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={upload.form.control}
          name="agentDescription"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  id={field.name}
                  label={t("Workflow description", "工作流说明")}
                  type="textarea"
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={upload.form.control}
          name="agentFile"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FileInput
                  mode="base64"
                  value={field.value}
                  onChange={field.onChange}
                  accept=".json,application/json"
                  placeholder={t("Workflow file", "工作流文件")}
                  maxFileSize={10 * 1024 * 1024}
                  showStorageNote={false}
                  className="mt-4 mb-8"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={!upload.agentObject || upload.isUploading}
        >
          {upload.isUploading ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="small" />
              <span>{t("Uploading...", "正在上传…")}</span>
            </div>
          ) : (
            "Upload"
          )}
        </Button>
      </Form>
    </TabsLineContent>
  );
}
