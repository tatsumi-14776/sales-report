-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- ホスト: 127.0.0.1
-- 生成日時: 2025-09-04 08:12:48
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
  `previous_cash_balance` decimal(10,2) DEFAULT 0.00 COMMENT '前日現金残',
  `cash_difference` decimal(10,2) DEFAULT 0.00 COMMENT '現金過不足',
  `remarks` text DEFAULT NULL COMMENT '備考',
  `status` enum('draft','submitted','approved','rejected') DEFAULT 'draft' COMMENT 'ステータス',
  `submitted_at` timestamp NULL DEFAULT NULL COMMENT '送信日時',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='日次売上報告書';

--
-- テーブルのデータのダンプ `daily_reports`
--

INSERT INTO `daily_reports` (`id`, `report_date`, `store_id`, `user_id`, `sales_data`, `point_payments_data`, `income_data`, `expense_data`, `cash_data`, `previous_cash_balance`, `cash_difference`, `remarks`, `status`, `submitted_at`, `created_at`, `updated_at`) VALUES
(1, '2025-08-31', 1, 'yanagisawa', '{\"cash10\": 50000, \"cash8\": 30000, \"card10\": 100000, \"card8\": 20000}', NULL, '{\"nyukin\": 0, \"miscIncome\": 500}', NULL, NULL, 0.00, 0.00, 'テスト用レポートデータ', 'draft', NULL, '2025-08-31 07:34:56', '2025-09-02 08:44:09');

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
(1, 'cash', '現金', 'cash', 'payment', 'green', 1, 1, 1, '2025-09-02 12:58:55', '2025-09-02 12:58:55', NULL),
(2, 'cash2', '現金２', 'cash', 'payment', 'green', 2, 0, 1, '2025-09-02 12:58:55', '2025-09-03 06:45:56', NULL),
(3, 'card', 'クレジットカード', 'cashless', 'payment', 'blue', 3, 0, 1, '2025-09-02 12:58:55', '2025-09-03 06:48:52', NULL),
(4, 'paypay', 'PayPay', 'cashless', 'payment', 'red', 4, 0, 1, '2025-09-02 12:58:55', '2025-09-03 06:49:25', NULL),
(5, 'linepay', 'LINE Pay', 'cashless', 'payment', 'green', 5, 0, 0, '2025-09-02 12:58:55', '2025-09-04 01:00:51', NULL),
(6, 'rakutenpay', '楽天ペイ', 'cashless', 'payment', 'red', 6, 0, 0, '2025-09-02 12:58:55', '2025-09-04 01:00:26', NULL),
(7, 'aupay', 'au PAY', 'cashless', 'payment', 'orange', 7, 0, 0, '2025-09-02 12:58:55', '2025-09-04 01:00:42', NULL),
(8, 'dpay', 'd払い', 'cashless', 'payment', 'red', 8, 0, 0, '2025-09-02 12:58:55', '2025-09-04 01:00:34', NULL),
(9, 'teipay', '提督ペイ', 'cashless', 'payment', 'blue', 9, 0, 0, '2025-09-02 13:28:25', '2025-09-04 01:00:17', NULL),
(10, 'Stera', 'stera', 'cashless', 'payment', 'purple', 3, 0, 1, '2025-09-03 03:54:46', '2025-09-04 04:47:33', NULL),
(11, 'uber', 'Uber', 'cashless', 'payment', 'black', 4, 0, 1, '2025-09-03 04:00:30', '2025-09-04 04:47:33', NULL),
(12, 'habatanpay', 'はばたんpay', 'cashless', 'payment', 'blue', 12, 0, 1, '2025-09-03 04:07:57', '2025-09-03 04:07:57', NULL),
(16, 'hotpepper', 'HOT PEPPER', '', 'point', 'blue', 1, 1, 1, '2025-09-02 12:58:55', '2025-09-03 03:57:31', NULL),
(17, 'ikkyu', '一休', '', 'point', 'blue', 2, 0, 1, '2025-09-02 12:58:55', '2025-09-03 06:51:09', NULL),
(18, 'tabelog', '食べログ', 'cashless', 'point', 'pink', 8, 0, 1, '2025-09-02 12:58:55', '2025-09-04 04:47:33', NULL),
(19, 'hitosara', 'ヒトサラ', 'cashless', 'point', 'cyan', 9, 0, 1, '2025-09-02 12:58:55', '2025-09-04 04:47:33', NULL),
(20, 'menu', 'menu', 'cashless', 'point', 'magenta', 10, 0, 1, '2025-09-02 12:58:55', '2025-09-04 04:47:33', NULL),
(21, 'Benefit_Coupon', '株主優待券', '', 'point', 'blue', 6, 0, 1, '2025-09-02 12:58:55', '2025-09-03 06:52:03', NULL),
(22, 'coupon_discount', 'クーポン割引', '', 'point', 'blue', 7, 0, 0, '2025-09-02 12:58:55', '2025-09-04 01:00:01', NULL),
(23, 'teip', '提P', '', 'point', 'blue', 100, 0, 0, '2025-09-03 00:58:54', '2025-09-04 00:59:52', NULL),
(33, 'sakujyo', '削除用', 'cash', 'payment', 'blue', 100, 0, 0, '2025-09-03 08:40:33', '2025-09-03 09:12:45', NULL),
(35, 'habatan_pay', 'はばたんpay', 'cashless', 'payment', 'yellow', 5, 0, 1, '2025-09-04 04:47:33', '2025-09-04 04:47:33', NULL),
(36, 'hot_pepper', 'HOT PEPPER', 'cashless', 'point', 'orange', 6, 0, 1, '2025-09-04 04:47:33', '2025-09-04 04:47:33', NULL),
(37, 'ikyu', '一休', 'cashless', 'point', 'red', 7, 0, 1, '2025-09-04 04:47:33', '2025-09-04 04:47:33', NULL),
(43, 'heheh', 'hehe', 'cash', 'payment', 'blue', 11111, 0, 1, '2025-09-04 05:27:48', '2025-09-04 05:27:48', NULL),
(44, 'fufufu', 'fufu', '', 'point', 'blue', 124, 0, 1, '2025-09-04 05:28:37', '2025-09-04 05:28:37', NULL);

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
(1, '本店', 'STORE001', '2025-09-02 08:31:30', '2025-09-04 01:03:30', 0, NULL),
(2, '支店', 'STORE002', '2025-09-02 08:31:30', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(6, '経理課', 'keiri', '2025-09-03 02:03:35', '2025-09-03 02:03:35', 0, NULL),
(7, '情報システム課', 'ah555', '2025-09-03 04:26:56', '2025-09-03 05:36:17', 1, '2025-09-03 05:36:17'),
(8, '四代目菊川　三ノ宮店', 'kikukawa_san', '2025-09-04 01:02:34', '2025-09-04 05:29:17', 0, NULL);

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
(56, 7, 21, 0, NULL, '2025-09-03 05:09:01', '2025-09-03 05:36:17', 1, '2025-09-03 05:36:17'),
(58, 7, 22, 0, NULL, '2025-09-03 05:09:01', '2025-09-03 05:36:17', 1, '2025-09-03 05:36:17'),
(60, 7, 19, 0, NULL, '2025-09-03 05:09:01', '2025-09-03 05:36:17', 1, '2025-09-03 05:36:17'),
(62, 7, 16, 1, NULL, '2025-09-03 05:09:01', '2025-09-03 05:36:17', 1, '2025-09-03 05:36:17'),
(64, 7, 17, 1, NULL, '2025-09-03 05:09:01', '2025-09-03 05:36:17', 1, '2025-09-03 05:36:17'),
(66, 7, 20, 0, NULL, '2025-09-03 05:09:01', '2025-09-03 05:36:17', 1, '2025-09-03 05:36:17'),
(68, 7, 18, 1, NULL, '2025-09-03 05:09:01', '2025-09-03 05:36:17', 1, '2025-09-03 05:36:17'),
(70, 7, 23, 1, NULL, '2025-09-03 05:09:01', '2025-09-03 05:36:17', 1, '2025-09-03 05:36:17'),
(109, 2, 1, 1, NULL, '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(110, 2, 2, 0, NULL, '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(111, 2, 3, 0, NULL, '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(112, 2, 4, 0, NULL, '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(113, 2, 5, 0, NULL, '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(114, 2, 6, 0, NULL, '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(115, 2, 7, 0, NULL, '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(116, 2, 8, 0, NULL, '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(117, 2, 9, 0, NULL, '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(118, 2, 10, 0, NULL, '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(119, 2, 11, 0, NULL, '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(120, 2, 12, 0, NULL, '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(121, 2, 33, 0, NULL, '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(122, 2, 16, 0, 'ポイント割引1', '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(123, 2, 17, 0, 'ポイント割引2', '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(124, 2, 18, 0, 'dポイント割引', '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(125, 2, 19, 0, 'Tポイント割引', '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(126, 2, 20, 0, '会員割引', '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(127, 2, 21, 0, NULL, '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(128, 2, 22, 0, NULL, '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(129, 2, 23, 0, NULL, '2025-09-03 09:11:17', '2025-09-04 01:02:04', 1, '2025-09-04 01:02:04'),
(144, 1, 1, 0, NULL, '2025-09-04 01:03:32', '2025-09-04 01:03:32', 0, NULL),
(145, 1, 2, 0, NULL, '2025-09-04 01:03:32', '2025-09-04 01:03:32', 0, NULL),
(146, 1, 3, 0, NULL, '2025-09-04 01:03:32', '2025-09-04 01:03:32', 0, NULL),
(147, 1, 4, 0, NULL, '2025-09-04 01:03:32', '2025-09-04 01:03:32', 0, NULL),
(148, 1, 10, 0, NULL, '2025-09-04 01:03:32', '2025-09-04 01:03:32', 0, NULL),
(149, 1, 11, 0, NULL, '2025-09-04 01:03:32', '2025-09-04 01:03:32', 0, NULL),
(150, 1, 12, 0, NULL, '2025-09-04 01:03:32', '2025-09-04 01:03:32', 0, NULL),
(151, 1, 16, 0, NULL, '2025-09-04 01:03:32', '2025-09-04 01:03:32', 0, NULL),
(152, 1, 17, 0, NULL, '2025-09-04 01:03:32', '2025-09-04 01:03:32', 0, NULL),
(153, 1, 18, 0, NULL, '2025-09-04 01:03:32', '2025-09-04 01:03:32', 0, NULL),
(154, 1, 19, 0, NULL, '2025-09-04 01:03:32', '2025-09-04 01:03:32', 0, NULL),
(155, 1, 20, 0, NULL, '2025-09-04 01:03:32', '2025-09-04 01:03:32', 0, NULL),
(156, 1, 21, 0, NULL, '2025-09-04 01:03:32', '2025-09-04 01:03:32', 0, NULL),
(171, 8, 1, 1, NULL, '2025-09-04 05:29:20', '2025-09-04 05:29:20', 0, NULL),
(172, 8, 2, 0, NULL, '2025-09-04 05:29:20', '2025-09-04 05:29:20', 0, NULL),
(173, 8, 10, 1, NULL, '2025-09-04 05:29:20', '2025-09-04 05:29:20', 0, NULL),
(174, 8, 3, 0, NULL, '2025-09-04 05:29:20', '2025-09-04 05:29:20', 0, NULL),
(175, 8, 4, 0, NULL, '2025-09-04 05:29:20', '2025-09-04 05:29:20', 0, NULL),
(176, 8, 11, 1, NULL, '2025-09-04 05:29:20', '2025-09-04 05:29:20', 0, NULL),
(177, 8, 35, 1, NULL, '2025-09-04 05:29:20', '2025-09-04 05:29:20', 0, NULL),
(178, 8, 12, 0, NULL, '2025-09-04 05:29:20', '2025-09-04 05:29:20', 0, NULL),
(179, 8, 43, 1, NULL, '2025-09-04 05:29:20', '2025-09-04 05:29:20', 0, NULL),
(180, 8, 16, 0, NULL, '2025-09-04 05:29:20', '2025-09-04 05:29:20', 0, NULL),
(181, 8, 17, 0, NULL, '2025-09-04 05:29:20', '2025-09-04 05:29:20', 0, NULL),
(182, 8, 36, 1, NULL, '2025-09-04 05:29:20', '2025-09-04 05:29:20', 0, NULL),
(183, 8, 21, 0, NULL, '2025-09-04 05:29:20', '2025-09-04 05:29:20', 0, NULL),
(184, 8, 37, 1, NULL, '2025-09-04 05:29:20', '2025-09-04 05:29:20', 0, NULL),
(185, 8, 18, 1, NULL, '2025-09-04 05:29:20', '2025-09-04 05:29:20', 0, NULL),
(186, 8, 19, 1, NULL, '2025-09-04 05:29:20', '2025-09-04 05:29:20', 0, NULL),
(187, 8, 20, 1, NULL, '2025-09-04 05:29:20', '2025-09-04 05:29:20', 0, NULL),
(188, 8, 44, 1, NULL, '2025-09-04 05:29:20', '2025-09-04 05:29:20', 0, NULL);

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

--
-- テーブルのデータのダンプ `store_settings`
--

INSERT INTO `store_settings` (`id`, `store_id`, `setting_type`, `setting_key`, `setting_value`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'payment_methods', 'available_methods', '{\r\n    \"cash\": {\"name\": \"現金\", \"enabled\": true},\r\n    \"credit\": {\"name\": \"クレジットカード\", \"enabled\": true},\r\n    \"qr\": {\"name\": \"QRコード決済\", \"enabled\": true}\r\n}', 1, '2025-09-02 08:48:05', '2025-09-02 08:48:05'),
(2, 2, 'payment_methods', 'available_methods', '{\r\n    \"cash\": {\"name\": \"現金\", \"enabled\": true},\r\n    \"credit\": {\"name\": \"クレジットカード\", \"enabled\": true}\r\n}', 1, '2025-09-02 08:48:05', '2025-09-02 08:48:05');

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

--
-- テーブルのデータのダンプ `system_settings`
--

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`, `category`, `updated_by`, `updated_at`) VALUES
('app_version', '1.0.0', 'アプリケーションバージョン', 'system', 'yanagisawa', '2025-08-31 07:34:55'),
('auto_backup_enabled', '1', '自動バックアップ有効フラグ', 'backup', 'yanagisawa', '2025-08-31 07:34:55'),
('max_attachments', '5', '最大添付ファイル数', 'upload', 'yanagisawa', '2025-08-31 07:34:55'),
('max_file_size', '10485760', '最大ファイルサイズ（10MB）', 'upload', 'yanagisawa', '2025-08-31 07:34:55'),
('session_timeout', '3600', 'セッションタイムアウト（1時間）', 'security', 'yanagisawa', '2025-08-31 07:34:55');

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
('admin', NULL, '管理者店舗', 'admin123', 'admin', 1, '2025-09-02 12:53:35', '2025-09-04 05:42:56'),
('okawa', 8, '四代目菊川　三ノ宮店', '$2y$10$pSNPlDalRyZfhZYfp46fF.mPKzw6T5V.W0cSQ.o0t7QDozadgp/9a', 'user', 1, '2025-09-04 01:15:14', '2025-09-04 02:37:53'),
('test', NULL, '経理課', '$2y$10$JIx0ctYIRZdtXsMsToqcQey6ka2mvvOpGAm8uDtsn05MLGKL/0UJG', 'admin', 1, '2025-09-03 02:04:43', '2025-09-03 02:04:43'),
('user1', 8, '四代目菊川　三ノ宮店', 'user123', 'user', 1, '2025-09-02 12:53:35', '2025-09-04 05:34:44'),
('yanagisawa', NULL, '本店', '$2y$10$WSAuQ9f0mxI9CF1Kgh/zHu1OTO67qoYQJ99bCXhgmOMoie4L1KJL2', 'admin', 1, '2025-08-31 07:34:55', '2025-09-04 00:46:12');

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
  ADD KEY `fk_daily_reports_store` (`store_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- テーブルの AUTO_INCREMENT `payment_method_masters`
--
ALTER TABLE `payment_method_masters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- テーブルの AUTO_INCREMENT `report_attachments`
--
ALTER TABLE `report_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- テーブルの AUTO_INCREMENT `stores`
--
ALTER TABLE `stores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- テーブルの AUTO_INCREMENT `store_payment_settings`
--
ALTER TABLE `store_payment_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=189;

--
-- テーブルの AUTO_INCREMENT `store_settings`
--
ALTER TABLE `store_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
  ADD CONSTRAINT `daily_reports_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
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
