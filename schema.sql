-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- ホスト: 127.0.0.1
-- 生成日時: 2025-09-17 05:41:38
-- サーバのバージョン： 10.4.32-MariaDB
-- PHP のバージョン: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- データベース: `sales_report`
--

-- --------------------------------------------------------

--
-- テーブルの構造 `daily_reports`
--

CREATE TABLE `daily_reports` (
  `id` int(11) NOT NULL,
  `report_date` date NOT NULL COMMENT '報告日',
  `store_id` int(11) DEFAULT NULL,
  `user_id` varchar(50) NOT NULL COMMENT '入力者ID',
  `sales_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '売上データ（JSON）' CHECK (json_valid(`sales_data`)),
  `point_payments_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'ポイント・クーポン支払データ（JSON）' CHECK (json_valid(`point_payments_data`)),
  `income_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '入金・雑収入データ（JSON）' CHECK (json_valid(`income_data`)),
  `expense_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '経費データ（JSON）' CHECK (json_valid(`expense_data`)),
  `cash_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '現金管理データ（JSON）' CHECK (json_valid(`cash_data`)),
  `payment_method_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '保存時の支払方法設定（JSON）' CHECK (json_valid(`payment_method_config`)),
  `point_payment_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '保存時のポイント支払設定（JSON）' CHECK (json_valid(`point_payment_config`)),
  `manual_tax_inputs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '手動税率入力データ（JSON）' CHECK (json_valid(`manual_tax_inputs`)),
  `previous_cash_balance` decimal(10,2) DEFAULT 0.00 COMMENT '前日現金残',
  `cash_difference` decimal(10,2) DEFAULT 0.00 COMMENT '現金過不足',
  `remarks` text DEFAULT NULL COMMENT '備考',
  `attached_files` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '添付ファイルデータ（JSON）' CHECK (json_valid(`attached_files`)),
  `status` enum('draft','submitted','approved','rejected') DEFAULT 'draft' COMMENT 'ステータス',
  `submitted_at` timestamp NULL DEFAULT NULL COMMENT '送信日時',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='日次売上報告書';

--
-- テーブルのデータのダンプ `daily_reports`
--

INSERT INTO `daily_reports` (`id`, `report_date`, `store_id`, `user_id`, `sales_data`, `point_payments_data`, `income_data`, `expense_data`, `cash_data`, `payment_method_config`, `point_payment_config`, `manual_tax_inputs`, `previous_cash_balance`, `cash_difference`, `remarks`, `attached_files`, `status`, `submitted_at`, `created_at`, `updated_at`) VALUES
(10, '2025-09-16', 2, '柳澤', '\"{\\\"cash10\\\":10160,\\\"cash8\\\":0,\\\"stera10\\\":167454,\\\"stera8\\\":0,\\\"other10\\\":0,\\\"other8\\\":0,\\\"Uber10\\\":0,\\\"Uber8\\\":0,\\\"menu10\\\":0,\\\"menu8\\\":0}\"', '\"{\\\"horpepper10\\\":0,\\\"horpepper8\\\":0,\\\"ikkyu10\\\":0,\\\"ikkyu8\\\":0,\\\"tabelog10\\\":0,\\\"tabelog8\\\":0,\\\"hitosawa10\\\":0,\\\"hitosawa8\\\":0}\"', '\"{\\\"nyukin\\\":470164,\\\"miscIncome\\\":0,\\\"foundMoney\\\":2}\"', '\"[{\\\"id\\\":1,\\\"vendor\\\":\\\"\\u30c6\\u30b9\\u30c8\\u8cb7\\u3044\\u72691\\\",\\\"account\\\":\\\"\\\",\\\"item\\\":\\\"3D\\u9c3b\\\",\\\"amount\\\":1},{\\\"id\\\":2,\\\"vendor\\\":\\\"\\u30c6\\u30b9\\u30c8\\u8cb7\\u3044\\u7269\\uff12\\\",\\\"account\\\":\\\"\\\",\\\"item\\\":\\\"\\u97cb\\u99c4\\u5929\\u5305\\u4e01\\\",\\\"amount\\\":1}]\"', '\"{\\\"bill10000\\\":{\\\"register\\\":1,\\\"safe\\\":0},\\\"bill5000\\\":{\\\"register\\\":18,\\\"safe\\\":0},\\\"bill2000\\\":{\\\"register\\\":1,\\\"safe\\\":0},\\\"bill1000\\\":{\\\"register\\\":49,\\\"safe\\\":0},\\\"coin500\\\":{\\\"register\\\":81,\\\"safe\\\":0},\\\"coin100\\\":{\\\"register\\\":118,\\\"safe\\\":0},\\\"coin50\\\":{\\\"register\\\":108,\\\"safe\\\":0},\\\"coin10\\\":{\\\"register\\\":117,\\\"safe\\\":0},\\\"coin5\\\":{\\\"register\\\":45,\\\"safe\\\":0},\\\"coin1\\\":{\\\"register\\\":65,\\\"safe\\\":0},\\\"totals\\\":{\\\"registerTotal\\\":210160,\\\"safeTotal\\\":0,\\\"totalCash\\\":210160}}\"', '[{\"id\":\"cash\",\"label\":\"\\u73fe\\u91d1\",\"color\":\"blue\",\"isCash\":true,\"enabled\":true},{\"id\":\"stera\",\"label\":\"stera\",\"color\":\"red\",\"isCash\":false,\"enabled\":true},{\"id\":\"other\",\"label\":\"\\u305d\\u306e\\u4ed6\\u652f\\u6255\",\"color\":\"blue\",\"isCash\":false,\"enabled\":true},{\"id\":\"Uber\",\"label\":\"Uber\",\"color\":\"blue\",\"isCash\":false,\"enabled\":true},{\"id\":\"menu\",\"label\":\"menu\",\"color\":\"blue\",\"isCash\":false,\"enabled\":true}]', '[{\"id\":\"horpepper\",\"label\":\"HOT PPEPER\",\"enabled\":true},{\"id\":\"ikkyu\",\"label\":\"\\u4e00\\u4f11\",\"enabled\":true},{\"id\":\"tabelog\",\"label\":\"\\u98df\\u3079\\u30ed\\u30b0\",\"enabled\":true},{\"id\":\"hitosawa\",\"label\":\"\\u30d2\\u30c8\\u30b5\\u30e9\",\"enabled\":true}]', '\"{\\\"manual10Percent\\\":177614,\\\"manual8Percent\\\":0}\"', 670164.00, 0.00, 'テスト実データだお　ユーザーサイド', NULL, 'draft', '2025-09-17 03:38:51', '2025-09-17 02:43:15', '2025-09-17 03:38:51');

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `daily_report_list`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `daily_report_list` (
);

-- --------------------------------------------------------

--
-- テーブルの構造 `payment_method_masters`
--

CREATE TABLE `payment_method_masters` (
  `id` int(11) NOT NULL,
  `method_id` varchar(50) NOT NULL COMMENT '支払方法ID（システム内部用）',
  `method_name` varchar(100) NOT NULL COMMENT '支払方法名',
  `method_type` enum('cash','cashless') NOT NULL DEFAULT 'cashless' COMMENT '支払種別',
  `method_category` varchar(20) NOT NULL DEFAULT 'payment' COMMENT '区分(payment:支払方法/point:ポイント)',
  `color_code` varchar(20) DEFAULT 'blue' COMMENT '表示色',
  `display_order` int(11) DEFAULT 100 COMMENT '表示順序',
  `is_system_default` tinyint(1) DEFAULT 0 COMMENT 'システム標準フラグ',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '有効フラグ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '削除日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支払方法マスター';

--
-- テーブルのデータのダンプ `payment_method_masters`
--

INSERT INTO `payment_method_masters` (`id`, `method_id`, `method_name`, `method_type`, `method_category`, `color_code`, `display_order`, `is_system_default`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(45, 'cash', '現金', 'cash', 'payment', 'blue', 1, 1, 1, '2025-09-05 07:55:45', '2025-09-09 07:54:47', NULL),
(46, 'cash2', '現金2', 'cash', 'payment', 'green', 2, 0, 1, '2025-09-05 07:56:11', '2025-09-05 07:56:11', NULL),
(47, 'stera', 'stera', 'cashless', 'payment', 'red', 100, 0, 1, '2025-09-05 07:56:31', '2025-09-05 07:57:45', NULL),
(48, 'paypay', 'paypay', 'cashless', 'payment', 'blue', 101, 0, 1, '2025-09-05 07:57:30', '2025-09-11 06:00:49', NULL),
(49, 'habatanpay', 'はばたんpay', 'cashless', 'payment', 'blue', 102, 0, 1, '2025-09-05 07:58:05', '2025-09-11 07:52:45', NULL),
(50, 'other', 'その他支払', 'cashless', 'payment', 'blue', 104, 0, 1, '2025-09-05 07:59:05', '2025-09-11 07:52:46', NULL),
(51, 'horpepper', 'HOT PPEPER', '', 'point', 'blue', 1, 0, 1, '2025-09-05 07:59:35', '2025-09-09 07:54:20', NULL),
(52, 'ikkyu', '一休', '', 'point', 'blue', 2, 0, 1, '2025-09-05 08:00:00', '2025-09-05 08:04:31', NULL),
(53, 'tabelog', '食べログ', '', 'point', 'blue', 3, 0, 1, '2025-09-05 08:00:20', '2025-09-05 08:00:20', NULL),
(54, 'hitosawa', 'ヒトサラ', '', 'point', 'blue', 4, 0, 1, '2025-09-05 08:00:47', '2025-09-05 08:00:47', NULL),
(55, 'Uber', 'Uber', 'cashless', 'payment', 'blue', 105, 0, 1, '2025-09-05 08:01:17', '2025-09-11 07:52:47', NULL),
(56, 'menu', 'menu', 'cashless', 'payment', 'blue', 106, 0, 1, '2025-09-05 08:01:35', '2025-09-11 07:53:10', NULL),
(57, 'yutai', '株主優待券', '', 'point', 'blue', 105, 0, 1, '2025-09-05 08:02:25', '2025-09-11 06:08:34', NULL),
(58, 'test', 'テスト', 'cash', 'payment', 'blue', 100, 0, 1, '2025-09-11 06:02:30', '2025-09-11 06:02:39', '2025-09-11 06:02:39');

-- --------------------------------------------------------

--
-- テーブルの構造 `point_payment_masters_backup`
--

CREATE TABLE `point_payment_masters_backup` (
  `id` int(11) NOT NULL DEFAULT 0,
  `point_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ポイントID（システム内部用）',
  `point_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ポイント・クーポン名',
  `point_type` enum('point','coupon','discount') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'point' COMMENT '種別',
  `display_order` int(11) DEFAULT 100 COMMENT '表示順序',
  `is_system_default` tinyint(1) DEFAULT 0 COMMENT 'システム標準フラグ',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '有効フラグ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `point_payment_masters_backup`
--

INSERT INTO `point_payment_masters_backup` (`id`, `point_id`, `point_name`, `point_type`, `display_order`, `is_system_default`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'hotpepper', 'HOT PEPPER', 'point', 1, 1, 1, '2025-09-02 12:58:55', '2025-09-03 03:57:31'),
(2, 'ikkyu', '一休', 'point', 2, 0, 1, '2025-09-02 12:58:55', '2025-09-03 06:51:09'),
(3, 'tabelog', '食べログ', 'point', 3, 0, 1, '2025-09-02 12:58:55', '2025-09-03 06:51:22'),
(4, 'hitosara', 'ヒトサラ', 'point', 4, 0, 1, '2025-09-02 12:58:55', '2025-09-03 06:51:32'),
(5, 'menu', 'menu', 'point', 5, 0, 1, '2025-09-02 12:58:55', '2025-09-03 06:51:50'),
(6, 'Benefit_Coupon', '株主優待券', 'discount', 6, 0, 1, '2025-09-02 12:58:55', '2025-09-03 06:52:03'),
(7, 'coupon_discount', 'クーポン割引', 'coupon', 7, 0, 1, '2025-09-02 12:58:55', '2025-09-03 06:52:14'),
(8, 'teip', '提P', 'point', 100, 0, 1, '2025-09-03 00:58:54', '2025-09-03 00:59:50');

-- --------------------------------------------------------

--
-- テーブルの構造 `report_attachments`
--

CREATE TABLE `report_attachments` (
  `id` int(11) NOT NULL,
  `report_id` int(11) NOT NULL COMMENT '報告書ID',
  `attachment_number` tinyint(4) NOT NULL COMMENT '添付番号（1-5）',
  `original_filename` varchar(255) NOT NULL COMMENT '元ファイル名',
  `stored_filename` varchar(255) NOT NULL COMMENT '保存ファイル名',
  `file_path` varchar(500) NOT NULL COMMENT 'ファイルパス',
  `file_size` int(11) NOT NULL COMMENT 'ファイルサイズ（バイト）',
  `mime_type` varchar(100) NOT NULL COMMENT 'MIMEタイプ',
  `upload_user_id` varchar(50) NOT NULL COMMENT 'アップロードユーザーID',
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'アップロード日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='報告書添付ファイル';

-- --------------------------------------------------------

--
-- テーブルの構造 `stores`
--

CREATE TABLE `stores` (
  `id` int(11) NOT NULL,
  `store_name` varchar(100) NOT NULL,
  `store_code` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- テーブルのデータのダンプ `stores`
--

INSERT INTO `stores` (`id`, `store_name`, `store_code`, `created_at`, `updated_at`, `is_deleted`, `deleted_at`) VALUES
(1, '本社', 'honsya', '2025-09-05 07:51:23', '2025-09-09 06:41:12', 1, '2025-09-09 06:41:12'),
(2, '四代目菊川　三ノ宮店', 'kikukawa_san', '2025-09-05 07:52:09', '2025-09-17 02:34:59', 0, NULL),
(3, 'ダンダダン　元町店', 'dan_motomachi', '2025-09-05 07:52:28', '2025-09-05 08:03:40', 0, NULL),
(5, 'ストランド垂水店', 'st_tarumi', '2025-09-08 08:12:54', '2025-09-11 06:58:31', 0, NULL),
(6, 'ストランド須磨店', 'st_suma', '2025-09-09 04:18:15', '2025-09-09 07:00:03', 0, NULL);

-- --------------------------------------------------------

--
-- テーブルの構造 `store_payment_settings`
--

CREATE TABLE `store_payment_settings` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL COMMENT '店舗ID',
  `payment_method_id` int(11) NOT NULL COMMENT '支払方法マスターID',
  `is_enabled` tinyint(1) DEFAULT 1 COMMENT '有効フラグ',
  `display_name` varchar(100) DEFAULT NULL COMMENT '店舗独自表示名（NULLならマスターの名前を使用）',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='店舗別支払方法設定';

--
-- テーブルのデータのダンプ `store_payment_settings`
--

INSERT INTO `store_payment_settings` (`id`, `store_id`, `payment_method_id`, `is_enabled`, `display_name`, `created_at`, `updated_at`, `is_deleted`, `deleted_at`) VALUES
(14, 3, 45, 1, NULL, '2025-09-05 08:03:42', '2025-09-05 08:03:42', 0, NULL),
(15, 3, 46, 0, NULL, '2025-09-05 08:03:42', '2025-09-05 08:03:42', 0, NULL),
(16, 3, 47, 0, NULL, '2025-09-05 08:03:42', '2025-09-05 08:03:42', 0, NULL),
(17, 3, 48, 1, NULL, '2025-09-05 08:03:42', '2025-09-05 08:03:42', 0, NULL),
(18, 3, 49, 1, NULL, '2025-09-05 08:03:42', '2025-09-05 08:03:42', 0, NULL),
(19, 3, 50, 0, NULL, '2025-09-05 08:03:42', '2025-09-05 08:03:42', 0, NULL),
(20, 3, 55, 0, NULL, '2025-09-05 08:03:42', '2025-09-05 08:03:42', 0, NULL),
(21, 3, 56, 0, NULL, '2025-09-05 08:03:42', '2025-09-05 08:03:42', 0, NULL),
(22, 3, 51, 0, NULL, '2025-09-05 08:03:42', '2025-09-05 08:03:42', 0, NULL),
(23, 3, 52, 0, NULL, '2025-09-05 08:03:42', '2025-09-05 08:03:42', 0, NULL),
(24, 3, 53, 0, NULL, '2025-09-05 08:03:42', '2025-09-05 08:03:42', 0, NULL),
(25, 3, 54, 0, NULL, '2025-09-05 08:03:42', '2025-09-05 08:03:42', 0, NULL),
(26, 3, 57, 1, NULL, '2025-09-05 08:03:42', '2025-09-05 08:03:42', 0, NULL),
(79, 6, 45, 1, NULL, '2025-09-09 07:00:05', '2025-09-09 07:00:05', 0, NULL),
(80, 6, 46, 0, NULL, '2025-09-09 07:00:05', '2025-09-09 07:00:05', 0, NULL),
(81, 6, 47, 0, NULL, '2025-09-09 07:00:05', '2025-09-09 07:00:05', 0, NULL),
(82, 6, 48, 0, NULL, '2025-09-09 07:00:05', '2025-09-09 07:00:05', 0, NULL),
(83, 6, 49, 0, NULL, '2025-09-09 07:00:05', '2025-09-09 07:00:05', 0, NULL),
(84, 6, 50, 0, NULL, '2025-09-09 07:00:05', '2025-09-09 07:00:05', 0, NULL),
(85, 6, 55, 0, NULL, '2025-09-09 07:00:05', '2025-09-09 07:00:05', 0, NULL),
(86, 6, 56, 0, NULL, '2025-09-09 07:00:05', '2025-09-09 07:00:05', 0, NULL),
(87, 6, 51, 1, NULL, '2025-09-09 07:00:05', '2025-09-09 07:00:05', 0, NULL),
(88, 6, 52, 0, NULL, '2025-09-09 07:00:05', '2025-09-09 07:00:05', 0, NULL),
(89, 6, 53, 0, NULL, '2025-09-09 07:00:05', '2025-09-09 07:00:05', 0, NULL),
(90, 6, 54, 0, NULL, '2025-09-09 07:00:05', '2025-09-09 07:00:05', 0, NULL),
(91, 6, 57, 0, NULL, '2025-09-09 07:00:05', '2025-09-09 07:00:05', 0, NULL),
(92, 5, 45, 1, NULL, '2025-09-11 06:58:34', '2025-09-11 06:58:34', 0, NULL),
(93, 5, 46, 1, NULL, '2025-09-11 06:58:34', '2025-09-11 06:58:34', 0, NULL),
(94, 5, 47, 0, NULL, '2025-09-11 06:58:34', '2025-09-11 06:58:34', 0, NULL),
(95, 5, 58, 0, NULL, '2025-09-11 06:58:34', '2025-09-11 06:58:34', 0, NULL),
(96, 5, 48, 1, NULL, '2025-09-11 06:58:34', '2025-09-11 06:58:34', 0, NULL),
(97, 5, 49, 0, NULL, '2025-09-11 06:58:34', '2025-09-11 06:58:34', 0, NULL),
(98, 5, 50, 0, NULL, '2025-09-11 06:58:34', '2025-09-11 06:58:34', 0, NULL),
(99, 5, 55, 0, NULL, '2025-09-11 06:58:34', '2025-09-11 06:58:34', 0, NULL),
(100, 5, 56, 0, NULL, '2025-09-11 06:58:34', '2025-09-11 06:58:34', 0, NULL),
(101, 5, 51, 1, NULL, '2025-09-11 06:58:34', '2025-09-11 06:58:34', 0, NULL),
(102, 5, 52, 1, NULL, '2025-09-11 06:58:34', '2025-09-11 06:58:34', 0, NULL),
(103, 5, 53, 0, NULL, '2025-09-11 06:58:34', '2025-09-11 06:58:34', 0, NULL),
(104, 5, 54, 0, NULL, '2025-09-11 06:58:34', '2025-09-11 06:58:34', 0, NULL),
(105, 5, 57, 1, NULL, '2025-09-11 06:58:34', '2025-09-11 06:58:34', 0, NULL),
(106, 2, 45, 1, NULL, '2025-09-17 02:35:01', '2025-09-17 02:35:01', 0, NULL),
(107, 2, 46, 0, NULL, '2025-09-17 02:35:01', '2025-09-17 02:35:01', 0, NULL),
(108, 2, 47, 1, NULL, '2025-09-17 02:35:01', '2025-09-17 02:35:01', 0, NULL),
(109, 2, 58, 0, NULL, '2025-09-17 02:35:01', '2025-09-17 02:35:01', 0, NULL),
(110, 2, 48, 0, NULL, '2025-09-17 02:35:01', '2025-09-17 02:35:01', 0, NULL),
(111, 2, 49, 0, NULL, '2025-09-17 02:35:01', '2025-09-17 02:35:01', 0, NULL),
(112, 2, 50, 1, NULL, '2025-09-17 02:35:01', '2025-09-17 02:35:01', 0, NULL),
(113, 2, 55, 1, NULL, '2025-09-17 02:35:01', '2025-09-17 02:35:01', 0, NULL),
(114, 2, 56, 1, NULL, '2025-09-17 02:35:01', '2025-09-17 02:35:01', 0, NULL),
(115, 2, 51, 1, NULL, '2025-09-17 02:35:01', '2025-09-17 02:35:01', 0, NULL),
(116, 2, 52, 1, NULL, '2025-09-17 02:35:01', '2025-09-17 02:35:01', 0, NULL),
(117, 2, 53, 1, NULL, '2025-09-17 02:35:01', '2025-09-17 02:35:01', 0, NULL),
(118, 2, 54, 1, NULL, '2025-09-17 02:35:01', '2025-09-17 02:35:01', 0, NULL),
(119, 2, 57, 0, NULL, '2025-09-17 02:35:01', '2025-09-17 02:35:01', 0, NULL);

-- --------------------------------------------------------

--
-- テーブルの構造 `store_point_settings_backup`
--

CREATE TABLE `store_point_settings_backup` (
  `id` int(11) NOT NULL DEFAULT 0,
  `store_id` int(11) NOT NULL COMMENT '店舗ID',
  `point_payment_id` int(11) NOT NULL COMMENT 'ポイント・クーポンマスターID',
  `is_enabled` tinyint(1) DEFAULT 1 COMMENT '有効フラグ',
  `display_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '店舗独自表示名（NULLならマスターの名前を使用）',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `store_point_settings_backup`
--

INSERT INTO `store_point_settings_backup` (`id`, `store_id`, `point_payment_id`, `is_enabled`, `display_name`, `created_at`, `updated_at`, `is_deleted`, `deleted_at`) VALUES
(14, 7, 1, 1, NULL, '2025-09-03 05:09:01', '2025-09-03 05:36:17', 1, '2025-09-03 05:36:17'),
(15, 7, 2, 1, NULL, '2025-09-03 05:09:01', '2025-09-03 05:36:17', 1, '2025-09-03 05:36:17'),
(16, 7, 3, 1, NULL, '2025-09-03 05:09:01', '2025-09-03 05:36:17', 1, '2025-09-03 05:36:17'),
(17, 7, 4, 0, NULL, '2025-09-03 05:09:01', '2025-09-03 05:36:17', 1, '2025-09-03 05:36:17'),
(18, 7, 5, 0, NULL, '2025-09-03 05:09:01', '2025-09-03 05:36:17', 1, '2025-09-03 05:36:17'),
(19, 7, 6, 0, NULL, '2025-09-03 05:09:01', '2025-09-03 05:36:17', 1, '2025-09-03 05:36:17'),
(20, 7, 7, 0, NULL, '2025-09-03 05:09:01', '2025-09-03 05:36:17', 1, '2025-09-03 05:36:17'),
(21, 7, 8, 1, NULL, '2025-09-03 05:09:01', '2025-09-03 05:36:17', 1, '2025-09-03 05:36:17'),
(30, 2, 1, 1, 'ポイント割引1', '2025-09-03 07:17:51', '2025-09-03 07:17:51', 0, NULL),
(31, 2, 2, 0, 'ポイント割引2', '2025-09-03 07:17:51', '2025-09-03 07:17:51', 0, NULL),
(32, 2, 3, 0, 'dポイント割引', '2025-09-03 07:17:51', '2025-09-03 07:17:51', 0, NULL),
(33, 2, 4, 0, 'Tポイント割引', '2025-09-03 07:17:51', '2025-09-03 07:17:51', 0, NULL),
(34, 2, 5, 0, '会員割引', '2025-09-03 07:17:51', '2025-09-03 07:17:51', 0, NULL),
(35, 2, 6, 0, NULL, '2025-09-03 07:17:51', '2025-09-03 07:17:51', 0, NULL),
(36, 2, 7, 0, NULL, '2025-09-03 07:17:51', '2025-09-03 07:17:51', 0, NULL),
(37, 2, 8, 0, NULL, '2025-09-03 07:17:51', '2025-09-03 07:17:51', 0, NULL);

-- --------------------------------------------------------

--
-- テーブルの構造 `store_settings`
--

CREATE TABLE `store_settings` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL COMMENT '店舗ID',
  `setting_type` enum('payment_methods','point_payments','other','payment_config') NOT NULL COMMENT '設定種別',
  `setting_key` varchar(100) NOT NULL COMMENT '設定キー',
  `setting_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '設定値' CHECK (json_valid(`setting_value`)),
  `is_active` tinyint(1) DEFAULT 1 COMMENT '有効フラグ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='店舗別設定';

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `store_settings_view`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `store_settings_view` (
`store_name` varchar(100)
,`store_code` varchar(50)
,`setting_type` enum('payment_methods','point_payments','other','payment_config')
,`setting_key` varchar(100)
,`setting_value` longtext
,`is_active` tinyint(1)
);

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `store_users`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `store_users` (
`店舗名` varchar(100)
,`ユーザーID` varchar(50)
,`権限` enum('admin','manager','user')
,`アクティブ` tinyint(1)
,`作成日時` timestamp
);

-- --------------------------------------------------------

--
-- テーブルの構造 `system_settings`
--

CREATE TABLE `system_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL COMMENT '設定値',
  `description` varchar(255) DEFAULT NULL COMMENT '設定説明',
  `category` varchar(50) DEFAULT 'general' COMMENT '設定カテゴリ',
  `updated_by` varchar(50) NOT NULL COMMENT '更新者',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='システム設定';

-- --------------------------------------------------------

--
-- テーブルの構造 `users`
--

CREATE TABLE `users` (
  `id` varchar(50) NOT NULL COMMENT 'ユーザーID（店舗単位）',
  `store_id` int(11) DEFAULT NULL,
  `store_name` varchar(100) DEFAULT NULL COMMENT '店舗名',
  `pass` varchar(255) NOT NULL COMMENT 'パスワード（ハッシュ化）',
  `role` enum('admin','manager','user') NOT NULL DEFAULT 'user' COMMENT '権限レベル',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'アクティブ状態',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='店舗単位ユーザーマスタ';

--
-- テーブルのデータのダンプ `users`
--

INSERT INTO `users` (`id`, `store_id`, `store_name`, `pass`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
('admin', 1, NULL, '$2y$10$a/fcOnjmSugf3uJ1GSQfIe.jgDhNfRFXCETlJ3fjfl695LmF4/E1K', 'admin', 1, '2025-09-05 07:50:48', '2025-09-17 02:59:43'),
('okawa', 6, 'ストランド須磨店', '$2y$10$mJQATi34aWXSTkoTH1W0G.Lypt5ro35Omdco.SooDYZ/.24NvQRny', 'user', 1, '2025-09-08 08:11:25', '2025-09-11 03:58:31'),
('user1', 2, '四代目菊川　三ノ宮店', '$2y$10$9pNP7mNlTuasrY62mjgcX.D.hopIkSO3VX3Vj1tGJ0wmf0wWpe0sO', 'user', 1, '2025-09-11 03:59:12', '2025-09-17 03:09:27'),
('user2', 3, 'ダンダダン　元町店', '$2y$10$NTOBixRVdLb0Ocv1KGYwEOIlCwECVwwSUK/8UTcj0V83SVPQlKjWq', 'user', 1, '2025-09-05 07:54:39', '2025-09-05 08:06:57');

-- --------------------------------------------------------

--
-- テーブルの構造 `user_activity_logs`
--

CREATE TABLE `user_activity_logs` (
  `id` int(11) NOT NULL,
  `action` varchar(100) NOT NULL COMMENT '実行されたアクション',
  `user_id` varchar(50) NOT NULL COMMENT '対象ユーザーID',
  `executed_by` varchar(50) DEFAULT NULL COMMENT '実行者（管理者操作時）',
  `details` text DEFAULT NULL COMMENT '詳細情報（JSON形式等）',
  `ip_address` varchar(45) DEFAULT NULL COMMENT '実行者IPアドレス',
  `user_agent` text DEFAULT NULL COMMENT 'ユーザーエージェント',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '実行日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ユーザー活動ログ';

-- --------------------------------------------------------

--
-- ビュー用の代替構造 `user_statistics`
-- (実際のビューを参照するには下にあります)
--
CREATE TABLE `user_statistics` (
`stat_type` varchar(13)
,`count` bigint(21)
,`description` varchar(10)
);

-- --------------------------------------------------------

--
-- ビュー用の構造 `daily_report_list`
--
DROP TABLE IF EXISTS `daily_report_list`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `daily_report_list`  AS SELECT `dr`.`report_date` AS `報告日`, `dr`.`store_name` AS `店舗名`, `dr`.`user_id` AS `入力者`, `dr`.`status` AS `ステータス`, `dr`.`cash_difference` AS `現金過不足`, `dr`.`submitted_at` AS `送信日時`, count(`ra`.`id`) AS `添付ファイル数` FROM (`daily_reports` `dr` left join `report_attachments` `ra` on(`dr`.`id` = `ra`.`report_id`)) GROUP BY `dr`.`id`, `dr`.`report_date`, `dr`.`store_name`, `dr`.`user_id`, `dr`.`status`, `dr`.`cash_difference`, `dr`.`submitted_at` ORDER BY `dr`.`report_date` DESC, `dr`.`store_name` ASC ;

-- --------------------------------------------------------

--
-- ビュー用の構造 `store_settings_view`
--
DROP TABLE IF EXISTS `store_settings_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `store_settings_view`  AS SELECT `s`.`store_name` AS `store_name`, `s`.`store_code` AS `store_code`, `ss`.`setting_type` AS `setting_type`, `ss`.`setting_key` AS `setting_key`, `ss`.`setting_value` AS `setting_value`, `ss`.`is_active` AS `is_active` FROM (`stores` `s` left join `store_settings` `ss` on(`s`.`id` = `ss`.`store_id`)) WHERE `ss`.`is_active` = 1 ORDER BY `s`.`store_name` ASC, `ss`.`setting_type` ASC ;

-- --------------------------------------------------------

--
-- ビュー用の構造 `store_users`
--
DROP TABLE IF EXISTS `store_users`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `store_users`  AS SELECT `users`.`store_name` AS `店舗名`, `users`.`id` AS `ユーザーID`, `users`.`role` AS `権限`, `users`.`is_active` AS `アクティブ`, `users`.`created_at` AS `作成日時` FROM `users` WHERE `users`.`is_active` = 1 ORDER BY `users`.`store_name` ASC, `users`.`role` DESC, `users`.`id` ASC ;

-- --------------------------------------------------------

--
-- ビュー用の構造 `user_statistics`
--
DROP TABLE IF EXISTS `user_statistics`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `user_statistics`  AS SELECT 'total_users' AS `stat_type`, count(0) AS `count`, '全ユーザー数' AS `description` FROM `users`union all select 'active_users' AS `stat_type`,count(0) AS `count`,'アクティブユーザー数' AS `description` from `users` where `users`.`is_active` = 1 union all select 'admin_users' AS `stat_type`,count(0) AS `count`,'管理者数' AS `description` from `users` where `users`.`role` = 'admin' and `users`.`is_active` = 1 union all select 'manager_users' AS `stat_type`,count(0) AS `count`,'マネージャー数' AS `description` from `users` where `users`.`role` = 'manager' and `users`.`is_active` = 1 union all select 'regular_users' AS `stat_type`,count(0) AS `count`,'一般ユーザー数' AS `description` from `users` where `users`.`role` = 'user' and `users`.`is_active` = 1  ;

--
-- ダンプしたテーブルのインデックス
--

--
-- テーブルのインデックス `daily_reports`
--
ALTER TABLE `daily_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_daily_reports_date` (`report_date`),
  ADD KEY `idx_daily_reports_user` (`user_id`),
  ADD KEY `idx_daily_reports_status` (`status`),
  ADD KEY `fk_daily_reports_store` (`store_id`),
  ADD KEY `idx_daily_reports_date_store` (`report_date`,`store_id`);

--
-- テーブルのインデックス `payment_method_masters`
--
ALTER TABLE `payment_method_masters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_method_id` (`method_id`),
  ADD KEY `idx_active_order` (`is_active`,`display_order`);

--
-- テーブルのインデックス `report_attachments`
--
ALTER TABLE `report_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_attachments_report_id` (`report_id`),
  ADD KEY `idx_attachments_user_id` (`upload_user_id`);

--
-- テーブルのインデックス `stores`
--
ALTER TABLE `stores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `store_code` (`store_code`);

--
-- テーブルのインデックス `store_payment_settings`
--
ALTER TABLE `store_payment_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_store_payment` (`store_id`,`payment_method_id`),
  ADD KEY `fk_store_payment_store` (`store_id`),
  ADD KEY `fk_store_payment_method` (`payment_method_id`),
  ADD KEY `idx_store_payment_active` (`store_id`,`payment_method_id`,`is_deleted`);

--
-- テーブルのインデックス `store_settings`
--
ALTER TABLE `store_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_store_setting` (`store_id`,`setting_type`,`setting_key`),
  ADD KEY `idx_setting_type` (`setting_type`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- テーブルのインデックス `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`setting_key`),
  ADD KEY `idx_settings_category` (`category`),
  ADD KEY `updated_by` (`updated_by`);

--
-- テーブルのインデックス `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_users_is_active` (`is_active`),
  ADD KEY `idx_users_role` (`role`),
  ADD KEY `idx_users_updated_at` (`updated_at`),
  ADD KEY `fk_users_store` (`store_id`);

--
-- テーブルのインデックス `user_activity_logs`
--
ALTER TABLE `user_activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_executed_by` (`executed_by`);

--
-- ダンプしたテーブルの AUTO_INCREMENT
--

--
-- テーブルの AUTO_INCREMENT `daily_reports`
--
ALTER TABLE `daily_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- テーブルの AUTO_INCREMENT `payment_method_masters`
--
ALTER TABLE `payment_method_masters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- テーブルの AUTO_INCREMENT `report_attachments`
--
ALTER TABLE `report_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- テーブルの AUTO_INCREMENT `stores`
--
ALTER TABLE `stores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- テーブルの AUTO_INCREMENT `store_payment_settings`
--
ALTER TABLE `store_payment_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=120;

--
-- テーブルの AUTO_INCREMENT `store_settings`
--
ALTER TABLE `store_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- テーブルの AUTO_INCREMENT `user_activity_logs`
--
ALTER TABLE `user_activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- ダンプしたテーブルの制約
--

--
-- テーブルの制約 `daily_reports`
--
ALTER TABLE `daily_reports`
  ADD CONSTRAINT `fk_daily_reports_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`);

--
-- テーブルの制約 `report_attachments`
--
ALTER TABLE `report_attachments`
  ADD CONSTRAINT `report_attachments_ibfk_1` FOREIGN KEY (`report_id`) REFERENCES `daily_reports` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `report_attachments_ibfk_2` FOREIGN KEY (`upload_user_id`) REFERENCES `users` (`id`);

--
-- テーブルの制約 `store_payment_settings`
--
ALTER TABLE `store_payment_settings`
  ADD CONSTRAINT `fk_store_payment_method` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_method_masters` (`id`),
  ADD CONSTRAINT `fk_store_payment_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`);

--
-- テーブルの制約 `store_settings`
--
ALTER TABLE `store_settings`
  ADD CONSTRAINT `store_settings_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`);

--
-- テーブルの制約 `system_settings`
--
ALTER TABLE `system_settings`
  ADD CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`);

--
-- テーブルの制約 `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`);
COMMIT;
