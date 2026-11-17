"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { AdminSkillSubmissionFiles } from "./AdminSkillSubmissionFiles";
import { useAdminSkillSubmissions } from "./useAdminSkillSubmissions";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function AdminSkillSubmissions() {
  const { t } = useTranslation();
  const {
    submissions,
    isLoading,
    isUnavailable,
    isReviewing,
    approve,
    reject,
  } = useAdminSkillSubmissions();

  if (isLoading) {
    return <div className="py-6 text-center">{t("Loading skill submissions…", "正在加载技能提交…")}</div>;
  }

  if (isUnavailable) {
    return (
      <Text variant="body" tone="muted">
        {t("Skill submissions are unavailable right now.", "技能提交暂时不可用。")}
      </Text>
    );
  }

  if (submissions.length === 0) {
    return (
      <Text variant="body" tone="muted">
        {t("No skill submissions are waiting for review.", "没有等待审核的技能提交。")}
      </Text>
    );
  }

  return (
    <ul className="flex flex-col gap-3" data-testid="admin-skill-submissions">
      {submissions.map((submission) => (
        <li
          key={submission.skill_listing_version_id}
          className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border-base bg-surface p-4"
        >
          <div className="min-w-0">
            <Text variant="body-medium">
              {submission.name}{" "}
              <span className="text-foreground-subtle">
                v{submission.version}
              </span>
            </Text>
            <Text variant="small" tone="muted">
              {submission.description}
            </Text>
            <Text variant="small" className="!mt-1" tone="subtle">
              /{submission.slug} · {submission.categories.join(", ")}
              {submission.required_providers.length > 0
                ? ` · works with ${submission.required_providers.join(", ")}`
                : ""}
            </Text>
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <Button
              variant="secondary"
              size="small"
              disabled={isReviewing}
              onClick={() => reject(submission.skill_listing_version_id)}
              data-testid={`reject-${submission.skill_listing_version_id}`}
            >
              {t("Reject", "拒绝")}
            </Button>
            <Button
              variant="primary"
              size="small"
              disabled={isReviewing}
              onClick={() => approve(submission.skill_listing_version_id)}
              data-testid={`approve-${submission.skill_listing_version_id}`}
            >
              {t("Approve", "通过")}
            </Button>
          </div>
          <AdminSkillSubmissionFiles
            versionId={submission.skill_listing_version_id}
            files={submission.files ?? []}
          />
        </li>
      ))}
    </ul>
  );
}
