"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { FormProvider } from "react-hook-form";
import { CronExpressionDialog } from "@/components/contextual/CronScheduler/cron-scheduler-dialog";
import { FormField } from "@/components/molecules/Form/Form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/molecules/Accordion/Accordion";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Select } from "@/components/atoms/Select/Select";
import { Text } from "@/components/atoms/Text/Text";
import { useStoreCategories } from "@/hooks/useStoreCategories";
import { describeCron } from "@/components/contextual/CronScheduler/helpers";
import { InformationTooltip } from "@/components/molecules/InformationTooltip/InformationTooltip";
import * as React from "react";
import { StepHeader } from "../StepHeader";
import { StepFooter } from "../StepFooter";
import { ThumbnailImages } from "./components/ThumbnailImages";
import { CharCountedTextarea } from "./components/CharCountedTextarea";
import { Props, useAgentInfoStep } from "./useAgentInfoStep";
import { SUB_HEADING_MAX } from "./helpers";
import {
  Album01Icon,
  AlertCircleIcon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  SparklesIcon,
  Store01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

const DESCRIPTION_MAX = 1000;
const INSTRUCTIONS_MAX = 2000;

export function AgentInfoStep({
  onBack,
  onSuccess,
  selectedAgentId,
  selectedAgentVersion,
  initialData,
  isMarketplaceUpdate,
}: Props) {
  const { t } = useTranslation();

  const {
    form,
    agentId,
    images,
    initialImages,
    initialSelectedImage,
    handleImagesChange,
    handleSubmit,
    isSubmitting,
  } = useAgentInfoStep({
    onBack,
    onSuccess,
    selectedAgentId,
    selectedAgentVersion,
    initialData,
    isMarketplaceUpdate,
  });

  const { categories, isUnavailable, placeholder } = useStoreCategories();

  const [cronScheduleDialogOpen, setCronScheduleDialogOpen] =
    React.useState(false);
  const [openAccordion, setOpenAccordion] = React.useState("");
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpenAccordion((current) => current || "basics");
    }, 320);
    return () => window.clearTimeout(timer);
  }, []);

  const handleScheduleChange = (cronExpression: string) => {
    form.setValue("recommendedScheduleCron", cronExpression);
  };

  const categoryOptions = categories.map((category) => ({
    value: category.value,
    label: category.label,
  }));

  const isSubmitDisabled =
    Object.keys(form.formState.errors).length > 0 || isSubmitting;

  const watched = form.watch();
  const errors = form.formState.errors;
  const basicsHasError = !!(
    errors.title ||
    errors.slug ||
    errors.subheader ||
    errors.category
  );
  const experienceHasError = !!(
    errors.description ||
    errors.instructions ||
    errors.youtubeLink ||
    errors.agentOutputDemo
  );
  const thumbnailsHasError = !!errors.root;
  const basicsComplete =
    !basicsHasError &&
    !!watched.title &&
    !!watched.slug &&
    !!watched.subheader &&
    !!watched.category;
  const thumbnailsComplete = !thumbnailsHasError && images.length > 0;
  const experienceComplete =
    !experienceHasError &&
    !!watched.description &&
    !!watched.youtubeLink &&
    !!watched.agentOutputDemo;

  const title = isMarketplaceUpdate
    ? t("Describe the update", "描述更新")
    : t("Build the store listing", "创建市场条目");
  const description = isMarketplaceUpdate
    ? t(
        "Explain what changed, then adjust any listing details that need to move with this version.",
        "说明更改内容，然后调整需要随此版本更新的条目详情。",
      )
    : t(
        "Write a bit of details about your workflow so reviewers and users know what to expect.",
        "填写工作流的详细信息，帮助审核人员和用户了解预期效果。",
      );

  return (
    <div className="mx-auto flex w-full flex-col">
      <StepHeader title={title} description={description} currentStep="info" />

      <FormProvider {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-5">
          {isMarketplaceUpdate && (
            <section className="rounded-2xl border border-warning-border bg-warning-surface p-4">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-warning-foreground shadow-subtle">
                  <Icon icon={InformationCircleIcon} size={18} />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <Text variant="body-medium" as="h3" tone="warning-strong">
                    {t("Update note", "更新说明")}
                  </Text>
                  <Text variant="small" tone="warning">
                    {t(
                      "Reviewers use this to understand why the marketplace listing needs a new version.",
                      "审核人员会据此了解市场条目为何需要新版本。",
                    )}
                  </Text>
                </div>
              </div>
              <FormField
                control={form.control}
                name="changesSummary"
                render={({ field }) => (
                  <Input
                    id={field.name}
                    labelVariant="body"
                    label={t("What changed?", "更改了什么？")}
                    labelTooltip={t(
                      "Summary of what's new or improved in this version. Reviewers see this first.",
                      "概述此版本的新增内容或改进。审核人员会首先查看这部分内容。",
                    )}
                    type="textarea"
                    rows={1}
                    placeholder={t(
                      "Describe what's new or improved in this version...",
                      "描述此版本的新增内容或改进…",
                    )}
                    error={form.formState.errors.changesSummary?.message}
                    required
                    wrapperClassName="!mb-0"
                    {...field}
                  />
                )}
              />
            </section>
          )}

          <Accordion
            type="single"
            collapsible
            value={openAccordion}
            onValueChange={setOpenAccordion}
            className="overflow-hidden rounded-xl border border-border-base bg-surface shadow-subtle [&>*+*]:border-t [&>*+*]:border-border-base"
          >
            <AccordionItem value="basics" className="border-0 px-4">
              <AccordionTrigger className="hover:no-underline">
                <Text
                  variant="body-medium-tight"
                  as="span"
                  className="flex items-center gap-2"
                >
                  <Icon icon={Store01Icon} size={18} tone="muted" />
                  {t("Listing basics", "条目基本信息")}
                  {basicsHasError ? (
                    <Icon icon={AlertCircleIcon} size={16} tone="error" />
                  ) : basicsComplete ? (
                    <Icon icon={CheckmarkCircle02Icon} size={16} tone="brand" />
                  ) : null}
                </Text>
              </AccordionTrigger>
              <AccordionContent className="px-1 pt-0 pb-4">
                <div className="grid gap-x-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <Input
                        id={field.name}
                        labelVariant="body"
                        label={t("Title", "标题")}
                        labelTooltip={t(
                          "Public name shown on the marketplace listing.",
                          "显示在市场条目中的公开名称。",
                        )}
                        type="text"
                        placeholder={t("Workflow name", "工作流名称")}
                        error={form.formState.errors.title?.message}
                        {...field}
                      />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subheader"
                    render={({ field }) => (
                      <CharCountedTextarea
                        max={SUB_HEADING_MAX}
                        value={field.value ?? ""}
                      >
                        <Input
                          id={field.name}
                          labelVariant="body"
                          label={t("Tagline", "简短介绍")}
                          labelTooltip={t(
                            "The one-line subtitle shown under the workflow name and on preview cards. Start with a verb and name the outcome for the user.",
                            "显示在工作流名称下方及预览卡片中的单行副标题。请以动词开头，并说明用户能够获得的成果。",
                          )}
                          type="text"
                          placeholder={t(
                            "Find decision-makers at any company in seconds",
                            "几秒内找到任意公司的决策者",
                          )}
                          error={form.formState.errors.subheader?.message}
                          required
                          {...field}
                        />
                      </CharCountedTextarea>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <Input
                      id={field.name}
                      labelVariant="body"
                      label={t("Slug", "网址标识")}
                      labelTooltip={t(
                        "URL-friendly identifier used in the marketplace path. Lowercase letters, numbers, hyphens only.",
                        "用于市场网址路径的标识，只能包含小写字母、数字和连字符。",
                      )}
                      type="text"
                      placeholder={t("URL-friendly name", "适用于 URL 的名称")}
                      error={form.formState.errors.slug?.message}
                      {...field}
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <Select
                      id={field.name}
                      labelVariant="body"
                      label={t("Category", "分类")}
                      labelTooltip={t(
                        "Primary category that helps users discover the workflow.",
                        "帮助用户发现此工作流的主要分类。",
                      )}
                      placeholder={placeholder}
                      disabled={isUnavailable}
                      value={field.value}
                      onValueChange={field.onChange}
                      error={form.formState.errors.category?.message}
                      options={categoryOptions}
                    />
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="thumbnails" className="border-0 px-4">
              <AccordionTrigger className="hover:no-underline">
                <Text
                  variant="body-medium-tight"
                  as="span"
                  className="flex items-center gap-2"
                >
                  <Icon icon={Album01Icon} size={18} tone="muted" />
                  {t("Thumbnails", "缩略图")}
                  {thumbnailsHasError ? (
                    <Icon icon={AlertCircleIcon} size={16} tone="error" />
                  ) : thumbnailsComplete ? (
                    <Icon icon={CheckmarkCircle02Icon} size={16} tone="brand" />
                  ) : null}
                </Text>
              </AccordionTrigger>
              <AccordionContent className="px-1 pt-0 pb-4">
                <ThumbnailImages
                  agentId={agentId}
                  onImagesChange={handleImagesChange}
                  initialImages={initialImages}
                  initialSelectedImage={initialSelectedImage}
                  errorMessage={form.formState.errors.root?.message}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="experience" className="border-0 px-4">
              <AccordionTrigger className="hover:no-underline">
                <Text
                  variant="body-medium-tight"
                  as="span"
                  className="flex items-center gap-2"
                >
                  <Icon icon={SparklesIcon} size={18} tone="muted" />
                  {t("Experience details", "使用详情")}
                  {experienceHasError ? (
                    <Icon icon={AlertCircleIcon} size={16} tone="error" />
                  ) : experienceComplete ? (
                    <Icon icon={CheckmarkCircle02Icon} size={16} tone="brand" />
                  ) : null}
                </Text>
              </AccordionTrigger>
              <AccordionContent className="px-1 pt-0 pb-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <CharCountedTextarea
                      max={DESCRIPTION_MAX}
                      value={field.value ?? ""}
                    >
                      <Input
                        id={field.name}
                        labelVariant="body"
                        label={t("Description", "描述")}
                        labelTooltip={t(
                          "What the workflow does and the outcome users get.",
                          "说明工作流的功能以及用户能够获得的成果。",
                        )}
                        type="textarea"
                        rows={2}
                        placeholder={t(
                          "Describe the outcome this workflow creates",
                          "描述此工作流能够产生的成果",
                        )}
                        error={form.formState.errors.description?.message}
                        {...field}
                      />
                    </CharCountedTextarea>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <CharCountedTextarea
                      max={INSTRUCTIONS_MAX}
                      value={field.value ?? ""}
                    >
                      <Input
                        id={field.name}
                        labelVariant="body"
                        label={t("Instructions", "使用说明")}
                        labelTooltip={t(
                          "Steps users should follow to set up and run the workflow.",
                          "用户设置并运行此工作流时应遵循的步骤。",
                        )}
                        type="textarea"
                        rows={2}
                        placeholder={t(
                          "Explain inputs, setup, and what to expect after a run",
                          "说明输入、设置步骤以及运行后的预期结果",
                        )}
                        error={form.formState.errors.instructions?.message}
                        {...field}
                      />
                    </CharCountedTextarea>
                  )}
                />

                <div className="grid gap-x-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="youtubeLink"
                    render={({ field }) => (
                      <Input
                        id={field.name}
                        labelVariant="body"
                        label={t("YouTube video link", "YouTube 视频链接")}
                        labelTooltip={t(
                          "Demo or walkthrough video hosted on YouTube.",
                          "托管在 YouTube 上的演示或操作讲解视频。",
                        )}
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        error={form.formState.errors.youtubeLink?.message}
                        {...field}
                      />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agentOutputDemo"
                    render={({ field }) => (
                      <Input
                        id={field.name}
                        labelVariant="body"
                        label={t("Output demo", "输出演示")}
                        labelTooltip={t(
                          "Link showing example output the workflow produces.",
                          "展示此工作流输出示例的链接。",
                        )}
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        error={form.formState.errors.agentOutputDemo?.message}
                        {...field}
                      />
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="recommendedScheduleCron"
                  render={({ field }) => (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1">
                          <Text variant="body" as="span">
                            {t("Recommended schedule", "推荐运行计划")}
                          </Text>
                          <InformationTooltip
                            description={t(
                              "Suggested cron schedule users can run the workflow on. Sets a run cadence for recurring use cases.",
                              "建议用户运行此工作流时采用的 Cron 计划，用于设置周期性使用场景的运行频率。",
                            )}
                            iconSize={20}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCronScheduleDialogOpen(true)}
                        className="flex h-[2.875rem] w-full items-center gap-2 rounded-xl border border-border-base bg-surface px-4 py-2.5 text-left text-foreground-base shadow-none transition-colors hover:border-border-strong focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
                      >
                        <Icon
                          icon={Calendar03Icon}
                          size={16}
                          tone="muted"
                          className="shrink-0"
                        />
                        <Text
                          variant="body-tight"
                          as="span"
                          tone={field.value ? "inherit" : "subtle"}
                          className="truncate"
                        >
                          {field.value
                            ? describeCron(field.value, t)
                            : t("Set schedule", "设置计划")}
                        </Text>
                      </button>
                    </div>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <StepFooter
            secondary={
              <Button
                type="button"
                onClick={onBack}
                variant="secondary"
                size="small"
                className="w-full sm:w-auto"
              >
                {t("Back", "返回")}
              </Button>
            }
            primary={
              <Button
                type="submit"
                size="small"
                disabled={isSubmitDisabled}
                loading={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting
                  ? "Submitting"
                  : t("Submit for review", "提交审核")}
              </Button>
            }
          />
        </form>
      </FormProvider>

      <CronExpressionDialog
        open={cronScheduleDialogOpen}
        setOpen={setCronScheduleDialogOpen}
        onSubmit={handleScheduleChange}
        defaultCronExpression={form.getValues("recommendedScheduleCron") || ""}
        title={t("Recommended Schedule", "推荐运行计划")}
      />
    </div>
  );
}
