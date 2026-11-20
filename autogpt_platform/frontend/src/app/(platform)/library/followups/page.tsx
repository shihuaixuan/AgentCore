"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SchedulesPanel } from "@/components/contextual/SchedulesPanel/SchedulesPanel";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export default function FollowupsPage() {
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    document.title = t("Scheduled – Duanmu Software", "计划 – 端木软件");
  }, [t]);

  function handleGuidedPrompt(prompt: string) {
    router.push(`/home#prompt=${encodeURIComponent(prompt)}`);
  }

  return (
    <main className="container min-h-screen space-y-6 pt-16 pb-20 sm:px-8 md:px-12">
      <Link
        href="/library"
        className="inline-flex items-center gap-1 text-body text-foreground-tertiary hover:text-foreground-emphasis"
        data-testid="followups-back-to-library"
      >
        <Icon icon={ArrowLeft02Icon} size={14} />

        {t("Back to Library", "返回工作流库")}
      </Link>
      <SchedulesPanel onGuidedPrompt={handleGuidedPrompt} />
    </main>
  );
}
