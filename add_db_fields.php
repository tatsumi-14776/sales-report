<?php
// データベースに支払方法設定保存用フィールドを追加するスクリプト

$host = 'localhost';
$dbname = 'sales_report';
$username = 'yanagisawa';
$password = 'zxcvb@12345';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "データベース接続成功\n";
    
    // まず、フィールドが存在するかチェック
    $checkSql = "SHOW COLUMNS FROM daily_reports LIKE 'payment_method_config'";
    $stmt = $pdo->query($checkSql);
    
    if ($stmt->rowCount() == 0) {
        // payment_method_configフィールドが存在しない場合、追加
        echo "payment_method_configフィールドを追加中...\n";
        $sql1 = "ALTER TABLE daily_reports 
                ADD COLUMN payment_method_config LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL 
                COMMENT '保存時の支払方法設定（JSON）' 
                CHECK (json_valid(payment_method_config)) 
                AFTER cash_data";
        $pdo->exec($sql1);
        echo "payment_method_configフィールド追加完了\n";
    } else {
        echo "payment_method_configフィールドは既に存在します\n";
    }
    
    // point_payment_configフィールドのチェック
    $checkSql2 = "SHOW COLUMNS FROM daily_reports LIKE 'point_payment_config'";
    $stmt2 = $pdo->query($checkSql2);
    
    if ($stmt2->rowCount() == 0) {
        // point_payment_configフィールドが存在しない場合、追加
        echo "point_payment_configフィールドを追加中...\n";
        $sql2 = "ALTER TABLE daily_reports 
                ADD COLUMN point_payment_config LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL 
                COMMENT '保存時のポイント支払設定（JSON）' 
                CHECK (json_valid(point_payment_config)) 
                AFTER payment_method_config";
        $pdo->exec($sql2);
        echo "point_payment_configフィールド追加完了\n";
    } else {
        echo "point_payment_configフィールドは既に存在します\n";
    }
    
    // テーブル構造を確認
    echo "\n現在のテーブル構造:\n";
    $descSql = "DESCRIBE daily_reports";
    $stmt = $pdo->query($descSql);
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo $row['Field'] . " - " . $row['Type'] . "\n";
    }
    
    echo "\nデータベースフィールド追加が完了しました！\n";
    
} catch (PDOException $e) {
    echo "エラー: " . $e->getMessage() . "\n";
}
?>
