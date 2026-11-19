"use client";

import { getExpertTopicHex } from "@/components/molecules/ExpertAvatar/colors";

import { ExpertAvatarRequestCategory } from "@/app/api/__generated__/models/expertAvatarRequestCategory";
import { getExpertVisualCategory } from "@/components/molecules/ExpertAvatar/helpers";
import type { Expert } from "@/app/api/__generated__/models/expert";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { ExpertAvatarPicker } from "@/components/molecules/ExpertAvatarPicker/ExpertAvatarPicker";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useExpertAvatarButton } from "./useExpertAvatarButton";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  expert: Expert;
}

export function ExpertAvatarButton({ expert }: Props) {
  const { t } = useTranslation();
  const { isOpen, setIsOpen, saveAvatar, isPending } = useExpertAvatarButton(
    expert.id,
  );
  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t(
          `Change ${expert.name}'s appearance`,
          `更改 ${expert.name} 的外观`,
        )}
        className="size-24 shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-focus"
      >
        <ExpertAvatar
          name={expert.name}
          avatarUrl={expert.avatar_url}
          size={96}
          // oxlint-disable-next-line design-system/no-restyle -- ExpertAvatar has no bordered variant (src/components is P9's)
          className="rounded-full border border-border-base ring-4 ring-canvas"
          backgroundColor={getExpertTopicHex({
            avatarUrl: expert.avatar_url,
            categories: expert.categories,
            role: expert.role,
          })}
        />
      </button>
      <Dialog
        title={t(
          `Change ${expert.name}'s avatar`,
          `更改 ${expert.name} 的头像`,
        )}
        controlled={{ isOpen, set: setIsOpen }}
      >
        <Dialog.Content>
          {isOpen && (
            <fieldset disabled={isPending} className="min-w-0">
              <ExpertAvatarPicker
                name={expert.name}
                category={
                  Object.values(ExpertAvatarRequestCategory).find(
                    (category) =>
                      category ===
                      getExpertVisualCategory(
                        expert.avatar_url,
                        expert.categories,
                      ),
                  ) ?? "general"
                }
                avatarUrl={expert.avatar_url}
                onPick={saveAvatar}
              />
            </fieldset>
          )}
        </Dialog.Content>
      </Dialog>
    </>
  );
}
