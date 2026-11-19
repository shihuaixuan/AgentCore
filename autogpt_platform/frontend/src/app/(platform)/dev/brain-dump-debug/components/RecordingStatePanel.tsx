import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import {
  ArrowReloadHorizontalIcon,
  DatabaseIcon,
} from "@hugeicons/core-free-icons";
import {
  formatBytes,
  formatClock,
  formatSeconds,
  formatValue,
  type RecordingSnapshot,
} from "../helpers";
import { DebugField, DebugNote, DebugPanel } from "./DebugPanel";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  snapshot: RecordingSnapshot;
  onRefresh: () => void;
}

export function RecordingStatePanel({ snapshot, onRefresh }: Props) {
  const { t } = useTranslation();
  const { meta, parts } = snapshot;

  return (
    <DebugPanel
      title={t("IndexedDB recording state", "IndexedDB 录音状态")}
      description={t(
        "Read live from the autogpt-onboarding-brain-dump database every second.",
        "每秒从 autogpt-onboarding-brain-dump 数据库实时读取。",
      )}
      icon={DatabaseIcon}
      action={
        <Button
          variant="outline"
          size="small"
          onClick={onRefresh}
          leftIcon={<Icon icon={ArrowReloadHorizontalIcon} size={16} />}
        >
          {t("Refresh", "刷新")}
        </Button>
      }
    >
      {!snapshot.supported ? (
        <DebugNote>
          {t(
            "IndexedDB is not available in this browser.",
            "此浏览器不支持 IndexedDB。",
          )}
        </DebugNote>
      ) : null}
      {snapshot.error ? (
        <DebugNote>
          {t("Read failed:", "读取失败：")} {snapshot.error}
        </DebugNote>
      ) : null}

      {meta ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DebugField label="recordingId" value={meta.recordingId} />
          <DebugField label="mimeType" value={meta.mimeType} />
          <DebugField label="startedAt" value={formatClock(meta.startedAt)} />
          <DebugField
            label="durationSecs"
            value={formatSeconds(meta.durationSecs)}
          />
          <DebugField label="finalized" value={formatValue(meta.finalized)} />
          <DebugField
            label={t("parts read at", "分片读取时间")}
            value={formatClock(snapshot.readAt)}
          />
        </div>
      ) : (
        <DebugNote>
          {t(
            "No meta row stored — nothing has been recorded in this browser, or the dump completed and the store was cleared.",
            "未存储元数据记录：此浏览器尚未录音，或梳理已完成且存储已清空。",
          )}
        </DebugNote>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Badge variant="info">
          {t(`${parts.length} parts`, `${parts.length} 个分片`)}
        </Badge>
        <Badge variant="info">
          {t(
            `${formatBytes(snapshot.totalBytes)} total`,
            `总计 ${formatBytes(snapshot.totalBytes)}`,
          )}
        </Badge>
      </div>

      {parts.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-large border border-border-base">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-muted">
              <tr>
                {["partIndex", "bytes", "savedAt", "uploaded"].map((column) => (
                  <th key={column} className="px-4 py-2">
                    <Text variant="label" tone="muted">
                      {column}
                    </Text>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parts.map((part) => (
                <tr key={part.partIndex} className="border-t border-separator">
                  <td className="px-4 py-2 font-mono text-body">
                    {part.partIndex}
                  </td>
                  <td className="px-4 py-2 font-mono text-body">
                    {formatBytes(part.bytes)}
                  </td>
                  <td className="px-4 py-2 font-mono text-body">
                    {formatClock(part.savedAt)}
                  </td>
                  <td className="px-4 py-2 font-mono text-body">
                    {formatValue(part.uploaded)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </DebugPanel>
  );
}
