"use client";

import { cn } from "@/lib/utils";
import type { MouseEvent } from "react";
import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FavouriteIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onClick: (
    e: MouseEvent<HTMLButtonElement>,
    position: { x: number; y: number },
  ) => void;
  className?: string;
}

export function FavoriteButton({
  isFavorite,
  onClick,
  className,
}: FavoriteButtonProps) {
  const { t } = useTranslation();
  const buttonRef = useRef<HTMLButtonElement>(null);

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    const rect = buttonRef.current?.getBoundingClientRect();
    const position = rect
      ? {
          x: rect.left + rect.width / 2 - 12,
          y: rect.top + rect.height / 2 - 12,
        }
      : { x: 0, y: 0 };
    onClick(e, position);
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className={cn(
        "rounded-full p-2 transition-all duration-200",
        "hover:scale-110 active:scale-95",
        !isFavorite && "opacity-0 group-hover:opacity-100",
        isFavorite
          ? "text-error"
          : "text-foreground-secondary hover:text-error",
        className,
      )}
      aria-label={
        isFavorite
          ? t("Remove from favorites", "取消收藏")
          : t("Add to favorites", "添加收藏")
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isFavorite ? "filled" : "empty"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", damping: 15, stiffness: 300 }}
        >
          <Icon icon={FavouriteIcon} size={20} />
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
