export async function getServerTranslation() {
  const locale = "zh-CN" as const;

  function t(_english: string, chinese: string) {
    return chinese;
  }

  return { locale, t };
}
