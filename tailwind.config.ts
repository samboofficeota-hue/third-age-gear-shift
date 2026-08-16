import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts}",
  ],
  theme: {
  	extend: {
  		colors: {
  			/* ── ブランドカラー（ネオングリーン × ダーク） ── */
  			neon: {
  				DEFAULT: '#00ff88',   /* メインアクセント */
  				dim:     '#00cc6a',   /* hover / グラデ終端 */
  			},
  			'bg-dark':  '#0a0e1a',    /* ページ背景 */
  			'bg-panel': '#0f1420',    /* ナビ・テーブルヘッダー */
  			'bg-card':  '#141a2a',    /* カード背景 */
  			hairline:   'rgba(255,255,255,0.06)', /* 中立の区切り線（カード内セクション区切り等） */

  			/* ── ワークシート（白地A4横）パレット：WORKSHEET_DESIGN.md ── */
  			ws: {
  				ink:    '#1F2937',   /* 本文 */
  				muted:  '#6B7280',   /* 補足 */
  				line:   '#D1D5DB',   /* 罫線 */
  				fill:   '#F4F6F5',   /* 薄面 */
  				teal:   '#129B86',   /* 構造アクセント */
  				accent: '#E5277E',   /* 強調（"じぶん"等） */
  				mint:   '#EAF3EC',   /* ルール枠の薄面 */
  				family: '#3B82F6',   /* 家庭 */
  				work:   '#E5277E',   /* 仕事 */
  				gift:   '#9A6A3C',   /* ギフト */
  				learn:  '#22A06B',   /* 学習 */
  			},

  			/* ── テキスト（ゲームUI） ──
  			   本文既定色は globals.css の body(#e0f0e8) と foreground が担う。
  			   サブ/メタ色は shadcn の secondary-foreground(#a0c0b0) / muted-foreground(#708070)。
  			   ※ 旧 'text-base' 色トークンは font-size ユーティリティ .text-base と
  			     クラス名衝突するため撤去（2026-08-12）。 */

  			/* ── shadcn/ui CSS変数 ── */
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		/* ── タイプスケール（rem基準・行間内蔵） ──
  		   html ルートを 16/17/18px と可変にする（globals.css）ため rem で定義。
  		   標準キー(xs..5xl)にも和文向けの line-height を必ず持たせ、行間のバラつきを封じる。
  		   意味づけキー(h1..h4, body-*, kpi)は用途を固定して使う。 */
  		fontSize: {
  			xs:   ['0.75rem',  { lineHeight: '1.5'  }],
  			sm:   ['0.875rem', { lineHeight: '1.6'  }],
  			base: ['1rem',     { lineHeight: '1.75' }],
  			lg:   ['1.125rem', { lineHeight: '1.8'  }],
  			xl:   ['1.25rem',  { lineHeight: '1.6'  }],
  			'2xl': ['1.5rem',   { lineHeight: '1.4'  }],
  			'3xl': ['1.875rem', { lineHeight: '1.3'  }],
  			'4xl': ['2.25rem',  { lineHeight: '1.2'  }],
  			'5xl': ['3rem',     { lineHeight: '1.1'  }],

  			/* 見出し（UPPERCASE運用はページ側のユーティリティで付与） */
  			display: ['2.625rem', { lineHeight: '1.15', fontWeight: '900', letterSpacing: '0.02em' }],
  			h1:      ['2.25rem',  { lineHeight: '1.2',  fontWeight: '900', letterSpacing: '0.02em' }],
  			h2:      ['1.75rem',  { lineHeight: '1.3',  fontWeight: '800', letterSpacing: '0.01em' }],
  			h3:      ['1.375rem', { lineHeight: '1.4',  fontWeight: '700' }],
  			h4:      ['1.125rem', { lineHeight: '1.5',  fontWeight: '700' }],

  			/* 本文 */
  			'body-lg': ['1.125rem', { lineHeight: '1.9' }],
  			body:      ['1rem',     { lineHeight: '1.75' }],
  			'body-sm': ['0.875rem', { lineHeight: '1.6' }],
  			caption:   ['0.75rem',  { lineHeight: '1.5' }],

  			/* KPI・数値強調 */
  			kpi: ['2.25rem', { lineHeight: '1', fontWeight: '900' }],
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-noto-sans-jp)',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'sans-serif'
  			]
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			'neon':        '0 0 20px rgba(0,255,136,0.2), 0 8px 32px rgba(0,0,0,0.4)',
  			'neon-strong': '0 0 20px rgba(0,255,136,0.4), 0 8px 32px rgba(0,0,0,0.4)',
  			'neon-glow':   '0 0 15px rgba(0,255,136,0.3)',
  			'card-dark':   '0 8px 32px rgba(0,0,0,0.4)',
  		},
  		backgroundImage: {
  			'neon-bar': 'linear-gradient(90deg, #00ff88, #00cc6a)',
  			'neon-fade': 'linear-gradient(90deg, transparent, #00ff88, transparent)',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
