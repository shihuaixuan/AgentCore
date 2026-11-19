"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { ApprovalFields } from "@/components/organisms/ApprovalFields/ApprovalFields";
import {
  type ApprovalItem,
  type ChatRule,
  type RuleScope,
  hiddenFieldKeys,
  isBare,
  isHeldRead,
  reasonLine,
  ruleSubjectName,
} from "../../helpers";
import { ApprovalHeadline } from "../ApprovalHeadline";
import { ApproveSplitButton } from "./ApproveSplitButton";
import { ChangePreview } from "./ChangePreview";
import { HeldPassage } from "./HeldPassage";
import { MoneyBlock } from "./MoneyBlock";
import { useApprovalFields } from "./useApprovalFields";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export type CardStatus = "idle" | "approving" | "rejecting";

interface Props {
  item: ApprovalItem;
  status: CardStatus;
  failed: boolean;
  expertName: string | null;
  onApprove: (rule?: ChatRule, scope?: RuleScope) => void;
  onReject: () => void;
  // Outside the chat: why a mode-held call asks.
  note?: string | null;
  // Home's dialog pins them in its own footer.
  hideActions?: boolean;
}

export function ApprovalCard({
  item,
  status,
  failed,
  expertName,
  onApprove,
  onReject,
  note = null,
  hideActions = false,
}: Props) {
  const { t, locale } = useTranslation();
  const fields = useApprovalFields(item);
  const reason = reasonLine(item, locale) ?? note;
  const read = isHeldRead(item);
  const busy = status !== "idle";

  const actions = hideActions ? null : (
    <ApprovalActions
      item={item}
      status={status}
      expertName={expertName}
      onApprove={onApprove}
      onReject={onReject}
    />
  );

  // Nothing to read beyond the headline: the card is one row, as a list line is.
  if (isBare(item) && !failed && !reason) {
    return (
      <article
        aria-busy={busy}
        className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3"
      >
        <div className="min-w-0 flex-1">
          <ApprovalHeadline item={item} />
        </div>
        {actions}
      </article>
    );
  }

  return (
    <article aria-busy={busy} className="flex flex-col gap-2 px-4 py-3">
      <ApprovalHeadline item={item} />
      <div
        // oxlint-disable-next-line design-system/no-arbitrary-values -- aligns the body with the headline text after its 38px icon column
        className="flex flex-col gap-3 sm:pl-[38px]"
      >
        {failed && (
          <p role="alert" className="text-body text-error-foreground">
            {t(
              "Couldn't send your answer. Nothing ran. Try again.",
              "发送答复失败，未执行任何操作。请重试。",
            )}
          </p>
        )}
        {reason && (
          <Text variant="body-tight" tone="muted" className="-mt-1">
            {reason}
          </Text>
        )}
        {item.spend && <MoneyBlock spend={item.spend} />}
        {item.preview && <ChangePreview tables={item.preview.tables} />}
        {read ? (
          item.passage && <HeldPassage passage={item.passage} />
        ) : (
          <ApprovalFields
            fields={fields.labels}
            values={fields.values}
            clipped={item.clipped}
            hiddenKeys={hiddenFieldKeys(item)}
            idsWhenAlone={!item.headline.object}
            references={item.blockId ? [] : item.references}
            referenceTotals={item.referenceTotals}
          />
        )}
        {actions}
      </div>
    </article>
  );
}

interface ActionsProps {
  item: ApprovalItem;
  status: CardStatus;
  expertName: string | null;
  onApprove: (rule?: ChatRule, scope?: RuleScope) => void;
  onReject: () => void;
  aside?: ReactNode;
}

export function ApprovalActions({
  item,
  status,
  expertName,
  onApprove,
  onReject,
  aside = null,
}: ActionsProps) {
  const { t, locale } = useTranslation();
  const read = isHeldRead(item);
  const busy = status !== "idle";
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-wrap">
      <ApproveSplitButton
        label={
          read
            ? t(`Release to ${item.reader}`, `向 ${item.reader} 放行`)
            : t("Approve", "批准")
        }
        subjectName={ruleSubjectName(item.subject, locale)}
        expertName={expertName}
        rules={read || item.spend ? [] : item.chatRulesAllowed}
        loading={status === "approving"}
        disabled={busy}
        onApprove={onApprove}
      />
      <Button
        size="small"
        variant="secondary"
        className="min-w-0"
        loading={status === "rejecting"}
        disabled={busy}
        onClick={onReject}
      >
        {status === "rejecting"
          ? t("Rejecting…", "正在拒绝…")
          : read
            ? t("Keep it out", "保持屏蔽")
            : t("Reject", "拒绝")}
      </Button>
      {aside && (
        <div className="col-span-2 flex justify-end sm:ml-auto sm:self-center">
          {aside}
        </div>
      )}
    </div>
  );
}
