<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "=== データベース確認テスト ===\n";

try {
    $dsn = "mysql:host=localhost;charset=utf8mb4";
    $pdo = new PDO($dsn, 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "MySQL接続成功\n";
    
    // データベース一覧確認
    $stmt = $pdo->query("SHOW DATABASES");
    $databases = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "データベース一覧:\n";
    foreach ($databases as $db) {
        echo "  - $db\n";
    }
    
    // sales_report関連のデータベースを確認
    $salesDbs = array_filter($databases, function($db) {
        return strpos($db, 'sales') !== false;
    });
    
    if (!empty($salesDbs)) {
        echo "\nsales関連データベース:\n";
        foreach ($salesDbs as $db) {
            echo "  - $db\n";
        }
    } else {
        echo "\nsales関連データベースが見つかりません\n";
    }
    
} catch (Exception $e) {
    echo "エラー: " . $e->getMessage() . "\n";
}

echo "=== テスト終了 ===\n";
?>
