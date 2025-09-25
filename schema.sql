-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- ホスト: 127.0.0.1
-- 生成日時: 2025-09-25 02:46:29
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
(1141, '2025-09-24', 2, '1111', '\"{\\\"cash10\\\":1,\\\"cash8\\\":1,\\\"urikake10\\\":1,\\\"urikake8\\\":1,\\\"stera10\\\":1,\\\"stera8\\\":1,\\\"habatanpay10\\\":1,\\\"habatanpay8\\\":0,\\\"other_pay10\\\":1,\\\"other_pay8\\\":1,\\\"Uber10\\\":1,\\\"Uber8\\\":1,\\\"menu10\\\":1,\\\"menu8\\\":1}\"', '\"{\\\"hotpepper10\\\":1,\\\"hotpepper8\\\":1,\\\"ikkyu10\\\":1,\\\"ikkyu8\\\":1,\\\"tabelog10\\\":1,\\\"tabelog8\\\":1,\\\"hitosara10\\\":1,\\\"hitosara8\\\":1}\"', '\"{\\\"nyukin\\\":1,\\\"miscIncome\\\":0,\\\"foundMoney\\\":0}\"', '\"[]\"', '\"{\\\"bill10000\\\":{\\\"register\\\":0,\\\"safe\\\":0},\\\"bill5000\\\":{\\\"register\\\":0,\\\"safe\\\":0},\\\"bill2000\\\":{\\\"register\\\":0,\\\"safe\\\":0},\\\"bill1000\\\":{\\\"register\\\":0,\\\"safe\\\":0},\\\"coin500\\\":{\\\"register\\\":0,\\\"safe\\\":0},\\\"coin100\\\":{\\\"register\\\":0,\\\"safe\\\":0},\\\"coin50\\\":{\\\"register\\\":0,\\\"safe\\\":0},\\\"coin10\\\":{\\\"register\\\":0,\\\"safe\\\":0},\\\"coin5\\\":{\\\"register\\\":0,\\\"safe\\\":0},\\\"coin1\\\":{\\\"register\\\":0,\\\"safe\\\":0},\\\"totals\\\":{\\\"registerTotal\\\":0,\\\"safeTotal\\\":0,\\\"totalCash\\\":0}}\"', '[{\"id\":\"cash\",\"label\":\"\\u73fe\\u91d1\",\"color\":\"blue\",\"isCash\":true,\"enabled\":true},{\"id\":\"urikake\",\"label\":\"\\u58f2\\u639b\\u91d1\",\"color\":\"blue\",\"isCash\":false,\"enabled\":true},{\"id\":\"stera\",\"label\":\"stera\",\"color\":\"red\",\"isCash\":false,\"enabled\":true},{\"id\":\"habatanpay\",\"label\":\"\\u306f\\u3070\\u305f\\u3093pay\",\"color\":\"blue\",\"isCash\":false,\"enabled\":true},{\"id\":\"other_pay\",\"label\":\"\\u305d\\u306e\\u4ed6\\u652f\\u6255\",\"color\":\"blue\",\"isCash\":false,\"enabled\":true},{\"id\":\"Uber\",\"label\":\"Uber\",\"color\":\"blue\",\"isCash\":false,\"enabled\":true},{\"id\":\"menu\",\"label\":\"menu\",\"color\":\"blue\",\"isCash\":false,\"enabled\":true}]', '[{\"id\":\"hotpepper\",\"label\":\"HOT PPEPER\",\"enabled\":true},{\"id\":\"ikkyu\",\"label\":\"\\u4e00\\u4f11\",\"enabled\":true},{\"id\":\"tabelog\",\"label\":\"\\u98df\\u3079\\u30ed\\u30b0\",\"enabled\":true},{\"id\":\"hitosara\",\"label\":\"\\u30d2\\u30c8\\u30b5\\u30e9\",\"enabled\":true}]', '\"{\\\"manualPercent10\\\":null,\\\"manualPercent8\\\":null}\"', 0.00, 0.00, '', NULL, 'draft', '2025-09-25 00:44:02', '2025-09-25 00:44:02', '2025-09-25 00:44:02');

-- --------------------------------------------------------

--
-- テーブルの構造 `payment_method_masters`
--

CREATE TABLE `payment_method_masters` (
  `id` int(11) NOT NULL,
  `method_id` varchar(50) NOT NULL COMMENT '支払方法ID（システム内部用）',
  `method_name` varchar(100) NOT NULL COMMENT '支払方法名',
  `method_type` enum('cash','cashless','point','discount') NOT NULL DEFAULT 'cashless' COMMENT '支払種別（cash:現金, cashless:キャッシュレス, point:ポイント, discount:割引）',
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
(50, 'other_pay', 'その他支払', 'cashless', 'payment', 'blue', 104, 0, 1, '2025-09-05 07:59:05', '2025-09-24 06:47:23', NULL),
(51, 'hotpepper', 'HOT PPEPER', 'point', 'point', 'blue', 1, 0, 1, '2025-09-05 07:59:35', '2025-09-24 07:32:20', NULL),
(52, 'ikkyu', '一休', 'discount', 'point', 'blue', 2, 0, 1, '2025-09-05 08:00:00', '2025-09-22 06:01:59', NULL),
(53, 'tabelog', '食べログ', 'point', 'point', 'blue', 3, 0, 1, '2025-09-05 08:00:20', '2025-09-22 06:02:09', NULL),
(54, 'hitosara', 'ヒトサラ', '', 'point', 'blue', 4, 0, 1, '2025-09-05 08:00:47', '2025-09-18 06:24:36', NULL),
(55, 'Uber', 'Uber', 'cashless', 'payment', 'blue', 105, 0, 1, '2025-09-05 08:01:17', '2025-09-11 07:52:47', NULL),
(56, 'menu', 'menu', 'cashless', 'payment', 'blue', 106, 0, 1, '2025-09-05 08:01:35', '2025-09-11 07:53:10', NULL),
(57, 'yutai', '株主優待券', '', 'point', 'blue', 105, 0, 1, '2025-09-05 08:02:25', '2025-09-11 06:08:34', NULL),
(58, 'test', 'テスト', 'cash', 'payment', 'blue', 100, 0, 1, '2025-09-11 06:02:30', '2025-09-11 06:02:39', '2025-09-11 06:02:39'),
(59, 'cash_niku', '現金　肉屋', 'cash', 'payment', 'blue', 1, 0, 0, '2025-09-17 06:18:37', '2025-09-17 06:21:40', NULL),
(60, 'urikake', '売掛金', 'cashless', 'payment', 'blue', 10, 0, 1, '2025-09-18 06:26:04', '2025-09-18 06:26:04', NULL),
(61, 'shinki', '新規P', '', 'point', 'blue', 100, 0, 1, '2025-09-22 05:40:20', '2025-09-22 05:43:13', NULL),
(64, 'sdfafa', 'sa', '', 'point', 'blue', 100, 0, 1, '2025-09-22 05:47:43', '2025-09-22 05:47:43', NULL),
(65, 'fsafa', 'sfafafa', 'discount', 'point', 'blue', 100, 0, 1, '2025-09-22 05:50:58', '2025-09-22 05:51:15', NULL);

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
(2, '四代目菊川　三ノ宮店', 'kikukawa_san', '2025-09-05 07:52:09', '2025-09-25 00:44:37', 0, NULL),
(3, 'ダンダダン　元町店', 'dan_motomachi', '2025-09-05 07:52:28', '2025-09-05 08:03:40', 0, NULL),
(5, 'ストランド垂水店だよ', 'st_tarumi', '2025-09-08 08:12:54', '2025-09-19 08:19:52', 0, NULL),
(6, 'ストランド須磨店', 'st_suma', '2025-09-09 04:18:15', '2025-09-09 07:00:03', 0, NULL),
(7, 'ミクランド米田店', 'stland_yoneda', '2025-09-17 06:16:15', '2025-09-18 03:51:28', 0, NULL),
(8, '寿司屋', 'sushi', '2025-09-19 06:22:02', '2025-09-19 06:29:27', 0, NULL),
(9, 'ｗあたｔｓふぁ', 'wats', '2025-09-19 07:06:05', '2025-09-19 08:20:52', 0, NULL);

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
(162, 7, 45, 0, NULL, '2025-09-18 03:51:30', '2025-09-18 03:51:30', 0, NULL),
(163, 7, 46, 0, NULL, '2025-09-18 03:51:30', '2025-09-18 03:51:30', 0, NULL),
(164, 7, 47, 0, NULL, '2025-09-18 03:51:30', '2025-09-18 03:51:30', 0, NULL),
(165, 7, 58, 0, NULL, '2025-09-18 03:51:30', '2025-09-18 03:51:30', 0, NULL),
(166, 7, 48, 0, NULL, '2025-09-18 03:51:30', '2025-09-18 03:51:30', 0, NULL),
(167, 7, 49, 1, NULL, '2025-09-18 03:51:30', '2025-09-18 03:51:30', 0, NULL),
(168, 7, 50, 0, NULL, '2025-09-18 03:51:30', '2025-09-18 03:51:30', 0, NULL),
(169, 7, 55, 0, NULL, '2025-09-18 03:51:30', '2025-09-18 03:51:30', 0, NULL),
(170, 7, 56, 0, NULL, '2025-09-18 03:51:30', '2025-09-18 03:51:30', 0, NULL),
(171, 7, 51, 0, NULL, '2025-09-18 03:51:30', '2025-09-18 03:51:30', 0, NULL),
(172, 7, 52, 0, NULL, '2025-09-18 03:51:30', '2025-09-18 03:51:30', 0, NULL),
(173, 7, 53, 0, NULL, '2025-09-18 03:51:30', '2025-09-18 03:51:30', 0, NULL),
(174, 7, 54, 0, NULL, '2025-09-18 03:51:30', '2025-09-18 03:51:30', 0, NULL),
(175, 7, 57, 1, NULL, '2025-09-18 03:51:30', '2025-09-18 03:51:30', 0, NULL),
(356, 5, 45, 1, NULL, '2025-09-19 08:19:54', '2025-09-19 08:19:54', 0, NULL),
(357, 5, 46, 1, NULL, '2025-09-19 08:19:54', '2025-09-19 08:19:54', 0, NULL),
(358, 5, 60, 1, NULL, '2025-09-19 08:19:54', '2025-09-19 08:19:54', 0, NULL),
(359, 5, 47, 1, NULL, '2025-09-19 08:19:54', '2025-09-19 08:19:54', 0, NULL),
(360, 5, 58, 1, NULL, '2025-09-19 08:19:54', '2025-09-19 08:19:54', 0, NULL),
(361, 5, 48, 1, NULL, '2025-09-19 08:19:54', '2025-09-19 08:19:54', 0, NULL),
(362, 5, 49, 0, NULL, '2025-09-19 08:19:54', '2025-09-19 08:19:54', 0, NULL),
(363, 5, 50, 1, NULL, '2025-09-19 08:19:54', '2025-09-19 08:19:54', 0, NULL),
(364, 5, 55, 1, NULL, '2025-09-19 08:19:54', '2025-09-19 08:19:54', 0, NULL),
(365, 5, 56, 0, NULL, '2025-09-19 08:19:54', '2025-09-19 08:19:54', 0, NULL),
(366, 5, 51, 1, NULL, '2025-09-19 08:19:54', '2025-09-19 08:19:54', 0, NULL),
(367, 5, 52, 1, NULL, '2025-09-19 08:19:54', '2025-09-19 08:19:54', 0, NULL),
(368, 5, 53, 1, NULL, '2025-09-19 08:19:54', '2025-09-19 08:19:54', 0, NULL),
(369, 5, 54, 0, NULL, '2025-09-19 08:19:54', '2025-09-19 08:19:54', 0, NULL),
(370, 5, 57, 0, NULL, '2025-09-19 08:19:54', '2025-09-19 08:19:54', 0, NULL),
(371, 9, 45, 1, NULL, '2025-09-19 08:20:55', '2025-09-19 08:20:55', 0, NULL),
(372, 9, 46, 1, NULL, '2025-09-19 08:20:55', '2025-09-19 08:20:55', 0, NULL),
(373, 9, 60, 1, NULL, '2025-09-19 08:20:55', '2025-09-19 08:20:55', 0, NULL),
(374, 9, 47, 1, NULL, '2025-09-19 08:20:55', '2025-09-19 08:20:55', 0, NULL),
(375, 9, 58, 1, NULL, '2025-09-19 08:20:55', '2025-09-19 08:20:55', 0, NULL),
(376, 9, 48, 1, NULL, '2025-09-19 08:20:55', '2025-09-19 08:20:55', 0, NULL),
(377, 9, 49, 1, NULL, '2025-09-19 08:20:55', '2025-09-19 08:20:55', 0, NULL),
(378, 9, 50, 1, NULL, '2025-09-19 08:20:55', '2025-09-19 08:20:55', 0, NULL),
(379, 9, 55, 1, NULL, '2025-09-19 08:20:55', '2025-09-19 08:20:55', 0, NULL),
(380, 9, 56, 1, NULL, '2025-09-19 08:20:55', '2025-09-19 08:20:55', 0, NULL),
(381, 9, 51, 1, NULL, '2025-09-19 08:20:55', '2025-09-19 08:20:55', 0, NULL),
(382, 9, 52, 1, NULL, '2025-09-19 08:20:55', '2025-09-19 08:20:55', 0, NULL),
(383, 9, 53, 1, NULL, '2025-09-19 08:20:55', '2025-09-19 08:20:55', 0, NULL),
(384, 9, 54, 1, NULL, '2025-09-19 08:20:55', '2025-09-19 08:20:55', 0, NULL),
(385, 9, 57, 1, NULL, '2025-09-19 08:20:55', '2025-09-19 08:20:55', 0, NULL),
(404, 2, 45, 1, NULL, '2025-09-25 00:44:39', '2025-09-25 00:44:39', 0, NULL),
(405, 2, 46, 0, NULL, '2025-09-25 00:44:39', '2025-09-25 00:44:39', 0, NULL),
(406, 2, 60, 1, NULL, '2025-09-25 00:44:39', '2025-09-25 00:44:39', 0, NULL),
(407, 2, 47, 1, NULL, '2025-09-25 00:44:39', '2025-09-25 00:44:39', 0, NULL),
(408, 2, 58, 0, NULL, '2025-09-25 00:44:39', '2025-09-25 00:44:39', 0, NULL),
(409, 2, 48, 0, NULL, '2025-09-25 00:44:39', '2025-09-25 00:44:39', 0, NULL),
(410, 2, 49, 0, NULL, '2025-09-25 00:44:39', '2025-09-25 00:44:39', 0, NULL),
(411, 2, 50, 0, NULL, '2025-09-25 00:44:39', '2025-09-25 00:44:39', 0, NULL),
(412, 2, 55, 0, NULL, '2025-09-25 00:44:39', '2025-09-25 00:44:39', 0, NULL),
(413, 2, 56, 1, NULL, '2025-09-25 00:44:39', '2025-09-25 00:44:39', 0, NULL),
(414, 2, 51, 1, NULL, '2025-09-25 00:44:39', '2025-09-25 00:44:39', 0, NULL),
(415, 2, 52, 1, NULL, '2025-09-25 00:44:39', '2025-09-25 00:44:39', 0, NULL),
(416, 2, 53, 1, NULL, '2025-09-25 00:44:39', '2025-09-25 00:44:39', 0, NULL),
(417, 2, 54, 1, NULL, '2025-09-25 00:44:39', '2025-09-25 00:44:39', 0, NULL),
(418, 2, 64, 0, NULL, '2025-09-25 00:44:39', '2025-09-25 00:44:39', 0, NULL),
(419, 2, 65, 0, NULL, '2025-09-25 00:44:39', '2025-09-25 00:44:39', 0, NULL),
(420, 2, 61, 0, NULL, '2025-09-25 00:44:39', '2025-09-25 00:44:39', 0, NULL),
(421, 2, 57, 0, NULL, '2025-09-25 00:44:39', '2025-09-25 00:44:39', 0, NULL);

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
('admin', 1, NULL, '$2y$10$a/fcOnjmSugf3uJ1GSQfIe.jgDhNfRFXCETlJ3fjfl695LmF4/E1K', 'admin', 1, '2025-09-05 07:50:48', '2025-09-25 00:44:14'),
('okawa', 6, 'ストランド須磨店', '$2y$10$mJQATi34aWXSTkoTH1W0G.Lypt5ro35Omdco.SooDYZ/.24NvQRny', 'user', 1, '2025-09-08 08:11:25', '2025-09-11 03:58:31'),
('oya', 7, 'ストランド　米田店', '$2y$10$3ViP9S9aZIENL5vROgR6nuGjUE.Ho1FhOf2F.zIOkyNE8/04PZ/MC', 'user', 1, '2025-09-17 06:24:17', '2025-09-18 03:51:45'),
('susususu', 3, 'ダンダダン　元町店', '$2y$10$z2dpNTB1klcyKop3ujmOAO5okHAjTqrkF7wkcyiSHZukGi3pYtqnq', 'user', 1, '2025-09-19 05:19:27', '2025-09-19 05:19:27'),
('user1', 2, '四代目菊川　三ノ宮店', '$2y$10$9pNP7mNlTuasrY62mjgcX.D.hopIkSO3VX3Vj1tGJ0wmf0wWpe0sO', 'user', 1, '2025-09-11 03:59:12', '2025-09-25 00:44:46'),
('user2', 3, 'ダンダダン　元町店', '$2y$10$NTOBixRVdLb0Ocv1KGYwEOIlCwECVwwSUK/8UTcj0V83SVPQlKjWq', 'user', 1, '2025-09-05 07:54:39', '2025-09-05 08:06:57');

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
-- テーブルのインデックス `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_users_is_active` (`is_active`),
  ADD KEY `idx_users_role` (`role`),
  ADD KEY `idx_users_updated_at` (`updated_at`),
  ADD KEY `fk_users_store` (`store_id`);

--
-- ダンプしたテーブルの AUTO_INCREMENT
--

--
-- テーブルの AUTO_INCREMENT `daily_reports`
--
ALTER TABLE `daily_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1142;

--
-- テーブルの AUTO_INCREMENT `payment_method_masters`
--
ALTER TABLE `payment_method_masters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- テーブルの AUTO_INCREMENT `stores`
--
ALTER TABLE `stores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- テーブルの AUTO_INCREMENT `store_payment_settings`
--
ALTER TABLE `store_payment_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=422;

--
-- ダンプしたテーブルの制約
--

--
-- テーブルの制約 `daily_reports`
--
ALTER TABLE `daily_reports`
  ADD CONSTRAINT `fk_daily_reports_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`);

--
-- テーブルの制約 `store_payment_settings`
--
ALTER TABLE `store_payment_settings`
  ADD CONSTRAINT `fk_store_payment_method` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_method_masters` (`id`),
  ADD CONSTRAINT `fk_store_payment_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`);

--
-- テーブルの制約 `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`);
COMMIT;
