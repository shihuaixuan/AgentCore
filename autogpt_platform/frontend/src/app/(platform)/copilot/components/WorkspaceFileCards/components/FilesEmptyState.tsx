"use client";

import {
  File02Icon,
  Image01Icon,
  Table01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { PanelEmptyState } from "../../ContextPanel/components/PanelEmptyState/PanelEmptyState";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

// Only Otto's chats reach this: an expert's chat always lists that expert's
// documents instead.
export function FilesEmptyState() {
  const { t } = useTranslation();
  return (
    <PanelEmptyState
      tiles={[
        <Icon key="image" icon={Image01Icon} size={22} className="text-sky" />,
        <Icon key="table" icon={Table01Icon} size={22} tone="success" />,
        <Icon key="doc" icon={File02Icon} size={22} tone="brand" />,
      ]}
      title={t("No files yet", "暂无文件")}
      description={t(
        "Files you attach and documents Otto creates in this chat will show up here.",
        "你添加的附件和 Otto 在此对话中创建的文档会显示在这里。",
      )}
    />
  );
}
