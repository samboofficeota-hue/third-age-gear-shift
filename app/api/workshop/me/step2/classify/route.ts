import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

type WorkType = "A" | "B" | "C" | "D" | "E";
type Activity = { description: string; hours: number };
type Classification = { description: string; hours: number; workType: WorkType };

const VALID_WORK_TYPES: WorkType[] = ["A", "B", "C", "D", "E"];

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
  }

  const existing = await prisma.workshopData.findUnique({
    where: { userId: session.sub },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "ワークショップデータが見つかりません。" },
      { status: 404 }
    );
  }

  const activities: Activity[] = (existing.step1 as Record<string, unknown>)
    ?.activities as Activity[] ?? [];

  if (activities.length === 0) {
    return NextResponse.json({ error: "STEP 1の活動が見つかりません。" }, { status: 400 });
  }

  const activityList = activities
    .map((a, i) => `${i + 1}. ${a.description}（${a.hours}時間）`)
    .join("\n");

  const prompt = `あなたはチャールズ・ハンディのポートフォリオ・ワーク理論に基づいて、活動を分類するアシスタントです。

各活動を以下の5つのカテゴリのいずれか1つに分類してください：
- A: お金をもらうワーク（Paid Work）- 仕事、副業、収入につながる活動
- B: 家族のためのワーク（Home Work）- 家事、育児、介護、家族のサポート
- C: 社会に貢献するワーク（Gift Work）- ボランティア、地域活動、無償での社会貢献
- D: 自分を高めるワーク（Study Work）- 学習、資格取得、スキルアップ、自己啓発
- E: その他 - 移動、通勤、SNS、娯楽、休息、睡眠、上記に当てはまらないもの

以下の活動リストを分類し、JSONのみ返してください（説明文不要）。

活動リスト：
${activityList}

返答形式（JSONのみ、他のテキスト不要）：
[{"description":"活動名","hours":時間数,"workType":"A"},...]`;

  let classifications: Classification[];
  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("JSON not found in response");

    const parsed = JSON.parse(jsonMatch[0]) as Classification[];

    // Validate and merge with original hours
    classifications = activities.map((a, i) => {
      const classified = parsed[i];
      const workType = VALID_WORK_TYPES.includes(classified?.workType)
        ? classified.workType
        : "E";
      return { description: a.description, hours: a.hours, workType };
    });
  } catch (err) {
    console.error("Claude classification error:", err);
    // Fallback: classify all as "E" if AI fails
    classifications = activities.map((a) => ({
      description: a.description,
      hours: a.hours,
      workType: "E" as WorkType,
    }));
  }

  return NextResponse.json({ classifications });
}
