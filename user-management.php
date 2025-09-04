<?php
/**
 * ユーザー管理API - user-management.php (店舗選択対応版)
 * 既存のauth.phpと同じ構成でユーザーCRUD操作を提供
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
        throw new Exception('データベース接続エラー。XAMPPのMySQLが起動しているか確認してください。');
    }

    // アクションに応じた処理
    switch ($action) {
        case 'get_stores':
            handleGetStores($pdo);
            break;
        case 'get_users':
            handleGetUsers($pdo);
            break;
        case 'add_user':
            handleAddUser($pdo, $data);
            break;
        case 'update_user':
            handleUpdateUser($pdo, $data);
            break;
        case 'delete_user':
            handleDeleteUser($pdo, $data);
            break;
        default:
            throw new Exception('無効なアクションです');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

/**
 * 店舗一覧取得
 */
function handleGetStores($pdo) {
    try {
        $sql = "SELECT id, store_name, store_code FROM stores WHERE is_deleted = 0 ORDER BY store_name ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $stores = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'stores' => $stores,
            'count' => count($stores)
        ]);

    } catch (Exception $e) {
        throw new Exception('店舗一覧の取得に失敗しました: ' . $e->getMessage());
    }
}

/**
 * ユーザー一覧取得（店舗名付き）
 */
function handleGetUsers($pdo) {
    try {
        $sql = "SELECT u.id, u.store_id, s.store_name, u.role, u.updated_at, u.is_active 
                FROM users u 
                LEFT JOIN stores s ON u.store_id = s.id 
                ORDER BY u.updated_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $users = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'users' => $users,
            'count' => count($users)
        ]);

    } catch (Exception $e) {
        throw new Exception('ユーザー一覧の取得に失敗しました: ' . $e->getMessage());
    }
}

/**
 * ユーザー追加（店舗ID対応）
 */
function handleAddUser($pdo, $data) {
    try {
        // バリデーション
        $user_id = trim($data['user_id'] ?? '');
        $store_id = intval($data['store_id'] ?? 0);
        $password = $data['password'] ?? '';
        $role = $data['role'] ?? 'user';
        $is_active = intval($data['is_active'] ?? 1);

        if (empty($user_id)) {
            throw new Exception('ユーザーIDは必須です');
        }

        if (strlen($user_id) < 3) {
            throw new Exception('ユーザーIDは3文字以上で入力してください');
        }

        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $user_id)) {
            throw new Exception('ユーザーIDは英数字、ハイフン、アンダースコアのみ使用できます');
        }

        if ($store_id <= 0) {
            throw new Exception('店舗を選択してください');
        }

        if (empty($password)) {
            throw new Exception('パスワードは必須です');
        }

        if (strlen($password) < 6) {
            throw new Exception('パスワードは6文字以上で入力してください');
        }

        if (!in_array($role, ['admin', 'manager', 'user'])) {
            throw new Exception('無効な権限が指定されています');
        }

        // 店舗の存在確認
        $sql = "SELECT id, store_name FROM stores WHERE id = ? AND is_deleted = 0 LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$store_id]);
        $store = $stmt->fetch();
        
        if (!$store) {
            throw new Exception('指定された店舗が見つかりません');
        }

        // 重複チェック
        $sql = "SELECT id FROM users WHERE id = ? LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id]);
        
        if ($stmt->fetch()) {
            throw new Exception('このユーザーIDは既に使用されています');
        }

        // パスワードハッシュ化（既存システムとの互換性を保つため平文も対応）
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // ユーザー挿入
        $sql = "INSERT INTO users (id, store_id, store_name, pass, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id, $store_id, $store['store_name'], $hashedPassword, $role, $is_active]);

        echo json_encode([
            'success' => true,
            'message' => 'ユーザーが正常に追加されました',
            'user_id' => $user_id
        ]);

    } catch (Exception $e) {
        throw new Exception('ユーザー追加に失敗しました: ' . $e->getMessage());
    }
}

/**
 * ユーザー更新（店舗ID対応）
 */
function handleUpdateUser($pdo, $data) {
    try {
        // バリデーション
        $original_user_id = trim($data['original_user_id'] ?? '');
        $user_id = trim($data['user_id'] ?? '');
        $store_id = intval($data['store_id'] ?? 0);
        $password = $data['password'] ?? '';
        $role = $data['role'] ?? 'user';
        $is_active = intval($data['is_active'] ?? 1);

        if (empty($original_user_id)) {
            throw new Exception('更新対象のユーザーIDが指定されていません');
        }

        if (empty($user_id)) {
            throw new Exception('ユーザーIDは必須です');
        }

        if (strlen($user_id) < 3) {
            throw new Exception('ユーザーIDは3文字以上で入力してください');
        }

        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $user_id)) {
            throw new Exception('ユーザーIDは英数字、ハイフン、アンダースコアのみ使用できます');
        }

        if ($store_id <= 0) {
            throw new Exception('店舗を選択してください');
        }

        if (!empty($password) && strlen($password) < 6) {
            throw new Exception('パスワードは6文字以上で入力してください');
        }

        if (!in_array($role, ['admin', 'manager', 'user'])) {
            throw new Exception('無効な権限が指定されています');
        }

        // 既存ユーザー確認
        $sql = "SELECT id, role FROM users WHERE id = ? LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$original_user_id]);
        $existing_user = $stmt->fetch();

        if (!$existing_user) {
            throw new Exception('更新対象のユーザーが見つかりません');
        }

        // 店舗の存在確認
        $sql = "SELECT id, store_name FROM stores WHERE id = ? AND is_deleted = 0 LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$store_id]);
        $store = $stmt->fetch();
        
        if (!$store) {
            throw new Exception('指定された店舗が見つかりません');
        }

        // 管理者権限変更の制限チェック
        if ($existing_user['role'] === 'admin' && $role !== 'admin') {
            // 管理者数をチェック
            $sql = "SELECT COUNT(*) as admin_count FROM users WHERE role = 'admin'";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $admin_count = $stmt->fetch()['admin_count'];

            if ($admin_count <= 1) {
                throw new Exception('最後の管理者ユーザーの権限は変更できません');
            }
        }

        // ユーザーID変更時の重複チェック
        if ($original_user_id !== $user_id) {
            $sql = "SELECT id FROM users WHERE id = ? AND id != ? LIMIT 1";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$user_id, $original_user_id]);
            
            if ($stmt->fetch()) {
                throw new Exception('このユーザーIDは既に使用されています');
            }
        }

        // 更新クエリの構築
        $sql = "UPDATE users SET id = ?, store_id = ?, store_name = ?, role = ?, is_active = ?, updated_at = NOW()";
        $params = [$user_id, $store_id, $store['store_name'], $role, $is_active];

        // パスワードが提供されている場合のみ更新
        if (!empty($password)) {
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $sql .= ", pass = ?";
            $params[] = $hashedPassword;
        }

        $sql .= " WHERE id = ?";
        $params[] = $original_user_id;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            throw new Exception('ユーザー情報の更新に失敗しました');
        }

        echo json_encode([
            'success' => true,
            'message' => 'ユーザー情報が正常に更新されました',
            'user_id' => $user_id
        ]);

    } catch (Exception $e) {
        throw new Exception('ユーザー更新に失敗しました: ' . $e->getMessage());
    }
}

/**
 * ユーザー削除
 */
function handleDeleteUser($pdo, $data) {
    try {
        $user_id = trim($data['user_id'] ?? '');

        if (empty($user_id)) {
            throw new Exception('削除対象のユーザーIDが指定されていません');
        }

        // 既存ユーザー確認
        $sql = "SELECT id, role FROM users WHERE id = ? LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id]);
        $existing_user = $stmt->fetch();

        if (!$existing_user) {
            throw new Exception('削除対象のユーザーが見つかりません');
        }

        // 管理者の削除制限チェック
        if ($existing_user['role'] === 'admin') {
            $sql = "SELECT COUNT(*) as admin_count FROM users WHERE role = 'admin'";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $admin_count = $stmt->fetch()['admin_count'];

            if ($admin_count <= 1) {
                throw new Exception('最後の管理者ユーザーは削除できません');
            }
        }

        // ユーザー削除
        $sql = "DELETE FROM users WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id]);

        if ($stmt->rowCount() === 0) {
            throw new Exception('ユーザーの削除に失敗しました');
        }

        echo json_encode([
            'success' => true,
            'message' => 'ユーザーが正常に削除されました',
            'user_id' => $user_id
        ]);

    } catch (Exception $e) {
        throw new Exception('ユーザー削除に失敗しました: ' . $e->getMessage());
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
 * ロギング機能（オプション）
 */
function logUserAction($pdo, $action, $user_id, $details = '') {
    try {
        $sql = "INSERT INTO user_activity_logs (action, user_id, details, created_at) VALUES (?, ?, ?, NOW())";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$action, $user_id, $details]);
    } catch (Exception $e) {
        // ログ記録エラーは無視（メイン処理に影響させない）
        error_log("ログ記録エラー: " . $e->getMessage());
    }
}
?>