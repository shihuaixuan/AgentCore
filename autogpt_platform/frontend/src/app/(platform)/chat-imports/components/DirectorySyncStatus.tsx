import { Progress } from "@/components/atoms/Progress/Progress";
import { Text } from "@/components/atoms/Text/Text";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { processedCount } from "../syncDirectory";
import type { useDirectorySync } from "../useDirectorySync";
import { ImportNotice } from "./ImportNotice";

type State = NonNullable<ReturnType<typeof useDirectorySync>["state"]>;

export function DirectorySyncStatus({ state }: { state: State }) {
  const { t } = useTranslation();
  const { phase, progress, error } = state;
  const done = phase === "done" || phase === "stopped";
  const total = progress?.total ?? 0;
  const processed = progress ? processedCount(progress) : 0;
  const headline = {
    reading: t("Reading local conversations…", "正在解析本地会话…"),
    syncing: t(
      `Syncing: ${processed} / ${total}`,
      `正在同步：${processed} / ${total} 条`,
    ),
    done: t(
      `Sync complete: ${processed} / ${total}`,
      `同步完成：${processed} / ${total} 条`,
    ),
    stopped: t(
      `Sync stopped: ${processed} / ${total}`,
      `同步已停止：${processed} / ${total} 条`,
    ),
  }[phase];

  return (
    <div className="space-y-2 border-t border-border-base pt-3">
      <Text variant="body-medium" role="status">
        {phase === "stopped" && !progress
          ? t("Could not sync the folder", "无法同步此目录")
          : headline}
      </Text>
      {total > 0 && (
        <Progress
          value={processed}
          max={total}
          role="progressbar"
          aria-label={t("Sync progress", "同步进度")}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={processed}
        />
      )}
      {progress && done && <DirectorySyncSummary progress={progress} />}
      {!done && (
        <Text variant="small" tone="secondary">
          {t(
            "Keep this page open until sync finishes.",
            "请保持本页打开，直到同步结束。",
          )}
        </Text>
      )}
      {phase === "stopped" && <DirectorySyncError error={error} />}
    </div>
  );
}

function DirectorySyncSummary({
  progress,
}: {
  progress: NonNullable<State["progress"]>;
}) {
  const { t } = useTranslation();
  const { added, duplicates, skipped, failed, total } = progress;
  return (
    <>
      <Text variant="small" tone="secondary">
        {t(
          `New ${added} · Already present ${duplicates} · Skipped ${skipped} · Failed ${failed}`,
          `新增 ${added} · 已存在 ${duplicates} · 跳过 ${skipped} · 失败 ${failed}`,
        )}
      </Text>
      {failed > 0 ? (
        <Text variant="small" tone="error-strong" role="alert">
          {t(
            "Some requests failed. Choose the same folder to retry without making duplicates.",
            "部分同步请求失败。可以重新选择同一目录重试，不会产生重复会话。",
          )}
        </Text>
      ) : total === skipped ? (
        <Text variant="small" tone="secondary">
          {t(
            "No supported conversations were found.",
            "此目录没有可同步的会话。",
          )}
        </Text>
      ) : null}
    </>
  );
}

function DirectorySyncError({ error }: { error: unknown }) {
  const { t } = useTranslation();
  if (error instanceof ApiError) {
    const message =
      error.status === 429
        ? t(
            "Too many requests. Wait a moment and choose the same folder again.",
            "请求过于频繁。请稍后重新选择同一目录。",
          )
        : t(
            "Check your signed-in account before trying again.",
            "请确认当前登录账号后再重试。",
          );
    return (
      <Text variant="small" tone="error-strong" role="alert">
        {message}
      </Text>
    );
  }
  return <ImportNotice error={error} />;
}
