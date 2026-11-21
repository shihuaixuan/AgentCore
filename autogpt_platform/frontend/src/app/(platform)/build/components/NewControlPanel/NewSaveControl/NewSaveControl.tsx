import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { FormProvider } from "react-hook-form";
import { Card, CardContent, CardFooter } from "@/components/atoms/Card/Card";
import { FormField } from "@/components/molecules/Form/Form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/molecules/Popover/Popover";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@/components/atoms/Tooltip/BaseTooltip";
import { useControlPanelStore } from "../../../stores/controlPanelStore";
import { ControlPanelButton } from "../ControlPanelButton";
import { useNewSaveControl } from "./useNewSaveControl";
import { FloppyDiskIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export const NewSaveControl = () => {
  const { t } = useTranslation();
  const { form, isSaving, graphVersion, handleSave } = useNewSaveControl();
  const { saveControlOpen, setSaveControlOpen, forceOpenSave } =
    useControlPanelStore();
  const saveLabel = t("Save", "保存");

  return (
    <Popover
      onOpenChange={(open) => {
        if (!forceOpenSave || open) {
          setSaveControlOpen(open);
        }
      }}
      open={forceOpenSave ? true : saveControlOpen}
    >
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <ControlPanelButton
              as="button"
              aria-label={saveLabel}
              aria-keyshortcuts="Control+S Meta+S"
              data-id="save-control-popover-trigger"
              data-testid="save-control-save-button"
              selected={saveControlOpen}
              className="rounded-none"
            >
              <Icon icon={FloppyDiskIcon} className="size-5" />
            </ControlPanelButton>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent side="right">{saveLabel} (Ctrl/⌘ + S)</TooltipContent>
        </TooltipPortal>
      </Tooltip>
      <PopoverContent
        side="right"
        sideOffset={15}
        align="start"
        data-id="save-control-popover-content"
        className="w-96 max-w-[400px] rounded-xlarge border-border-base text-foreground-base"
      >
        <Card variant="outlined" className="border-none">
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleSave)}>
              <CardContent className="p-0">
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field, fieldState: { error } }) => (
                      <Input
                        id="name"
                        label={t("Name", "名称")}
                        size="small"
                        placeholder={t(
                          "Enter your workflow name",
                          "输入工作流名称",
                        )}
                        data-id="save-control-name-input"
                        data-testid="save-control-name-input"
                        maxLength={100}
                        aria-invalid={!!error}
                        error={
                          error?.type === "too_small"
                            ? t("Name is required", "请填写名称")
                            : error?.type === "too_big"
                              ? t(
                                  "Name must be at most 100 characters",
                                  "名称不能超过 100 个字符",
                                )
                              : error?.message
                        }
                        wrapperClassName="!mb-0"
                        {...field}
                      />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field, fieldState: { error } }) => (
                      <Input
                        id="description"
                        size="small"
                        label={t("Description", "描述")}
                        placeholder={t(
                          "Your workflow description",
                          "工作流描述",
                        )}
                        data-id="save-control-description-input"
                        data-testid="save-control-description-input"
                        maxLength={500}
                        aria-invalid={!!error}
                        error={
                          error?.type === "too_big"
                            ? t(
                                "Description must be at most 500 characters",
                                "描述不能超过 500 个字符",
                              )
                            : error?.message
                        }
                        wrapperClassName="!mb-0"
                        {...field}
                      />
                    )}
                  />

                  {graphVersion && (
                    <Input
                      id="version"
                      placeholder={t("Version", "版本")}
                      size="small"
                      value={graphVersion || "-"}
                      disabled
                      data-testid="save-control-version-output"
                      data-tutorial-id="save-control-version-output"
                      label={t("Version", "版本")}
                      wrapperClassName="!mb-0"
                    />
                  )}
                </div>
              </CardContent>
              {/* TODO: Add a cron schedule button */}
              <CardFooter className="mt-3 flex flex-col items-stretch gap-2 p-0">
                <Button
                  variant="primary"
                  type="submit"
                  size="small"
                  className="w-full"
                  data-id="save-control-save-agent"
                  data-testid="save-control-save-agent-button"
                  disabled={isSaving}
                  loading={isSaving}
                >
                  {t("Save Workflow", "保存工作流")}
                </Button>
              </CardFooter>
            </form>
          </FormProvider>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
