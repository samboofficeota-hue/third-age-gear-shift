import { WorksheetPlaceholder } from "@/components/worksheet/WorksheetPlaceholder";

/** 事前: じぶん紹介ワークシート（A4横・プレースホルダ）。pre は ungated。 */
export default function ProfileSlidePage() {
  return (
    <WorksheetPlaceholder
      phaseLabel="事前課題"
      title="じぶん紹介"
      note="名前・写真・3つのポイント／生い立ち／今の会社・仕事 を記入（今後追加）"
    />
  );
}
