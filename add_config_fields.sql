-- daily_reportsテーブルに設定保存用フィールドを追加

ALTER TABLE daily_reports 
ADD COLUMN payment_method_config LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '保存時の支払方法設定（JSON）' CHECK (json_valid(`payment_method_config`)) AFTER cash_data,
ADD COLUMN point_payment_config LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '保存時のポイント支払設定（JSON）' CHECK (json_valid(`point_payment_config`)) AFTER payment_method_config;
