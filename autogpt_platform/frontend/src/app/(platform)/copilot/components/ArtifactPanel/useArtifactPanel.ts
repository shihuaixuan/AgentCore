"use client";

import { toast } from "@/components/molecules/Toast/use-toast";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useEffect, useRef, useState } from "react";
import { useCopilotUIStore } from "../../store";
import { getCachedArtifactContent } from "./components/useArtifactContent";
import { downloadArtifact } from "./downloadArtifact";
import { classifyArtifactRef } from "./helpers";

export function useArtifactPanel() {
  const { t } = useTranslation();
  const artifactPanel = useCopilotUIStore((s) => s.artifactPanel);
  const closeArtifactPanel = useCopilotUIStore((s) => s.closeArtifactPanel);
  const clearArtifactPreview = useCopilotUIStore((s) => s.clearArtifactPreview);
  const goBackArtifact = useCopilotUIStore((s) => s.goBackArtifact);
  const showFilesTab = useCopilotUIStore((s) => s.showFilesTab);
  const artifactPanelWidth = useCopilotUIStore((s) => s.artifactPanelWidth);
  const setArtifactPanelWidth = useCopilotUIStore(
    (s) => s.setArtifactPanelWidth,
  );
  const setArtifactPanelMode = useCopilotUIStore((s) => s.setArtifactPanelMode);

  const [isSourceView, setIsSourceView] = useState(false);

  const { activeArtifact } = artifactPanel;

  const classification = activeArtifact
    ? classifyArtifactRef(activeArtifact)
    : null;

  // Reset source view when switching artifacts. A new version of the same
  // document, after Otto overwrites it, is not a switch.
  const artifactId = activeArtifact?.id;
  const documentId = activeArtifact?.documentId ?? artifactId;
  const previousRef = useRef({ artifactId, documentId });
  useEffect(() => {
    const previous = previousRef.current;
    if (
      artifactId !== previous.artifactId &&
      documentId !== previous.documentId
    ) {
      setIsSourceView(false);
    }
    previousRef.current = { artifactId, documentId };
  }, [artifactId, documentId]);

  // Escape-to-close is owned by the vaul Drawer.Root in ArtifactPanel — its
  // onOpenChange already routes to clearArtifactPreview. A manual document
  // listener here would self-block on the drawer's own [role="dialog"].

  const canCopy =
    classification != null &&
    classification.type !== "image" &&
    classification.type !== "video" &&
    classification.type !== "download-only" &&
    classification.type !== "pdf" &&
    classification.type !== "expert";

  function handleCopy() {
    if (!activeArtifact || !canCopy) return;
    // Reuse content already fetched by the preview pane when available —
    // Copy should feel instant, not trigger a second network round-trip.
    const cached = getCachedArtifactContent(activeArtifact.id);
    const textPromise = cached
      ? Promise.resolve(cached)
      : fetch(activeArtifact.sourceUrl).then((res) => {
          if (!res.ok) throw new Error(`Copy failed: ${res.status}`);
          return res.text();
        });
    textPromise
      .then((text) => navigator.clipboard.writeText(text))
      .then(() => {
        toast({ title: t("Copied to clipboard", "已复制到剪贴板") });
      })
      .catch(() => {
        toast({
          title: t("Copy failed", "复制失败"),
          description: t(
            "Couldn't read the file or access the clipboard.",
            "无法读取文件或访问剪贴板。",
          ),
          variant: "destructive",
        });
      });
  }

  function handleDownload() {
    if (!activeArtifact) return;
    downloadArtifact(activeArtifact).catch(() => {
      toast({
        title: t("Download failed", "下载失败"),
        description: t("Couldn't fetch the file.", "无法获取文件。"),
        variant: "destructive",
      });
    });
  }

  return {
    activeArtifact,
    history: artifactPanel.history,
    isSourceView,
    classification,
    setIsSourceView,
    closeArtifactPanel,
    clearArtifactPreview,
    goBackArtifact,
    showFilesTab,
    canCopy,
    handleCopy,
    handleDownload,
    artifactPanelWidth,
    setArtifactPanelWidth,
    mode: artifactPanel.mode,
    isComputerOpen: artifactPanel.isComputerOpen,
    setArtifactPanelMode,
  };
}
