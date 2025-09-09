-- ステータスの更新SQL
-- submitted と rejected ステータスを draft に変更

-- まず現在のステータス分布を確認
SELECT status, COUNT(*) as count 
FROM daily_reports 
GROUP BY status;

-- submitted ステータスを draft に変更
UPDATE daily_reports 
SET status = 'draft' 
WHERE status = 'submitted';

-- rejected ステータスを draft に変更
UPDATE daily_reports 
SET status = 'draft' 
WHERE status = 'rejected';

-- テーブル構造の変更（ENUMの修正）
ALTER TABLE daily_reports 
MODIFY COLUMN status enum('draft','approved') DEFAULT 'draft' COMMENT 'ステータス';

-- 変更後のステータス分布を確認
SELECT status, COUNT(*) as count 
FROM daily_reports 
GROUP BY status;
