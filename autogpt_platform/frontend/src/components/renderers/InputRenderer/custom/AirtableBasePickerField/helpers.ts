import { ApiError } from "@/lib/autogpt-server-api/helpers";

export const AIRTABLE_PICKER_FORMAT = "airtable-base-picker";
export const AIRTABLE_HOME_URL = "https://airtable.com/";

// The search box appears once the list is too long to scan.
export const SEARCH_THRESHOLD = 8;

// The copilot fills in the account the run will use; without one (the builder)
// there is nothing to list, so the field stays a plain text input.
export function pickerCredentialsID(schema: unknown): string | null {
  if (!isRecord(schema) || schema.format !== AIRTABLE_PICKER_FORMAT) {
    return null;
  }
  const picker = schema.resource_picker;
  if (!isRecord(picker)) return null;
  const id = picker.credentials_id;
  return typeof id === "string" && id ? id : null;
}

export type BaseAccess = "read" | "edit" | "create";

const ACCESS_RANK: Record<BaseAccess, number> = { read: 0, edit: 1, create: 2 };

// The least a base must allow for the step: Airtable lets only a base's
// creators change its tables, editors write records, and anyone read.
export function pickerAccess(schema: unknown): BaseAccess {
  if (!isRecord(schema) || !isRecord(schema.resource_picker)) return "create";
  const access = schema.resource_picker.access;
  return access === "read" || access === "edit" ? access : "create";
}

export function allows(access: BaseAccess, needed: BaseAccess): boolean {
  return ACCESS_RANK[access] >= ACCESS_RANK[needed];
}

// Why a base is listed but can't be picked for this step.
export function lockedReason(
  access: BaseAccess,
  needed: BaseAccess,
  t: (english: string, chinese: string) => string = (english) => english,
): string {
  if (access === "read") return t("View only", "仅可查看");
  return needed === "create"
    ? t("Needs creator access", "需要创建者权限")
    : t("View only", "仅可查看");
}

// What the step will do to the base, and only that: a table change is shown
// on a card first, a record change (adding, updating or deleting) is not, and
// a read changes nothing.
export function pickerHint(
  needed: BaseAccess,
  t: (english: string, chinese: string) => string = (english) => english,
): string {
  const base =
    "A base is Airtable's word for a set of tables, like a spreadsheet file with several sheets.";
  const chineseBase =
    "Airtable 中的数据库是一组数据表，类似于包含多个工作表的电子表格文件。";
  if (needed === "read") {
    return t(
      `${base} Otto only reads from the one you pick; nothing in it changes.`,
      `${chineseBase} Otto 只读取你选择的数据库，不会修改其内容。`,
    );
  }
  if (needed === "edit") {
    return t(
      `${base} Otto changes records in the one you pick.`,
      `${chineseBase} Otto 会修改你选择的数据库中的记录。`,
    );
  }
  return t(
    `${base} Otto adds what it needs to the one you pick, and you'll see what it adds before anything changes.`,
    `${chineseBase} Otto 会在你选择的数据库中添加所需内容，并在实际更改前让你查看要添加的内容。`,
  );
}

// What to do when no base allows the step.
export function noUsableBaseText(
  needed: BaseAccess,
  t: (english: string, chinese: string) => string = (english) => english,
): string {
  return needed === "create"
    ? t(
        "This step needs creator access to a base, which Airtable gives to the people who set it up. Ask the owner to make you a creator, or start a new one.",
        "此步骤需要数据库的创建者权限，Airtable 会将该权限授予建立数据库的人。请所有者为你授予创建者权限，或新建数据库。",
      )
    : t(
        "You can only view these bases, so Otto can't change records in them. Ask the owner to make you an editor, or start a new one.",
        "你只有这些数据库的查看权限，因此 Otto 无法修改其中的记录。请所有者为你授予编辑者权限，或新建数据库。",
      );
}

export function isAirtableBasePickerSchema(schema: unknown): boolean {
  return pickerCredentialsID(schema) !== null;
}

// The server words these for the user: reconnect, busy, or try again.
const WORDED_STATUSES = new Set([409, 502, 503]);

export function loadErrorText(
  error: unknown,
  t: (english: string, chinese: string) => string = (english) => english,
): string {
  if (error instanceof ApiError && WORDED_STATUSES.has(error.status)) {
    return error.message;
  }
  return t(
    "Couldn't load your Airtable bases. Try again.",
    "无法加载 Airtable 数据库。请重试。",
  );
}

export function matchesSearch(name: string, search: string): boolean {
  return name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
