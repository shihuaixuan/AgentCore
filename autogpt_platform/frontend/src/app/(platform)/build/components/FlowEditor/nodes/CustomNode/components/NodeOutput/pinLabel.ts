import { getBuilderSchemaText } from "@/app/(platform)/build/helpers/blockCopy";
import type { Locale } from "@/lib/i18n/locale";
import { beautifyString } from "@/lib/utils";
import type { RJSFSchema } from "@rjsf/utils";

export function getOutputPinLabel(
  key: string,
  catalogSchema: RJSFSchema | undefined,
  locale: Locale,
) {
  if (locale === "en") return beautifyString(key);
  if (
    !catalogSchema?.properties ||
    !Object.hasOwn(catalogSchema.properties, key)
  )
    return key;
  const field = catalogSchema.properties[key];
  const label =
    typeof field === "object" && field.title
      ? field.title
      : beautifyString(key);
  return getBuilderSchemaText(label, locale);
}
