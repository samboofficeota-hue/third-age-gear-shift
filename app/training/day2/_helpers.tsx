"use client";

import {
  CommunityPortfolio,
  type PortfolioCircle,
} from "@/components/worksheet/CommunityPortfolio";
import { cn } from "@/lib/utils";
import { MINI_SCALE } from "./_constants";

/** 読み取り専用ポートフォリオを縮小表示（フレーム660×430のみ）。比較ステップ用 */
export function MiniPortfolio({
  label,
  year,
  value,
  scale = MINI_SCALE,
}: {
  label: string;
  year: string;
  value: PortfolioCircle[];
  scale?: number;
}) {
  const w = Math.round(660 * scale);
  const h = Math.round(430 * scale) + 4;
  return (
    <div style={{ width: w }}>
      <p className="mb-1 text-center text-sm font-bold text-ws-teal">
        {label}
        {year ? `（${year}年）` : ""}
      </p>
      <div style={{ width: w, height: h, overflow: "hidden" }}>
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: 660,
          }}
        >
          {/* CommunityPortfolio の mt-6 を相殺してフレーム上端から表示 */}
          <div className="-mt-6">
            <CommunityPortfolio
              value={value}
              readOnly
              hideQuadrantLabels
              titleFontScale={12 / 11 / scale}
              allowLabelOverflow
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** アクションプランの記入ボックス（Why/With/What/So What 共通） */
export function ActionBox({
  label,
  value,
  onChange,
  ph,
  readOnly = false,
  rows = 6,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  ph: string;
  readOnly?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-bold text-ws-teal">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={ph}
        readOnly={readOnly}
        className="w-full resize-none rounded-md border border-ws-line px-3 py-2 text-base leading-relaxed text-ws-ink outline-none placeholder:text-ws-muted/50 focus:border-ws-teal"
      />
    </div>
  );
}

/** Will/Can/Must の記入ボックス（高さ固定で左右の列を揃える） */
export function WcmBox({
  value,
  onChange,
  emph = false,
  readOnly = false,
}: {
  value: string;
  onChange: (v: string) => void;
  emph?: boolean;
  readOnly?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      placeholder="○○○○"
      readOnly={readOnly}
      className={cn(
        "h-20 w-full resize-none rounded-xl px-3 py-2 text-base leading-relaxed text-ws-ink outline-none placeholder:text-ws-muted/40 focus:border-ws-teal",
        emph ? "border-2 border-ws-teal" : "border border-ws-line"
      )}
    />
  );
}

/** 下から上への三角矢印（Will/Can/Must の Must→Can→Will） */
export function UpTriangle() {
  return (
    <div className="h-0 w-0 border-x-[10px] border-b-[15px] border-x-transparent border-b-ws-accent" />
  );
}
