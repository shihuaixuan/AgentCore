"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { FormProvider } from "react-hook-form";
import * as React from "react";
import { StoreSubmission } from "@/app/api/__generated__/models/storeSubmission";
import { StoreSubmissionEditRequest } from "@/app/api/__generated__/models/storeSubmissionEditRequest";
import { FormField } from "@/components/molecules/Form/Form";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Select } from "@/components/atoms/Select/Select";
import { Text } from "@/components/atoms/Text/Text";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/molecules/Accordion/Accordion";

import { CharCountedTextarea } from "../../PublishAgentModal/components/AgentInfoStep/components/CharCountedTextarea";
import { ThumbnailImages } from "../../PublishAgentModal/components/AgentInfoStep/components/ThumbnailImages";
import { SUB_HEADING_MAX } from "../../PublishAgentModal/components/AgentInfoStep/helpers";

import { useEditAgentForm } from "./useEditAgentForm";
import {
  Album01Icon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  SparklesIcon,
  Store01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

const DESCRIPTION_MAX = 1000;
const CHANGES_SUMMARY_MAX = 500;

interface EditAgentFormProps {
  submission: StoreSubmissionEditRequest & {
    store_listing_version_id: string | undefined;
    graph_id: string;
  };
  onClose: () => void;
  onSuccess: (submission: StoreSubmission) => void;
}

export function EditAgentForm({
  submission,
  onClose,
  onSuccess,
}: EditAgentFormProps) {
  const { t } = useTranslation();

  const {
    form,
    images,
    categoryOptions,
    categoriesUnavailable,
    categoryPlaceholder,
    isSubmitting,
    handleFormSubmit,
    handleImagesChange,
  } = useEditAgentForm({ submission, onSuccess, onClose });

  const [openAccordion, setOpenAccordion] = React.useState("basics");

  const watched = form.watch();
  const errors = form.formState.errors;

  const basicsHasError = !!(
    errors.title ||
    errors.subheader ||
    errors.category
  );
  const experienceHasError = !!(
    errors.description ||
    errors.youtubeLink ||
    errors.agentOutputDemo
  );
  const thumbnailsHasError = !!errors.root;

  const basicsComplete =
    !basicsHasError &&
    !!watched.title &&
    !!watched.subheader &&
    !!watched.category;
  const experienceComplete = !experienceHasError && !!watched.description;
  const thumbnailsComplete = !thumbnailsHasError && images.length > 0;

  const isSubmitDisabled =
    Object.keys(form.formState.errors).length > 0 || isSubmitting;

  return (
    <div className="mx-auto flex w-full flex-col">
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-5 pb-5"
        >
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
                    "Reviewers use this to understand why this submission was edited.",
                    "审核人员会据此了解此次编辑提交的原因。",
                  )}
                </Text>
              </div>
            </div>
            <FormField
              control={form.control}
              name="changes_summary"
              render={({ field }) => (
                <CharCountedTextarea
                  max={CHANGES_SUMMARY_MAX}
                  value={field.value ?? ""}
                >
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
                      "Briefly describe what you changed",
                      "简要描述您的更改",
                    )}
                    error={form.formState.errors.changes_summary?.message}
                    required
                    wrapperClassName="!mb-0"
                    {...field}
                  />
                </CharCountedTextarea>
              )}
            />
          </section>

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
                      placeholder={categoryPlaceholder}
                      disabled={categoriesUnavailable}
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
                  agentId={submission.graph_id}
                  onImagesChange={handleImagesChange}
                  initialImages={Array.from(
                    new Set(submission.image_urls || []),
                  )}
                  initialSelectedImage={submission.image_urls?.[0] || null}
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
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex flex-col-reverse gap-3 border-t border-border-base pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              size="small"
              className="w-full sm:w-auto"
            >
              {t("Cancel", "取消")}
            </Button>
            <Button
              type="submit"
              size="small"
              disabled={isSubmitDisabled}
              loading={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting
                ? t("Saving", "保存中")
                : t("Update submission", "更新提交")}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
