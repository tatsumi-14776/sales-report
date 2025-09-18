<?php
/**
 * 売上データ取得 窓口API
 * 店舗ID毎に適切なパターンAPIに分岐して売上データを取得
 */

// CORS設定（フロントエンドからのリクエストを許可）
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONSリクエスト（プリフライト）への対応
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// POSTリクエストのみ受付
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed. POST required.',
        'code' => 'METHOD_NOT_ALLOWED'
    ]);
    exit;
}

/**
 * ログ出力関数
 */
function writeLog($message, $level = 'INFO') {
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[{$timestamp}] [{$level}] {$message}" . PHP_EOL;
    error_log($logMessage, 3, __DIR__ . '/sales-api.log');
}

/**
 * エラーレスポンス送信
 */
function sendErrorResponse($message, $code = 'GENERAL_ERROR', $httpCode = 400) {
    writeLog("ERROR: {$message}", 'ERROR');
    http_response_code($httpCode);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'code' => $code
    ]);
    exit;
}

/**
 * 成功レスポンス送信
 */
function sendSuccessResponse($data, $pattern, $provider, $storeId, $message) {
    writeLog("SUCCESS: 店舗ID {$storeId} ({$provider}) からデータ取得完了", 'INFO');
    echo json_encode([
        'success' => true,
        'data' => $data,
        'pattern' => $pattern,
        'provider' => $provider,
        'store_id' => $storeId,
        'message' => $message
    ]);
}

try {
    // リクエストボディ取得
    $input = file_get_contents('php://input');
    if (empty($input)) {
        sendErrorResponse('リクエストボディが空です', 'EMPTY_REQUEST_BODY');
    }

    // JSON解析
    $requestData = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendErrorResponse('無効なJSON形式です: ' . json_last_error_msg(), 'INVALID_JSON');
    }

    // 必須パラメータチェック
    if (!isset($requestData['store_id']) || !isset($requestData['date'])) {
        sendErrorResponse('必須パラメータが不足しています (store_id, date)', 'MISSING_PARAMETERS');
    }

    $storeId = (int)$requestData['store_id'];
    $date = trim($requestData['date']);

    // 店舗IDバリデーション
    if ($storeId <= 0) {
        sendErrorResponse('無効な店舗IDです: ' . $requestData['store_id'], 'INVALID_STORE_ID');
    }

    // 日付形式バリデーション (yyyy-MM-dd)
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        sendErrorResponse('無効な日付形式です。yyyy-MM-dd形式で入力してください: ' . $date, 'INVALID_DATE_FORMAT');
    }

    // 日付有効性チェック
    $dateTime = DateTime::createFromFormat('Y-m-d', $date);
    if (!$dateTime || $dateTime->format('Y-m-d') !== $date) {
        sendErrorResponse('存在しない日付です: ' . $date, 'INVALID_DATE');
    }

    writeLog("リクエスト受信: 店舗ID {$storeId}, 日付 {$date}", 'INFO');

    // 店舗ID毎の分岐処理（テスト用：実際のAPIは呼び出さず、パターン情報のみ返却）
    switch ($storeId) {
        // パターン1: スマレジ系
        case 1:
        case 3:
        case 5:
        case 8:
            writeLog("パターン1(スマレジ系)に分岐: 店舗ID {$storeId}", 'INFO');
            
            // テスト用のダミーデータ
            $testData = [
                'cash10' => 45000,
                'cash8' => 15000,
                'card10' => 25000,
                'card8' => 8000,
                'paypay10' => 12000,
                'paypay8' => 3000
            ];
            
            sendSuccessResponse(
                $testData, 
                'pattern1', 
                'smaregi', 
                $storeId, 
                "店舗は{$storeId}です pattern1のAPIを利用します。日付は{$date}です"
            );
            break;

        // パターン2: Airレジ系
        case 2:
        case 6:
            writeLog("パターン2(Airレジ系)に分岐: 店舗ID {$storeId}", 'INFO');
            
            // テスト用のダミーデータ
            $testData = [
                'cash10' => 32000,
                'cash8' => 12000,
                'card10' => 18000,
                'card8' => 5000,
                'paypay10' => 8000,
                'paypay8' => 2000
            ];
            
            sendSuccessResponse(
                $testData, 
                'pattern2', 
                'airregi', 
                $storeId, 
                "店舗は{$storeId}です pattern2のAPIを利用します。日付は{$date}です"
            );
            break;

        // パターン3: Excel取込
        case 4:
        case 7:
            writeLog("パターン3(Excel取込)に分岐: 店舗ID {$storeId}", 'INFO');
            
            // テスト用のダミーデータ
            $testData = [
                'cash10' => 28000,
                'cash8' => 9000,
                'card10' => 15000,
                'card8' => 4000,
                'paypay10' => 6000,
                'paypay8' => 1500
            ];
            
            sendSuccessResponse(
                $testData, 
                'pattern3', 
                'excel', 
                $storeId, 
                "店舗は{$storeId}です pattern3のAPIを利用します。日付は{$date}です"
            );
            break;

        // 未対応店舗
        default:
            sendErrorResponse("未対応の店舗IDです: {$storeId}", 'UNSUPPORTED_STORE_ID', 404);
            break;
    }

} catch (Exception $e) {
    writeLog("予期しないエラー: " . $e->getMessage(), 'ERROR');
    sendErrorResponse('サーバー内部エラーが発生しました', 'INTERNAL_ERROR', 500);
}

?>