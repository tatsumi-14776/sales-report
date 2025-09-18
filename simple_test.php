<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "=== データベース接続テスト開始 ===\n";

try {
    echo "1. config/database.php読み込み中...\n";
    require_once __DIR__ . '/config/database.php';
    echo "2. ファイル読み込み成功\n";
    
    echo "3. データベース接続実行中...\n";
    $pdo = DatabaseConfig::getConnection();
    echo "4. 接続成功\n";
    
    $stmt = $pdo->query("SELECT DATABASE() as db_name");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "データベース: " . $result['db_name'] . "\n";
    
} catch (Exception $e) {
    echo "エラー発生: " . $e->getMessage() . "\n";
}

echo "=== テスト終了 ===\n";
?>
