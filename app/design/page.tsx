import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Trophy } from "lucide-react";

/**
 * /design — デザインシステムのプレビュー（開発用スタイルガイド）。
 * ネオン×ダークの世界観のまま、タイポグラフィ・行間・スペーシング・カードの
 * 新ルールを一望する。ここで詰めてから各ページへ展開する。
 */
export default function DesignSystemPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
      {/* ── Header ── */}
      <header className="mb-14">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neon">
          Design System
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-neon text-glow-neon">
          じぶん戦略講座 UI
        </h1>
        <p className="mt-3 max-w-2xl text-body-lg text-secondary-foreground">
          ネオン×ダークの世界観はそのままに、文字サイズ・行間・余白・カード設計の
          「規律」を整えました。ミドルシニアが迷わず読める実用ツールを目指します。
        </p>
      </header>

      {/* ── Typography ── */}
      <Section title="Typography / タイプスケール">
        <div className="space-y-5">
          <ScaleRow token="text-display" note="ヒーロー見出し">
            <span className="text-display text-neon">はじめよう</span>
          </ScaleRow>
          <ScaleRow token="text-h1" note="ページ見出し h1">
            <span className="text-h1">これからのサードエイジ</span>
          </ScaleRow>
          <ScaleRow token="text-h2" note="セクション見出し h2">
            <span className="text-h2">経験の棚卸し</span>
          </ScaleRow>
          <ScaleRow token="text-h3" note="カード見出し h3">
            <span className="text-h3">好きと得意のマトリクス</span>
          </ScaleRow>
          <ScaleRow token="text-body-lg" note="本文（読み物・約20px）">
            <span className="text-body-lg text-secondary-foreground">
              これまでの経験を棚卸しし、これからの「サードエイジ」を、じぶんの言葉で設計していく。
            </span>
          </ScaleRow>
          <ScaleRow token="text-body" note="本文（標準・18px）">
            <span className="text-body text-secondary-foreground">
              これまでの経験を棚卸しし、これからの「サードエイジ」を、じぶんの言葉で設計していく。
            </span>
          </ScaleRow>
          <ScaleRow token="text-sm" note="補足・キャプション">
            <span className="text-sm text-muted-foreground">
              招待制プログラムです。事務局からの案内メールよりお進みください。
            </span>
          </ScaleRow>
        </div>
      </Section>

      {/* ── Buttons ── */}
      <Section title="Buttons / ボタン">
        <div className="flex flex-wrap items-center gap-4">
          <Button>
            はじめる
            <ArrowRight />
          </Button>
          <Button variant="outline">詳しく見る</Button>
          <Button variant="secondary">あとで</Button>
          <Button variant="ghost">スキップ</Button>
          <Button variant="link">ヘルプ</Button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large / CTA</Button>
        </div>
      </Section>

      {/* ── Cards ── */}
      <Section title="Cards / カード">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-neon/10 text-2xl text-neon">
                <Sparkles />
              </div>
              <CardTitle>静的カード</CardTitle>
              <CardDescription>
                情報を落ち着いて見せる。ホバーでは動かない（既定）。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-body text-secondary-foreground">
                2px のネオン枠と外周グロー。角丸12px、余白24px。本文は行間1.75で
                読みやすさを確保しています。
              </p>
            </CardContent>
          </Card>

          <Card interactive>
            <CardHeader>
              <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-neon/10 text-2xl text-neon">
                <Trophy />
              </div>
              <CardTitle>インタラクティブ</CardTitle>
              <CardDescription>
                クリックできるカードは interactive で浮かせる。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-body text-secondary-foreground">
                ホバーで translateY・枠がネオンに・グロー強化。クエスト選択など
                「押せる」要素に使います。
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ── Spacing ── */}
      <Section title="Spacing / 余白の目安">
        <ul className="space-y-2 text-body text-secondary-foreground">
          <li>セクション間: <code className="text-neon">py-16</code>（〜80px）</li>
          <li>見出し→本文: <code className="text-neon">mt-2〜mt-3</code></li>
          <li>カード内: <code className="text-neon">p-6</code>（24px）／カード間: <code className="text-neon">gap-6</code></li>
          <li>本文ブロック間: <code className="text-neon">space-y-4〜5</code></li>
        </ul>
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-16">
      <h2 className="mb-6 border-l-4 border-neon pl-3 text-xl font-extrabold uppercase tracking-wider text-neon">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ScaleRow({
  token,
  note,
  children,
}: {
  token: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border pb-4 sm:grid-cols-[180px_1fr] sm:gap-4">
      <div className="pt-1">
        <code className="text-sm text-neon">{token}</code>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
