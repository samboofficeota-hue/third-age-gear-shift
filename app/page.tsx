import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold text-stone-800">
        サードエイジへのギア・シフト
      </h1>
      <p className="text-stone-600">
        ミドルシニア向け 2日間ワークショップ用ウェブアプリ（開発中）
      </p>
      <Link
        href="/workshop/block-0"
        className="rounded-xl bg-community px-6 py-3 text-white transition hover:bg-community-light"
      >
        オンボーディングを始める（Block 0）
      </Link>
    </main>
  );
}
