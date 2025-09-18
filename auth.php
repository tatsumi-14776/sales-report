<?php
/**
 * 認証API - auth.php
 * 修正版（店舗ID対応）
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

    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    $action = $data['action'] ?? '';

    // 入力値検証
    if (empty($username)) {
        throw new Exception('ユーザーIDを入力してください');
    }

    if (empty($password)) {
        throw new Exception('パスワードを入力してください');
    }

    if ($action !== 'login') {
        throw new Exception('無効なアクション');
    }

    // データベース接続（統一設定を使用）
    // 統一データベース設定を使用
    try {
        require_once __DIR__ . '/config/database.php';
        $pdo = DatabaseConfig::getConnection();
    } catch (Exception $e) {
        error_log("データベース接続エラー: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'データベース接続に失敗しました']);
        exit;
    }

    // ユーザー検索（store_idも取得）
    $sql = "SELECT u.id, u.store_id, u.pass, u.role, u.store_name, u.is_active, s.store_code
            FROM users u 
            LEFT JOIN stores s ON u.store_id = s.id 
            WHERE u.id = :username AND u.is_active = 1 
            LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':username', $username);
    $stmt->execute();
    $user = $stmt->fetch();

    if (!$user) {
        // デバッグ情報（開発用）
        error_log("ログイン失敗: ユーザーID '$username' が見つからない");
        
        echo json_encode([
            'success' => false,
            'message' => 'ユーザーIDまたはパスワードが正しくありません'
        ]);
        exit;
    }

    // パスワード検証（平文とハッシュ両対応）
    $isValid = false;
    if ($password === $user['pass']) { 
        // 平文パスワード（テスト用）
        $isValid = true;
        error_log("ログイン成功: ユーザー '$username' (平文パスワード)");
    } elseif (password_verify($password, $user['pass'])) { 
        // ハッシュ化パスワード
        $isValid = true;
        error_log("ログイン成功: ユーザー '$username' (ハッシュパスワード)");
    } else {
        error_log("ログイン失敗: ユーザー '$username' のパスワードが不正");
    }

    if (!$isValid) {
        echo json_encode([
            'success' => false,
            'message' => 'ユーザーIDまたはパスワードが正しくありません'
        ]);
        exit;
    }

    // 最終ログイン時刻更新
    try {
        $updateSql = "UPDATE users SET updated_at = NOW() WHERE id = :username";
        $updateStmt = $pdo->prepare($updateSql);
        $updateStmt->bindParam(':username', $username);
        $updateStmt->execute();
    } catch (Exception $e) {
        // 更新エラーは無視
        error_log("最終ログイン時刻の更新エラー: " . $e->getMessage());
    }

    // role正規化
    $role = strtolower(trim($user['role']));
    $normalizedRole = ($role === 'admin') ? 'admin' : (($role === 'manager') ? 'manager' : 'user');

    // 成功レスポンス（store_id追加・修正）
    echo json_encode([
        'success' => true,
        'message' => 'ログイン成功',
        'user' => [
            'user_id' => $user['id'],
            'username' => $user['id'],
            'displayName' => $user['id'],
            'role' => $normalizedRole,
            'store_id' => intval($user['store_id'] ?? 0),  // 修正：intvalで数値に変換
            'storeName' => $user['store_name'] ?? '',
            'storeCode' => $user['store_code'] ?? ''
        ]
    ]);

    error_log("ログイン完了: ユーザー '$username' (役職: $normalizedRole, 店舗ID: " . ($user['store_id'] ?? 'なし') . ")");

} catch (Exception $e) {
    error_log("認証エラー: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>