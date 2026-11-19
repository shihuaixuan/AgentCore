import type { DumpStatusResponse } from "@/app/api/__generated__/models/dumpStatusResponse";
import type { FinalizeResponse } from "@/app/api/__generated__/models/finalizeResponse";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Link } from "@/components/atoms/Link/Link";
import { AudioWaveformIcon, Download01Icon } from "@hugeicons/core-free-icons";
import {
  formatMs,
  formatValue,
  recordingDownloadHref,
  STATUS_POLL_MS,
} from "../helpers";
import { DebugField, DebugNote, DebugPanel } from "./DebugPanel";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  dump: DumpStatusResponse | null;
  isLoading: boolean;
  isError: boolean;
  finalizeResponse: FinalizeResponse | null;
  finalizeRoundTripMs: number | null;
  finalizeError: string | null;
  canFinalize: boolean;
  isFinalizing: boolean;
  onFinalize: () => void;
}

export function ServerStatusPanel({
  dump,
  isLoading,
  isError,
  finalizeResponse,
  finalizeRoundTripMs,
  finalizeError,
  canFinalize,
  isFinalizing,
  onFinalize,
}: Props) {
  const { t } = useTranslation();
  return (
    <DebugPanel
      title={t("Server status", "服务端状态")}
      description={t(
        `GET /onboarding/brain-dump/status, polled every ${STATUS_POLL_MS}ms.`,
        `GET /onboarding/brain-dump/status，每 ${STATUS_POLL_MS}ms 轮询一次。`,
      )}
      icon={AudioWaveformIcon}
      action={
        dump?.has_audio ? (
          <Link href={recordingDownloadHref()} isExternal variant="secondary">
            <span className="inline-flex items-center gap-2">
              <Icon icon={Download01Icon} size={16} />
              {t("Download server-side recording", "下载服务端录音")}
            </span>
          </Link>
        ) : null
      }
    >
      {isError ? (
        <DebugNote>
          {t(
            "Status request failed — check that you are signed in and the backend is available.",
            "状态请求失败：请检查是否已登录，以及后端是否可用。",
          )}
        </DebugNote>
      ) : null}
      {isLoading && !dump ? (
        <DebugNote>{t("Loading status…", "正在加载状态…")}</DebugNote>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DebugField label="status" value={formatValue(dump?.status)} />
        <DebugField label="input_mode" value={formatValue(dump?.input_mode)} />
        <DebugField label="error_code" value={formatValue(dump?.error_code)} />
        <DebugField label="has_audio" value={formatValue(dump?.has_audio)} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge variant="info">
            {t("last finalize response", "最近一次 finalize 响应")}
          </Badge>
          {finalizeRoundTripMs !== null ? (
            <Badge variant="info">
              {t("round-trip", "往返耗时")} {formatMs(finalizeRoundTripMs)}
            </Badge>
          ) : null}
        </div>
        <Button
          variant="outline"
          size="small"
          onClick={onFinalize}
          disabled={!canFinalize}
          loading={isFinalizing}
        >
          {t(
            "Run finalize on the stored recording",
            "对已存储录音执行 finalize",
          )}
        </Button>
      </div>

      {finalizeError ? (
        <div className="mt-4">
          <DebugNote>
            {t("Finalize failed:", "Finalize 失败：")} {finalizeError}
          </DebugNote>
        </div>
      ) : null}

      {finalizeResponse ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <DebugField
            label="status"
            value={formatValue(finalizeResponse.status)}
          />
          <DebugField
            label="input_mode"
            value={formatValue(finalizeResponse.input_mode)}
          />
          <DebugField
            label="error_code"
            value={formatValue(finalizeResponse.error_code)}
          />
        </div>
      ) : (
        <div className="mt-4">
          <DebugNote>
            {t(
              "No finalize response captured. Nothing persists the response from the real onboarding run, so this page can only show one it issued itself. Finalize is idempotent per recording_id and consumes the server-side part buffer.",
              "尚未捕获 finalize 响应。真实入门流程的响应不会持久化，因此本页只能显示由本页发起的响应。Finalize 对每个 recording_id 是幂等的，且会消耗服务端分片缓冲区。",
            )}
          </DebugNote>
        </div>
      )}
    </DebugPanel>
  );
}
