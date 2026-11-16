"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { RunOutputs } from "@/app/(platform)/library/agents/[id]/components/NewAgentLibraryView/components/selected-views/SelectedRunView/components/RunOutputs";
import { okData } from "@/app/api/helpers";
import { useGetV1GetSharedExecution } from "@/app/api/__generated__/endpoints/default/default";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card/Card";
import { Alert, AlertDescription } from "@/components/molecules/Alert/Alert";
import { CookieSettingsLink } from "@/components/molecules/CookieSettingsLink/CookieSettingsLink";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useParams } from "next/navigation";
import { ShareActions } from "../components/ShareHeader/ShareActions";
import { ShareHeader } from "../components/ShareHeader/ShareHeader";

// Wraps the page in the shared header + a scrollable container.
// Header is the same component used by the chat share viewer so the
// two routes stay visually consistent.
function ExecutionShareChrome({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full flex-col bg-canvas">
      <ShareHeader title={title} actions={<ShareActions />} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8">{children}</div>
      </div>
      <CookieSettingsLink className="mb-1 shrink-0 self-center" />
    </div>
  );
}

export default function SharePage() {
  const { t } = useTranslation();
  const params = useParams();
  const token = params.token as string;

  const {
    data: executionData,
    isLoading: loading,
    error,
  } = useGetV1GetSharedExecution(token, { query: { select: okData } });

  const is404 = !loading && !executionData;

  if (loading) {
    return (
      <ExecutionShareChrome>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-action"></div>
            <p className="text-foreground-tertiary">
              {t("Loading shared execution...", "正在加载分享的运行结果…")}
            </p>
          </div>
        </div>
      </ExecutionShareChrome>
    );
  }

  if (error || is404 || !executionData) {
    return (
      <ExecutionShareChrome>
        <div className="flex items-center justify-center py-16">
          <div className="mx-auto w-full max-w-md p-6">
            <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-px text-foreground-base">
              <div className="p-6">
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover text-foreground-tertiary">
                    <Icon
                      aria-hidden
                      icon={InformationCircleIcon}
                      className="h-6 w-6"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lead font-semibold">
                      {is404
                        ? t("Share Link Not Found", "找不到分享链接")
                        : t("Unable to Load", "无法加载")}
                    </h3>
                    <p className="text-body text-foreground-tertiary">
                      {is404
                        ? t(
                            "This shared link is invalid or has been disabled by the owner. Please check with the person who shared this link.",
                            "此分享链接无效或已被所有者停用，请联系分享者。",
                          )
                        : t(
                            "There was an error loading this shared execution. Please try refreshing the page.",
                            "加载分享的运行结果时出错，请刷新页面重试。",
                          )}
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => window.location.reload()}
                      className="text-body text-action hover:underline"
                    >
                      {t("Try again", "重试")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center text-caption text-foreground-tertiary">
              <p>
                {t("Powered by AutoGPT Platform", "由 AutoGPT 平台提供支持")}
              </p>
            </div>
          </div>
        </div>
      </ExecutionShareChrome>
    );
  }

  return (
    <ExecutionShareChrome title={executionData.graph_name}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Alert>
            <Icon
              aria-hidden
              icon={InformationCircleIcon}
              className="h-4 w-4"
            />
            <AlertDescription>
              {t(
                "This is a publicly shared workflow run result. The person who shared this link can disable access at any time.",
                "这是公开分享的工作流运行结果。分享者可以随时停用此链接。",
              )}
            </AlertDescription>
          </Alert>
        </div>

        <Card variant="outlined" className="mb-6">
          <CardHeader>
            <h3 className="text-heading-md font-semibold tracking-tight">
              {executionData.graph_name}
            </h3>
            {executionData.graph_description && (
              <p className="mt-2 text-foreground-tertiary">
                {executionData.graph_description}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-body">
              <div>
                <span className="font-medium">{t("Status:", "状态：")}</span>
                <span className="ml-2 capitalize">
                  {executionData.status.toLowerCase()}
                </span>
              </div>
              <div>
                <span className="font-medium">
                  {t("Created:", "创建时间：")}
                </span>
                <span className="ml-2">
                  {new Date(executionData.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader>
            <CardTitle>{t("Output", "输出")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RunOutputs outputs={executionData.outputs} shareToken={token} />
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-body text-foreground-tertiary">
          <p>{t("Powered by AutoGPT Platform", "由 AutoGPT 平台提供支持")}</p>
        </div>
      </div>
    </ExecutionShareChrome>
  );
}
