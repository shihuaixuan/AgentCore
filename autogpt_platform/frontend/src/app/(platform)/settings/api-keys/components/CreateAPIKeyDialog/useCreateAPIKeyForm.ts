"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { z } from "zod";

import { useCreateAPIKey } from "../hooks/useCreateAPIKey";
import { createAPIKeySchema, type CreateAPIKeyFormValues } from "./schema";

type View = "form" | "success";

interface Args {
  onClose: () => void;
}

export function useCreateAPIKeyForm({ onClose }: Args) {
  const { t } = useTranslation();
  const localizedSchema = createAPIKeySchema.extend({
    name: z
      .string()
      .trim()
      .min(1, t("Name is required", "请输入名称"))
      .max(
        100,
        t("Name must be 100 characters or less", "名称不能超过 100 个字符"),
      ),
    description: z
      .string()
      .trim()
      .max(
        500,
        t(
          "Description must be 500 characters or less",
          "说明不能超过 500 个字符",
        ),
      )
      .optional(),
    permissions: createAPIKeySchema.shape.permissions.min(
      1,
      t("Select at least one permission", "请至少选择一项权限"),
    ),
  });
  const [view, setView] = useState<View>("form");
  const [plainTextKey, setPlainTextKey] = useState("");
  const { createKey, isPending } = useCreateAPIKey();

  const form = useForm<CreateAPIKeyFormValues>({
    resolver: zodResolver(localizedSchema),
    defaultValues: { name: "", description: "", permissions: [] },
    mode: "onChange",
  });

  async function handleSubmit(values: CreateAPIKeyFormValues) {
    try {
      const result = await createKey({
        name: values.name,
        description: values.description || null,
        permissions: values.permissions,
      });
      setPlainTextKey(result.plain_text_key);
      setView("success");
    } catch {
      // Toast is surfaced by useCreateAPIKey; keep form open so user can retry.
    }
  }

  function handleClose() {
    setView("form");
    setPlainTextKey("");
    form.reset();
    onClose();
  }

  return {
    form,
    view,
    plainTextKey,
    isPending,
    handleSubmit,
    handleClose,
  };
}
