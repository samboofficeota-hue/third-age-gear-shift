-- email_logs / _prisma_migrations だけ RLS が無効のまま残っていたのを有効化する。
--
-- 経緯: 2026-08-21 に email_logs を追加した際、ENABLE ROW LEVEL SECURITY を書き忘れた。
-- RLS 無効のテーブルは anon / authenticated ロールに全開放されるため、ブラウザバンドルに
-- 含まれる公開 anon キーだけで、受講者のメールアドレス・所属研修・送信操作をした事務局担当者の
-- アドレスが読み書きできる状態だった（2026-08-27 のセキュリティレビューで検出）。
--
-- ポリシーは作らない。アプリは Prisma が postgres ロールで接続するため RLS を迂回する。
-- 他の全テーブルも「RLS 有効・ポリシー無し」で正常動作しており、それに揃える。
--
-- ALTER ... ENABLE ROW LEVEL SECURITY は冪等（既に有効でもエラーにならない）。
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
