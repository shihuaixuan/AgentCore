"use client";

import { toast } from "@/components/molecules/Toast/use-toast";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useEffect, useRef, useState } from "react";

export function useArtifactFullscreen() {
  const { t } = useTranslation();
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);

  useEffect(() => {
    setCanFullscreen(!!document.fullscreenEnabled);
    function handleFullscreenChange() {
      setIsFullscreen(
        !!fullscreenRef.current &&
          document.fullscreenElement === fullscreenRef.current,
      );
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  async function exitFullscreen() {
    if (
      !fullscreenRef.current ||
      document.fullscreenElement !== fullscreenRef.current
    )
      return true;
    try {
      await document.exitFullscreen();
      return true;
    } catch {
      toast({
        title: t("Couldn't change fullscreen mode", "无法切换全屏模式"),
        variant: "destructive",
      });
      return false;
    }
  }

  async function toggleFullscreen() {
    if (!fullscreenRef.current) return;
    if (document.fullscreenElement === fullscreenRef.current) {
      await exitFullscreen();
      return;
    }
    try {
      await fullscreenRef.current.requestFullscreen();
    } catch {
      toast({
        title: t("Couldn't change fullscreen mode", "无法切换全屏模式"),
        variant: "destructive",
      });
    }
  }

  return {
    fullscreenRef,
    isFullscreen,
    canFullscreen,
    toggleFullscreen,
    exitFullscreen,
  };
}
