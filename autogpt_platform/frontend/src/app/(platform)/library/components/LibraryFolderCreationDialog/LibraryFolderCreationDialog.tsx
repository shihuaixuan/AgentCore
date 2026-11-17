"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Select } from "@/components/atoms/Select/Select";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/molecules/Form/Form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import dynamic from "next/dynamic";
import {
  usePostV2CreateFolder,
  getGetV2ListLibraryFoldersQueryKey,
} from "@/app/api/__generated__/endpoints/folders/folders";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { FOLDER_COLORS } from "../folder-constants";
import { Folder01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

const LazyEmojiPicker = dynamic(
  () =>
    import("../LazyEmojiPicker").then((mod) => ({
      default: mod.LazyEmojiPicker,
    })),
  { ssr: false },
);

export const libraryFolderCreationFormSchema = z.object({
  folderName: z
    .string()
    .min(1, "Folder name is required")
    .max(100, "Folder name must be 100 characters or less"),
  folderColor: z.string().min(1, "Folder color is required"),
  folderIcon: z.string().min(1, "Folder icon is required"),
});

export default function LibraryFolderCreationDialog() {
  const { t } = useTranslation();
  const localizedSchema = z.object({
    folderName: z
      .string()
      .min(1, t("Folder name is required", "请输入文件夹名称"))
      .max(
        100,
        t(
          "Folder name must be 100 characters or less",
          "文件夹名称不能超过 100 个字符",
        ),
      ),
    folderColor: z
      .string()
      .min(1, t("Folder color is required", "请选择文件夹颜色")),
    folderIcon: z
      .string()
      .min(1, t("Folder icon is required", "请选择文件夹图标")),
  });
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate: createFolder, isPending } = usePostV2CreateFolder({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetV2ListLibraryFoldersQueryKey(),
        });
        setIsOpen(false);
        form.reset();
        toast({
          title: t("Folder created", "文件夹已创建"),
          description: t(
            "Your folder has been created successfully.",
            "文件夹已成功创建。",
          ),
        });
      },
      onError: () => {
        toast({
          title: t("Error", "错误"),
          description: t(
            "Failed to create folder. Please try again.",
            "创建文件夹失败，请重试。",
          ),
          variant: "destructive",
        });
      },
    },
  });

  const form = useForm<z.infer<typeof libraryFolderCreationFormSchema>>({
    resolver: zodResolver(localizedSchema),
    defaultValues: {
      folderName: "",
      folderColor: "",
      folderIcon: "",
    },
  });

  function onSubmit(values: z.infer<typeof libraryFolderCreationFormSchema>) {
    createFolder({
      data: {
        name: values.folderName.trim(),
        color: values.folderColor,
        icon: values.folderIcon,
      },
    });
  }

  return (
    <Dialog
      title={t("Create Folder", "创建文件夹")}
      styling={{ maxWidth: "30rem" }}
      controlled={{
        isOpen,
        set: setIsOpen,
      }}
      onClose={() => {
        setIsOpen(false);
      }}
    >
      <Dialog.Trigger>
        <Button
          data-testid="upload-agent-button"
          variant="secondary"
          className="h-fit w-fit"
          size="small"
        >
          <Icon icon={Folder01Icon} width={18} height={18} />
          <span>{t("Create folder", "创建文件夹")}</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Form
          form={form}
          onSubmit={(values) => onSubmit(values)}
          // oxlint-disable-next-line design-system/no-restyle -- the folder form spaces its fields; Form has no gap or padding option
          className="flex flex-col justify-center gap-2 px-1"
        >
          <FormField
            control={form.control}
            name="folderName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    id={field.name}
                    label={t("Folder name", "文件夹名称")}
                    placeholder={t("Enter folder name", "输入文件夹名称")}
                    className="!mb-0 w-full"
                    wrapperClassName="!mb-0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="folderColor"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select
                    id="folderColor"
                    label={t("Folder color", "文件夹颜色")}
                    placeholder={t("Select a color", "选择颜色")}
                    value={field.value}
                    onValueChange={field.onChange}
                    options={FOLDER_COLORS.map((color) => ({
                      value: color.value,
                      label: t(
                        color.label,
                        (
                          {
                            Blue: "蓝色",
                            Purple: "紫色",
                            Green: "绿色",
                            Orange: "橙色",
                            Pink: "粉色",
                          } as Record<string, string>
                        )[color.label] ?? color.label,
                      ),
                      icon: (
                        <div
                          className="h-4 w-4 rounded-full"
                          // oxlint-disable-next-line design-system/no-inline-styles -- the swatch shows the folder colour, a runtime value
                          style={{ backgroundColor: color.value }}
                        />
                      ),
                    }))}
                    wrapperClassName="!mb-0"
                    renderItem={(option) => (
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="folderIcon"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-col gap-2">
                  <Text variant="large-medium" as="span">
                    {t("Folder icon", "文件夹图标")}
                  </Text>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Text variant="small" tone="muted">
                        {t("Selected:", "已选择：")}
                      </Text>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-base bg-surface-muted text-heading-md">
                        {form.watch("folderIcon") || (
                          <span className="text-body text-foreground-subtle">
                            —
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-[295px] w-full overflow-hidden">
                      <LazyEmojiPicker
                        onEmojiSelect={(emoji) => {
                          field.onChange(emoji);
                        }}
                      />
                    </div>
                  </div>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            variant="primary"
            className="mt-2 min-w-[18rem]"
            disabled={!form.formState.isValid || isPending}
            loading={isPending}
          >
            {t("Create", "创建")}
          </Button>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
}
