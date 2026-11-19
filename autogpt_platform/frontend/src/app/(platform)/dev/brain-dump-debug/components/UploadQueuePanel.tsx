import { Badge } from "@/components/atoms/Badge/Badge";
import { CloudUploadIcon } from "@hugeicons/core-free-icons";
import { formatBytes, type RecordingSnapshot } from "../helpers";
import { DebugField, DebugNote, DebugPanel } from "./DebugPanel";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  snapshot: RecordingSnapshot;
}

export function UploadQueuePanel({ snapshot }: Props) {
  const { t } = useTranslation();
  const pending = snapshot.pendingUploads;
  const pendingBytes = snapshot.parts
    .filter((part) => !part.uploaded)
    .reduce((total, part) => total + part.bytes, 0);

  return (
    <DebugPanel
      title={t("Upload queue", "上传队列")}
      description={t(
        "Derived from the parts table — a part is pending until markPartUploaded flips its flag.",
        "根据 parts 表推导：在 markPartUploaded 更新标记之前，分片一直处于待上传状态。",
      )}
      icon={CloudUploadIcon}
      action={
        <Badge variant={pending === 0 ? "success" : "error"}>
          {pending === 0
            ? t("drained", "已清空")
            : t(`${pending} pending`, `${pending} 个待上传`)}
        </Badge>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <DebugField
          label={t("parts pending upload", "待上传分片")}
          value={String(pending)}
        />
        <DebugField
          label={t("parts uploaded", "已上传分片")}
          value={String(snapshot.parts.length - pending)}
        />
        <DebugField
          label={t("pending bytes", "待上传字节数")}
          value={formatBytes(pendingBytes)}
        />
      </div>
      <div className="mt-4">
        <DebugNote>
          {t(
            "The in-memory queue inside useUploadQueue is not observable from here; this panel reflects the durable IndexedDB flags, which is what survives a refresh.",
            "此处无法观察 useUploadQueue 内部的内存队列；本面板显示 IndexedDB 中持久化的标记，刷新后仍会保留。",
          )}
        </DebugNote>
      </div>
    </DebugPanel>
  );
}
