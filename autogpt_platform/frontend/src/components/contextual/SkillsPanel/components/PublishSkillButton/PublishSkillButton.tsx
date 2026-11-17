"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Select } from "@/components/atoms/Select/Select";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { MultiToggle } from "@/components/molecules/MultiToggle/MultiToggle";
import { CheckmarkCircle02Icon, Store01Icon } from "@hugeicons/core-free-icons";
import { usePublishSkillButton } from "./usePublishSkillButton";

interface Props {
  skillName: string;
}

export function PublishSkillButton({ skillName }: Props) {
  const { t } = useTranslation();

  const {
    isOpen,
    setIsOpen,
    open,
    submitted,
    isPublishing,
    canSubmit,
    category,
    setCategory,
    categoryOptions,
    providers,
    setProviders,
    providerItems,
    submit,
  } = usePublishSkillButton({ skillName });

  return (
    <>
      <Button
        variant="icon"
        size="icon"
        onClick={open}
        data-testid="skill-publish-button"
        aria-label={t("Publish skill to marketplace", "将技能发布到市场")}
      >
        <Icon icon={Store01Icon} className="h-4 w-4" />
      </Button>

      <Dialog
        controlled={{ isOpen, set: setIsOpen }}
        styling={{ maxWidth: "32rem" }}
        title={t("Publish to marketplace", "发布到市场")}
      >
        <Dialog.Content>
          {submitted ? (
            <div
              className="flex items-start gap-2"
              data-testid="skill-publish-submitted"
            >
              <Icon
                icon={CheckmarkCircle02Icon}
                size={18}
                tone="success"
                className="mt-0.5"
              />
              <Text variant="body">
                {t(
                  "Submitted for review. Your skill appears in the marketplace once it is approved; what you published is a copy, so editing it here changes nothing until you publish again.",
                  "已提交审核。审核通过后，技能将显示在市场中；发布的是技能副本，因此在此处编辑不会影响已发布内容，除非再次发布。",
                )}
              </Text>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Text variant="body" tone="muted">
                {t(
                  `Publishing sends a copy of ${skillName} for review. Say where it belongs and what it expects to be connected.`,
                  `发布会将 ${skillName} 的副本提交审核。请选择所属分类，并说明需要连接哪些集成。`,
                )}
              </Text>
              <Select
                id="skill-category"
                label={t("Category", "分类")}
                placeholder={t("Pick a category", "选择分类")}
                value={category}
                onValueChange={setCategory}
                options={categoryOptions}
              />
              <div className="flex flex-col gap-2">
                <Text variant="large-medium">
                  {t("Works with", "适用集成")}
                </Text>
                <Text variant="small" tone="muted">
                  {t(
                    "Integrations your instructions assume. Installers see these and connect them when they first need one.",
                    "使用说明所需的集成。安装者会看到这些集成，并在首次需要时连接。",
                  )}
                </Text>
                <MultiToggle
                  items={providerItems}
                  selectedValues={providers}
                  onChange={setProviders}
                  aria-label={t(
                    "Integrations this skill works with",
                    "此技能适用的集成",
                  )}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={submit}
                  disabled={!canSubmit}
                  loading={isPublishing}
                  data-testid="skill-publish-submit"
                >
                  {t("Submit for review", "提交审核")}
                </Button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog>
    </>
  );
}
