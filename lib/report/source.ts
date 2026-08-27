/**
 * レポートのAI分析に渡す「材料」を WorkshopData から組み立てる。
 *
 * 方針:
 * - 会社軸／社会軸それぞれに、①出発点（研修前に重視していたこと）②到達点（こうしたいと
 *   考えるようになったこと）③裏づけ（実体験・強み・意識の変化）の3層で材料を渡す。
 *   これは prompt.ts が出力させる3点構成（重視 → こうしたい → 励まし＋注意）と対応する。
 * - AIには「見出し: 本文」の素朴なテキストで渡す。JSONを読ませるより、空欄の多い
 *   実データで安定するため。値が空の項目は行ごと落とす（AIに空欄を推測させない）。
 */

import type { AssetKey, AssetsData } from "@/lib/homework/assets/meta";
import { ASSET_META, ASSET_KEYS } from "@/lib/homework/assets/meta";
import type { ExcursionData } from "@/lib/homework/excursion/types";

type Json = Record<string, unknown>;

/**
 * policy = じぶん経営方針（MVV）。会社軸・社会軸の両方を束ねた、その人自身の方針。
 * WCMとMVVは次の対応で読み替える（研修の図版に準拠）:
 *   Must（本分・使命） → MISSION（存在意義）
 *   Will（ありたい姿） → VISION（ありたい姿）
 *   Can（役割と責任）  → VALUE（行動指針）
 */
export type ReportAxis = "company" | "society" | "policy";

/** WorkshopData の各フェーズ（Prisma の Json 列をそのまま受ける） */
export type ReportInput = {
  pre: unknown;
  day1: unknown;
  homework: unknown;
  day2: unknown;
  post: unknown;
};

function obj(v: unknown): Json {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {};
}

function text(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

/** 「見出し: 本文」の行。本文が空なら null（呼び出し側で落とす） */
function line(label: string, value: string): string | null {
  const v = value.trim();
  return v ? `${label}: ${v}` : null;
}

/** 空行を除いてブロックに整形。中身が無ければ null */
function block(title: string, lines: (string | null)[]): string | null {
  const body = lines.filter((l): l is string => !!l);
  return body.length ? `【${title}】\n${body.join("\n")}` : null;
}

/**
 * 事前・事後の同一設問の変化を「3 → 5」の形にする。
 * 片方でも欠けていれば空文字（＝行ごと落とす）。「事前は未回答」のような
 * 欠損の情報を渡すと、AIがそれを所見に書いてしまうため。
 */
function shift(pre: Json, post: Json, key: string): string {
  const a = pre[key];
  const b = post[key];
  if (typeof a !== "number" || typeof b !== "number") return "";
  return `${a} → ${b}`;
}

/** 会社軸の材料 */
function companySource(input: ReportInput): string {
  const day1 = obj(input.day1);
  const bunseki = obj(day1.bunseki);
  const bunkai = obj(day1.bunkai);
  const homework = obj(input.homework);
  const scenario = obj(homework.scenario);
  const company = obj(scenario.company);
  const day2 = obj(input.day2);
  const wcm = obj(day2.wcm);
  const cur = obj(wcm.current);
  const fut = obj(wcm.future);
  const summary = obj(day2.summary);
  const alignment = obj(bunseki.alignment);
  const pre = obj(obj(input.pre).survey);
  const post = obj(obj(input.post).surveyImmediate);

  const blocks = [
    // ① 出発点：研修前に会社で何を重視していたか
    block("研修前：じぶんと会社の重なり（Day1）", [
      line("会社が目指していること", text(alignment.vision)),
      line("自分がこの会社で働く理由", text(alignment.whyWork)),
      line("この会社で成し遂げたいこと", text(alignment.achieve)),
    ]),
    block("研修前：いまのWill/Can/Must（WCM 2.0）", [
      line("Will（やりたいこと）", text(cur.will)),
      line("Can（できること）", text(cur.can)),
      line("Must（するべきこと）", text(cur.must)),
    ]),
    block(
      "研修前：会社の中での好き・得意（Day1）",
      arr(bunseki.sukiTokui)
        .map((e) => obj(e))
        .filter((e) => e.row === "company")
        .map((e) => line(e.col === "good" ? "得意" : "好き", text(e.text)))
    ),
    block(
      "研修前：仕事の分人（Day1 分人シェア表）",
      arr(bunkai.shareTable)
        .map((r) => obj(r))
        .map((r) =>
          line(text(r.bunjin), [text(r.share), text(r.meaning)].filter(Boolean).join(" / "))
        )
    ),

    // ② 到達点：これからどうしたいと考えるようになったか
    block("研修後：会社編のみらいシナリオ（宿題）", [
      line("何歳まで走り切ると決めたか", text(company.age)),
      line("起きているだろう変化", text(company.change)),
      line("やりきりたいこと", text(company.doit)),
      line("応えたい相手", text(company.who)),
      line("応えたい課題", text(company.challenge)),
      line("いちばん活きる自分の力", text(company.power)),
      line("役割を終える年", text(company.endYear)),
      line("託していきたいもの", text(company.legacy)),
      line("託す相手", text(company.successor)),
    ]),
    block("研修後：ありたいWill/Can/Must（WCM 3.0）", [
      line("Will（ありたい姿）", text(fut.will)),
      line("Can（できるようになりたいこと）", text(fut.can)),
      line("Must（本分・なすべきこと）", text(fut.must)),
    ]),
    block("研修後：課題・目標・行動（Day2 まとめ）", [
      line("Must（私の本分）", text(summary.must)),
      line("Will（ありたい姿）", text(summary.will)),
      line("Issue（今の課題）", text(summary.issue)),
      line("Flag（まず目指す旗）", text(summary.flag)),
      line("Start（一歩目）", text(summary.start)),
    ]),

    // ③ 裏づけ：働く動機の源泉・意識の変化
    block(
      "働く動機の源泉（Day1）",
      arr(bunseki.workOrigin)
        .map((e) => obj(e))
        .map((e) => line(text(e.reason) || "きっかけ", text(e.experience)))
    ),
    block("意識の変化（事前 → 事後・5段階）", [
      line("自分のキャリアは自分で切り拓くものだと思う", shift(pre, post, "a1")),
      line("経験は社外でも通用する価値があると思う", shift(pre, post, "a4")),
      line("今の会社の中でやってみたいことがある", shift(pre, post, "c1")),
    ]),
  ];

  return blocks.filter((b): b is string => !!b).join("\n\n");
}

/** 社会軸の材料 */
function societySource(input: ReportInput): string {
  const day1 = obj(input.day1);
  const bunseki = obj(day1.bunseki);
  const bunkai = obj(day1.bunkai);
  const homework = obj(input.homework);
  const scenario = obj(homework.scenario);
  const society = obj(scenario.society);
  const excursion = homework.excursion as ExcursionData | undefined;
  const day2 = obj(input.day2);
  const backcast = obj(day2.backcast);
  const portfolio2 = obj(day2.portfolio);
  const socialContact = obj(bunseki.socialContact);
  const actionPlan = obj(day2.actionPlan);
  const pre = obj(obj(input.pre).survey);
  const post = obj(obj(input.post).surveyImmediate);

  const shiftPoints = Array.isArray(portfolio2.shift)
    ? portfolio2.shift.map((s) => text(s)).filter(Boolean)
    : [text(portfolio2.shift)].filter(Boolean);

  const blocks = [
    // ① 出発点：研修前の社会との関わり方
    block("研修前：社会との接点（Day1）", [
      line("すでに持っている接点", arr(socialContact.have).map(text).filter(Boolean).join("、")),
      line("持てていない接点", arr(socialContact.missing).map(text).filter(Boolean).join("、")),
    ]),
    block(
      "研修前：いまのポートフォリオ（Day1）",
      arr(bunkai.portfolio)
        .map((c) => obj(c))
        .map((c) =>
          line(
            `${text(c.title) || "（無題）"}（大きさ${typeof c.size === "number" ? c.size : "?"}）`,
            text(c.description) || String(c.type ?? "")
          )
        )
    ),

    // ② 到達点：これからどう社会と関わりたいか
    block("研修後：社会編のみらいシナリオ（宿題）", [
      line("2045年の自分の年齢", text(society.age)),
      line("取り組んでいる活動", text(society.activity)),
      line("感じていた社会の課題", text(society.issue)),
      line("動けずにいた言い訳・思い込み", text(society.excuse)),
      line("得られている実感", text(society.fulfill)),
      line("活かせている自分の力", text(society.power)),
      line("誰・何のために", text(society.forWhom)),
      line("2026年の自分へのメッセージ", text(society.message)),
    ]),
    block("研修後：バックキャスト（Day2）", [
      line("未来と今のギャップから見えた課題", text(backcast.issue)),
      line("まず目指すゴール", text(backcast.goal)),
      line("何から始めるか", text(backcast.firstStep)),
    ]),
    block("研修後：ポートフォリオ3.0（Day2）", [
      line("何年時点の姿か", text(portfolio2.year)),
      ...arr(portfolio2.future)
        .map((c) => obj(c))
        .map((c) =>
          line(
            `${text(c.title) || "（無題）"}（大きさ${typeof c.size === "number" ? c.size : "?"}）`,
            text(c.description) || String(c.type ?? "")
          )
        ),
      line("シフトポイント", shiftPoints.join("、")),
    ]),
    block("研修後：アクションプラン（Day2）", [
      line("対象", text(actionPlan.target)),
      line("なぜやるのか", text(actionPlan.why)),
      line("誰と", text(actionPlan.with)),
      line("何をする", text(actionPlan.what)),
      line("それによってどうなる", text(actionPlan.sowhat)),
    ]),

    // ③ 裏づけ：実際にやってみた越境体験・意識の変化
    block("実際にやってみたこと：プチ越境体験（宿題）", [
      line("決めた企画", text(excursion?.decision?.summary)),
      line("行った場所", text(excursion?.report?.place)),
      line("そこにいた人・していたこと", text(excursion?.report?.people)),
      line("感想", text(excursion?.report?.impression)),
    ]),
    block("意識の変化（事前 → 事後・5段階）", [
      line("会社の外でやってみたいことがある", shift(pre, post, "c2")),
      line("キャリアを本音で話せる相手が社外にいる", shift(pre, post, "c3")),
      line("3か月以内に具体的な行動を起こすつもりだ", shift(pre, post, "c4")),
      line("60歳以降の働き方に具体的なイメージがある", shift(pre, post, "a5")),
    ]),
  ];

  return blocks.filter((b): b is string => !!b).join("\n\n");
}

/** 両軸に共通で添える、その人の背景（じぶん資産表・じぶん紹介） */
function commonBackground(input: ReportInput): string {
  const pre = obj(input.pre);
  const slide = obj(pre.profileSlide);
  const work = obj(slide.work);
  const assets = obj(input.homework).assets as AssetsData | undefined;

  const assetLines = ASSET_KEYS.flatMap((k: AssetKey) => {
    const answers = assets?.[k];
    if (!Array.isArray(answers)) return [];
    const filled = answers.map(text).filter(Boolean);
    return filled.length ? [line(ASSET_META[k].label, filled.join("、"))] : [];
  });

  const blocks = [
    block("この方について（じぶん紹介）", [
      line("会社・部署・肩書き", [text(work.company), text(work.dept), text(work.title)].filter(Boolean).join(" / ")),
      line("知ってほしいポイント", arr(slide.points).map(text).filter(Boolean).join("、")),
      line("会社の役割", text(work.q1)),
      line("組織の役割", text(work.q2)),
      line("自分の役割", text(work.q3)),
    ]),
    block("じぶん資産表（宿題）", assetLines),
  ];

  return blocks.filter((b): b is string => !!b).join("\n\n");
}

/**
 * じぶん経営方針（MVV）の材料。
 * 会社軸・社会軸を束ねた「その人自身の方針」なので、両方のシナリオを渡す。
 * MVVの元になるのは Day2 の WCM 3.0 と、最後にまとめた課題・目標・行動。
 */
function policySource(input: ReportInput): string {
  const day1 = obj(input.day1);
  const bunseki = obj(day1.bunseki);
  const homework = obj(input.homework);
  const scenario = obj(homework.scenario);
  const company = obj(scenario.company);
  const society = obj(scenario.society);
  const day2 = obj(input.day2);
  const fut = obj(obj(day2.wcm).future);
  const summary = obj(day2.summary);
  const actionPlan = obj(day2.actionPlan);
  const backcast = obj(day2.backcast);

  const blocks = [
    // MISSION の元 = Must（本分・使命）
    block("Must（本分・使命）＝ミッションの元", [
      line("WCM3.0 のMust（なすべきこと）", text(fut.must)),
      line("まとめ：私の本分は", text(summary.must)),
      line("会社編シナリオ：やりきりたいこと", text(company.doit)),
      line("会社編シナリオ：応えたい相手と課題", [text(company.who), text(company.challenge)].filter(Boolean).join(" の ")),
      line("社会編シナリオ：感じていた社会の課題", text(society.issue)),
      line("社会編シナリオ：誰・何のために", text(society.forWhom)),
    ]),

    // VISION の元 = Will（ありたい姿）
    block("Will（ありたい姿）＝ビジョンの元", [
      line("WCM3.0 のWill（ありたい姿）", text(fut.will)),
      line("まとめ：ありたい姿は", text(summary.will)),
      line("社会編シナリオ：取り組んでいる活動", text(society.activity)),
      line("社会編シナリオ：得られている実感", text(society.fulfill)),
      line("会社編シナリオ：託していきたいもの", text(company.legacy)),
      line("バックキャスト：まず目指すゴール", text(backcast.goal)),
    ]),

    // VALUE の元 = Can（役割と責任／行動指針）
    block("Can（役割と責任）＝バリュー（行動指針）の元", [
      line("WCM3.0 のCan（できるようになりたいこと）", text(fut.can)),
      line("いちばん活きる自分の力（会社編）", text(company.power)),
      line("活かせている自分の力（社会編）", text(society.power)),
      line("まとめ：まず目指す旗", text(summary.flag)),
      line("まとめ：一歩目", text(summary.start)),
      line("アクションプラン：何をする", text(actionPlan.what)),
      line("アクションプラン：誰と", text(actionPlan.with)),
      line("バックキャスト：何から始めるか", text(backcast.firstStep)),
    ]),

    // 方針の裏づけ（何に根ざした方針なのか）
    block(
      "働く動機の源泉（Day1）",
      arr(bunseki.workOrigin)
        .map((e) => obj(e))
        .map((e) => line(text(e.reason) || "きっかけ", text(e.experience)))
    ),
    block("じぶんと会社の重なり（Day1）", [
      line("自分がこの会社で働く理由", text(bunseki.alignment ? obj(bunseki.alignment).whyWork : "")),
      line("この会社で成し遂げたいこと", text(bunseki.alignment ? obj(bunseki.alignment).achieve : "")),
    ]),
  ];

  return blocks.filter((b): b is string => !!b).join("\n\n");
}

/**
 * 指定した軸のAI分析用テキストを組み立てる。
 * 材料がほとんど無いときは null（呼び出し側でAIを叩かず「記入が少ない」旨を出す）。
 */
export function buildReportSource(
  input: ReportInput,
  axis: ReportAxis
): string | null {
  const main =
    axis === "company"
      ? companySource(input)
      : axis === "society"
        ? societySource(input)
        : policySource(input);
  if (main.trim().length < 40) return null;

  const background = commonBackground(input);
  return background ? `${background}\n\n${main}` : main;
}
