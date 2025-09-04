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

    // データベース接続（XAMPP設定）
    try {
        $dsn = "mysql:host=localhost;port=3306;dbname=sales_report;charset=utf8mb4";
        $pdo = new PDO($dsn, 'root', '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]);
    } catch (PDOException $e) {
        throw new Exception('データベース接続エラー。XAMPPのMySQLが起動しているか確認してください。エラー詳細: ' . $e->getMessage());
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
        
        // 削除済み除外条件
        $whereCondition = "method_category = ?";
        $params = [$type];
        
        if (!$includeDeleted) {
            $whereCondition .= " AND is_active = 1";
        }
        
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

        // payment_method_masters から削除（論理削除）
        $stmt = $pdo->prepare("
            UPDATE payment_method_masters 
            SET is_active = 0, updated_at = NOW() 
            WHERE id = ? AND method_category = ?
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
?>