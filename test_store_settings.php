<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "=== store-settings.php テスト ===\n";

// POSTデータをシミュレート
$_SERVER['REQUEST_METHOD'] = 'POST';
$testData = json_encode(['action' => 'get_stores']);

// ファイル内容をキャプチャ
ob_start();

// リクエストデータを設定
file_put_contents('php://temp', $testData);

try {
    include 'store-settings.php';
} catch (Exception $e) {
    echo "エラー: " . $e->getMessage() . "\n";
}

$output = ob_get_clean();
echo "出力: " . $output . "\n";
echo "=== テスト終了 ===\n";
?>
