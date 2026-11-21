import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/molecules/Accordion/Accordion";
import type { RJSFSchema } from "@rjsf/utils";
import { getOutputPinLabel } from "./pinLabel";
import { NodeDataViewer } from "./components/NodeDataViewer/NodeDataViewer";
import { ContentRenderer } from "./components/ContentRenderer";
import { useNodeOutput } from "./useNodeOutput";
import { ViewMoreData } from "./components/ViewMoreData";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export const NodeDataRenderer = ({
  nodeId,
  builtInOutputSchema,
}: {
  nodeId: string;
  builtInOutputSchema?: RJSFSchema;
}) => {
  const { t, locale } = useTranslation();
  const {
    latestOutputData,
    copiedKey,
    handleCopy,
    executionResultId,
    latestInputData,
  } = useNodeOutput(nodeId);

  if (Object.keys(latestOutputData).length === 0) {
    return null;
  }

  return (
    <div
      data-tutorial-id={`node-output`}
      className="rounded-b-xl border-t border-border-base px-4 py-2"
    >
      <Accordion type="single" collapsible defaultValue="node-output">
        <AccordionItem value="node-output" className="border-none">
          <AccordionTrigger className="py-2 hover:no-underline">
            <Text variant="body-semibold" tone="body">
              {t("Node Output", "节点输出")}
            </Text>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="flex max-w-[350px] flex-col gap-4">
              <div className="space-y-2">
                <Text variant="small-medium">{t("Input", "输入")}</Text>

                <ContentRenderer value={latestInputData} shortContent={true} />

                <div className="mt-1 flex justify-end gap-1">
                  <NodeDataViewer
                    pinName="Input"
                    pinLabel={t("Input", "输入")}
                    nodeId={nodeId}
                    execId={executionResultId}
                    dataType="input"
                  />
                  <Button
                    variant={copiedKey === "input" ? "success" : "secondary"}
                    size="icon-sm"
                    shape="pill"
                    onClick={() => handleCopy("input", latestInputData)}
                    tone="base"
                  >
                    {copiedKey === "input" ? (
                      <Icon icon={Tick02Icon} size={12} tone="success" />
                    ) : (
                      <Icon icon={Copy01Icon} size={12} />
                    )}
                  </Button>
                </div>
              </div>

              {Object.entries(latestOutputData)
                .slice(0, 2)
                .map(([key, value]) => {
                  return (
                    <div key={key} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Text variant="small-semibold" tone="secondary">
                          {t("Pin:", "端口：")}
                        </Text>
                        <Text variant="small" tone="body">
                          {getOutputPinLabel(key, builtInOutputSchema, locale)}
                        </Text>
                      </div>
                      <div className="w-full space-y-2">
                        <Text variant="small-semibold" tone="secondary">
                          {t("Data:", "数据：")}
                        </Text>
                        <div className="relative space-y-2">
                          {value.slice(0, 3).map((item, index) => (
                            <div key={index}>
                              <ContentRenderer
                                value={item}
                                shortContent={true}
                              />
                            </div>
                          ))}

                          <div className="mt-1 flex justify-end gap-1">
                            <NodeDataViewer
                              pinName={key}
                              pinLabel={getOutputPinLabel(
                                key,
                                builtInOutputSchema,
                                locale,
                              )}
                              nodeId={nodeId}
                              execId={executionResultId}
                            />
                            <Button
                              variant={
                                copiedKey === key ? "success" : "secondary"
                              }
                              size="icon-sm"
                              shape="pill"
                              onClick={() => handleCopy(key, value)}
                              tone="base"
                            >
                              {copiedKey === key ? (
                                <Icon
                                  icon={Tick02Icon}
                                  size={12}
                                  tone="success"
                                />
                              ) : (
                                <Icon icon={Copy01Icon} size={12} />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <ViewMoreData
              nodeId={nodeId}
              builtInOutputSchema={builtInOutputSchema}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
