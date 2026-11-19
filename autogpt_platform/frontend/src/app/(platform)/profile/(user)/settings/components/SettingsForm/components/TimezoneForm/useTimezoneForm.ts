"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/molecules/Toast/use-toast";
import type { User } from "@/lib/auth/types";
import {
  usePostV1UpdateUserTimezone,
  getGetV1GetUserTimezoneQueryKey,
} from "@/app/api/__generated__/endpoints/auth/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

type FormData = { timezone: string };

type UseTimezoneFormProps = {
  user: User;
  currentTimezone: string;
};

export const useTimezoneForm = ({ currentTimezone }: UseTimezoneFormProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const formSchema = z.object({
    timezone: z.string().min(1, t("Please select a timezone", "请选择时区")),
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timezone: currentTimezone,
    },
  });

  const updateTimezone = usePostV1UpdateUserTimezone();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await updateTimezone.mutateAsync({
        data: { timezone: data.timezone } as any,
      });

      // Invalidate the timezone query to refetch the updated value
      await queryClient.invalidateQueries({
        queryKey: getGetV1GetUserTimezoneQueryKey(),
      });

      toast({
        title: t("Success", "成功"),
        description: t(
          "Your timezone has been updated successfully.",
          "你的时区已更新。",
        ),
        variant: "success",
      });
    } catch {
      toast({
        title: t("Error", "错误"),
        description: t(
          "Failed to update timezone. Please try again.",
          "更新时区失败，请重试。",
        ),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    onSubmit,
    isLoading,
  };
};
