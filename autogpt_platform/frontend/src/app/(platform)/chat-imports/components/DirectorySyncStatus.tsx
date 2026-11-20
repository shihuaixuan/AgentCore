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
  const { phase, progress, error, scan } = state;
  const reading = phase === "reading";
  const done = phase === "done" || phase === "stopped";
  const total = scan?.total ?? progress?.total ?? 0;
  const processed = scan?.read ?? (progress ? processedCount(progress) : 0);
  const headline = {
    reading: scan
      ? t(
          `Reading locally: ${processed} / ${total}`,
          `正在本机解析：${processed} / ${total} 条`,
        )
      : t("Reading local conversations…", "正在解析本地会话…"),
    review: null,
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
          ? t("Could not read the folder", "无法读取此目录")
          : headline}
      </Text>
      {total > 0 && (
        <Progress
          value={processed}
          max={total}
          role="progressbar"
          aria-label={
            reading
              ? t("Reading progress", "解析进度")
              : t("Sync progress", "同步进度")
          }
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={processed}
        />
      )}
      {progress && done && <DirectorySyncSummary progress={progress} />}
      {!done && (
        <Text variant="small" tone="secondary">
          {reading
            ? t(
                "No conversations are being uploaded.",
                "解析期间不会上传任何会话。",
              )
            : t(
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
            "Some requests failed. The unconfirmed chats are still selected; you can retry without making duplicates.",
            "部分请求失败，未确认的会话仍已勾选。可以直接重试，不会创建重复会话。",
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
            "Too many requests. Wait a moment and sync the remaining selection again.",
            "请求过于频繁。请稍后重试剩余的已选会话。",
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
