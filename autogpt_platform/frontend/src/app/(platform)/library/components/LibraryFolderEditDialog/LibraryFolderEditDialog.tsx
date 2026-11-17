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
import { useToast } from "@/components/molecules/Toast/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import dynamic from "next/dynamic";
import {
  usePatchV2UpdateFolder,
  getGetV2ListLibraryFoldersQueryKey,
} from "@/app/api/__generated__/endpoints/folders/folders";
import { useQueryClient } from "@tanstack/react-query";
import type { LibraryFolder } from "@/app/api/__generated__/models/libraryFolder";
import type { getV2ListLibraryFoldersResponseSuccess } from "@/app/api/__generated__/endpoints/folders/folders";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { FOLDER_COLORS } from "../folder-constants";

const LazyEmojiPicker = dynamic(
  () =>
    import("../LazyEmojiPicker").then((mod) => ({
      default: mod.LazyEmojiPicker,
    })),
  { ssr: false },
);

interface Props {
  folder: LibraryFolder;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function LibraryFolderEditDialog({ folder, isOpen, setIsOpen }: Props) {
  const { t } = useTranslation();
  const editFolderSchema = z.object({
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
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof editFolderSchema>>({
    resolver: zodResolver(editFolderSchema),
    defaultValues: {
      folderName: folder.name,
      folderColor: folder.color ?? "",
      folderIcon: folder.icon ?? "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        folderName: folder.name,
        folderColor: folder.color ?? "",
        folderIcon: folder.icon ?? "",
      });
    }
  }, [isOpen, folder, form]);

  const { mutate: updateFolder, isPending } = usePatchV2UpdateFolder({
    mutation: {
      onMutate: async ({ folderId, data }) => {
        await queryClient.cancelQueries({
          queryKey: getGetV2ListLibraryFoldersQueryKey(),
        });

        const previousData =
          queryClient.getQueriesData<getV2ListLibraryFoldersResponseSuccess>({
            queryKey: getGetV2ListLibraryFoldersQueryKey(),
          });

        queryClient.setQueriesData<getV2ListLibraryFoldersResponseSuccess>(
          { queryKey: getGetV2ListLibraryFoldersQueryKey() },
          (old) => {
            if (!old?.data?.folders) return old;
            return {
              ...old,
              data: {
                ...old.data,
                folders: old.data.folders.map((f) =>
                  f.id === folderId
                    ? {
                        ...f,
                        name: data.name ?? f.name,
                        color: data.color ?? f.color,
                        icon: data.icon ?? f.icon,
                      }
                    : f,
                ),
              },
            };
          },
        );

        return { previousData };
      },
      onError: (error: unknown, _variables, context) => {
        if (context?.previousData) {
          for (const [queryKey, data] of context.previousData) {
            queryClient.setQueryData(queryKey, data);
          }
        }
        if (error instanceof ApiError) {
          const detail = (error.response as any)?.detail ?? "";
          if (
            typeof detail === "string" &&
            detail.toLowerCase().includes("already exists")
          ) {
            form.setError("folderName", {
              message: t(
                "A folder with this name already exists",
                "已存在同名文件夹",
              ),
            });
            return;
          }
        }
        toast({
          title: t("Error", "错误"),
          description: t(
            "Failed to update folder. Please try again.",
            "更新文件夹失败，请重试。",
          ),
          variant: "destructive",
        });
      },
      onSuccess: () => {
        setIsOpen(false);
        toast({
          title: t("Folder updated", "文件夹已更新"),
          description: t(
            "Your folder has been updated successfully.",
            "文件夹已成功更新。",
          ),
        });
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: getGetV2ListLibraryFoldersQueryKey(),
        });
      },
    },
  });

  function onSubmit(values: z.infer<typeof editFolderSchema>) {
    updateFolder({
      folderId: folder.id,
      data: {
        name: values.folderName.trim(),
        color: values.folderColor,
        icon: values.folderIcon,
      },
    });
  }

  return (
    <Dialog
      title={t("Edit Folder", "编辑文件夹")}
      styling={{ maxWidth: "30rem" }}
      controlled={{
        isOpen,
        set: setIsOpen,
      }}
    >
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
                    className="w-full"
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
                    wrapperClassName="!mb-0"
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
            {t("Save Changes", "保存更改")}
          </Button>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
}
