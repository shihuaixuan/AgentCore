"use client";

import Link from "next/link";
import { type MouseEvent, type ReactNode, useContext } from "react";
import {
  type SubSessionPreview,
  SubSessionPreviewContext,
} from "./SubSessionPreviewContext";

interface Props {
  preview: SubSessionPreview;
  className: string;
  label?: string;
  children: ReactNode;
}

export function subSessionHref(sessionID: string) {
  return `/copilot?sessionId=${encodeURIComponent(sessionID)}`;
}

export function SubSessionLink({ preview, className, label, children }: Props) {
  const openPreview = useContext(SubSessionPreviewContext);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      !openPreview ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    openPreview(preview);
  }

  return (
    <Link
      href={subSessionHref(preview.sessionID)}
      className={className}
      aria-label={label}
      prefetch={false}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
