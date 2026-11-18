import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, parseLocale } from "./locale";

export async function getServerTranslation() {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE_NAME)?.value);

  function t(english: string, chinese: string) {
    return locale === "en" ? english : chinese;
  }

  return { locale, t };
}
