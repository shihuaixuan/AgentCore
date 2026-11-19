import { ProfileEntry } from "../../[expertId]/components/ProfileEntry";
import { AUTOPILOT_BLURB } from "../../helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function AutopilotAboutSection() {
  const { t } = useTranslation();
  const entries = [
    {
      label: t("Bio", "简介"),
      value: t(
        AUTOPILOT_BLURB,
        "你的内置通才助手，负责回答问题、运行工作流，并将任务分配给你聘用的专家。",
      ),
    },
    {
      label: t("Identity", "身份"),
      value: t(
        "Your general office assistant talks with you directly, answers questions, and runs workflows on request.",
        "通用办公助手与你直接沟通、回答问题，并按需运行工作流。",
      ),
    },
    {
      label: t("Works with", "协作对象"),
      value: t(
        "Every expert you hire. The assistant hands work to the right expert and reports back to you.",
        "你聘用的所有专家。助手会将任务交给合适的专家，并向你汇报。",
      ),
    },
    {
      label: t("Boundaries", "边界"),
      value: t(
        "The assistant asks before taking external actions on your behalf and never edits an expert's Soul for you.",
        "助手代表你执行外部操作前会征求同意，也不会代你修改专家的核心设定。",
      ),
    },
  ];
  return (
    <section className="space-y-5">
      <dl className="space-y-4">
        {entries.map((entry) => (
          <ProfileEntry
            key={entry.label}
            label={entry.label}
            value={entry.value}
          />
        ))}
      </dl>
    </section>
  );
}
