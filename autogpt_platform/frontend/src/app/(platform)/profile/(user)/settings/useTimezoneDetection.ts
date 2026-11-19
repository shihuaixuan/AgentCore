import { useCallback, useEffect, useRef } from "react";
import { usePostV1UpdateUserTimezone } from "@/app/api/__generated__/endpoints/auth/auth";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

/**
 * Hook to automatically detect and set user's timezone if it's not set
 * @param currentTimezone - The current timezone value from the backend
 * @returns Object with detection status and manual trigger function
 */
export const useTimezoneDetection = (currentTimezone?: string) => {
  const { t } = useTranslation();
  const updateTimezone = usePostV1UpdateUserTimezone();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const hasAttemptedDetection = useRef(false);

  const detectAndSetTimezone = useCallback(async () => {
    // Mark that we've attempted detection to prevent multiple attempts
    hasAttemptedDetection.current = true;

    try {
      // Detect browser timezone
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      if (!browserTimezone) {
        console.error("Could not detect browser timezone");
        return;
      }

      // Fire-and-forget timezone update - we don't need to wait for response
      updateTimezone.mutate({
        data: { timezone: browserTimezone } as any,
      });

      // Invalidate queries to refresh the data
      await queryClient.invalidateQueries({
        queryKey: ["/api/auth/user/timezone"],
      });

      // Show success notification
      toast({
        title: t("Timezone detected", "已检测到时区"),
        description: t(
          `We've set your timezone to ${browserTimezone}. You can change this in settings.`,
          `已将你的时区设为 ${browserTimezone}。你可以在设置中更改。`,
        ),
        variant: "success",
      });

      return browserTimezone;
    } catch (error) {
      console.error("Failed to auto-detect timezone:", error);
      // Silent failure - don't show error toast for auto-detection
      // User can still manually set timezone in settings
    }
  }, [updateTimezone, queryClient, toast, t]);

  useEffect(() => {
    // Only proceed if timezone is "not-set" and we haven't already attempted detection
    if (currentTimezone !== "not-set" || hasAttemptedDetection.current) {
      return;
    }

    detectAndSetTimezone();
  }, [currentTimezone, detectAndSetTimezone]);

  return {
    isNotSet: currentTimezone === "not-set",
  };
};
