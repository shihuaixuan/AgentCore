"use client";

import type { WorkspaceFileItem } from "@/app/api/__generated__/models/workspaceFileItem";
import { getFilePreviewUrl } from "../helpers";

// Whole file (kind is gated < 110KB) via the preview endpoint, which sets
// browser cache headers — unlike /download (no-store).
const STRUCTURED_PREVIEW_BYTES = 110_000;
import {
  parseIcs,
  parseVcard,
  type IcsPreview as IcsData,
  type VcardPreview as VcardData,
} from "../parsers";
import { Fallback, LoadingPlaceholder, useFileText } from "./PreviewParts";
import { CallIcon, Mail02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";

interface PreviewProps {
  file: WorkspaceFileItem;
  onError: () => void;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  minute: number | null;
}

function parseDateTime(value: string | undefined): DateParts | null {
  const digits = (value ?? "").replace(/[^0-9]/g, "");
  if (digits.length < 8) return null;
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const hasTime = digits.length >= 12;
  return {
    year: Number(digits.slice(0, 4)),
    month,
    day,
    hour: hasTime ? Number(digits.slice(8, 10)) : null,
    minute: hasTime ? Number(digits.slice(10, 12)) : null,
  };
}

function weekdayLabel(date: DateParts, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(date.year, date.month - 1, date.day)));
}

function clock(hour: number, minute: number): string {
  return `${hour % 12 === 0 ? 12 : hour % 12}:${String(minute).padStart(2, "0")}`;
}

function meridiem(hour: number): string {
  return hour >= 12 ? "PM" : "AM";
}

function formatTimeRange(
  start: string | undefined,
  end: string | undefined,
  locale: Locale,
): string | null {
  const startDate = parseDateTime(start);
  if (!startDate || startDate.hour === null || startDate.minute === null)
    return null;
  const endDate = parseDateTime(end);
  if (locale === "zh-CN") {
    const startTime = `${String(startDate.hour).padStart(2, "0")}:${String(startDate.minute).padStart(2, "0")}`;
    return endDate && endDate.hour !== null && endDate.minute !== null
      ? `${startTime}–${String(endDate.hour).padStart(2, "0")}:${String(endDate.minute).padStart(2, "0")}`
      : startTime;
  }
  if (endDate && endDate.hour !== null && endDate.minute !== null) {
    // Collapse the meridiem when both ends share it: "3:30–4:30 PM".
    if (meridiem(startDate.hour) === meridiem(endDate.hour)) {
      return `${clock(startDate.hour, startDate.minute)}–${clock(endDate.hour, endDate.minute)} ${meridiem(endDate.hour)}`;
    }
    return `${clock(startDate.hour, startDate.minute)} ${meridiem(startDate.hour)} – ${clock(endDate.hour, endDate.minute)} ${meridiem(endDate.hour)}`;
  }
  return `${clock(startDate.hour, startDate.minute)} ${meridiem(startDate.hour)}`;
}

export function IcsPreview({ file, onError }: PreviewProps) {
  const text = useFileText(
    getFilePreviewUrl(file.id, { bytes: STRUCTURED_PREVIEW_BYTES }),
    onError,
  );
  if (text === null) return <LoadingPlaceholder file={file} />;

  const event = parseIcs(text);
  if (!event) return <Fallback file={file} />;
  return <EventCard event={event} />;
}

function EventCard({ event }: { event: IcsData }) {
  const { t, locale } = useTranslation();
  const date = parseDateTime(event.start);
  const timeRange = formatTimeRange(event.start, event.end, locale);
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 bg-surface p-3 text-center">
      {date ? (
        <>
          <span className="text-body leading-none font-bold tracking-wide text-error uppercase">
            {weekdayLabel(date, locale)}
          </span>
          <span className="text-title leading-none font-bold text-foreground-strong">
            {date.day}
          </span>
        </>
      ) : null}
      <span className="mt-1.5 line-clamp-2 text-body font-medium text-foreground-emphasis">
        {event.summary ?? t("Event", "日程")}
      </span>
      {timeRange ? (
        <span className="text-caption text-foreground-secondary">
          {timeRange}
        </span>
      ) : null}
    </div>
  );
}

export function VcardPreview({ file, onError }: PreviewProps) {
  const text = useFileText(
    getFilePreviewUrl(file.id, { bytes: STRUCTURED_PREVIEW_BYTES }),
    onError,
  );
  if (text === null) return <LoadingPlaceholder file={file} />;

  const contact = parseVcard(text);
  if (!contact) return <Fallback file={file} />;
  return <ContactCard contact={contact} />;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function ContactCard({ contact }: { contact: VcardData }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-surface p-3 text-center">
      {contact.photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- a contact photo from an arbitrary host, which next/image would need configured
        <img
          src={contact.photo}
          alt={contact.name ?? t("Contact", "联系人")}
          className="h-14 w-14 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-active text-lead font-semibold text-foreground-secondary">
          {initials(contact.name ?? "")}
        </div>
      )}
      <span className="truncate text-body font-medium text-foreground-strong">
        {contact.name}
      </span>
      {contact.title || contact.org ? (
        <span className="truncate text-caption text-foreground-tertiary">
          {[contact.title, contact.org].filter(Boolean).join(" · ")}
        </span>
      ) : null}
      {contact.tel ? (
        <span className="flex items-center gap-1 text-caption text-foreground-tertiary">
          <Icon icon={CallIcon} size={12} className="shrink-0" />
          <span className="truncate">{contact.tel}</span>
        </span>
      ) : null}
      {contact.email ? (
        <span className="flex items-center gap-1 text-caption text-foreground-tertiary">
          <Icon icon={Mail02Icon} size={12} className="shrink-0" />
          <span className="truncate">{contact.email}</span>
        </span>
      ) : null}
    </div>
  );
}
