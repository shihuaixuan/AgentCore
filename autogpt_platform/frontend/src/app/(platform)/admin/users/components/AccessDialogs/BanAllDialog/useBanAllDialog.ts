"use client";

import type { AccountIPReport } from "@/app/api/__generated__/models/accountIPReport";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  type AdminUser,
  type BanDuration,
  getBanEnd,
  getErrorMessage,
  pluralize,
} from "../../../helpers";
import { useAccessBlocks } from "../../../useAccessBlocks";
import { type BanAccountResult, useBanAccounts } from "../../../useBanAccounts";
import {
  getBanSentence,
  getBanTargets,
  hasFailedBans,
  mergeBanResults,
  partialBanFailure,
} from "../helpers";
import {
  type AlsoBlockOption,
  describeBlocks,
  getAlsoBlockOptions,
  getBanAllAccounts,
} from "./helpers";

interface Args {
  user: AdminUser;
  report: AccountIPReport;
  signedInUserId: string | undefined;
}

export function useBanAllDialog({ user, report, signedInUserId }: Args) {
  const { t, locale } = useTranslation();
  const { toast } = useToast();
  const { banAccounts, isBanning } = useBanAccounts();
  const { createBlock, isCreating } = useAccessBlocks();
  const { accounts, excludesSelf } = getBanAllAccounts({
    user,
    report,
    signedInUserId,
  });
  const blockOptions = getAlsoBlockOptions(report);

  const [isOpen, setIsOpen] = useState(false);
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [blocksTicked, setBlocksTicked] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<BanDuration>("permanent");
  const [results, setResults] = useState<Map<string, BanAccountResult>>(
    new Map(),
  );
  const [blocksDone, setBlocksDone] = useState<Set<string>>(new Set());

  const toBan = getBanTargets({ accounts, ticked, results });
  const toBlock = blockOptions.filter(
    (option) => blocksTicked.has(option.key) && !blocksDone.has(option.key),
  );
  const isBlockOnly = toBan.length === 0 && toBlock.length > 0;
  const addressCount = toBlock.filter((option) => option.kind === "IP").length;
  const blockSummary = t(
    describeBlocks(toBlock),
    [
      addressCount > 0 ? `${addressCount} 个地址` : null,
      toBlock.find((option) => option.kind === "EMAIL_DOMAIN")?.label ?? null,
    ]
      .filter(Boolean)
      .join("和"),
  );

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) return;
    setTicked(
      new Set(
        accounts
          .filter((account) => !account.banned && account.isTickedByDefault)
          .map((account) => account.id),
      ),
    );
    setBlocksTicked(new Set());
    setReason("");
    setDuration("permanent");
    setResults(new Map());
    setBlocksDone(new Set());
  }

  async function blockTicked() {
    const blocked = new Set(blocksDone);
    const errors: string[] = [];
    for (const option of toBlock) {
      try {
        await createBlock({
          ...blockArgs(option),
          reason,
          expiresAt: getBanEnd(duration),
        });
        blocked.add(option.key);
      } catch (error) {
        errors.push(`${option.label}: ${getErrorMessage(error, locale)}`);
      }
    }
    setBlocksDone(blocked);
    return { blocked: blocked.size, errors };
  }

  async function submit() {
    let banResults: BanAccountResult[] = [];
    if (toBan.length > 0) {
      try {
        banResults = await banAccounts({ userIds: toBan, reason, duration });
      } catch (error) {
        toast({
          title: t("Couldn't ban the accounts", "无法封禁这些账户"),
          description: getErrorMessage(error, locale),
          variant: "destructive",
        });
        return;
      }
    }
    const { merged, total, failed } = mergeBanResults(results, banResults);
    setResults(merged);
    const blocks = await blockTicked();
    if (failed > 0) {
      toast(partialBanFailure(total, failed, blocks.errors, locale));
      return;
    }
    if (blocks.errors.length > 0) {
      toast({
        title: t("Couldn't block every address", "未能阻止所有地址"),
        description: blocks.errors.join(" "),
        variant: "destructive",
      });
      return;
    }
    setIsOpen(false);
    if (total === 0) {
      toast({
        title: t(`Blocked ${blockSummary}`, `已阻止 ${blockSummary}`),
        variant: "success",
      });
      return;
    }
    const bans = t(
      `Banned ${pluralize(total, "account")}`,
      `已封禁 ${total} 个账户`,
    );
    toast({
      title:
        blocks.blocked > 0
          ? t(
              `${bans} and blocked ${blocks.blocked}`,
              `${bans}，并阻止 ${blocks.blocked} 项`,
            )
          : bans,
      description: getBanSentence(locale),
      variant: "success",
    });
  }

  return {
    isOpen,
    handleOpenChange,
    accounts,
    excludesSelf,
    blockOptions,
    ticked,
    toggleAccount: (id: string) => setTicked((set) => toggle(set, id)),
    blocksTicked,
    toggleBlock: (key: string) => setBlocksTicked((set) => toggle(set, key)),
    blocksDone,
    reason,
    setReason,
    duration,
    setDuration,
    results,
    banCount: toBan.length,
    blockCount: toBlock.length,
    isBlockOnly,
    blockSummary,
    tickedAdmins: accounts.filter(
      (account) => account.role === "admin" && toBan.includes(account.id),
    ).length,
    isRetry: hasFailedBans(results),
    isSubmitting: isBanning || isCreating,
    submit,
  };
}

function toggle(set: Set<string>, key: string) {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

function blockArgs(option: AlsoBlockOption) {
  return { kind: option.kind, value: option.value };
}
