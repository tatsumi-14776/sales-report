<?php
/**
 * スマレジAPI連携モジュール（2段階マッピング完全版）
 * 設定の追加・変更は上部の設定セクションで行ってください
 */

// ==========================================
// 📋 設定セクション（営業店舗追加時はここを編集）
// ==========================================

/**
 * 🔄 2段階マッピング処理順序:
 * 
 * 1. 店舗IDマッピング: システム店舗ID → スマレジ店舗ID
 * 2. スマレジAPI呼び出し: 日付とスマレジ店舗IDでデータ取得
 * 3. 第1段階: スマレジフィールド → 内部変数（固定マッピング）
 *    例: cashSales → cash, creditSales → credit, otherSales[id=1] → id1
 * 4. 第2段階: 内部変数 → 店舗レスポンスキー（店舗別カスタム）
 *    例: cash → cash10, credit → card10, id1 → paypay10
 * 
 * メリット:
 * - スマレジフィールド名を覚える必要なし
 * - 内部変数は人がわかりやすい名前
 * - 店舗設定はシンプルな内部変数ベース
 * - 新しいスマレジフィールド追加時は第1段階のみ変更
 */

/**
 * スマレジAPI基本設定
 */
const SMAREGI_CONFIG = [
    'endpoint' => 'https://webapi.smaregi.jp/access/',
    'contract_id' => 'skux602f6',
    'access_token' => 'ee287d5fac097cd665cb338f7fafde3f',
    'proc_name' => 'daily_sum_ref',
    'table_name' => 'DailySum'
];

/**
 * 店舗IDマッピング設定
 * [システム店舗ID => スマレジ店舗ID]
 * スマレジ使用店舗を増やす場合はここ
 */
const STORE_ID_MAPPING = [
    2 => '1',    // 店舗A
    //3 => '2',    // 店舗B  
    //5 => '3',    // 店舗C
    //8 => '4',    // 店舗D
    // 新規店舗はここに追加
    // 例: 10 => '5',  // 店舗E
];

/**
 * 第1段階: スマレジレスポンス → 内部変数マッピング（固定・全店舗共通）
 * スマレジのフィールドを人がわかりやすい内部変数名に変換
 * この設定は全店舗共通で、スマレジのフィールド追加時のみ変更
 */
const SMAREGI_TO_INTERNAL_MAPPING = [
    // 基本売上フィールド
    'cashSales' => 'cash',             // 現金売上
    'creditSales' => 'credit',         // クレジット売上
 
  
    
    // otherSalseListは動的に処理（id1, id2, id3...として変換）
];

/**
 * 第2段階: 内部変数 → レスポンス用キーマッピング（店舗別カスタム）
 * 各店舗のフォームキーに合わせて内部変数をマッピング
 * 新規店舗追加や既存店舗のフォーム変更時はここを編集
 */
const INTERNAL_TO_RESPONSE_MAPPING = [
    // スマレジ店舗ID "1" のマッピング
    1 => [
        'cash' => 'cash10',           // 現金売上 → cash10フィールド
        'credit' => 'stera10',         // クレジット売上 → card10フィールド
        'id1' => 'tabelog10', 
        'id2' => 'horpepper10', 
        'id3' => 'ikkyu10', 
        'id4' => 'hitosara10', 
        'id5' => 'Uber10',    
        'id6' => 'urikake10', 
        'id7' => 'menu10',     
        // 必要な内部変数を追加
    ],
    
    // 店舗8のマッピング
    //8 => [
    //    'total' => 'uriage_gokei',    // 売上合計 → uriage_gokeiフィールド
    //    'cash' => 'genkin_haraikomi', // 現金売上 → genkin_haraikomieフィールド
    //    'credit' => 'credit_card',    // クレジット売上 → credit_cardフィールド
    //    'intax' => 'zeinuki_uriage',  // 内税売上 → zeinuki_uriageフィールド
    //    'id1' => 'smartphone_pay',    // otherSales id=1 → スマホ決済
    //    'id6' => 'qr_code_pay',       // otherSales id=6 → QRコード決済
        // 必要な内部変数を追加
    //]
    
    // 新規店舗追加時はここに追加
    // 10 => [
    //     'cash' => '店舗10_現金',
    //     'credit' => '店舗10_カード',
    //     'id1' => '店舗10_PayPay'
    // ]
];

/**
 * 利用可能な内部変数一覧（参考）
 * 
 * 基本売上:
 * - total: 売上合計
 * - cash: 現金売上
 * - credit: クレジット売上
 * - intax: 内税売上合計
 * - outtax: 外税売上合計
 * - taxfree: 税抜売上
 * 
 * 値引き・手数料:
 * - discount: 値引き
 * - pointdiscount: ポイント値引き
 * - carriage: 送料
 * - commission: 手数料
 * - change: お釣り過不足
 * 
 * その他:
 * - nonsales: 非売上対象合計
 * - preparation: 準備金
 * - calc_balance: 計算残高
 * - real_balance: 実際残高
 * - balance_diff: 過不足
 * 
 * その他支払方法:
 * - id1, id2, id3... : otherSalseListのid順（PayPay=id1, LINE Pay=id6など）
 */

// ==========================================
// 🔧 メイン処理（設定変更時は上記セクションのみ編集）
// ==========================================

/**
 * スマレジ売上データ取得メイン関数
 * @param int $storeId システム内店舗ID
 * @param string $date 日付 (YYYY-MM-DD)
 * @return array レスポンス配列
 */
function getPattern1SalesData($storeId, $date) {
    try {
        writeSmaregiLog("🚀 スマレジ処理開始: 店舗ID {$storeId}, 日付 {$date}");
        
        // ステップ1: 店舗IDマッピング確認
        writeSmaregiLog("📍 ステップ1: 店舗IDマッピング確認");
        if (!isset(STORE_ID_MAPPING[$storeId])) {
            throw new Exception("店舗ID {$storeId} はスマレジ対応店舗ではありません");
        }
        
        $smaregiStoreId = STORE_ID_MAPPING[$storeId];
        writeSmaregiLog("✅ 店舗IDマッピング: システム店舗ID {$storeId} → スマレジ店舗ID {$smaregiStoreId}");
        
        // ステップ2: スマレジAPIからデータ取得
        writeSmaregiLog("📡 ステップ2: スマレジAPIからデータ取得");
        $smaregiResponse = callSmaregiAPI($date, $smaregiStoreId);
        if (!$smaregiResponse['success']) {
            throw new Exception($smaregiResponse['error']);
        }
        
        // ステップ3: 2段階マッピング（スマレジ → 内部変数 → レスポンスキー）
        writeSmaregiLog("🔄 ステップ3: 2段階マッピング処理");
        $mappedData = mapToStoreFields($smaregiResponse['data'], $date, $smaregiStoreId, $storeId);
        
        writeSmaregiLog("🎉 スマレジ処理完了: 2段階マッピング成功");
        
        return [
            'success' => true,
            'data' => $mappedData,
            'source' => 'smaregi',
            'smaregi_store_id' => $smaregiStoreId,
            'system_store_id' => $storeId,
            'debug_info' => [
                'store_mapping' => $storeId . ' → ' . $smaregiStoreId,
                'date' => $date,
                'mapped_fields' => count($mappedData)
            ]
        ];
        
    } catch (Exception $e) {
        writeSmaregiLog("❌ スマレジエラー: " . $e->getMessage(), 'ERROR');
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'source' => 'smaregi'
        ];
    }
}

/**
 * スマレジAPIを呼び出し
 * @param string $date 日付
 * @param string $smaregiStoreId スマレジ店舗ID
 * @return array APIレスポンス
 */
function callSmaregiAPI($date, $smaregiStoreId) {
    try {
        // リクエストパラメータを構築
        $params = [
            'conditions' => [
                [
                    'sumDate' => $date,
                    'storeId' => $smaregiStoreId
                ]
            ],
            'table_name' => SMAREGI_CONFIG['table_name']
        ];
        
        // POSTデータを構築
        $postData = http_build_query([
            'proc_name' => SMAREGI_CONFIG['proc_name'],
            'params' => json_encode($params, JSON_UNESCAPED_UNICODE)
        ]);
        
        writeSmaregiLog("API呼び出し: " . SMAREGI_CONFIG['endpoint']);
        writeSmaregiLog("リクエスト: " . json_encode($params, JSON_UNESCAPED_UNICODE));
        
        // cURLでAPIリクエスト
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => SMAREGI_CONFIG['endpoint'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postData,
            CURLOPT_HTTPHEADER => [
                'X-contract-id: ' . SMAREGI_CONFIG['contract_id'],
                'X-access-token: ' . SMAREGI_CONFIG['access_token'],
                'Content-Type: application/x-www-form-urlencoded;charset=UTF-8'
            ],
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_USERAGENT => 'Daily Sales Report System/1.0'
        ]);
        
        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $curlError = curl_error($curl);
        curl_close($curl);
        
        if ($curlError) {
            throw new Exception("cURLエラー: " . $curlError);
        }
        
        if ($httpCode !== 200) {
            throw new Exception("HTTP エラー {$httpCode}: " . substr($response, 0, 200));
        }
        
        // JSONデコード
        $responseData = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("JSONデコードエラー: " . json_last_error_msg());
        }
        
        writeSmaregiLog("APIレスポンス受信成功: " . strlen($response) . " bytes");
        
        return [
            'success' => true,
            'data' => $responseData
        ];
        
    } catch (Exception $e) {
        writeSmaregiLog("API呼び出しエラー: " . $e->getMessage(), 'ERROR');
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

/**
 * スマレジデータを店舗フォームキーにマッピング（2段階処理）
 * @param array $smaregiData スマレジAPIレスポンス
 * @param string $requestDate リクエスト日付
 * @param string $requestStoreId リクエスト店舗ID（スマレジ）
 * @param int $systemStoreId システム店舗ID
 * @return array 店舗フォームキーでマッピングされたデータ
 */
/**
 * スマレジデータを店舗フォームキーにマッピング（2段階処理）
 */
function mapToStoreFields($smaregiData, $requestDate, $requestStoreId, $systemStoreId) {
    try {
        // レスポンス構造の確認
        if (!isset($smaregiData['result']) || !is_array($smaregiData['result']) || empty($smaregiData['result'])) {
            throw new Exception('スマレジAPIレスポンスにresultが含まれていません');
        }
        
        // 該当する日付・店舗IDのデータを探す
        $targetData = findTargetData($smaregiData['result'], $requestDate, $requestStoreId);
        if (!$targetData) {
            throw new Exception("指定された日付 {$requestDate} と店舗ID {$requestStoreId} のデータが見つかりません");
        }
        
        // スマレジレスポンスからstoreIdを取得
        $smaregiStoreId = $targetData['storeId'];
        writeSmaregiLog("対象データ確認: " . $targetData['sumDate'] . " スマレジ店舗ID " . $smaregiStoreId);
        
        // ステップ1: スマレジデータ → 内部変数への変換
        writeSmaregiLog("🔄 第1段階: スマレジデータ → 内部変数変換");
        $internalData = convertSmaregiToInternal($targetData);
        
        // ステップ2: 内部変数 → 店舗レスポンスキーへの変換（スマレジ店舗IDを使用）
        writeSmaregiLog("🔄 第2段階: 内部変数 → 店舗レスポンスキー変換（スマレジ店舗ID: {$smaregiStoreId}）");
        $responseData = convertInternalToResponse($internalData, $smaregiStoreId); // ← 修正：スマレジ店舗IDを渡す
        
        writeSmaregiLog("🎉 2段階マッピング完了: " . json_encode($responseData));
        
        return $responseData;
        
    } catch (Exception $e) {
        writeSmaregiLog("❌ 2段階マッピングエラー: " . $e->getMessage(), 'ERROR');
        throw $e;
    }
}

/**
 * 第1段階: スマレジデータを内部変数に変換
 * @param array $targetData スマレジの対象データ
 * @return array 内部変数データ
 */
function convertSmaregiToInternal($targetData) {
    try {
        $internalData = [];
        
        writeSmaregiLog("📋 基本フィールドの内部変数変換開始");
        
        // 基本フィールドの変換
        foreach (SMAREGI_TO_INTERNAL_MAPPING as $smaregiField => $internalVar) {
            if (isset($targetData[$smaregiField])) {
                $fieldValue = (float)($targetData[$smaregiField] ?? 0);
                $internalData[$internalVar] = $fieldValue;
                
                writeSmaregiLog("✅ 基本変換: {$smaregiField}({$fieldValue}) → {$internalVar}");
            } else {
                writeSmaregiLog("ℹ️ フィールド '{$smaregiField}' はデータに存在しません");
            }
        }
        
        // otherSalseListの変換（id1, id2, id3...）
        writeSmaregiLog("📋 otherSalseList の内部変数変換開始");
        $otherSalesList = $targetData['otherSalseList'] ?? [];
        
        if (is_array($otherSalesList) && !empty($otherSalesList)) {
            foreach ($otherSalesList as $otherSale) {
                $otherId = $otherSale['id'] ?? '';
                $otherSales = (float)($otherSale['sales'] ?? 0);
                $otherName = $otherSale['name'] ?? '';
                
                if ($otherId !== '') {
                    $internalVar = 'id' . $otherId;
                    $internalData[$internalVar] = $otherSales;
                    
                    writeSmaregiLog("✅ その他支払変換: otherSales[{$otherId}]({$otherName}: {$otherSales}) → {$internalVar}");
                }
            }
        } else {
            writeSmaregiLog("ℹ️ otherSalseList データなし");
        }
        
        writeSmaregiLog("🎉 内部変数変換完了: " . count($internalData) . "件");
        writeSmaregiLog("📄 内部変数データ: " . json_encode($internalData));
        
        return $internalData;
        
    } catch (Exception $e) {
        writeSmaregiLog("❌ 内部変数変換エラー: " . $e->getMessage(), 'ERROR');
        throw $e;
    }
}

/**
 * 第2段階: 内部変数を店舗レスポンスキーに変換
 * @param array $internalData 内部変数データ
 * @param string $smaregiStoreId スマレジ店舗ID（文字列）
 * @return array レスポンスデータ
 */
function convertInternalToResponse($internalData, $smaregiStoreId) {
    try {
        // スマレジ店舗IDでマッピング設定を取得
        if (!isset(INTERNAL_TO_RESPONSE_MAPPING[$smaregiStoreId])) {
            throw new Exception("スマレジ店舗ID {$smaregiStoreId} の内部変数→レスポンスマッピング設定が見つかりません");
        }
        
        $responseMapping = INTERNAL_TO_RESPONSE_MAPPING[$smaregiStoreId];
        writeSmaregiLog("🎯 スマレジ店舗マッピング設定: 店舗ID {$smaregiStoreId} (" . count($responseMapping) . "件)");
        
        $responseData = [];
        
        foreach ($responseMapping as $internalVar => $responseKey) {
            if (isset($internalData[$internalVar])) {
                $value = $internalData[$internalVar];
                $responseData[$responseKey] = $value;
                
                writeSmaregiLog("✅ レスポンス変換: {$internalVar}({$value}) → {$responseKey}");
            } else {
                writeSmaregiLog("⚠️ 内部変数 '{$internalVar}' がデータに存在しません");
                $responseData[$responseKey] = 0; // デフォルト値
            }
        }
        
        writeSmaregiLog("🎉 レスポンス変換完了: " . count($responseData) . "件");
        
        return $responseData;
        
    } catch (Exception $e) {
        writeSmaregiLog("❌ レスポンス変換エラー: " . $e->getMessage(), 'ERROR');
        throw $e;
    }
}

/**
 * 対象データを検索
 * @param array $resultList スマレジのresult配列
 * @param string $requestDate 要求日付
 * @param string $requestStoreId 要求店舗ID
 * @return array|null 該当データまたはnull
 */
function findTargetData($resultList, $requestDate, $requestStoreId) {
    foreach ($resultList as $record) {
        if ($record['sumDate'] === $requestDate && $record['storeId'] === $requestStoreId) {
            return $record;
        }
    }
    return null;
}

/**
 * スマレジ専用ログ出力
 * @param string $message ログメッセージ
 * @param string $level ログレベル
 */
function writeSmaregiLog($message, $level = 'INFO') {
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[{$timestamp}] [SMAREGI] [{$level}] {$message}" . PHP_EOL;
    error_log($logMessage, 3, __DIR__ . '/smaregi.log');
    
    // メインログにも出力
    if (function_exists('writeLog')) {
        writeLog("SMAREGI: {$message}", $level);
    }
}

?>