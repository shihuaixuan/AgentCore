"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Menu01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import type { KeyboardEvent, ReactNode } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import {
  ApprovalActions,
  ApprovalCard,
} from "@/app/(platform)/copilot/components/ApprovalQueue/components/ApprovalCard/ApprovalCard";
import { modeLine } from "@/app/(platform)/copilot/components/ApprovalQueue/helpers";
import { AUTOPILOT_NAME } from "@/components/molecules/AutopilotAvatar/helpers";
import { isKey } from "@/lib/keyboard";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { toHomeApprovalItem } from "../attentionCopy";
import { reviewTally, shortAge } from "../helpers";
import type { useHeldReview } from "../useHeldReview";
import type { useReviewCarousel } from "../useReviewCarousel";
import { HeldAvatar } from "./HeldAvatar";
import { HeldReceiptRow } from "./HeldReceiptRow";
import { ReviewSidebar } from "./ReviewSidebar";

interface Props {
  carousel: ReturnType<typeof useReviewCarousel>;
  held: Pick<ReturnType<typeof useHeldReview>, "statusOf" | "hasFailed">;
  // Off inside the chat the calls came from.
  chatLink?: boolean;
}

// Every held call on the page, one at a time: the chat's card, a sidebar, and ‹ › to move.
export function HeldReviewDialog({ carousel, held, chatLink = true }: Props) {
  const { t, locale } = useTranslation();
  const { current } = carousel;
  const approval = current
    ? toHomeApprovalItem(current.item.review!, current.item.expert, locale)
    : null;
  const expertTitle = current?.item.expert
    ? getExpertDisplayTitle(current.item.expert, locale)
    : null;

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    // The rule menu portals out of this subtree; its arrows are the menu's.
    if (!e.currentTarget.contains(e.target as Node) || e.defaultPrevented)
      return;
    if (isKey(e, "ArrowLeft")) carousel.move(-1);
    else if (isKey(e, "ArrowRight")) carousel.move(1);
  }

  return (
    <Dialog
      controlled={{
        isOpen: carousel.open,
        set: (isOpen) => (isOpen ? undefined : carousel.close()),
      }}
      className="h-[90vh] p-0 lg:h-[min(720px,85vh)] lg:w-[960px] lg:max-w-[95vw] lg:min-w-0"
    >
      <Dialog.Content>
        <div
          onKeyDown={handleKeyDown}
          className="relative -mx-2 flex h-[calc(90vh-1rem)] min-h-0 lg:h-[min(720px,85vh)]"
        >
          <div className="hidden w-[272px] shrink-0 border-r border-separator bg-surface-muted lg:flex">
            <ReviewSidebar carousel={carousel} />
          </div>
          <section
            aria-label={t("Held call", "待审核调用")}
            className="flex min-w-0 flex-1 flex-col"
          >
            <header className="flex min-h-16 shrink-0 items-center gap-2 border-b border-separator py-3 pr-16 pl-4">
              <Button
                variant="secondary"
                size="icon-sm"
                className="lg:hidden"
                aria-label={t("All held calls", "所有待审核调用")}
                aria-expanded={carousel.sheetOpen}
                leadingIcon={Menu01Icon}
                onClick={() => carousel.setSheetOpen(!carousel.sheetOpen)}
              />
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label={t("Previous", "上一步")}
                disabled={!carousel.canPrev}
                leadingIcon={ArrowLeft01Icon}
                onClick={() => carousel.move(-1)}
              />
              <Text variant="body-medium" as="span" aria-live="polite" tabular>
                {t(
                  `${carousel.position} of ${carousel.total}`,
                  `第 ${carousel.position} 项，共 ${carousel.total} 项`,
                )}
              </Text>
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label={t("Next", "下一步")}
                disabled={!carousel.canNext}
                leadingIcon={ArrowRight01Icon}
                onClick={() => carousel.move(1)}
              />
              {current && !carousel.finished ? (
                <span className="ml-2 flex min-w-0 items-center gap-2">
                  <HeldAvatar item={current.item} size={24} />
                  <Text
                    variant="body"
                    as="span"
                    tone="secondary"
                    className="truncate"
                  >
                    {expertTitle ?? AUTOPILOT_NAME}
                    {current.item.created_at
                      ? ` · ${shortAge(current.item.created_at, undefined, locale)}`
                      : ""}
                  </Text>
                </span>
              ) : null}
            </header>
            {/* Only the body scrolls; the header and the decision footer stay put. */}
            <div
              ref={carousel.paneRef}
              data-testid="review-pane-body"
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            >
              {carousel.finished ? (
                <Finished carousel={carousel} />
              ) : current?.receipt && approval ? (
                <div className="px-2 py-4">
                  <HeldReceiptRow
                    approval={approval}
                    receipt={current.receipt}
                    heading
                  />
                </div>
              ) : current && approval ? (
                <ApprovalCard
                  key={current.item.id}
                  item={approval}
                  status={held.statusOf(current.item.id)}
                  failed={held.hasFailed(current.item.id)}
                  expertName={expertTitle}
                  note={
                    approval.reasonKind === "mode"
                      ? modeLine(approval.mode)
                      : null
                  }
                  onApprove={(rule, scope) =>
                    carousel.decide(current.item, true, rule, scope)
                  }
                  onReject={() => carousel.decide(current.item, false)}
                  hideActions
                />
              ) : null}
            </div>
            {carousel.finished ? (
              <PaneFooter>
                <Button size="small" variant="primary" onClick={carousel.close}>
                  {t("Done", "完成")}
                </Button>
              </PaneFooter>
            ) : current && approval && !current.receipt ? (
              <PaneFooter>
                <ApprovalActions
                  key={current.item.id}
                  item={approval}
                  status={held.statusOf(current.item.id)}
                  expertName={expertTitle}
                  onApprove={(rule, scope) =>
                    carousel.decide(current.item, true, rule, scope)
                  }
                  onReject={() => carousel.decide(current.item, false)}
                  aside={
                    chatLink ? (
                      <Link
                        href={current.item.primary_action.href}
                        className="rounded-sm text-body font-medium text-foreground-emphasis underline underline-offset-4 hover:text-foreground-base focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:outline-none"
                      >
                        {t("Open chat", "打开聊天")}
                      </Link>
                    ) : null
                  }
                />
              </PaneFooter>
            ) : null}
          </section>
          {carousel.sheetOpen ? (
            <div className="absolute inset-x-0 top-16 bottom-0 z-10 flex rounded-t-2xl border-t border-border-base bg-surface shadow-lg lg:hidden">
              <ReviewSidebar carousel={carousel} sheet />
            </div>
          ) : null}
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

function Finished({
  carousel,
}: {
  carousel: ReturnType<typeof useReviewCarousel>;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <Icon icon={Tick02Icon} size={20} tone="success" aria-hidden />
      <Text variant="h4" as="h3" data-pane-focus>
        {t(`All ${carousel.total} reviewed`, `已审核全部 ${carousel.total} 项`)}
      </Text>
      <Text variant="body" tone="secondary">
        {reviewTally(carousel.order, t)}
      </Text>
    </div>
  );
}

function PaneFooter({ children }: { children: ReactNode }) {
  return (
    <footer
      data-testid="review-pane-footer"
      className="flex shrink-0 justify-end border-t border-separator bg-surface px-4 py-3 [&>div]:w-full"
    >
      {children}
    </footer>
  );
}
