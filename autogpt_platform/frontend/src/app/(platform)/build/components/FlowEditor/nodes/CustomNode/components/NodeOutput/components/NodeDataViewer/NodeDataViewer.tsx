import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/atoms/Tooltip/BaseTooltip";
import {
  OutputActions,
  OutputItem,
} from "@/components/contextual/OutputRenderers";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { beautifyString } from "@/lib/utils";
import React, { FC } from "react";
import { useNodeDataViewer } from "./useNodeDataViewer";
import { useNodeStore } from "@/app/(platform)/build/stores/nodeStore";
import { useShallow } from "zustand/react/shallow";
import { NodeDataType } from "../../helpers";
import {
  ArrowExpand01Icon,
  Copy01Icon,
  Download04Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export interface NodeDataViewerProps {
  data?: any;
  pinName: string;
  nodeId?: string;
  execId?: string;
  isViewMoreData?: boolean;
  dataType?: NodeDataType;
}

export const NodeDataViewer: FC<NodeDataViewerProps> = ({
  data,
  pinName,
  nodeId,
  execId = "N/A",
  isViewMoreData = false,
  dataType = "output",
}) => {
  const { t } = useTranslation();
  const executionResults = useNodeStore(
    useShallow((state) =>
      nodeId ? state.getNodeExecutionResults(nodeId) : [],
    ),
  );
  const latestInputData = useNodeStore(
    useShallow((state) =>
      nodeId ? state.getLatestNodeInputData(nodeId) : undefined,
    ),
  );
  const accumulatedOutputData = useNodeStore(
    useShallow((state) =>
      nodeId ? state.getAccumulatedNodeOutputData(nodeId) : {},
    ),
  );

  const resolvedData =
    data ??
    (dataType === "input"
      ? (latestInputData ?? {})
      : (accumulatedOutputData[pinName] ?? []));

  const {
    outputItems,
    copyExecutionId,
    handleCopyItem,
    handleDownloadItem,
    dataArray,
    copiedIndex,
    groupedExecutions,
    totalGroupedItems,
    handleCopyGroupedItem,
    handleDownloadGroupedItem,
    copiedKey,
  } = useNodeDataViewer(
    resolvedData,
    pinName,
    execId,
    executionResults,
    dataType,
  );

  const shouldGroupExecutions = groupedExecutions.length > 0;
  return (
    <Dialog title={t("Data Preview", "数据预览")} styling={{ width: "600px" }}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Dialog.Trigger>
              <Button
                variant="secondary"
                size="icon-sm"
                shape="pill"
                tone="base"
              >
                <Icon
                  icon={ArrowExpand01Icon}
                  size={isViewMoreData ? 16 : 12}
                />
              </Button>
            </Dialog.Trigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("View Data", "查看数据")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Dialog.Content>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Text variant="large-medium" tone="primary">
                {dataType === "input"
                  ? t("Full Input Preview", "完整输入预览")
                  : t("Full Output Preview", "完整输出预览")}
              </Text>
            </div>
            <div className="rounded-full border border-border-strong bg-surface-hover px-3 py-1.5">
              <Text variant="small-medium-tight" as="div">
                {t(
                  `${shouldGroupExecutions ? totalGroupedItems : dataArray.length} item${(shouldGroupExecutions ? totalGroupedItems : dataArray.length) !== 1 ? "s" : ""} total`,
                  `共 ${shouldGroupExecutions ? totalGroupedItems : dataArray.length} 项`,
                )}
              </Text>
            </div>
          </div>
          <Text variant="body-tight" tone="secondary" as="div">
            {shouldGroupExecutions ? (
              <div>
                {t("Pin: ", "连接点：")}
                <Text variant="body-semibold-tight" as="span" tone="inherit">
                  {beautifyString(pinName)}
                </Text>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Text variant="body" tone="secondary">
                    {t("Execution ID:", "运行 ID：")}
                  </Text>
                  <div className="rounded-full border border-border-strong bg-surface-muted px-2 py-1">
                    <Text variant="small-medium-mono-tight" as="p">
                      {execId}
                    </Text>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-2xs"
                    shape="pill"
                    onClick={copyExecutionId}
                  >
                    <Icon icon={Copy01Icon} size={14} />
                  </Button>
                </div>
                <div className="mt-2">
                  {t("Pin: ", "连接点：")}
                  <Text variant="body-semibold-tight" as="span" tone="inherit">
                    {beautifyString(pinName)}
                  </Text>
                </div>
              </>
            )}
          </Text>
        </div>

        <div className="flex-1">
          <div className="my-4">
            {shouldGroupExecutions ? (
              <div className="space-y-4">
                {groupedExecutions.map((execution) => (
                  <div
                    key={execution.execId}
                    className="rounded-3xl border border-node-border bg-surface p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Text variant="body" tone="secondary">
                        {t("Execution ID:", "运行 ID：")}
                      </Text>
                      <div className="rounded-full border border-border-strong bg-surface-muted px-2 py-1">
                        <Text variant="small-medium-mono-tight" as="p">
                          {execution.execId}
                        </Text>
                      </div>
                    </div>
                    <div className="mt-2 space-y-4">
                      {execution.outputItems.length > 0 ? (
                        execution.outputItems.map((item, index) => (
                          <div key={item.key} className="group">
                            <OutputItem
                              value={item.value}
                              metadata={item.metadata}
                              renderer={item.renderer}
                            />
                            <div className="mt-2 flex gap-3">
                              <Button
                                variant="secondary"
                                size="icon-xs"
                                shape="pill"
                                withTooltip={false}
                                onClick={() =>
                                  handleCopyGroupedItem(
                                    execution.execId,
                                    index,
                                    item,
                                  )
                                }
                                aria-label={t("Copy item", "复制项目")}
                              >
                                {copiedKey ===
                                `${execution.execId}-${index}` ? (
                                  <Icon
                                    icon={Tick02Icon}
                                    tone="success"
                                    className="size-4"
                                  />
                                ) : (
                                  <Icon
                                    icon={Copy01Icon}
                                    tone="base"
                                    className="size-4"
                                  />
                                )}
                              </Button>
                              <Button
                                variant="secondary"
                                size="icon-xs"
                                shape="pill"
                                withTooltip={false}
                                onClick={() => handleDownloadGroupedItem(item)}
                                aria-label={t("Download item", "下载项目")}
                              >
                                <Icon
                                  icon={Download04Icon}
                                  tone="base"
                                  className="size-4"
                                />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-foreground-tertiary">
                          {t("No data available", "暂无数据")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : dataArray.length > 0 ? (
              <div className="space-y-4">
                {outputItems.map((item, index) => (
                  <div key={item.key} className="group">
                    <OutputItem
                      value={item.value}
                      metadata={item.metadata}
                      renderer={item.renderer}
                    />
                    <div className="mt-2 flex gap-3">
                      <Button
                        variant="secondary"
                        size="icon-xs"
                        shape="pill"
                        withTooltip={false}
                        onClick={() => handleCopyItem(index)}
                        aria-label={t("Copy item", "复制项目")}
                      >
                        {copiedIndex === index ? (
                          <Icon
                            icon={Tick02Icon}
                            tone="success"
                            className="size-4"
                          />
                        ) : (
                          <Icon
                            icon={Copy01Icon}
                            tone="base"
                            className="size-4"
                          />
                        )}
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon-xs"
                        shape="pill"
                        withTooltip={false}
                        onClick={() => handleDownloadItem(index)}
                        aria-label={t("Download item", "下载项目")}
                      >
                        <Icon
                          icon={Download04Icon}
                          tone="base"
                          className="size-4"
                        />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-foreground-tertiary">
                {t("No data available", "暂无数据")}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          {outputItems.length > 1 && (
            <OutputActions
              items={outputItems.map((item) => ({
                value: item.value,
                metadata: item.metadata,
                renderer: item.renderer,
              }))}
              isPrimary
            />
          )}
        </div>
      </Dialog.Content>
    </Dialog>
  );
};
