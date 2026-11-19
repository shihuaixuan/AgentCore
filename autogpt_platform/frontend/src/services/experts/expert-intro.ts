export function formatExpertIntro(
  text: string,
  legacyName: string,
  title: string,
) {
  const name = legacyName.trim();
  if (!name || name === title) return text;

  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text
    .replace(
      new RegExp(`^(我是|你是)\\s*${escaped}\\s*[,，]\\s*(你的|一名)`),
      "$1$2",
    )
    .replace(
      new RegExp(`^((?:我是|你是|我叫)\\s*)${escaped}(?=[，。！？,:;、]|$)`),
      (_match, prefix: string) =>
        `${prefix === "我叫" ? "我是" : prefix.trim()}${title}`,
    )
    .replace(
      new RegExp(
        `^((?:I['’]m|I am|You are)\\s+)${escaped}(?=[,.—:;\\s]|$)`,
        "i",
      ),
      (_match, prefix: string) => `${prefix}${title}`,
    )
    .replace(new RegExp(`^${escaped}(?=\\s+is\\b)`, "i"), () => title);
}
