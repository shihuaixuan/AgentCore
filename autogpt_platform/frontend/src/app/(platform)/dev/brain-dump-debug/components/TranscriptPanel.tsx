import type { FinalizeResponse } from "@/app/api/__generated__/models/finalizeResponse";
import { Text } from "@/components/atoms/Text/Text";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/molecules/Alert/Alert";
import { File02Icon } from "@hugeicons/core-free-icons";
import { TRANSCRIPT_PREVIEW_CHARS } from "../helpers";
import { DebugNote, DebugPanel } from "./DebugPanel";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  finalizeResponse: FinalizeResponse | null;
}

export function TranscriptPanel({ finalizeResponse }: Props) {
  const { t } = useTranslation();
  const preview = finalizeResponse?.transcript_preview ?? null;

  return (
    <DebugPanel
      title={t("Transcript & extraction JSON", "转录与提取 JSON")}
      description={t(
        "What the pipeline produced from the dump.",
        "流水线从语音梳理中生成的内容。",
      )}
      icon={File02Icon}
    >
      <Alert variant="warning">
        <AlertTitle>
          {t("Not exposed by any current endpoint", "现有接口尚未提供这些数据")}
        </AlertTitle>
        <AlertDescription>
          <Text variant="small" tone="body" className="mb-2">
            {t(
              "The full transcript and the extracted CoPilotUnderstanding.data are written server-side and never returned to the browser. Verified against the whole generated client: the brain-dump tag has only parts, finalize, status, recording and discard;",
              "完整转录和提取出的 CoPilotUnderstanding.data 仅写入服务端，不会返回浏览器。已核对全部生成客户端：brain-dump 标签下仅有 parts、finalize、status、recording 和 discard；",
            )}{" "}
            <span className="font-mono">GET /onboarding/brain-dump/status</span>{" "}
            {t(
              "returns status, input_mode, error_code and has_audio only, and UnderstandingUpdatedResponse is a copilot tool-result shape, not a readable endpoint.",
              "仅返回 status、input_mode、error_code 和 has_audio；UnderstandingUpdatedResponse 是 copilot 工具结果结构，并非可读取的接口。",
            )}
          </Text>
          <Text variant="small" tone="body">
            {t(
              "Showing them here would need a new backend route — e.g.",
              "要在此显示这些数据，需要新增后端路由，例如",
            )}{" "}
            <span className="font-mono">
              GET /onboarding/brain-dump/transcript
            </span>{" "}
            {t(
              "returning BrainDump.transcript plus transcriptLang, and a read endpoint for the user's CoPilotUnderstanding row. Neither was added.",
              "返回 BrainDump.transcript 和 transcriptLang，并提供读取用户 CoPilotUnderstanding 记录的接口。这两者均未添加。",
            )}
          </Text>
        </AlertDescription>
      </Alert>

      <div className="mt-6">
        <Text variant="label" tone="muted">
          {t(
            "transcript_preview (from finalize)",
            "transcript_preview（来自 finalize）",
          )}
        </Text>
        {preview ? (
          <pre className="mt-2 rounded-large bg-surface-muted p-4 font-mono text-body whitespace-pre-wrap text-foreground-emphasis">
            {preview}
          </pre>
        ) : (
          <div className="mt-2">
            <DebugNote>
              {t(
                `None captured. Run finalize from the server-status panel above to capture one — the server truncates it to ${TRANSCRIPT_PREVIEW_CHARS} characters, so even this is not the full transcript.`,
                `尚未捕获。请在上方服务端状态面板执行 finalize；服务端会将其截断至 ${TRANSCRIPT_PREVIEW_CHARS} 个字符，因此这仍不是完整转录。`,
              )}
            </DebugNote>
          </div>
        )}
      </div>
    </DebugPanel>
  );
}
