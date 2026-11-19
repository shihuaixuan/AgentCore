"use client";

import { Text } from "@/components/atoms/Text/Text";
import { Button } from "@/components/atoms/Button/Button";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { toast } from "@/components/molecules/Toast/use-toast";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { useCopilotUIStore } from "../../../../store";
import { downloadArtifact } from "../../../ArtifactPanel/downloadArtifact";
import { fileItemToArtifactRef } from "../FilesTab/helpers";
import type { SessionFile } from "../FilesTab/useSessionFiles";
import { useSessionFiles } from "../FilesTab/useSessionFiles";
import { ArtifactMiniCard } from "./components/ArtifactMiniCard";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

// The panel previews what this chat produced; /artifacts stays one click away
// for the workspace-wide library.
const PREVIEWABLE_LIMIT = 6;

interface Props {
  sessionId: string | null;
}

export function ArtifactsTab({ sessionId }: Props) {
  const { t } = useTranslation();
  const openArtifact = useCopilotUIStore((s) => s.openArtifact);
  const { uploaded, deliverables, isLoading, isError } =
    useSessionFiles(sessionId);
  const files = [...deliverables, ...uploaded].slice(0, PREVIEWABLE_LIMIT);

  function handleDownload(file: SessionFile) {
    downloadArtifact(fileItemToArtifactRef(file.item)).catch(() =>
      toast({
        title: t("Download failed", "下载失败"),
        variant: "destructive",
      }),
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[17rem] flex-col gap-2 p-3">
        <Skeleton variant="translucent" className="h-12 w-full rounded-2xl" />
        <Skeleton variant="translucent" className="h-12 w-full rounded-2xl" />
        <Skeleton variant="translucent" className="h-12 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-3">
        <ErrorCard
          isSuccess={false}
          context={t("artifacts", "产物")}
          responseError={{
            message: t("Failed to load artifacts.", "加载产物失败。"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-4 py-8">
      <div className="flex flex-col items-center gap-3">
        <Text
          variant="body-tight"
          as="p"
          tone="muted"
          className="max-w-[17rem] text-center"
        >
          {files.length === 0
            ? t("Nothing to preview yet.", "暂无可预览的内容。")
            : t(
                "Pick an artifact from this chat to preview it here.",
                "选择此对话中的产物，即可在这里预览。",
              )}
        </Text>
        <Button
          as="NextLink"
          href="/artifacts"
          variant="secondary"
          size="small"
        >
          {t("Open artifacts", "打开产物")}
        </Button>
      </div>
      {files.length > 0 && (
        <div className="flex w-full max-w-[17rem] flex-col gap-2">
          {files.map((file) => (
            <ArtifactMiniCard
              key={file.item.id}
              file={file}
              onOpen={() => openArtifact(fileItemToArtifactRef(file.item))}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
}
