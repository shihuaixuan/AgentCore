"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { useRouter } from "next/navigation";

export function PublishAuthPrompt() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <div>
      <div className="mx-auto inline-flex h-[370px] w-full flex-col items-center justify-center gap-6 px-4 py-5 sm:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Text variant="h3-semibold">
            {t("Share your AI creations", "分享您的 AI 作品")}
          </Text>
          <Text variant="lead" tone="secondary" className="max-w-[80%]">
            {t(
              "Log in or create an account to publish your workflows to the marketplace and join a community of creators",
              "登录或创建账户，将工作流发布到市场，并加入创作者社区",
            )}
          </Text>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button onClick={() => router.push("/login")}>
            {t("Log in", "登录")}
          </Button>
          <Button onClick={() => router.push("/signup")} variant="secondary">
            {t("Create account", "创建账户")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export const PublishAuthPromptSkeleton = () => {
  return (
    <div className="mx-auto inline-flex h-[370px] w-full flex-col items-center justify-center gap-6 px-4 py-5 sm:px-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-20 w-96" />
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
};
