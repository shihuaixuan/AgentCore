"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { Alert, AlertDescription } from "@/components/molecules/Alert/Alert";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useShareRunButton } from "./useShareRunButton";
import {
  Alert01Icon,
  Copy01Icon,
  Share08Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  graphId: string;
  executionId: string;
  isShared?: boolean;
  shareToken?: string | null;
}

export function ShareRunButton({
  graphId,
  executionId,
  isShared: initialIsShared = false,
  shareToken: initialShareToken,
}: Props) {
  const { t } = useTranslation();
  const {
    isShared,
    shareUrl,
    copied,
    loading,
    handleShare,
    handleStopSharing,
    handleCopy,
  } = useShareRunButton({
    graphId,
    executionId,
    isShared: initialIsShared,
    shareToken: initialShareToken,
  });

  return (
    <Dialog
      title={t("Share Workflow Run", "分享工作流运行结果")}
      styling={{ maxWidth: "36rem", minWidth: "auto" }}
    >
      <Dialog.Trigger>
        <Button
          variant="icon"
          size="icon"
          aria-label={t("Share results", "分享结果")}
          className={isShared ? "relative" : ""}
        >
          <Icon icon={Share08Icon} size={18} />
        </Button>
      </Dialog.Trigger>

      <Dialog.Content>
        <div className="flex flex-col gap-4">
          <Text variant="large">
            {isShared
              ? "Your workflow run is currently shared. Anyone with the link can view the output."
              : "Generate a public link to share this workflow run output with others."}
          </Text>

          {!isShared ? (
            <>
              <div className="!mb-4">
                <Alert>
                  <Icon icon={Alert01Icon} className="h-4 w-4" />
                  <Text variant="body">
                    When you enable sharing, the output of this workflow run
                    will be publicly accessible to anyone with the link. The
                    page will include a noindex directive to discourage search
                    engine crawling, but this cannot be guaranteed.
                  </Text>
                </Alert>
              </div>
              <Button
                onClick={handleShare}
                loading={loading}
                className="mt-6 w-full"
              >
                {t("Enable Sharing", "启用分享")}
              </Button>
            </>
          ) : (
            <>
              <div className="flex w-full items-center gap-4">
                <Input
                  type="text"
                  value={shareUrl}
                  readOnly
                  label={t("Share URL", "分享链接")}
                  id="share-url"
                  size="small"
                  className="!m-0"
                  wrapperClassName="flex-1"
                />
                <Button
                  variant="secondary"
                  onClick={handleCopy}
                  size="small"
                  className="mt-0.5 !min-w-0"
                >
                  {copied ? (
                    <Icon icon={Tick02Icon} size={16} />
                  ) : (
                    <Icon icon={Copy01Icon} size={16} />
                  )}
                </Button>
              </div>
              <Alert>
                <Icon icon={Alert01Icon} className="h-4 w-4" />
                <AlertDescription>
                  This link is publicly accessible. Only share it with people
                  you trust. The shared page includes noindex directives to
                  discourage search engines.
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleStopSharing}
                loading={loading}
                variant="destructive"
                className="mt-6 w-full"
              >
                {t("Stop Sharing", "停止分享")}
              </Button>
            </>
          )}
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
