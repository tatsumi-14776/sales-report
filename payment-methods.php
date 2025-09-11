
<?php
/**
 * 支払方法管理API - payment-methods.php
 * 支払方法マスターのCRUD操作を提供（ポイント・クーポン対応版）
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

// ファイルの先頭部分にデバッグログを追加
error_log("=== Payment Methods API Called ===");
error_log("REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD']);
error_log("Raw input: " . file_get_contents('php://input'));

try {
    // リクエストデータ取得
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        throw new Exception('無効なJSONリクエストです');
    }

    $action = $data['action'] ?? '';

    if (empty($action)) {
        throw new Exception('アクションが指定されていません');
    }

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
        $dsn = "mysql:host=localhost;port=3306;dbname=sales_report;charset=utf8mb4";
        $pdo = new PDO($dsn, 'root', '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]);
    }

    // POSTデータの取得とデバッグログ
    $rawInput = file_get_contents('php://input');
    error_log("Raw POST data: " . $rawInput);

    $data = json_decode($rawInput, true);
    $action = $data['action'] ?? '';

    error_log("Parsed action: " . $action);
    error_log("Parsed data: " . json_encode($data));

    // アクションに応じた処理
    try {
        error_log("Processing action: " . $action);
        
        switch ($action) {
            case 'get_methods':
                error_log("Handling get_methods");
                handleGetMethods($pdo, $data);
                break;

            case 'add_method':
                handleAddMethod($pdo, $data);
                break;

            case 'update_method':
                handleUpdateMethod($pdo, $data);
                break;

            case 'delete_method':
                handleDeleteMethod($pdo, $data);
                break;

            case 'toggle_status':
                handleToggleStatus($pdo, $data);
                break;

            case 'get_payment_stats':
                error_log("=== get_payment_stats action called ===");
                handleGetPaymentStats($pdo);
                break;

            case 'test_connection':
                testConnection($pdo);
                break;

            default:
                echo json_encode([
                    'success' => false,
                    'message' => '不正なアクション: ' . $action
                ]);
                break;
        }
    } catch (Exception $e) {
        error_log("API Error: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

/**
 * 新規追加処理（統合版）
 */
function handleAddMethod($pdo, $data) {
    try {
        $type = $data['type'] ?? 'payment';
        $methodName = $data['method_name'] ?? '';
        $methodId = $data['method_id'] ?? '';
        $displayOrder = $data['display_order'] ?? 100;
        $isActive = $data['is_active'] ?? 1;
        
        // typeに応じた処理分岐
        if ($type === 'point') {
            // ポイント・クーポンの場合
            $methodType = $data['point_type'] ?? 'point'; // point_type を method_type にマッピング
            $colorCode = 'blue'; // ポイントはデフォルト色
        } else {
            // 支払方法の場合
            $methodType = $data['method_type'] ?? 'cashless';
            $colorCode = $data['color_code'] ?? 'blue';
        }
        
        if (empty($methodName) || empty($methodId)) {
            throw new Exception('名前とIDは必須です');
        }

        // 重複チェック（統合テーブルで）
        $stmt = $pdo->prepare("
            SELECT COUNT(*) FROM payment_method_masters 
            WHERE method_id = ? OR (method_name = ? AND method_category = ?)
        ");
        $stmt->execute([$methodId, $methodName, $type]);
        
        if ($stmt->fetchColumn() > 0) {
            throw new Exception('同じIDまたは名称が既に存在します');
        }

        // payment_method_masters に統合して追加
        $stmt = $pdo->prepare("
            INSERT INTO payment_method_masters 
            (method_id, method_name, method_category, method_type, color_code, display_order, is_system_default, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?, NOW(), NOW())
        ");
        
        $stmt->execute([
            $methodId, 
            $methodName, 
            $type, // 'payment' または 'point'
            $methodType, 
            $colorCode, 
            $displayOrder, 
            $isActive
        ]);

        echo json_encode([
            'success' => true,
            'message' => ($type === 'point' ? 'ポイント・クーポン' : '支払方法') . 'を追加しました',
            'id' => $pdo->lastInsertId()
        ]);

    } catch (Exception $e) {
        error_log('追加エラー: ' . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

/**
 * 更新処理（統合版）
 */
function handleUpdateMethod($pdo, $data) {
    try {
        $id = $data['id'] ?? 0;
        $type = $data['type'] ?? 'payment';
        $methodName = $data['method_name'] ?? '';
        $methodId = $data['method_id'] ?? '';
        $displayOrder = $data['display_order'] ?? 100;
        $isActive = $data['is_active'] ?? 1;
        
        // typeに応じた処理分岐
        if ($type === 'point') {
            // ポイント・クーポンの場合
            $methodType = $data['point_type'] ?? 'point';
            $colorCode = 'blue'; // ポイントはデフォルト色を維持
        } else {
            // 支払方法の場合
            $methodType = $data['method_type'] ?? 'cashless';
            $colorCode = $data['color_code'] ?? 'blue';
        }
        
        if (empty($id) || empty($methodName) || empty($methodId)) {
            throw new Exception('必須項目が不足しています');
        }

        // 現在のデータを確認
        $stmt = $pdo->prepare("
            SELECT * FROM payment_method_masters 
            WHERE id = ? AND method_category = ?
        ");
        $stmt->execute([$id, $type]);
        $currentData = $stmt->fetch();
        
        if (!$currentData) {
            throw new Exception('更新対象が見つかりません');
        }

        // 重複チェック（自分以外で）
        $stmt = $pdo->prepare("
            SELECT COUNT(*) FROM payment_method_masters 
            WHERE (method_id = ? OR (method_name = ? AND method_category = ?)) 
            AND id != ?
        ");
        $stmt->execute([$methodId, $methodName, $type, $id]);
        
        if ($stmt->fetchColumn() > 0) {
            throw new Exception('同じIDまたは名称が既に存在します');
        }

        // payment_method_masters を更新
        $stmt = $pdo->prepare("
            UPDATE payment_method_masters 
            SET method_id = ?, method_name = ?, method_type = ?, color_code = ?, 
                display_order = ?, is_active = ?, updated_at = NOW()
            WHERE id = ? AND method_category = ?
        ");
        
        $stmt->execute([
            $methodId, 
            $methodName, 
            $methodType, 
            $colorCode, 
            $displayOrder, 
            $isActive, 
            $id, 
            $type
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception('更新に失敗しました');
        }

        echo json_encode([
            'success' => true,
            'message' => ($type === 'point' ? 'ポイント・クーポン' : '支払方法') . 'を更新しました'
        ]);

    } catch (Exception $e) {
        error_log('更新エラー: ' . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

/**
 * 支払方法・ポイント一覧取得（削除済み表示制御対応）
 */
function handleGetMethods($pdo, $data) {
    try {
        $type = $data['type'] ?? 'payment';
        $includeDeleted = $data['include_deleted'] ?? false;
        
        // ✅ 修正: deleted_atがNULLの項目のみ表示（is_activeは関係なし）
        $whereCondition = "method_category = ? AND deleted_at IS NULL";
        $params = [$type];
        
        // 統合テーブルから取得
        $sql = "SELECT id, method_id, method_name, method_category, method_type, 
                       color_code, display_order, is_system_default, is_active, 
                       created_at, updated_at,
                       method_type as point_type  -- ポイント用の別名も追加
                FROM payment_method_masters 
                WHERE {$whereCondition}
                ORDER BY is_active DESC, display_order ASC, method_name ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $methods = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'methods' => $methods,
            'count' => count($methods),
            'type' => $type
        ]);

    } catch (Exception $e) {
        error_log('データ取得エラー: ' . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'データの取得に失敗しました: ' . $e->getMessage(),
            'methods' => [],
            'count' => 0
        ]);
    }
}

/**
 * ステータス切り替え処理（統合版）
 */
function handleToggleStatus($pdo, $data) {
    try {
        $methodId = $data['method_id'] ?? 0;
        $isActive = $data['is_active'] ?? 0;
        $type = $data['type'] ?? 'payment';
        
        if (empty($methodId)) {
            throw new Exception('メソッドIDが指定されていません');
        }

        // payment_method_masters でステータス更新
        $stmt = $pdo->prepare("
            UPDATE payment_method_masters 
            SET is_active = ?, updated_at = NOW() 
            WHERE id = ? AND method_category = ?
        ");
        $stmt->execute([$isActive, $methodId, $type]);

        if ($stmt->rowCount() === 0) {
            throw new Exception('更新対象が見つかりません');
        }

        echo json_encode([
            'success' => true,
            'message' => 'ステータスを更新しました'
        ]);

    } catch (Exception $e) {
        error_log('ステータス更新エラー: ' . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

/**
 * 削除処理（統合版）
 */
function handleDeleteMethod($pdo, $data) {
    try {
        $methodId = $data['method_id'] ?? 0;
        $type = $data['type'] ?? 'payment';
        
        if (empty($methodId)) {
            throw new Exception('メソッドIDが指定されていません');
        }

        // ✅ 追加: 店舗設定での使用状況をチェック
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as usage_count,
                   GROUP_CONCAT(DISTINCT s.store_name SEPARATOR ', ') as store_names
            FROM store_payment_settings sps
            JOIN stores s ON sps.store_id = s.id
            WHERE sps.payment_method_id = ? AND sps.is_enabled = 1 AND sps.is_deleted = 0
        ");
        $stmt->execute([$methodId]);
        $usage = $stmt->fetch();
        
        if ($usage['usage_count'] > 0) {
            throw new Exception("この支払方法は以下の店舗で使用されています：{$usage['store_names']}\n\n削除する前に、各店舗の設定画面で使用を停止してください。");
        }

        // ✅ 修正: 論理削除（deleted_atを設定＋is_activeを0に）
        $stmt = $pdo->prepare("
            UPDATE payment_method_masters 
            SET deleted_at = NOW(), is_active = 0, updated_at = NOW() 
            WHERE id = ? AND method_category = ? AND deleted_at IS NULL
        ");
        $stmt->execute([$methodId, $type]);

        if ($stmt->rowCount() === 0) {
            throw new Exception('削除対象が見つかりません');
        }

        echo json_encode([
            'success' => true,
            'message' => ($type === 'point' ? 'ポイント・クーポン' : '支払方法') . 'を削除しました'
        ]);

    } catch (Exception $e) {
        error_log('削除エラー: ' . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

/**
 * 削除済み項目の復元
 */
function handleRestoreMethod($pdo, $data) {
    try {
        $methodId = $data['method_id'] ?? 0;
        $type = $data['type'] ?? 'payment';
        
        if (empty($methodId)) {
            throw new Exception('メソッドIDが指定されていません');
        }

        // 復元実行
        $stmt = $pdo->prepare("
            UPDATE payment_method_masters 
            SET is_active = 1, deleted_at = NULL 
            WHERE id = ? AND method_category = ?
        ");
        $stmt->execute([$methodId, $type]);

        if ($stmt->rowCount() === 0) {
            throw new Exception('復元対象が見つかりません');
        }

        echo json_encode([
            'success' => true,
            'message' => ($type === 'point' ? 'ポイント・クーポン' : '支払方法') . 'を復元しました'
        ]);

    } catch (Exception $e) {
        error_log('復元エラー: ' . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

/**
 * バリデーション：安全な文字列チェック
 */
function validateSafeString($string) {
    // SQLインジェクション対策の基本チェック
    $dangerous_patterns = [
        '/(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i',
        '/[;<>"\']/',
        '/\-\-/',
        '/\/\*|\*\//'
    ];
    
    foreach ($dangerous_patterns as $pattern) {
        if (preg_match($pattern, $string)) {
            return false;
        }
    }
    
    return true;
}

/**
 * ログ記録（オプション）
 */
function logPaymentMethodAction($pdo, $action, $method_id, $details = '') {
    try {
        // user_activity_logsテーブルがあれば記録
        $sql = "INSERT INTO user_activity_logs (action, user_id, details, created_at) VALUES (?, ?, ?, NOW())";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$action, 'system', json_encode([
            'action' => $action,
            'method_id' => $method_id,
            'details' => $details
        ])]);
    } catch (Exception $e) {
        // ログ記録エラーは無視（メイン処理に影響させない）
        error_log("ログ記録エラー: " . $e->getMessage());
    }
}

/**
 * 支払方法統計を取得
 */
function handleGetPaymentStats($pdo) {
    try {
        error_log("=== handleGetPaymentStats: 開始 ===");
        
        // 登録されている支払方法数（削除されていないもの）
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM payment_method_masters WHERE deleted_at IS NULL");
        $totalMethods = $stmt->fetch()['count'];
        error_log("総支払方法数: " . $totalMethods);
        
        // デバッグ用：全ての支払方法名を取得
        $stmt = $pdo->query("SELECT method_name, method_category FROM payment_method_masters WHERE deleted_at IS NULL");
        $allMethods = $stmt->fetchAll();
        error_log("登録されている支払方法: " . json_encode($allMethods));
        
        // ポイント・クーポン系の支払方法数（method_categoryがpointのもの）
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM payment_method_masters WHERE deleted_at IS NULL AND method_category = 'point'");
        $pointCouponCount = $stmt->fetch()['count'];
        error_log("ポイント・クーポン数: " . $pointCouponCount);
        
        // デバッグ用：ポイント系の支払方法を取得
        $stmt = $pdo->query("SELECT method_name, method_category FROM payment_method_masters WHERE deleted_at IS NULL AND method_category = 'point'");
        $pointMethods = $stmt->fetchAll();
        error_log("ポイント・クーポン系の支払方法: " . json_encode($pointMethods));
        
        $result = [
            'success' => true,
            'totalMethods' => $totalMethods,
            'pointCouponCount' => $pointCouponCount
        ];
        
        error_log("レスポンス: " . json_encode($result));
        echo json_encode($result);
        
    } catch (Exception $e) {
        error_log("handleGetPaymentStats エラー: " . $e->getMessage());
        throw new Exception('支払方法統計の取得に失敗しました: ' . $e->getMessage());
    }
}

/**
 * 接続テスト
 */
function testConnection($pdo) {
    try {
        $stmt = $pdo->query("SELECT 1");
        echo json_encode([
            'success' => true,
            'message' => 'データベース接続成功'
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'データベース接続エラー: ' . $e->getMessage()
        ]);
    }
}
?>