"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { deleteV1DeleteCredentials } from "@/app/api/__generated__/endpoints/integrations/integrations";
import { toast } from "@/components/molecules/Toast/use-toast";
import { invalidateConnectionQueries } from "@/lib/react-query/invalidateConnections";

export interface DeleteIntegrationTarget {
  id: string;
  provider: string;
  name?: string;
}

interface RemoveResult {
  succeeded: DeleteIntegrationTarget[];
  failed: DeleteIntegrationTarget[];
  needsConfirmation: { target: DeleteIntegrationTarget; message: string }[];
}

export function useDeleteIntegration() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [pendingIds, setPendingIds] = useState<Record<string, true>>({});

  async function remove(
    targets: DeleteIntegrationTarget[],
    force = false,
  ): Promise<RemoveResult> {
    const empty: RemoveResult = {
      succeeded: [],
      failed: [],
      needsConfirmation: [],
    };
    if (targets.length === 0) return empty;

    setIsPending(true);
    setPendingIds(() => {
      const next: Record<string, true> = {};
      for (const t of targets) next[t.id] = true;
      return next;
    });
    try {
      const results = await Promise.allSettled(
        targets.map((t) =>
          deleteV1DeleteCredentials(
            t.provider,
            t.id,
            force ? { force } : undefined,
          ),
        ),
      );

      const out: RemoveResult = {
        succeeded: [],
        failed: [],
        needsConfirmation: [],
      };

      results.forEach((r, idx) => {
        const target = targets[idx];
        if (r.status === "rejected") {
          out.failed.push(target);
          return;
        }
        const body = r.value.data;
        if (body && "need_confirmation" in body && body.need_confirmation) {
          out.needsConfirmation.push({ target, message: body.message });
          return;
        }
        out.succeeded.push(target);
      });

      const successCount = out.succeeded.length;

      if (successCount === 1) {
        const only = out.succeeded[0];
        toast({
          title: only.name
            ? t(`Removed ${only.name}`, `已移除 ${only.name}`)
            : t("Integration removed", "集成已移除"),
          variant: "success",
        });
      } else if (successCount > 1) {
        const previewNames = out.succeeded
          .map((t) => t.name)
          .filter(Boolean)
          .slice(0, 3)
          .join(", ");
        toast({
          title: t(
            `${successCount} integrations removed`,
            `已移除 ${successCount} 个集成`,
          ),
          description: previewNames || undefined,
          variant: "success",
        });
      }

      // needsConfirmation is surfaced by the caller as a force-delete dialog,
      // so we deliberately don't toast here — the dialog *is* the prompt.

      if (out.failed.length > 0) {
        const failedNames = out.failed
          .map((t) => t.name ?? `${t.provider}/${t.id.slice(0, 6)}`)
          .slice(0, 3)
          .join(", ");
        const more =
          out.failed.length > 3
            ? t(
                ` +${out.failed.length - 3} more`,
                `，另有 ${out.failed.length - 3} 个`,
              )
            : "";
        // needsConfirmation items are pending a force-delete prompt, not
        // failures and not successes — exclude them from the denominator
        // so "X of Y could not be removed" doesn't imply the rest succeeded.
        const attemptableCount = targets.length - out.needsConfirmation.length;
        const allFailedTitle =
          attemptableCount === 1
            ? t("Failed to remove integration", "移除集成失败")
            : t(
                `Failed to remove ${attemptableCount} integrations`,
                `移除 ${attemptableCount} 个集成失败`,
              );
        toast({
          title:
            out.failed.length === attemptableCount
              ? allFailedTitle
              : t(
                  `${out.failed.length} of ${attemptableCount} could not be removed`,
                  `${attemptableCount} 个集成中有 ${out.failed.length} 个无法移除`,
                ),
          description: t(
            `${failedNames}${more}. Try again to retry the failed ones.`,
            `${failedNames}${more}。请重试以再次移除失败的项目。`,
          ),
          variant: "destructive",
        });
      }

      await invalidateConnectionQueries(queryClient);

      return out;
    } finally {
      setIsPending(false);
      setPendingIds({});
    }
  }

  function isDeletingId(id: string): boolean {
    return Boolean(pendingIds[id]);
  }

  return { remove, isPending, isDeletingId };
}
