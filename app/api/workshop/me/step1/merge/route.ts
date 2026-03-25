import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth";

export type MergeActivity = {
  id: string;
  description: string;
  hours: number;
  workType: string | null;
};

export type MergeSuggestion = {
  mergedName: string;
  ids: string[];      // 1件 = 変更なし、2件以上 = 統合候補
  totalHours: number;
  workType: string | null;
};

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }

  let body: { activities: MergeActivity[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const activities = body.activities ?? [];
  if (activities.length === 0) {
    return NextResponse.json({ error: "活動リストが空です。" }, { status: 400 });
  }

  const activityList = activities
    .map(
      (a, i) =>
        `${i + 1}. [ID:${a.id}] "${a.description}" (${a.hours}H / 区分:${a.workType ?? "未分類"})`
    )
    .join("\n");

  const prompt = `以下は月間活動リストです。似た活動（同じまたは類似の意味を持つ活動）をグループ化してください。

活動リスト：
${activityList}

グループ化のルール：
- 同じ活動名が複数ある場合は必ず同一グループ（例：「睡眠」が2行 → 1グループ）
- 意味が同じ・類似の活動を同一グループ（例：「仕事」「お仕事」→ 1グループ）
- 意味が明確に異なる活動は別グループのまま
- 統合後の活動名は最も一般的・簡潔な表現を使う
- 単独で問題ない活動も必ず1件グループとして含める（取りこぼし禁止）
- workType は統合後も最も適切なものを選ぶ

JSONのみ返してください（説明文不要）：
{
  "groups": [
    { "mergedName": "統合後の活動名", "ids": ["ID1", "ID2"], "workType": "A" }
  ]
}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON not found in response");

    const parsed = JSON.parse(jsonMatch[0]) as {
      groups: Array<{ mergedName: string; ids: string[]; workType: string }>;
    };

    const activityMap = new Map(activities.map((a) => [a.id, a]));

    // 全アクティビティがいずれかのグループに含まれているか検証
    const assignedIds = new Set(parsed.groups.flatMap((g) => g.ids));
    const missingActivities = activities.filter((a) => !assignedIds.has(a.id));

    // 取りこぼしがあれば個別グループとして追加
    for (const a of missingActivities) {
      parsed.groups.push({
        mergedName: a.description,
        ids: [a.id],
        workType: a.workType ?? "E",
      });
    }

    const suggestions: MergeSuggestion[] = parsed.groups.map((g) => {
      const members = g.ids
        .map((id) => activityMap.get(id))
        .filter((a): a is MergeActivity => !!a);
      const totalHours =
        Math.round(members.reduce((s, a) => s + a.hours, 0) * 10) / 10;
      return {
        mergedName: g.mergedName,
        ids: g.ids.filter((id) => activityMap.has(id)), // 存在するIDのみ
        totalHours,
        workType: g.workType ?? members[0]?.workType ?? null,
      };
    });

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("Merge error:", err);
    return NextResponse.json(
      { error: "統合処理に失敗しました。もう一度お試しください。" },
      { status: 500 }
    );
  }
}
