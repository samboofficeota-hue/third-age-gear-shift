/** 管理画面（/admin）で共有する型。API のレスポンス形と1:1で対応させる。 */

export type BlockStatus = "LOCKED" | "PREVIEW" | "OPEN" | "CLOSED";

export type BlockInfo = {
  blockId: string;
  status: BlockStatus;
  openedAt: string | null;
};

export type InviteStatus = "activated" | "invited" | "none";

export type Participant = {
  id: string;
  email: string;
  name: string | null;
  department: string | null;
  organizationName: string | null;
  inviteStatus: InviteStatus;
  invitedAt: string | null;
  activatedAt: string | null;
  completedPhases: string[];
  lastUpdated: string | null;
  preSurveyDone: boolean;
  profileSlideDone: boolean;
  attendanceDay1: boolean | null;
  attendanceDay2: boolean | null;
  completedAt: string | null;
};

export type SessionInfo = {
  id: string;
  name: string | null;
  code: string;
  isActive: boolean;
  createdAt: string;
  day1Date: string | null;
  day2Date: string | null;
  location: string | null;
  isOnline: boolean;
  facilitatorId: string | null;
  facilitatorName: string | null;
  participantCount: number;
};

export type Facilitator = {
  id: string;
  name: string | null;
  email: string;
};

export type InviteResult = {
  email: string;
  name: string | null;
  status: "created" | "reissued" | "skipped" | "error";
  reason?: string;
  inviteUrl?: string;
};

export type InviteSummary = {
  requested: number;
  created: number;
  reissued: number;
  skipped: number;
  error: number;
};

export const STATUS_LABEL: Record<BlockStatus, string> = {
  LOCKED: "ロック中",
  PREVIEW: "プレビュー",
  OPEN: "開放中",
  CLOSED: "クローズ",
};

export const STATUS_DOT: Record<BlockStatus, string> = {
  LOCKED: "bg-muted-foreground/40",
  PREVIEW: "bg-chart-3",
  OPEN: "bg-primary",
  CLOSED: "bg-destructive",
};

export function statusBadgeVariant(
  status: BlockStatus
): "secondary" | "default" | "destructive" | "outline" {
  if (status === "OPEN") return "default";
  if (status === "CLOSED") return "destructive";
  if (status === "PREVIEW") return "outline";
  return "secondary";
}

/** ISO文字列 → 「8/6 14:30」 */
export function formatTime(iso: string | null) {
  if (!iso) return "－";
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string | null) {
  if (!iso) return "－";
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

/** Date → input[type=date] 用の YYYY-MM-DD（JSTで切る） */
export function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

/* ── メール（P-1 / M-1） ───────────────────────────── */

export type EmailTemplateKey = "invite" | "reminder_pre" | "completion" | "followup_3m";

export type MailConfig = {
  /** RESEND_API_KEY が設定されているか */
  configured: boolean;
  from: string;
  replyTo: string;
  /** メール内リンクの基点。localhost のままだと受講生がリンクを開けない */
  appUrl: string;
  /** 差出人ドメインが Resend で認証済みか。unknown は確認できなかった場合 */
  domainState: "verified" | "unverified" | "unknown";
  domain: string;
};

export type EmailLogRow = {
  id: string;
  to: string;
  name: string | null;
  userId: string | null;
  template: EmailTemplateKey;
  subject: string;
  status: "sent" | "failed";
  error: string | null;
  sentBy: string | null;
  createdAt: string;
};

export type MailSendResult = {
  email: string;
  name: string | null;
  status: "sent" | "failed" | "skipped";
  reason?: string;
};

export type MailSendSummary = {
  requested: number;
  sent: number;
  failed: number;
  skipped: number;
};

export const TEMPLATE_LABEL: Record<EmailTemplateKey, string> = {
  invite: "招待メール",
  reminder_pre: "事前課題リマインド",
  completion: "修了の激励",
  followup_3m: "3ヶ月後リマインド",
};
