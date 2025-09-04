<?php
/**
 * 統合APIエンドポイント - api.php
 * 全てのAPI処理を一元管理
 */


// セッション開始
session_start();
header('Content-Type: application/json');


// エラー表示設定
ini_set('display_errors', 1);
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
error_log("Processing request, action: " . ($_GET['action'] ?? 'none'));

// データベース設定
class Database {
    private static $instance = null;
    private $pdo;
    
    private function __construct() {
        try {
            $this->pdo = new PDO(
                "mysql:host=localhost;dbname=sales_report;charset=utf8mb4",
                'yanagisawa',
                'zxcvb@12345',
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            throw new Exception('データベース接続エラー: ' . $e->getMessage());
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
    /**
     * 店舗設定取得
     */
    private function getStoreSettings($data) {
        $storeId = $data['storeId'] ?? $data['store_id'] ?? 1; // URLパラメータとJSONの両方に対応
        
        if (empty($storeId)) {
            throw new Exception('店舗IDが指定されていません');
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
     * 売上レポート保存
     */
    private function saveReport($data) {
        $reportDate = $data['report_date'] ?? '';
        $storeId = $data['store_id'] ?? 0;
        $userId = $data['user_id'] ?? '';
        $salesData = $data['sales_data'] ?? [];
        
        if (empty($reportDate) || empty($storeId) || empty($userId)) {
            throw new Exception('必須項目が不足しています');
        }
        
        // 既存レポートの確認
        $stmt = $this->db->prepare("
            SELECT id FROM daily_reports 
            WHERE report_date = ? AND store_id = ?
        ");
        $stmt->execute([$reportDate, $storeId]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // 更新
            $stmt = $this->db->prepare("
                UPDATE daily_reports 
                SET sales_data = ?, user_id = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([json_encode($salesData), $userId, $existing['id']]);
            $reportId = $existing['id'];
        } else {
            // 新規作成
            $stmt = $this->db->prepare("
                INSERT INTO daily_reports (report_date, store_id, user_id, sales_data)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$reportDate, $storeId, $userId, json_encode($salesData)]);
            $reportId = $this->db->lastInsertId();
        }
        
        return [
            'success' => true,
            'report_id' => $reportId,
            'message' => '売上レポートを保存しました'
        ];
    }
    
    /**
     * 売上レポート取得
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
        
        return [
            'success' => true,
            'report' => [
                'id' => $report['id'],
                'report_date' => $report['report_date'],
                'store_id' => $report['store_id'],
                'user_id' => $report['user_id'],
                'sales_data' => json_decode($report['sales_data'], true),
                'created_at' => $report['created_at'],
                'updated_at' => $report['updated_at']
            ]
        ];
    }
    
    /**
     * 支払方法マスタ一覧取得
     */
    private function getPaymentMethods($data) {
        try {
            // 支払方法マスタ取得
            $stmt = $this->db->prepare("
                SELECT id, method_id, method_name, method_type, method_category,
                       color_code, display_order, is_active
                FROM payment_method_masters 
                WHERE is_active = 1 AND deleted_at IS NULL
                ORDER BY display_order ASC, id ASC
            ");
            $stmt->execute();
            $allMethods = $stmt->fetchAll();
            
            // 支払方法（payment）とポイント・クーポン（point）で分離
            $paymentMethods = [];
            $pointMethods = [];
            
            foreach ($allMethods as $method) {
                // データ構造を統一
                $methodData = [
                    'method_id' => $method['id'], // 主キーをmethod_idとして使用
                    'method_name' => $method['method_name'],
                    'display_name' => $method['method_name'], // display_nameは method_nameと同じ
                    'color_code' => $method['color_code'] ?: '#667eea',
                    'is_active' => $method['is_active'],
                    'method_type' => $method['method_type'],
                    'sort_order' => $method['display_order']
                ];
                
                if ($method['method_category'] === 'point') {
                    $pointMethods[] = $methodData;
                } else {
                    $paymentMethods[] = $methodData;
                }
            }
            
            return [
                'success' => true,
                'payment_methods' => $paymentMethods,
                'point_methods' => $pointMethods,
                'all_methods' => array_merge($paymentMethods, $pointMethods)
            ];
        } catch (Exception $e) {
            throw new Exception('支払方法データの取得に失敗しました: ' . $e->getMessage());
        }
    }
    
    /**
     * 支払方法新規追加
     */
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
}

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
