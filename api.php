<?php
/**
 * 統合APIエンドポイント - api.php
 * 全てのAPI処理を一元管理
 */


// セッション開始
session_start();
header('Content-Type: application/json');


// エラー表示設定
ini_set('display_errors', 0);
error_reporting(E_ALL);

// デバッグログ
error_log("API called with: " . print_r($_GET, true));
error_log("Session data: " . print_r($_SESSION, true));

// CORS設定
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONSリクエスト対応
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// デバッグ: リクエスト処理開始
// デバッグログ（ブラウザには出力されない）
error_log("API called with: " . print_r($_GET, true));
error_log("Session data: " . print_r($_SESSION, true));
error_log("Processing request, action: " . ($_GET['action'] ?? 'none'));

// データベース設定
class Database {
    private static $instance = null;
    private $pdo;
    
    private function __construct() {
        try {
            // 統一設定を使用
            $config_path = __DIR__ . '/config/database.php';
            if (!file_exists($config_path)) {
                throw new Exception("設定ファイルが見つかりません: $config_path");
            }
            
            require_once $config_path;
            
            if (!class_exists('DatabaseConfig')) {
                throw new Exception("DatabaseConfigクラスが見つかりません");
            }
            
            $this->pdo = DatabaseConfig::getConnection();
        } catch (Exception $e) {
            // フォールバック: 直接接続
            error_log("統一設定の読み込みに失敗、直接接続を使用: " . $e->getMessage());
            $this->pdo = new PDO(
                "mysql:host=localhost;dbname=sales_report;charset=utf8mb4",
                'root',
                '',
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getPDO() {
        return $this->pdo;
    }
}

// APIコントローラー
class APIController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getPDO();
    }
    
    /**
     * リクエスト処理のメインハンドラー
     */
    public function handleRequest() {
        try {
            // GETリクエストとPOSTリクエストの両方に対応
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $action = $_GET['action'] ?? '';
                $input = $_GET;
            } else {
                $input = json_decode(file_get_contents('php://input'), true);
                $action = $input['action'] ?? '';
            }
            
            switch ($action) {
                case 'login':
                    return $this->login($input);
                case 'getStoreSettings':
                    return $this->getStoreSettings($input);
                case 'getUserSession':
                    return $this->getUserSession($input);
                case 'saveReport':
                    return $this->saveReport($input);
                case 'getReport':
                    return $this->getReport($input);
                case 'getPaymentMethods':
                    return $this->getPaymentMethods($input);
                case 'addPaymentMethod':
                    return $this->addPaymentMethod($input);
                case 'updatePaymentMethod':
                    return $this->updatePaymentMethod($input);
                case 'deletePaymentMethod':
                    return $this->deletePaymentMethod($input);
                case 'savePaymentMethods':
                    return $this->savePaymentMethods($input);
                case 'getStoreByName':
                    return $this->getStoreByName($input);
                case 'createStore':
                    return $this->createStore($input);
                case 'getAllStores':
                    return $this->getAllStores($input);
                case 'confirmReport':
                    return $this->confirmReport($input);
                case 'unconfirmReport':
                    return $this->unconfirmReport($input);
                case 'checkReportStatus':
                    return $this->checkReportStatus($input);
                case 'getBatchReports':
                    return $this->getBatchReports($input);
                default:
                    throw new Exception('無効なアクション: ' . $action);
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * ユーザー認証
     */
    private function login($data) {
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';
        
        if (empty($username) || empty($password)) {
            throw new Exception('ユーザー名とパスワードを入力してください');
        }
        
        $stmt = $this->db->prepare("
            SELECT u.*, s.name as store_name 
            FROM users u 
            LEFT JOIN stores s ON u.store_id = s.id 
            WHERE u.username = ? AND u.password = ? AND u.is_active = 1
        ");
        $stmt->execute([$username, $password]);
        $user = $stmt->fetch();
        
        if (!$user) {
            throw new Exception('ユーザー名またはパスワードが間違っています');
        }
        
        return [
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'role' => $user['role'],
                'storeId' => $user['store_id'],
                'storeName' => $user['store_name'] ?? '店舗未設定'
            ]
        ];
    }
    
    /**
     * ユーザーセッション情報取得
     */
    private function getUserSession($data) {
        // セッション開始
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // セッションにユーザー情報があるかチェック
        if (isset($_SESSION['user_id'])) {
            return [
                'success' => true,
                'user' => [
                    'id' => $_SESSION['user_id'],
                    'username' => $_SESSION['username'] ?? '',
                    'name' => $_SESSION['user_name'] ?? '',
                    'role' => $_SESSION['role'] ?? 'user',
                    'storeId' => $_SESSION['store_id'] ?? '1',
                    'storeName' => $_SESSION['store_name'] ?? 'デフォルト店舗'
                ]
            ];
        } else {
            // セッションがない場合はデフォルトユーザー情報を返す
            return [
                'success' => true,
                'user' => [
                    'id' => 1,
                    'username' => 'guest',
                    'name' => 'ゲストユーザー',
                    'role' => 'user',
                    'storeId' => '1',
                    'storeName' => '四代目菊川　三ノ宮店'
                ]
            ];
        }
    }
    
    /**
     * 店舗設定取得
     */

    private function getStoreSettings($data) {
        $storeId = $data['storeId'] ?? $data['store_id'] ?? 1;
        
        if (empty($storeId)) {
            throw new Exception('店舗IDが指定されていません');
        }
        
        // 店舗情報を取得
        $stmt = $this->db->prepare("
            SELECT id, store_name, store_code, created_at 
            FROM stores 
            WHERE id = ? 
            LIMIT 1
        ");
        $stmt->execute([$storeId]);
        $storeInfo = $stmt->fetch();
        
        if (!$storeInfo) {
            throw new Exception('指定された店舗が見つかりません');
        }
        
        // 支払い方法設定を取得
        $stmt = $this->db->prepare("
            SELECT 
                pmm.method_id,
                pmm.method_name as display_name,
                pmm.method_type,
                pmm.color_code,
                COALESCE(sps.is_enabled, 0) as is_enabled
            FROM payment_method_masters pmm
            LEFT JOIN store_payment_settings sps ON pmm.id = sps.payment_method_id 
                AND sps.store_id = ? AND sps.is_enabled = 1
            WHERE pmm.method_category = 'payment' AND pmm.is_active = 1
            ORDER BY pmm.display_order ASC
        ");
        $stmt->execute([$storeId]);
        $paymentSettings = $stmt->fetchAll();
        
        // ポイント設定を取得
        $stmt = $this->db->prepare("
            SELECT 
                pmm.method_id,
                pmm.method_name as display_name,
                pmm.method_type,
                pmm.color_code,
                COALESCE(sps.is_enabled, 0) as is_enabled
            FROM payment_method_masters pmm
            LEFT JOIN store_payment_settings sps ON pmm.id = sps.payment_method_id 
                AND sps.store_id = ? AND sps.is_enabled = 1
            WHERE pmm.method_category = 'point' AND pmm.is_active = 1
            ORDER BY pmm.display_order ASC
        ");
        $stmt->execute([$storeId]);
        $pointSettings = $stmt->fetchAll();
        
        return [
            'success' => true,
            'store_id' => $storeId,
            'payment_settings' => array_filter($paymentSettings, function($p) { return $p['is_enabled']; }),
            'point_settings' => array_filter($pointSettings, function($p) { return $p['is_enabled']; })
        ];
    }
    
    /**
     * 売上レポート保存（確定状態チェック対応版）
     */
    private function saveReport($data) {
        try {
            $reportDate = $data['report_date'] ?? '';
            $storeId = $data['store_id'] ?? 0;
            $userId = $data['user_id'] ?? '';
            
            if (empty($reportDate) || empty($storeId) || empty($userId)) {
                throw new Exception('必須項目が不足しています');
            }
            
            // 既存レポートの確認
            $stmt = $this->db->prepare("
                SELECT id, status FROM daily_reports 
                WHERE report_date = ? AND store_id = ?
            ");
            $stmt->execute([$reportDate, $storeId]);
            $existing = $stmt->fetch();
            
            // 確定済みの場合は保存不可
            if ($existing && $existing['status'] === 'approved') {
                throw new Exception('この日報は既に確定済みのため、修正・保存できません。管理者にお問い合わせください。');
            }
            
            $salesData = $data['sales_data'] ?? [];
            $pointPaymentsData = $data['point_payments_data'] ?? [];
            $incomeData = $data['income_data'] ?? [];
            $expenseData = $data['expense_data'] ?? [];
            $cashData = $data['cash_data'] ?? [];
            $previousCashBalance = floatval($data['previous_cash_balance'] ?? 0);
            $cashDifference = floatval($data['cash_difference'] ?? 0);
            $remarks = $data['remarks'] ?? '';
            $attachedFiles = $data['attached_files'] ?? [];
            $paymentMethodConfig = $data['payment_method_config'] ?? null;
            $pointPaymentConfig = $data['point_payment_config'] ?? null;
            $manualTaxInputs = $data['manual_tax_inputs'] ?? null;
            
            if ($existing) {
                // 更新（ステータスは draft に設定）
                $stmt = $this->db->prepare("
                    UPDATE daily_reports 
                    SET sales_data = ?, 
                        point_payments_data = ?,
                        income_data = ?,
                        expense_data = ?,
                        cash_data = ?,
                        payment_method_config = ?,
                        point_payment_config = ?,
                        manual_tax_inputs = ?,
                        previous_cash_balance = ?,
                        cash_difference = ?,
                        remarks = ?,
                        attached_files = ?,
                        status = 'draft',
                        submitted_at = NOW(),
                        user_id = ?, 
                        updated_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([
                    json_encode($salesData), 
                    json_encode($pointPaymentsData),
                    json_encode($incomeData),
                    json_encode($expenseData),
                    json_encode($cashData),
                    $paymentMethodConfig ? json_encode($paymentMethodConfig) : null,
                    $pointPaymentConfig ? json_encode($pointPaymentConfig) : null,
                    $manualTaxInputs ? json_encode($manualTaxInputs) : null,
                    $previousCashBalance,
                    $cashDifference,
                    $remarks,
                    $attachedFiles ? json_encode($attachedFiles) : null,
                    $userId, 
                    $existing['id']
                ]);
                $reportId = $existing['id'];
            } else {
                // 新規作成（ステータスは draft に設定）
                $stmt = $this->db->prepare("
                    INSERT INTO daily_reports (
                        report_date, 
                        store_id, 
                        user_id, 
                        sales_data,
                        point_payments_data,
                        income_data,
                        expense_data,
                        cash_data,
                        payment_method_config,
                        point_payment_config,
                        manual_tax_inputs,
                        previous_cash_balance,
                        cash_difference,
                        remarks,
                        attached_files,
                        status,
                        submitted_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', NOW())
                ");
                $stmt->execute([
                    $reportDate, 
                    $storeId, 
                    $userId, 
                    json_encode($salesData),
                    json_encode($pointPaymentsData),
                    json_encode($incomeData),
                    json_encode($expenseData),
                    json_encode($cashData),
                    $paymentMethodConfig ? json_encode($paymentMethodConfig) : null,
                    $pointPaymentConfig ? json_encode($pointPaymentConfig) : null,
                    $manualTaxInputs ? json_encode($manualTaxInputs) : null,
                    $previousCashBalance,
                    $cashDifference,
                    $remarks,
                    $attachedFiles ? json_encode($attachedFiles) : null
                ]);
                $reportId = $this->db->lastInsertId();
            }
            
            return [
                'success' => true,
                'report_id' => $reportId,
                'message' => '売上レポートを保存しました'
            ];
            
        } catch (Exception $e) {
            error_log('saveReport error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * 日報確定状態チェック
     */
    private function checkReportStatus($data) {
        $reportDate = $data['report_date'] ?? '';
        $storeId = $data['store_id'] ?? 0;
        
        if (empty($reportDate) || empty($storeId)) {
            throw new Exception('日付と店舗IDが必要です');
        }
        
        $stmt = $this->db->prepare("
            SELECT id, status, user_id, created_at, updated_at 
            FROM daily_reports 
            WHERE report_date = ? AND store_id = ?
        ");
        $stmt->execute([$reportDate, $storeId]);
        $report = $stmt->fetch();
        
        return [
            'success' => true,
            'exists' => !!$report,
            'status' => $report['status'] ?? 'draft',
            'is_confirmed' => ($report['status'] ?? 'draft') === 'approved',
            'user_id' => $report['user_id'] ?? null,
            'created_at' => $report['created_at'] ?? null,
            'updated_at' => $report['updated_at'] ?? null
        ];
    }

    /**
     * 複数日報の一括取得（高速化版）
     */
    private function getBatchReports($data) {
        $startDate = $data['start_date'] ?? '';
        $endDate = $data['end_date'] ?? '';
        $storeIds = $data['store_ids'] ?? [];
        
        // 入力値検証
        if (empty($startDate) || empty($endDate)) {
            throw new Exception('開始日と終了日が必要です');
        }
        
        if (empty($storeIds)) {
            throw new Exception('店舗IDが必要です');
        }
        
        // IN句用のプレースホルダーを作成
        $placeholders = str_repeat('?,', count($storeIds) - 1) . '?';
        
        // 日報データを取得
        $stmt = $this->db->prepare("
            SELECT dr.*, s.store_name 
            FROM daily_reports dr
            LEFT JOIN stores s ON dr.store_id = s.id 
            WHERE dr.report_date BETWEEN ? AND ? 
            AND dr.store_id IN ($placeholders)
            ORDER BY dr.report_date DESC, s.store_name ASC
        ");
        
        $params = array_merge([$startDate, $endDate], $storeIds);
        $stmt->execute($params);
        $reports = $stmt->fetchAll();
        
        // データを整形
        $formattedReports = [];
        foreach ($reports as $report) {
            $formattedReports[] = [
                'id' => $report['id'],
                'report_date' => $report['report_date'],
                'store_id' => $report['store_id'],
                'store_name' => $report['store_name'],
                'user_id' => $report['user_id'],
                'status' => $report['status'] ?? 'submitted',
                'sales_data' => $report['sales_data'] ? json_decode($report['sales_data'], true) : [],
                'point_payments_data' => $report['point_payments_data'] ? json_decode($report['point_payments_data'], true) : [],
                'income_data' => $report['income_data'] ? json_decode($report['income_data'], true) : [],
                'expense_data' => $report['expense_data'] ? json_decode($report['expense_data'], true) : [],
                'cash_data' => $report['cash_data'] ? json_decode($report['cash_data'], true) : [],
                'previous_cash_balance' => floatval($report['previous_cash_balance'] ?? 0),
                'cash_difference' => floatval($report['cash_difference'] ?? 0),
                'remarks' => $report['remarks'] ?? '',
                'attached_files' => $report['attached_files'] ? json_decode($report['attached_files'], true) : [],
                'created_at' => $report['created_at'],
                'updated_at' => $report['updated_at']
            ];
        }
        
        return [
            'success' => true,
            'data' => $formattedReports,
            'count' => count($formattedReports),
            'message' => count($formattedReports) . '件のレポートを取得しました'
        ];
    }
    
/**
 * 売上レポート取得（添付ファイル対応版）
 */
private function getReport($data) {
    $reportDate = $data['report_date'] ?? '';
    $storeId = $data['store_id'] ?? 0;
    
    if (empty($reportDate) || empty($storeId)) {
        throw new Exception('日付と店舗IDが必要です');
    }
    
    $stmt = $this->db->prepare("
        SELECT * FROM daily_reports 
        WHERE report_date = ? AND store_id = ?
    ");
    $stmt->execute([$reportDate, $storeId]);
    $report = $stmt->fetch();
    
    if (!$report) {
        return [
            'success' => false,
            'message' => '指定された日付のレポートが見つかりません'
        ];
    }
    
    // デバッグログ追加
    error_log("=== getReport デバッグ ===");
    error_log("Report ID: " . $report['id']);
    error_log("Raw Status: " . ($report['status'] ?? 'NULL'));
    error_log("Report Date: " . $report['report_date']);
    
    // デバッグログ追加
    error_log("=== getReport デバッグ ===");
    error_log("Report ID: " . $report['id']);
    error_log("Raw Status: " . ($report['status'] ?? 'NULL'));
    error_log("Report Date: " . $report['report_date']);
    error_log("Raw cash_data: " . substr($report['cash_data'] ?? 'NULL', 0, 200));
    
    // cash_dataの詳細デバッグ
    if ($report['cash_data']) {
        $cashDataRaw = $report['cash_data'];
        error_log("cash_data type: " . gettype($cashDataRaw));
        error_log("cash_data length: " . strlen($cashDataRaw));
        
        // 二重JSON解析を試行
        $firstDecode = json_decode($cashDataRaw, true);
        if (is_string($firstDecode)) {
            error_log("cash_data is double-encoded, performing second decode");
            $secondDecode = json_decode($firstDecode, true);
            if ($secondDecode !== null) {
                error_log("Second decode successful");
                $cashDataParsed = $secondDecode;
            } else {
                error_log("Second decode failed");
                $cashDataParsed = $firstDecode;
            }
        } else {
            $cashDataParsed = $firstDecode;
        }
    } else {
        $cashDataParsed = [];
    }
    
    $attachedFilesData = $report['attached_files'] ? json_decode($report['attached_files'], true) : [];
    error_log("添付ファイル数: " . count($attachedFilesData));
    
    // statusが確実に設定されるようにする
    $status = $report['status'] ?? 'submitted'; // デフォルトはsubmitted
    if (empty($status) || !in_array($status, ['draft', 'submitted', 'approved', 'rejected'])) {
        $status = 'submitted'; // 不正な値の場合はsubmittedに設定
    }
    
    error_log("Final Status: " . $status);
    
    // 手動税率入力データを復元
    $manualTaxInputsData = [];
    if ($report['manual_tax_inputs']) {
        try {
            $manualTaxInputsData = json_decode($report['manual_tax_inputs'], true);
        } catch (Exception $e) {
            error_log('手動税率入力データのパースエラー: ' . $e->getMessage());
            $manualTaxInputsData = [];
        }
    }

    return [
        'success' => true,
        'data' => [
            'id' => $report['id'],
            'report_date' => $report['report_date'],
            'store_id' => $report['store_id'],
            'user_id' => $report['user_id'],
            // 旧形式との互換性を保持
            'sales_data' => $report['sales_data'] ? json_decode($report['sales_data'], true) : [],
            'point_payments_data' => $report['point_payments_data'] ? json_decode($report['point_payments_data'], true) : [],
            'income_data' => $report['income_data'] ? json_decode($report['income_data'], true) : [],
            'expense_data' => $report['expense_data'] ? json_decode($report['expense_data'], true) : [],
            'cash_data' => $cashDataParsed,
            // 新形式も併用（前日現金残取得用）
            'sales' => $report['sales_data'] ? json_decode($report['sales_data'], true) : [],
            'cash' => $cashDataParsed,
            'expenses' => $report['expense_data'] ? json_decode($report['expense_data'], true) : [],
            'payment_method_config' => $report['payment_method_config'] ? json_decode($report['payment_method_config'], true) : null,
            'point_payment_config' => $report['point_payment_config'] ? json_decode($report['point_payment_config'], true) : null,
            'previous_cash_balance' => floatval($report['previous_cash_balance'] ?? 0),
            'cash_difference' => floatval($report['cash_difference'] ?? 0),
            'remarks' => $report['remarks'] ?? '',
            'attached_files' => $attachedFilesData,
            'attachedFiles' => $attachedFilesData, // 新形式も併用
            'manual_tax_inputs' => $manualTaxInputsData,
            'status' => $status, // statusを確実に返す
            'submitted_at' => $report['submitted_at'],
            'created_at' => $report['created_at'],
            'updated_at' => $report['updated_at']
        ]
    ];
}

private function addPaymentMethod($data) {
        $methodName = trim($data['method_name'] ?? '');
        $methodType = trim($data['method_type'] ?? '');
        $colorCode = trim($data['color_code'] ?? '#667eea');
        
        if (empty($methodName) || empty($methodType)) {
            throw new Exception('支払方法名と種別は必須です');
        }
        
        // method_categoryの決定
        $methodCategory = 'payment';
        if ($methodType === 'point' || $methodType === 'coupon') {
            $methodCategory = 'point';
        }
        
        // method_typeの正規化 (データベース構造に合わせて)
        $normalizedMethodType = 'cashless'; // デフォルト
        if ($methodType === 'cash') {
            $normalizedMethodType = 'cash';
        }
        
        // 重複チェック
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM payment_method_masters 
            WHERE method_name = ? AND deleted_at IS NULL
        ");
        $stmt->execute([$methodName]);
        
        if ($stmt->fetchColumn() > 0) {
            throw new Exception('同じ名前の支払方法が既に存在します');
        }
        
        // 一意なmethod_idを生成
        $methodId = strtolower(str_replace([' ', '　'], '_', $methodName)) . '_' . time();
        
        // 最大表示順を取得
        $stmt = $this->db->prepare("SELECT COALESCE(MAX(display_order), 0) + 1 FROM payment_method_masters");
        $stmt->execute();
        $displayOrder = $stmt->fetchColumn();
        
        // 新規追加
        $stmt = $this->db->prepare("
            INSERT INTO payment_method_masters 
            (method_id, method_name, method_type, method_category, color_code, display_order, is_active, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
        ");
        $stmt->execute([$methodId, $methodName, $normalizedMethodType, $methodCategory, $colorCode, $displayOrder]);
        
        $newId = $this->db->lastInsertId();
        
        return [
            'success' => true,
            'method_id' => $newId,
            'message' => '支払方法を追加しました'
        ];
    }
    
    /**
     * 支払方法更新
     */
    private function updatePaymentMethod($data) {
        $methodId = intval($data['method_id'] ?? 0);
        $methodName = trim($data['method_name'] ?? '');
        $colorCode = trim($data['color_code'] ?? '#667eea');
        $isActive = isset($data['is_active']) ? intval($data['is_active']) : 1;
        
        if ($methodId <= 0) {
            throw new Exception('有効な支払方法IDが必要です');
        }
        
        if (empty($methodName)) {
            throw new Exception('支払方法名は必須です');
        }
        
        // 存在チェック（主キーのidで検索）
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM payment_method_masters WHERE id = ? AND deleted_at IS NULL");
        $stmt->execute([$methodId]);
        
        if ($stmt->fetchColumn() == 0) {
            throw new Exception('指定された支払方法が見つかりません');
        }
        
        // 更新実行
        $stmt = $this->db->prepare("
            UPDATE payment_method_masters 
            SET method_name = ?, color_code = ?, is_active = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$methodName, $colorCode, $isActive, $methodId]);
        
        return [
            'success' => true,
            'message' => '支払方法を更新しました'
        ];
    }
    
    /**
     * 支払方法削除
     */
    private function deletePaymentMethod($data) {
        $methodId = intval($data['method_id'] ?? 0);
        
        if ($methodId <= 0) {
            throw new Exception('有効な支払方法IDが必要です');
        }
        
        // 使用状況チェック（店舗設定で使用されているかチェック）
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM store_payment_settings 
            WHERE payment_method_id = ? AND is_enabled = 1 AND is_deleted = 0
        ");
        $stmt->execute([$methodId]);
        
        if ($stmt->fetchColumn() > 0) {
            throw new Exception('この支払方法は店舗設定で使用されているため削除できません');
        }
        
        // 論理削除実行
        $stmt = $this->db->prepare("
            UPDATE payment_method_masters 
            SET deleted_at = NOW(), updated_at = NOW() 
            WHERE id = ? AND deleted_at IS NULL
        ");
        $stmt->execute([$methodId]);
        
        if ($stmt->rowCount() == 0) {
            throw new Exception('指定された支払方法が見つかりません');
        }
        
        return [
            'success' => true,
            'message' => '支払方法を削除しました'
        ];
    }
    
    /**
     * 支払方法一括保存（既存メソッドとの互換性）
     */
    private function savePaymentMethods($data) {
        $paymentMethods = $data['payment_methods'] ?? [];
        $pointMethods = $data['point_methods'] ?? [];
        
        try {
            $this->db->beginTransaction();
            
            $successCount = 0;
            
            // 支払方法の更新
            foreach ($paymentMethods as $method) {
                if (isset($method['method_id']) && is_numeric($method['method_id'])) {
                    $this->updatePaymentMethod([
                        'method_id' => $method['method_id'],
                        'method_name' => $method['display_name'] ?? $method['method_name'],
                        'color_code' => $method['color_code'] ?? '#667eea',
                        'is_active' => $method['is_active'] ?? 1
                    ]);
                    $successCount++;
                }
            }
            
            // ポイント方法の更新
            foreach ($pointMethods as $method) {
                if (isset($method['method_id']) && is_numeric($method['method_id'])) {
                    $this->updatePaymentMethod([
                        'method_id' => $method['method_id'],
                        'method_name' => $method['display_name'] ?? $method['method_name'],
                        'color_code' => $method['color_code'] ?? '#667eea',
                        'is_active' => $method['is_active'] ?? 1
                    ]);
                    $successCount++;
                }
            }
            
            $this->db->commit();
            
            return [
                'success' => true,
                'message' => "{$successCount}件の支払方法を保存しました"
            ];
            
        } catch (Exception $e) {
            $this->db->rollBack();
            throw new Exception('支払方法の保存に失敗しました: ' . $e->getMessage());
        }
    }
    
    /**
     * 店舗名から店舗情報を取得
     */
    private function getStoreByName($input) {
        try {
            $storeName = $input['store_name'] ?? '';
            
            if (empty($storeName)) {
                throw new Exception('店舗名が指定されていません');
            }
            
            $stmt = $this->db->prepare("
                SELECT id, store_name, created_at 
                FROM stores 
                WHERE store_name = ? 
                LIMIT 1
            ");
            $stmt->execute([$storeName]);
            $store = $stmt->fetch();
            
            if ($store) {
                return [
                    'success' => true,
                    'data' => $store
                ];
            } else {
                return [
                    'success' => false,
                    'message' => '指定された店舗が見つかりません'
                ];
            }
            
        } catch (Exception $e) {
            throw new Exception('店舗情報の取得に失敗しました: ' . $e->getMessage());
        }
    }
    
    /**
     * 新規店舗を作成
     */
    private function createStore($input) {
        try {
            $storeName = $input['store_name'] ?? '';
            
            if (empty($storeName)) {
                throw new Exception('店舗名が指定されていません');
            }
            
            // 既存店舗の重複チェック
            $stmt = $this->db->prepare("SELECT id FROM stores WHERE store_name = ?");
            $stmt->execute([$storeName]);
            if ($stmt->fetch()) {
                throw new Exception('同名の店舗が既に存在します');
            }
            
            // 新規店舗作成
            $stmt = $this->db->prepare("
                INSERT INTO stores (store_name, created_at) 
                VALUES (?, NOW())
            ");
            $stmt->execute([$storeName]);
            
            $newStoreId = $this->db->lastInsertId();
            
            return [
                'success' => true,
                'data' => [
                    'id' => $newStoreId,
                    'store_name' => $storeName
                ],
                'message' => '新規店舗を作成しました'
            ];
            
        } catch (Exception $e) {
            throw new Exception('店舗の作成に失敗しました: ' . $e->getMessage());
        }
    }
    
    /**
     * 全店舗一覧を取得
     */
    private function getAllStores($input) {
        try {
            $stmt = $this->db->prepare("
                SELECT id, store_name, store_code, created_at 
                FROM stores 
                WHERE is_deleted = 0 
                ORDER BY store_name ASC
            ");
            $stmt->execute();
            $stores = $stmt->fetchAll();
            
            return [
                'success' => true,
                'data' => $stores,
                'message' => count($stores) . '件の店舗を取得しました'
            ];
            
        } catch (Exception $e) {
            throw new Exception('店舗一覧の取得に失敗しました: ' . $e->getMessage());
        }
    }

    /**
     * 日報確定（approved に変更）
     */
    private function confirmReport($data) {
        $reportDate = $data['report_date'] ?? '';
        $storeId = $data['store_id'] ?? 0;
        
        if (empty($reportDate) || empty($storeId)) {
            throw new Exception('日付と店舗IDが必要です');
        }
        
        // レポートの存在確認
        $stmt = $this->db->prepare("
            SELECT id, status FROM daily_reports 
            WHERE report_date = ? AND store_id = ?
        ");
        $stmt->execute([$reportDate, $storeId]);
        $report = $stmt->fetch();
        
        if (!$report) {
            throw new Exception('指定された日報が見つかりません');
        }
        
        // 既に確定済みの場合はエラー
        if ($report['status'] === 'approved') {
            throw new Exception('この日報は既に確定済みです');
        }
        
        // ステータスを確定に更新
        $stmt = $this->db->prepare("
            UPDATE daily_reports 
            SET status = 'approved', updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$report['id']]);
        
        return [
            'success' => true,
            'message' => '日報を確定しました'
        ];
    }

    /**
     * 日報確定解除（submitted または draft に変更）
     */
    private function unconfirmReport($data) {
        $reportDate = $data['report_date'] ?? '';
        $storeId = $data['store_id'] ?? 0;
        
        if (empty($reportDate) || empty($storeId)) {
            throw new Exception('日付と店舗IDが必要です');
        }
        
        // レポートの存在確認
        $stmt = $this->db->prepare("
            SELECT id, status FROM daily_reports 
            WHERE report_date = ? AND store_id = ?
        ");
        $stmt->execute([$reportDate, $storeId]);
        $report = $stmt->fetch();
        
        if (!$report) {
            throw new Exception('指定された日報が見つかりません');
        }
        
        // 確定済みでない場合はエラー
        if ($report['status'] !== 'approved') {
            throw new Exception('この日報は確定状態ではありません');
        }
        
        // ステータスを草稿に更新（編集可能な状態に戻す）
        $stmt = $this->db->prepare("
            UPDATE daily_reports 
            SET status = 'draft', updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$report['id']]);
        
        return [
            'success' => true,
            'message' => '日報の確定を解除しました'
        ];
    }

} // APIControllerクラスの終了

// メイン処理
error_log("Starting main processing...");
try {
    error_log("Creating APIController...");
    $controller = new APIController();
    error_log("Handling request...");
    $result = $controller->handleRequest();
    error_log("Request handled, result: " . print_r($result, true));
    echo json_encode($result);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
