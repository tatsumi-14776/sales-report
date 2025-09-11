<?php
/**
 * 店舗設定API - store-settings.php（修正版）
 * 店舗情報と支払方法設定の管理（マスターデータ連携対応）
 */

// エラー表示（開発用）
ini_set('display_errors', 1);
error_reporting(E_ALL);

// JSONレスポンス用ヘッダー
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONSリクエスト対応
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// POSTリクエストのみ受付
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'POST リクエストのみサポートしています'
    ]);
    exit;
}

// データベース接続設定
// データベース接続（統一設定を使用）
try {
    $config_path = __DIR__ . '/config/database.php';
    if (!file_exists($config_path)) {
        throw new Exception("設定ファイルが見つかりません: $config_path");
    }
    
    require_once $config_path;
    
    if (!class_exists('DatabaseConfig')) {
        throw new Exception("DatabaseConfigクラスが見つかりません");
    }
    
    $pdo = DatabaseConfig::getConnection();
} catch (Exception $config_error) {
    // フォールバック: 直接接続
    error_log("統一設定の読み込みに失敗、直接接続を使用: " . $config_error->getMessage());
    $pdo = new PDO(
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

// POSTデータの取得
$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

// アクションに応じた処理
try {
    switch ($action) {
        case 'get_stores':
            handleGetStores($pdo);
            break;

        case 'get_store_info':
            handleGetStoreInfo($pdo, $data);
            break;

        case 'create_store':
            handleCreateStore($pdo, $data);
            break;

        case 'update_store_info':
            handleUpdateStoreInfo($pdo, $data);
            break;

        case 'get_master_data':
            handleGetMasterData($pdo);
            break;

        case 'get_store_settings':
            handleGetStoreSettings($pdo, $data);
            break;

        case 'save_store_settings':
            handleSaveStoreSettings($pdo, $data);
            break;

        case 'delete_store':
            handleDeleteStore($pdo, $data);
            break;

        case 'get_deleted_stores':
            handleGetDeletedStores($pdo);
            break;

        case 'restore_store':
            handleRestoreStore($pdo, $data);
            break;

        case 'get_store_stats':
            handleGetStoreStats($pdo);
            break;

        default:
            echo json_encode([
                'success' => false,
                'message' => '不正なアクション: ' . $action
            ]);
            break;
    }
} catch (Exception $e) {
    error_log("Store Settings API Error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

/**
 * 店舗一覧を取得
 */
function handleGetStores($pdo) {
    try {
        $stmt = $pdo->query("SELECT * FROM stores WHERE is_deleted = 0 ORDER BY store_name");
        $stores = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'stores' => $stores
        ]);
    } catch (Exception $e) {
        throw new Exception('店舗一覧の取得に失敗しました: ' . $e->getMessage());
    }
}

/**
 * 特定の店舗情報を取得
 */
function handleGetStoreInfo($pdo, $data) {
    try {
        $storeId = $data['store_id'] ?? 0;
        
        if (empty($storeId)) {
            throw new Exception('店舗IDが指定されていません');
        }

        $stmt = $pdo->prepare("SELECT * FROM stores WHERE id = ? AND is_deleted = 0");
        $stmt->execute([$storeId]);
        $store = $stmt->fetch();
        
        if (!$store) {
            throw new Exception('指定された店舗が見つかりません');
        }

        echo json_encode([
            'success' => true,
            'store' => $store
        ]);
    } catch (Exception $e) {
        throw new Exception('店舗情報の取得に失敗しました: ' . $e->getMessage());
    }
}

/**
 * 新規店舗を作成
 */
function handleCreateStore($pdo, $data) {
    try {
        $storeName = trim($data['store_name'] ?? '');
        $storeCode = trim($data['store_code'] ?? '');

        if (empty($storeName)) {
            throw new Exception('店舗名は必須です');
        }

        if (empty($storeCode)) {
            throw new Exception('店舗コードは必須です');
        }

        // 店舗コードの重複チェック
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM stores WHERE store_code = ?");
        $stmt->execute([$storeCode]);
        if ($stmt->fetchColumn() > 0) {
            throw new Exception('この店舗コードは既に使用されています');
        }

        // 店舗を作成
        $stmt = $pdo->prepare("INSERT INTO stores (store_name, store_code, created_at, updated_at) VALUES (?, ?, NOW(), NOW())");
        $stmt->execute([$storeName, $storeCode]);
        
        $storeId = $pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'message' => '店舗を登録しました',
            'store_id' => $storeId
        ]);
    } catch (Exception $e) {
        throw new Exception('店舗作成に失敗しました: ' . $e->getMessage());
    }
}

/**
 * 店舗情報を更新
 */
function handleUpdateStoreInfo($pdo, $data) {
    try {
        $storeId = $data['store_id'] ?? 0;
        $storeName = trim($data['store_name'] ?? '');
        $storeCode = trim($data['store_code'] ?? '');

        if (empty($storeId)) {
            throw new Exception('店舗IDが指定されていません');
        }

        if (empty($storeName)) {
            throw new Exception('店舗名は必須です');
        }

        if (empty($storeCode)) {
            throw new Exception('店舗コードは必須です');
        }

        // 店舗コードの重複チェック（自分以外）
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM stores WHERE store_code = ? AND id != ?");
        $stmt->execute([$storeCode, $storeId]);
        if ($stmt->fetchColumn() > 0) {
            throw new Exception('この店舗コードは既に使用されています');
        }

        // 店舗情報の更新
        $stmt = $pdo->prepare("UPDATE stores SET store_name = ?, store_code = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$storeName, $storeCode, $storeId]);

        echo json_encode([
            'success' => true,
            'message' => '店舗情報を更新しました'
        ]);
    } catch (Exception $e) {
        throw new Exception('店舗情報更新に失敗しました: ' . $e->getMessage());
    }
}

/**
 * 支払方法・ポイントマスターデータを取得
 */
function handleGetMasterData($pdo) {
    try {
        // 支払方法マスター取得（統合テーブルから）
        $stmt = $pdo->query("
            SELECT id, method_id, method_name, method_type, color_code, display_order, is_active 
            FROM payment_method_masters 
            WHERE method_category = 'payment' AND is_active = 1
            ORDER BY display_order ASC, method_name ASC
        ");
        $paymentMethods = $stmt->fetchAll();

        // ポイント・クーポンマスター取得（統合テーブルから）
        $stmt = $pdo->query("
            SELECT id, method_id, method_name, method_type as point_type, display_order, is_active 
            FROM payment_method_masters 
            WHERE method_category = 'point' AND is_active = 1
            ORDER BY display_order ASC, method_name ASC
        ");
        $pointMethods = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'payment_methods' => $paymentMethods,
            'point_methods' => $pointMethods
        ]);
    } catch (Exception $e) {
        throw new Exception('マスターデータの取得に失敗しました: ' . $e->getMessage());
    }
}

/**
 * 店舗別設定を取得
 */
function handleGetStoreSettings($pdo, $data) {
    try {
        $storeId = $data['store_id'] ?? 0;
        
        if (empty($storeId)) {
            throw new Exception('店舗IDが指定されていません');
        }

        // 店舗情報を取得
        $stmt = $pdo->prepare("SELECT * FROM stores WHERE id = ? AND is_deleted = 0");
        $stmt->execute([$storeId]);
        $store = $stmt->fetch();
        
        if (!$store) {
            throw new Exception('指定された店舗が見つかりません');
        }

        // 支払方法マスターと店舗設定を統合取得
        $stmt = $pdo->prepare("
            SELECT 
                pmm.id as master_id,
                pmm.method_id,
                pmm.method_name,
                pmm.method_type,
                pmm.color_code,
                pmm.display_order,
                pmm.method_category,
                COALESCE(sps.is_enabled, 0) as is_enabled,
                COALESCE(sps.display_name, pmm.method_name) as display_name
            FROM payment_method_masters pmm
            LEFT JOIN store_payment_settings sps ON pmm.id = sps.payment_method_id 
                AND sps.store_id = ? 
                AND (sps.is_deleted = 0 OR sps.is_deleted IS NULL)
            WHERE pmm.method_category = 'payment' AND pmm.is_active = 1
            ORDER BY pmm.display_order ASC, pmm.method_name ASC
        ");
        $stmt->execute([$storeId]);
        $paymentSettings = $stmt->fetchAll();

        // ポイント・クーポンマスターと店舗設定を統合取得
        $stmt = $pdo->prepare("
            SELECT 
                pmm.id as master_id,
                pmm.method_id,
                pmm.method_name,
                pmm.method_type as point_type,
                pmm.display_order,
                pmm.method_category,
                COALESCE(sps.is_enabled, 0) as is_enabled,
                COALESCE(sps.display_name, pmm.method_name) as display_name
            FROM payment_method_masters pmm
            LEFT JOIN store_payment_settings sps ON pmm.id = sps.payment_method_id 
                AND sps.store_id = ? 
                AND (sps.is_deleted = 0 OR sps.is_deleted IS NULL)
            WHERE pmm.method_category = 'point' AND pmm.is_active = 1
            ORDER BY pmm.display_order ASC, pmm.method_name ASC
        ");
        $stmt->execute([$storeId]);
        $pointSettings = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'store' => $store,
            'payment_settings' => $paymentSettings,
            'point_settings' => $pointSettings
        ]);
    } catch (Exception $e) {
        throw new Exception('店舗設定の取得に失敗しました: ' . $e->getMessage());
    }
}

/**
 * 店舗別設定を保存
 */
function handleSaveStoreSettings($pdo, $data) {
    try {
        $storeId = $data['store_id'] ?? 0;
        $paymentSettings = $data['payment_settings'] ?? [];
        $pointSettings = $data['point_settings'] ?? [];

        if (empty($storeId)) {
            throw new Exception('店舗IDが指定されていません');
        }

        $pdo->beginTransaction();

        try {
            // 既存の設定を削除（支払方法・ポイント両方）
            $stmt = $pdo->prepare("DELETE FROM store_payment_settings WHERE store_id = ?");
            $stmt->execute([$storeId]);

            // 統合保存用の準備文
            $stmt = $pdo->prepare("
                INSERT INTO store_payment_settings (store_id, payment_method_id, is_enabled, display_name, created_at, updated_at) 
                VALUES (?, ?, ?, ?, NOW(), NOW())
            ");

            // 支払方法設定を保存
            if (!empty($paymentSettings)) {
                foreach ($paymentSettings as $setting) {
                    $masterId = $setting['master_id'] ?? 0;
                    $isEnabled = $setting['is_enabled'] ?? 0;
                    $displayName = trim($setting['display_name'] ?? '') ?: null;
                    
                    if ($masterId > 0) {
                        $stmt->execute([$storeId, $masterId, $isEnabled, $displayName]);
                    }
                }
            }

            // ポイント設定も同じテーブルに保存
            if (!empty($pointSettings)) {
                foreach ($pointSettings as $setting) {
                    $masterId = $setting['master_id'] ?? 0;
                    $isEnabled = $setting['is_enabled'] ?? 0;
                    $displayName = trim($setting['display_name'] ?? '') ?: null;
                    
                    if ($masterId > 0) {
                        $stmt->execute([$storeId, $masterId, $isEnabled, $displayName]);
                    }
                }
            }

            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => '店舗設定を保存しました'
            ]);

        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }

    } catch (Exception $e) {
        throw new Exception('店舗設定の保存に失敗しました: ' . $e->getMessage());
    }
}

/**
 * 店舗の削除処理
 */
function handleDeleteStore($pdo, $data) {
    try {
        $storeId = $data['store_id'] ?? 0;
        
        if (empty($storeId)) {
            throw new Exception('店舗IDが指定されていません');
        }

        // 店舗の存在確認
        $stmt = $pdo->prepare("SELECT * FROM stores WHERE id = ? AND is_deleted = 0");
        $stmt->execute([$storeId]);
        $store = $stmt->fetch();
        
        if (!$store) {
            throw new Exception('指定された店舗が見つかりません');
        }

        // トランザクション開始
        $pdo->beginTransaction();

        try {
            // 店舗を論理削除
            $stmt = $pdo->prepare("
                UPDATE stores 
                SET is_deleted = 1, 
                    deleted_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ");
            $stmt->execute([$storeId]);

            // 統合テーブルの店舗設定を論理削除（支払方法・ポイント両方）
            $stmt = $pdo->prepare("
                UPDATE store_payment_settings 
                SET is_deleted = 1, 
                    deleted_at = CURRENT_TIMESTAMP 
                WHERE store_id = ?
            ");
            $stmt->execute([$storeId]);

            // コミット
            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => '店舗を削除しました'
            ]);

        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    } catch (Exception $e) {
        error_log('店舗削除エラー: ' . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => '店舗の削除に失敗しました: ' . $e->getMessage()
        ]);
    }
}

/**
 * 店舗統計を取得（登録店舗数と削除済み店舗数）
 */
function handleGetStoreStats($pdo) {
    try {
        // 登録店舗数（is_deleted = 0）
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM stores WHERE is_deleted = 0");
        $activeStores = $stmt->fetch()['count'];
        
        // 削除済み店舗数（is_deleted = 1）
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM stores WHERE is_deleted = 1");
        $deletedStores = $stmt->fetch()['count'];
        
        echo json_encode([
            'success' => true,
            'activeStores' => $activeStores,
            'deletedStores' => $deletedStores
        ]);
    } catch (Exception $e) {
        throw new Exception('店舗統計の取得に失敗しました: ' . $e->getMessage());
    }
}

/**
 * 削除済み店舗一覧を取得
 */
function handleGetDeletedStores($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT id, store_name, store_code, deleted_at, created_at, updated_at 
            FROM stores 
            WHERE is_deleted = 1 
            ORDER BY deleted_at DESC
        ");
        $stores = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'stores' => $stores
        ]);
    } catch (Exception $e) {
        error_log('削除済み店舗一覧取得エラー: ' . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => '削除済み店舗一覧の取得に失敗しました: ' . $e->getMessage()
        ]);
    }
}

/**
 * 店舗の復活処理
 */
function handleRestoreStore($pdo, $data) {
    try {
        $storeId = $data['store_id'] ?? 0;
        
        if (empty($storeId)) {
            throw new Exception('店舗IDが指定されていません');
        }

        // 削除済み店舗の存在確認
        $stmt = $pdo->prepare("SELECT * FROM stores WHERE id = ? AND is_deleted = 1");
        $stmt->execute([$storeId]);
        $store = $stmt->fetch();
        
        if (!$store) {
            throw new Exception('指定された削除済み店舗が見つかりません');
        }

        // トランザクション開始
        $pdo->beginTransaction();

        try {
            // 店舗を復活（論理削除フラグを解除）
            $stmt = $pdo->prepare("
                UPDATE stores 
                SET is_deleted = 0, 
                    deleted_at = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            $stmt->execute([$storeId]);

            // 関連する店舗設定も復活
            $stmt = $pdo->prepare("
                UPDATE store_payment_settings 
                SET is_deleted = 0, 
                    deleted_at = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE store_id = ? AND is_deleted = 1
            ");
            $stmt->execute([$storeId]);

            // コミット
            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => '店舗を復活させました',
                'store' => [
                    'id' => $store['id'],
                    'store_name' => $store['store_name'],
                    'store_code' => $store['store_code']
                ]
            ]);

        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    } catch (Exception $e) {
        error_log('店舗復活エラー: ' . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => '店舗の復活に失敗しました: ' . $e->getMessage()
        ]);
    }
}
?>