"use client";

import { useEffect, useRef, useState } from "react";

import {
  useGetV1GetAutoTopUp,
  usePostV1ConfigureAutoTopUp,
} from "@/app/api/__generated__/endpoints/credits/credits";
import type { AutoTopUpConfig } from "@/app/api/__generated__/models/autoTopUpConfig";
import { toast } from "@/components/molecules/Toast/use-toast";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function useAutoRefillCard() {
  const { t } = useTranslation();
  const {
    data: config,
    isLoading,
    refetch,
  } = useGetV1GetAutoTopUp({
    query: {
      select: (res) => {
        const raw = res.data as AutoTopUpConfig | undefined;
        if (!raw) return undefined;
        if (!raw.amount && !raw.threshold) return undefined;
        return raw;
      },
    },
  });

  const { mutateAsync: configureAutoTopUp, isPending: isSaving } =
    usePostV1ConfigureAutoTopUp();

  const isEnabled = Boolean(config && (config.amount || config.threshold));

  const [open, setOpen] = useState(false);
  const [threshold, setThreshold] = useState("");
  const [refillAmount, setRefillAmount] = useState("");
  const initializedForOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      initializedForOpenRef.current = false;
      return;
    }
    // Wait for the config fetch to settle before locking in defaults —
    // otherwise opening the dialog mid-load would seed "5/5" and skip
    // re-hydration when saved config arrives moments later.
    if (isLoading) return;
    // Initialize once per open transition so background refetches (e.g. on
    // window focus) don't clobber the user's in-progress edits.
    if (initializedForOpenRef.current) return;
    initializedForOpenRef.current = true;
    // Backend minimum is $5 — pre-fill with the floor so the form is valid
    // by default and matches the "$5 minimum" copy in the empty state.
    setThreshold(config?.threshold ? (config.threshold / 100).toString() : "5");
    setRefillAmount(config?.amount ? (config.amount / 100).toString() : "5");
  }, [open, config, isLoading]);

  const thresholdValue = Number.parseFloat(threshold);
  const refillValue = Number.parseFloat(refillAmount);
  // Use Number.isFinite (not Number.isInteger) so legacy non-whole-dollar
  // values (e.g. $7.50 stored as 750 cents) don't permanently disable save.
  // Math.round(value * 100) below converts back to integer cents.
  const isValid =
    Number.isFinite(thresholdValue) &&
    thresholdValue >= 5 &&
    Number.isFinite(refillValue) &&
    refillValue >= 5 &&
    // Backend rejects refill < threshold with 422 — gate it client-side too.
    refillValue >= thresholdValue;

  async function save() {
    if (!isValid) return;
    try {
      await configureAutoTopUp({
        data: {
          amount: Math.round(refillValue * 100),
          threshold: Math.round(thresholdValue * 100),
        },
      });
      await refetch();
      setOpen(false);
    } catch (error) {
      toast({
        title: t("Couldn't save auto top-up", "无法保存自动充值设置"),
        description:
          error instanceof Error
            ? error.message
            : t(
                "Auto top-up settings weren't saved. Please try again.",
                "自动充值设置未保存，请重试。",
              ),
        variant: "destructive",
      });
    }
  }

  async function disable() {
    try {
      await configureAutoTopUp({ data: { amount: 0, threshold: 0 } });
      await refetch();
      setOpen(false);
    } catch (error) {
      toast({
        title: t("Couldn't disable auto top-up", "无法关闭自动充值"),
        description:
          error instanceof Error
            ? error.message
            : t(
                "Auto top-up couldn't be disabled. Please try again.",
                "未能关闭自动充值，请重试。",
              ),
        variant: "destructive",
      });
    }
  }

  return {
    config,
    isEnabled,
    isLoading,
    isSaving,
    open,
    setOpen,
    threshold,
    setThreshold,
    refillAmount,
    setRefillAmount,
    isValid,
    save: () => void save(),
    disable: () => void disable(),
  };
}
