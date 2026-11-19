import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useState, useEffect } from "react";
import {
  usePostV1EnableExecutionSharing,
  useDeleteV1DisableExecutionSharing,
} from "@/app/api/__generated__/endpoints/default/default";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { executionShareUrl } from "@/lib/share/routes";

interface UseShareRunButtonProps {
  graphId: string;
  executionId: string;
  isShared?: boolean;
  shareToken?: string | null;
}

export function useShareRunButton({
  graphId,
  executionId,
  isShared: initialIsShared = false,
  shareToken: initialShareToken,
}: UseShareRunButtonProps) {
  const { t } = useTranslation();
  const [isShared, setIsShared] = useState(initialIsShared);
  const [shareToken, setShareToken] = useState(initialShareToken || null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Sync state when props change (e.g., after re-fetching run data)
  useEffect(() => {
    setIsShared(initialIsShared);
    setShareToken(initialShareToken || null);
  }, [initialIsShared, initialShareToken]);

  const shareUrl = shareToken ? executionShareUrl(shareToken) : "";

  const { mutateAsync: enableSharing, isPending: isEnabling } =
    usePostV1EnableExecutionSharing();
  const { mutateAsync: disableSharing, isPending: isDisabling } =
    useDeleteV1DisableExecutionSharing();

  const loading = isEnabling || isDisabling;

  async function handleShare() {
    try {
      const response = await enableSharing({
        graphId,
        graphExecId: executionId,
        data: {}, // Empty ExecutionShareRequest
      });

      if (response.status === 200) {
        setShareToken(response.data.share_token);
        setIsShared(true);
        toast({
          title: t("Sharing enabled", "分享已启用"),
          description: t(
            "Your workflow run is now publicly accessible via the share link.",
            "现在可通过分享链接公开访问此次工作流运行。",
          ),
        });
      } else {
        toast({
          title: t("Error", "错误"),
          description: t(
            "Failed to enable sharing. Please try again.",
            "无法启用分享，请重试。",
          ),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t("Error", "错误"),
        description: t(
          "Failed to enable sharing. Please try again.",
          "无法启用分享，请重试。",
        ),
        variant: "destructive",
      });
    }
  }

  async function handleStopSharing() {
    try {
      await disableSharing({
        graphId,
        graphExecId: executionId,
      });

      setIsShared(false);
      setShareToken(null);
      toast({
        title: t("Sharing disabled", "分享已停用"),
        description: t(
          "The share link is no longer accessible.",
          "分享链接已无法访问。",
        ),
      });
    } catch {
      toast({
        title: t("Error", "错误"),
        description: t(
          "Failed to disable sharing. Please try again.",
          "无法停用分享，请重试。",
        ),
        variant: "destructive",
      });
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: t("Copied!", "已复制！"),
        description: t(
          "Share link copied to clipboard.",
          "分享链接已复制到剪贴板。",
        ),
      });
    } catch {
      toast({
        title: t("Error", "错误"),
        description: t(
          "Failed to copy link. Please try again.",
          "无法复制链接，请重试。",
        ),
        variant: "destructive",
      });
    }
  }

  return {
    isShared,
    shareToken,
    shareUrl,
    copied,
    loading,
    handleShare,
    handleStopSharing,
    handleCopy,
  };
}
