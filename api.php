<?php
session_start();
header('Content-Type: application/json');

$action = $_GET['action'] ?? 'test';

if ($action === 'getUserSession') {
    $_SESSION['store_id'] = 8;
    $_SESSION['store_name'] = '四代目菊川三ノ宮店';
    $_SESSION['user_id'] = 'okawa';
    
    echo json_encode([
        'success' => true,
        'data' => [
            'store_id' => $_SESSION['store_id'],
            'store_name' => $_SESSION['store_name'],
            'user_id' => $_SESSION['user_id']
        ]
    ], JSON_UNESCAPED_UNICODE);
} elseif ($action === 'getStoreSettings') {
    try {
        $pdo = new PDO(
            'mysql:host=localhost;dbname=sales_report;charset=utf8mb4',
            'yanagisawa',
            'zxcvb@12345',
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        
        $storeId = $_GET['storeId'] ?? $_SESSION['store_id'] ?? 8;
        
        // 店舗情報を取得
        $storeQuery = "SELECT store_name, store_code FROM stores WHERE id = ?";
        $stmt = $pdo->prepare($storeQuery);
        $stmt->execute([$storeId]);
        $storeInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // 支払方法の取得
        $paymentQuery = "
            SELECT 
                pmm.method_id,
                pmm.method_name as name,
                pmm.method_type,
                pmm.color_code,
                pmm.display_order
            FROM payment_method_masters pmm
            LEFT JOIN store_payment_settings sps ON pmm.id = sps.payment_method_id 
                AND sps.store_id = ? 
                AND sps.is_deleted = 0
            WHERE pmm.is_active = 1 
                AND pmm.method_category = 'payment'
                AND (sps.is_enabled = 1 OR sps.is_enabled IS NULL)
            ORDER BY pmm.display_order ASC
        ";
        
        $stmt = $pdo->prepare($paymentQuery);
        $stmt->execute([$storeId]);
        $paymentMethods = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // ポイント支払の取得
        $pointQuery = "
            SELECT 
                pmm.method_id,
                pmm.method_name as name,
                pmm.method_type,
                pmm.color_code,
                pmm.display_order
            FROM payment_method_masters pmm
            LEFT JOIN store_payment_settings sps ON pmm.id = sps.payment_method_id 
                AND sps.store_id = ? 
                AND sps.is_deleted = 0
            WHERE pmm.is_active = 1 
                AND pmm.method_category = 'point'
                AND (sps.is_enabled = 1 OR sps.is_enabled IS NULL)
            ORDER BY pmm.display_order ASC
        ";
        
        $stmt = $pdo->prepare($pointQuery);
        $stmt->execute([$storeId]);
        $pointPayments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'store_id' => $storeId,
                'store_name' => $storeInfo['store_name'] ?? '店舗名未設定',
                'store_code' => $storeInfo['store_code'] ?? '',
                'payment_methods' => $paymentMethods,
                'point_payments' => $pointPayments
            ]
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
} else {
    echo json_encode(['success' => true, 'action' => $action]);
}
?>
