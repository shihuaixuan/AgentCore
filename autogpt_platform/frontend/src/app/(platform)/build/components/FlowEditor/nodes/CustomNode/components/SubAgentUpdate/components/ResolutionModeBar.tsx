import { useTranslation } from "@/lib/i18n/LanguageProvider";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/Tooltip/BaseTooltip";
import { IncompatibilityInfo } from "@/app/(platform)/build/hooks/useSubAgentUpdate/types";
import { Alert01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";

type ResolutionModeBarProps = {
  incompatibilities: IncompatibilityInfo | null;
};

export function ResolutionModeBar({
  incompatibilities,
}: ResolutionModeBarProps): React.ReactElement {
  const { t } = useTranslation();
  const renderIncompatibilities = () => {
    if (!incompatibilities)
      return <span>{t("No incompatibilities", "没有不兼容项")}</span>;

    const sections: React.ReactNode[] = [];

    if (incompatibilities.missingInputs.length > 0) {
      sections.push(
        <div key="missing-inputs" className="mb-1">
          <Text variant="small-semibold-tight" as="span" tone="inherit">
            {t("Missing inputs: ", "缺失输入：")}
          </Text>
          {incompatibilities.missingInputs.map((name, i) => (
            <React.Fragment key={name}>
              <Text variant="small-mono-tight" as="code" tone="inherit">
                {name}
              </Text>
              {i < incompatibilities.missingInputs.length - 1 && ", "}
            </React.Fragment>
          ))}
        </div>,
      );
    }
    if (incompatibilities.missingOutputs.length > 0) {
      sections.push(
        <div key="missing-outputs" className="mb-1">
          <Text variant="small-semibold-tight" as="span" tone="inherit">
            {t("Missing outputs: ", "缺失输出：")}
          </Text>
          {incompatibilities.missingOutputs.map((name, i) => (
            <React.Fragment key={name}>
              <Text variant="small-mono-tight" as="code" tone="inherit">
                {name}
              </Text>
              {i < incompatibilities.missingOutputs.length - 1 && ", "}
            </React.Fragment>
          ))}
        </div>,
      );
    }
    if (incompatibilities.newRequiredInputs.length > 0) {
      sections.push(
        <div key="new-required" className="mb-1">
          <Text variant="small-semibold-tight" as="span" tone="inherit">
            {t("New required inputs: ", "新增必填输入：")}
          </Text>
          {incompatibilities.newRequiredInputs.map((name, i) => (
            <React.Fragment key={name}>
              <Text variant="small-mono-tight" as="code" tone="inherit">
                {name}
              </Text>
              {i < incompatibilities.newRequiredInputs.length - 1 && ", "}
            </React.Fragment>
          ))}
        </div>,
      );
    }
    if (incompatibilities.inputTypeMismatches.length > 0) {
      sections.push(
        <div key="type-mismatches" className="mb-1">
          <Text variant="small-semibold-tight" as="span" tone="inherit">
            {t("Type changed: ", "类型变更：")}
          </Text>
          {incompatibilities.inputTypeMismatches.map((m, i) => (
            <React.Fragment key={m.name}>
              <Text variant="small-mono-tight" as="code" tone="inherit">
                {m.name}
              </Text>
              <span className="text-foreground-subtle">
                {" "}
                ({m.oldType} → {m.newType})
              </span>
              {i < incompatibilities.inputTypeMismatches.length - 1 && ", "}
            </React.Fragment>
          ))}
        </div>,
      );
    }

    return <>{sections}</>;
  };

  return (
    <div className="flex items-center justify-between gap-2 rounded-t-xl bg-warning-surface px-3 py-2">
      <div className="flex items-center gap-2">
        <Icon icon={Alert01Icon} tone="warning" className="h-4 w-4" />
        <Text variant="body-tight" tone="warning" as="span">
          {t("Remove incompatible connections", "移除不兼容的连接")}
        </Text>
        <Tooltip>
          <TooltipTrigger asChild>
            <Icon
              icon={InformationCircleIcon}
              tone="warning-bright"
              className="h-4 w-4 cursor-help"
            />
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <Text
              variant="small-semibold-lh-normal"
              tone="inherit"
              className="mb-2"
            >
              {t("Incompatible changes:", "不兼容的变更：")}
            </Text>
            <Text variant="small-tight" tone="inherit" as="div">
              {renderIncompatibilities()}
            </Text>
            <Text variant="small-tight" tone="subtle" className="mt-2">
              {(incompatibilities?.newRequiredInputs.length ?? 0) > 0
                ? t(
                    "Replace / delete the red connections to continue",
                    "替换或删除红色连接以继续",
                  )
                : t(
                    "Delete the red connections to continue",
                    "删除红色连接以继续",
                  )}
            </Text>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
