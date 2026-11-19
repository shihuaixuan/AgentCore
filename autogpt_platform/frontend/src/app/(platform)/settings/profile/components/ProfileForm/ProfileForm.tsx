"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { cn } from "@/lib/utils";

import {
  MAX_BIO_LENGTH,
  type ProfileFormState,
  validateForm,
} from "../../helpers";
import {
  EyeClosedIcon,
  EyeIcon,
  LeftToRightListBulletIcon,
  Link01Icon,
  TextBoldIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  formState: ProfileFormState;
  errors: ReturnType<typeof validateForm>["errors"];
  onChange: <K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K],
  ) => void;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface MarkdownAction {
  label: string;
  chineseLabel: string;
  icon: ReactNode;
  before: string;
  after: string;
  placeholder: string;
  chinesePlaceholder: string;
  block?: boolean;
}

const ACTIONS: ReadonlyArray<MarkdownAction> = [
  {
    label: "Bold",
    chineseLabel: "粗体",
    icon: <Icon icon={TextBoldIcon} size={16} />,
    before: "**",
    after: "**",
    placeholder: "bold text",
    chinesePlaceholder: "粗体文本",
  },
  {
    label: "Italic",
    chineseLabel: "斜体",
    icon: <Icon icon={TextItalicIcon} size={16} />,
    before: "*",
    after: "*",
    placeholder: "italic text",
    chinesePlaceholder: "斜体文本",
  },
  {
    label: "Strikethrough",
    chineseLabel: "删除线",
    icon: <Icon icon={TextStrikethroughIcon} size={16} />,
    before: "~~",
    after: "~~",
    placeholder: "strikethrough",
    chinesePlaceholder: "删除线文本",
  },
  {
    label: "Link",
    chineseLabel: "链接",
    icon: <Icon icon={Link01Icon} size={16} />,
    before: "[",
    after: "](https://)",
    placeholder: "link text",
    chinesePlaceholder: "链接文本",
  },
  {
    label: "Bulleted list",
    chineseLabel: "项目符号列表",
    icon: <Icon icon={LeftToRightListBulletIcon} size={16} />,
    before: "- ",
    after: "",
    placeholder: "list item",
    chinesePlaceholder: "列表项",
    block: true,
  },
];

export function ProfileForm({ formState, errors, onChange }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPreview, setIsPreview] = useState(false);
  const remaining = MAX_BIO_LENGTH - formState.description.length;
  const counterTone =
    remaining < 0 ? "error" : remaining < 30 ? "warning" : "subtle";

  function applyAction(action: MarkdownAction) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const value = formState.description;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const scrollTop = textarea.scrollTop;
    const hasSelection = start !== end;
    const selected = hasSelection ? value.substring(start, end) : "";

    let newValue: string;
    let cursorStart: number;
    let cursorEnd: number;

    if (action.block) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const alreadyPrefixed = value
        .substring(lineStart)
        .startsWith(action.before);
      if (alreadyPrefixed) {
        newValue = value;
        cursorStart = start;
        cursorEnd = end;
      } else {
        newValue =
          value.substring(0, lineStart) +
          action.before +
          value.substring(lineStart);
        cursorStart = start + action.before.length;
        cursorEnd = end + action.before.length;
      }
    } else {
      const insertText =
        selected || t(action.placeholder, action.chinesePlaceholder);
      newValue =
        value.substring(0, start) +
        action.before +
        insertText +
        action.after +
        value.substring(end);
      if (hasSelection) {
        cursorStart = start + action.before.length;
        cursorEnd = end + action.before.length;
      } else {
        cursorStart = start + action.before.length;
        cursorEnd = cursorStart + insertText.length;
      }
    }

    onChange("description", newValue);
    requestAnimationFrame(() => {
      const node = textareaRef.current;
      if (!node) return;
      node.focus({ preventScroll: true });
      node.setSelectionRange(cursorStart, cursorEnd);
      node.scrollTop = scrollTop;
    });
  }

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT, delay: 0.06 }}
      className="flex w-full flex-col gap-2"
    >
      <div className="flex items-center justify-between px-4">
        <Text variant="body-medium" as="span">
          {t("Bio", "简介")}
        </Text>
        <Text
          variant="small"
          as="span"
          tone={counterTone}
          tabular
          motion="colors"
        >
          {t(
            `${Math.max(remaining, 0)} left`,
            `剩余 ${Math.max(remaining, 0)} 个字符`,
          )}
        </Text>
      </div>
      <div className="flex items-center gap-1 px-2">
        <div
          className={cn(
            "flex items-center gap-1 transition-opacity",
            isPreview && "pointer-events-none opacity-40",
          )}
          aria-hidden={isPreview}
        >
          {ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              aria-label={t(action.label, action.chineseLabel)}
              title={t(action.label, action.chineseLabel)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyAction(action)}
              disabled={isPreview}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground-base"
            >
              {action.icon}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={isPreview}
          onClick={() => setIsPreview((v) => !v)}
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-caption font-medium text-foreground-body transition-colors hover:bg-surface-hover hover:text-foreground-base"
        >
          {isPreview ? (
            <Icon icon={EyeClosedIcon} size={14} />
          ) : (
            <Icon icon={EyeIcon} size={14} />
          )}
          {isPreview ? t("Edit", "编辑") : t("Preview", "预览")}
        </button>
      </div>
      {isPreview ? (
        <div
          className={cn(
            "min-h-[8.75rem] w-full rounded-3xl border border-border-base bg-surface px-4 py-2.5",
            "text-body leading-5.5 text-foreground-base",
          )}
        >
          {formState.description.trim() ? (
            <div
              className={cn(
                "max-w-none text-body leading-5.5 break-words text-foreground-base",
                "[&_p]:my-2 [&_p]:first:mt-0 [&_p]:last:mb-0",
                "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
                "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
                "[&_li]:my-1 [&_li]:pl-1",
                "[&_li>p]:my-0",
                "[&_a]:text-brand-hover [&_a]:underline [&_a]:hover:text-accent-strong",
                "[&_strong]:font-semibold",
                "[&_em]:italic",
                "[&_del]:text-foreground-tertiary [&_del]:line-through",
                "[&_code]:rounded [&_code]:bg-surface-hover [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-body-sm [&_code]:leading-inherit",
                "[&_blockquote]:border-l-2 [&_blockquote]:border-border-strong [&_blockquote]:pl-3 [&_blockquote]:text-foreground-secondary",
                "[&_h1]:my-2 [&_h1]:text-body-lg [&_h1]:font-semibold",
                "[&_h2]:my-2 [&_h2]:text-body-lg [&_h2]:font-semibold",
                "[&_h3]:my-2 [&_h3]:text-body [&_h3]:font-semibold",
              )}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {formState.description}
              </ReactMarkdown>
            </div>
          ) : (
            <Text variant="body" as="span" tone="subtle">
              {t("Nothing to preview yet.", "暂无可预览内容。")}
            </Text>
          )}
        </div>
      ) : (
        <Input
          ref={textareaRef}
          id="profile-bio"
          label={t("Bio", "简介")}
          hideLabel
          type="textarea"
          rows={5}
          placeholder={t(
            "Tell people what you build, the workflows you ship, and what you care about.",
            "介绍你构建的内容、发布的工作流，以及你关注的领域。",
          )}
          value={formState.description}
          error={errors.description}
          onChange={(e) => onChange("description", e.target.value)}
          // oxlint-disable-next-line design-system/no-restyle -- the bio textarea is a speech-bubble shape with a thin scrollbar
          className="scrollbar-thin scrollbar-thumb-surface-active scrollbar-track-transparent !rounded-3xl !rounded-tr-md hover:scrollbar-thumb-border-strong"
        />
      )}
    </motion.div>
  );
}
