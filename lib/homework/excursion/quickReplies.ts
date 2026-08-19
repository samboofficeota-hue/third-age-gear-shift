// AIの応答末尾に付く [QUICK_REPLIES: A | B | C] を本文から切り離す。

const PATTERN = /\[QUICK_REPLIES:\s*([^\]]+)\]/i;

export function parseQuickReplies(raw: string): { text: string; quickReplies: string[] } {
  const match = raw.match(PATTERN);
  if (!match) return { text: raw.trim(), quickReplies: [] };

  const quickReplies = match[1]
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 4);

  return { text: raw.replace(PATTERN, "").trim(), quickReplies };
}
