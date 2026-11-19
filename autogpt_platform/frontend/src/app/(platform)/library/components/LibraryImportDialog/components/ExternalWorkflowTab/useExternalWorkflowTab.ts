import { useToast } from "@/components/molecules/Toast/use-toast";
import { uploadFileDirect } from "@/lib/direct-upload";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { fetchWorkflowFromUrl } from "./fetchWorkflowFromUrl";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";
import type { DisplayTranslate } from "@/app/(platform)/library/helpers/translation";

function decodeBase64Json(dataUrl: string): string {
  const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
  if (!match) throw new Error("Could not read the uploaded file.");
  const binary = atob(match[1]);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const json = new TextDecoder().decode(bytes);
  JSON.parse(json); // validate — throws SyntaxError if invalid
  return json;
}

async function uploadJsonAsFile(
  jsonString: string,
  locale: Locale,
): Promise<{ fileId: string; fileName: string; mimeType: string }> {
  const file = new File(
    [new Blob([jsonString], { type: "application/json" })],
    `workflow-${uuidv4({})}.json`,
    { type: "application/json" },
  );
  const uploaded = await uploadFileDirect(file, undefined, locale);
  return {
    fileId: uploaded.file_id,
    fileName: uploaded.name,
    mimeType: uploaded.mime_type,
  };
}

function storeAndRedirect(
  fileInfo: { fileId: string; fileName: string; mimeType: string },
  router: ReturnType<typeof useRouter>,
  t: DisplayTranslate,
) {
  sessionStorage.setItem(
    "importWorkflowPrompt",
    t(
      "Import this workflow and recreate it as an AutoGPT workflow",
      "请导入此工作流，并将其重新创建为 AutoGPT 工作流",
    ),
  );
  sessionStorage.setItem("importWorkflowFile", JSON.stringify(fileInfo));
  router.push("/copilot?source=import&autosubmit=true");
}

export function useExternalWorkflowTab() {
  const { t, locale } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const [fileValue, setFileValue] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [submittingMode, setSubmittingMode] = useState<"url" | "file" | null>(
    null,
  );
  const isSubmitting = submittingMode !== null;

  async function submitWithMode(mode: "url" | "file") {
    setSubmittingMode(mode);
    try {
      const jsonString = await resolveJson(mode);
      if (!jsonString) return;
      storeAndRedirect(await uploadJsonAsFile(jsonString, locale), router, t);
    } catch (err) {
      toast({
        title: t("Upload failed", "上传失败"),
        description:
          err instanceof Error
            ? err.message
            : t("Could not upload the file.", "无法上传文件。"),
        variant: "destructive",
      });
    } finally {
      setSubmittingMode(null);
    }
  }

  async function resolveJson(mode: "url" | "file"): Promise<string | null> {
    if (mode === "url") {
      const result = await fetchWorkflowFromUrl(urlValue, locale);
      if (!result.ok) {
        toast({
          title: t("Could not fetch workflow", "无法获取工作流"),
          description: result.error,
          variant: "destructive",
        });
        return null;
      }
      setUrlValue("");
      return result.json;
    }

    try {
      const json = decodeBase64Json(fileValue);
      setFileValue("");
      return json;
    } catch (err) {
      const isParseError = err instanceof SyntaxError;
      toast({
        title: isParseError
          ? t("Invalid JSON", "无效的 JSON")
          : t("Invalid file", "无效的文件"),
        description: isParseError
          ? t(
              "The uploaded file is not valid JSON.",
              "上传的文件不是有效的 JSON。",
            )
          : t("Could not read the uploaded file.", "无法读取上传的文件。"),
        variant: "destructive",
      });
      return null;
    }
  }

  return {
    submitWithMode,
    fileValue,
    setFileValue,
    urlValue,
    setUrlValue,
    isSubmitting,
    submittingMode,
  };
}
