/**
 * 動的設定管理システム（修正版）
 * 店舗別設定をAPIから取得し、グローバル変数として提供
 */

// グローバル設定変数（従来のconfig.jsの置き換え）
let paymentMethodConfig = [];
let pointPaymentConfig = [];
let denominations = [];
let fileUploadConfig = {};
let storeInfo = {};
let appConfig = {}; 

/**
 * API通信ユーティリティ
 */
/**
 * API通信ユーティリティ
 */
const API = {
    /**
     * APIリクエスト送信
     */
    async request(action, data = {}) {
        try {
            console.log('🌐 API リクエスト開始:', action, data);
            
            const response = await fetch('api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: action,
                    ...data
                })
            });
            
            // レスポンステキストを先に取得
            const responseText = await response.text();
            
            console.log('📝 生レスポンス:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, response: ${responseText.substring(0, 100)}`);
            }
            
            // 空レスポンスチェック
            if (!responseText.trim()) {
                throw new Error('Empty response from server');
            }
            
            // JSONパース（デバッグ出力を除去）
            let result;
            try {
                // HTMLタグや PHP エラーメッセージが混入していないかチェック
                if (responseText.includes('<br') || responseText.includes('<b>') || responseText.includes('Fatal error') || responseText.includes('Warning:')) {
                    console.error('❌ PHPエラーまたはHTMLタグが検出されました:', responseText);
                    throw new Error('Server returned HTML/PHP error instead of JSON');
                }
                
                // JSONの開始位置を見つける
                const jsonStart = responseText.indexOf('{');
                if (jsonStart === -1) {
                    console.error('❌ JSONオブジェクトが見つかりません:', responseText);
                    throw new Error('No JSON object found in response');
                }
                
                const cleanResponseText = responseText.substring(jsonStart);
                console.log('🧹 クリーンなレスポンス:', cleanResponseText.substring(0, 100) + '...');
                
                result = JSON.parse(cleanResponseText);
                console.log('✅ JSON パース成功:', result);
                
            } catch (parseError) {
                console.error('❌ JSON parse error:', parseError);
                console.error('📄 Raw response text:', responseText);
                console.error('🔤 Response length:', responseText.length);
                console.error('🎯 First 500 chars:', responseText.substring(0, 500));
                throw new Error(`Invalid JSON response: ${parseError.message}. Response: ${responseText.substring(0, 100)}`);
            }
            
            if (!result.success && result.message) {
                console.warn('⚠️ API returned error:', result.message);
            }
            
            return result;
        } catch (error) {
            console.error('💥 API request error:', error);
            throw error;
        }
    }
};

/**
 * 設定ローダー（修正版）
 */
const ConfigLoader = {
    /**
     * ユーザーセッションから店舗設定を読み込み
     */
    async loadStoreConfig() {
        try {
            // ローディング表示 - 修正: showLoadingIndicator を使用
            if (typeof showLoadingIndicator === 'function') {
                showLoadingIndicator(true, '店舗設定を読み込み中...');
            } else {
                console.log('店舗設定を読み込み中...');
            }
            
          // URLパラメータから店舗IDと日付を取得
            const urlParams = new URLSearchParams(window.location.search);
            const urlStoreId = urlParams.get('store_id');
            const urlDate = urlParams.get('date');
            const viewMode = urlParams.get('mode');
            
            console.log('URLパラメータ:', { urlStoreId, urlDate, viewMode });
            
            // セッションからユーザー情報を取得
            const userSession = this.getUserSession();
            if (!userSession) {
                throw new Error('ユーザーセッションが見つかりません');
            }

            console.log('ユーザーセッション情報:', userSession); // デバッグ用

            // 管理者の場合の処理
            if (userSession.role === 'admin') {
                console.log('管理者ユーザーです。店舗選択待機またはフォールバック設定を使用します');
                
                // 管理者で店舗IDがない場合はフォールバック設定を適用
                if (!userSession.store_id && userSession.store_id !== 0) {
                    console.log('管理者：店舗未選択のためフォールバック設定を適用');
                    this.applyFallbackConfig();
                    // ローディング非表示 - 修正
                    if (typeof showLoadingIndicator === 'function') {
                        showLoadingIndicator(false);
                    }
                    return { success: true, message: '管理者モード：フォールバック設定適用' };
                }
            }

            // store_idの確認（デバッグ強化）
            console.log('🔍 セッション全体:', userSession);
            console.log('🔍 store_id詳細:', {
                store_id: userSession.store_id,
                type: typeof userSession.store_id,
                isNull: userSession.store_id === null,
                isUndefined: userSession.store_id === undefined
            });

            // 使用する店舗IDを決定（URLパラメータを最優先）
            let targetStoreId;
            if (urlStoreId) {
                // URLパラメータで店舗IDが指定されている場合（管理者・一般ユーザー問わず優先）
                targetStoreId = parseInt(urlStoreId);
                console.log('🎯 URLパラメータの店舗IDを使用:', targetStoreId);
            } else if (userSession.store_id || userSession.store_id === 0) {
                // 通常のユーザーセッションの店舗ID
                targetStoreId = userSession.store_id;
                console.log('セッションの店舗IDを使用:', targetStoreId);
            } else {
                // 管理者で店舗IDがない場合はフォールバック設定
                if (userSession.role === 'admin') {
                    console.log('管理者：店舗未選択のためフォールバック設定を適用');
                    this.applyFallbackConfig();
                    // ローディング非表示 - 修正
                    if (typeof showLoadingIndicator === 'function') {
                        showLoadingIndicator(false);
                    }
                    return { success: true, message: '管理者モード：フォールバック設定適用' };
                } else {
                    throw new Error('店舗IDが設定されていません');
                }
            }

            console.log('✅ 対象店舗ID:', targetStoreId);

            // 店舗設定をAPIから取得
            const response = await API.request('getStoreSettings', {
                storeId: targetStoreId
            });

            console.log('API応答:', response); // デバッグ用
            
            // グローバル変数に設定
            await this.applyStoreConfig(response);
            
            console.log('店舗設定の読み込み完了:', {
                store: storeInfo,
                paymentMethods: paymentMethodConfig.length,
                pointMethods: pointPaymentConfig.length
            });
            
            // ローディング非表示 - 修正
            if (typeof showLoadingIndicator === 'function') {
                showLoadingIndicator(false);
            }
            
            return response;
            
        } catch (error) {
            // ローディング非表示 - 修正
            if (typeof showLoadingIndicator === 'function') {
                showLoadingIndicator(false);
            }
            console.error('店舗設定の読み込みエラー:', error);
            
            // フォールバック設定を適用
            this.applyFallbackConfig();
            
            throw error;
        }
    },
    
    // 残りのメソッドはそのまま（変更なし）
    async applyStoreConfig(response) {
        try {
            // レスポンス構造を確認
            if (!response) {
                console.warn('APIレスポンスが空です:', response);
                this.applyFallbackConfig();
                return;
            }

            // レスポンスが直接データを持っている場合の対応
            const data = response.data || response;
            console.log('設定データ:', data);

            // URLパラメータをチェック（追加）
            const urlParams = new URLSearchParams(window.location.search);
            const urlStoreId = urlParams.get('store_id');

            // 店舗情報の設定を修正 - APIレスポンス構造に対応
            const userSession = this.getUserSession();
            
            // APIレスポンスから店舗名を抽出（複数のパターンに対応）
            let storeName = '店舗未設定';
            if (data.store_info && data.store_info.store_name) {
                // getStoreSettings API の場合
                storeName = data.store_info.store_name;
                console.log('🏪 store_info.store_name から店舗名を取得:', storeName);
            } else if (data.store_name) {
                // 直接 store_name が含まれている場合
                storeName = data.store_name;
                console.log('🏪 store_name から店舗名を取得:', storeName);
            } else if (!urlStoreId && userSession?.storeName) {
                // URLパラメータがなく、ユーザーセッションに店舗名がある場合
                storeName = userSession.storeName;
                console.log('🏪 ユーザーセッションから店舗名を取得:', storeName);
            } else if (urlStoreId) {
                // URLパラメータで店舗IDが指定されているが店舗名が取得できない場合
                console.log('🏪 URLパラメータ指定店舗の店舗名を別途取得します...');
                try {
                    const storeResponse = await fetch('user-management.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ action: 'get_stores' })
                    });
                    
                    if (storeResponse.ok) {
                        const storeResult = await storeResponse.json();
                        if (storeResult.success && (storeResult.data || storeResult.stores)) {
                            // dataまたはstoresプロパティから店舗一覧を取得
                            const storeList = storeResult.data || storeResult.stores;
                            const store = storeList.find(s => s.id == urlStoreId);
                            if (store) {
                                storeName = store.name || store.store_name;
                                console.log(`🏪 URLパラメータ店舗の店舗名を取得: "${storeName}"`);
                            } else {
                                console.warn(`店舗ID ${urlStoreId} が見つかりません`);
                            }
                        }
                    }
                } catch (storeError) {
                    console.error('店舗名取得エラー:', storeError);
                }
            }
            
            storeInfo = {
                id: data.store_id,
                name: storeName,
                code: (data.store_info && data.store_info.store_code) || data.store_code || ''
            };

            // デバッグログ追加
            console.log('🏪 最終的な店舗情報:', storeInfo);
            console.log('🏪 APIレスポンス詳細:', {
                hasStoreInfo: !!data.store_info,
                storeInfoStoreName: data.store_info?.store_name,
                directStoreName: data.store_name,
                urlStoreId: urlStoreId,
                userSessionStoreName: userSession?.storeName
            });
            
            if (urlStoreId) {
                console.log('🏪 URLパラメータ店舗の情報を適用:', storeInfo);
            }

            // 支払方法設定を変換（payment_settingsから）
            const paymentSettings = data.payment_settings || {};
            paymentMethodConfig = Object.values(paymentSettings).map(method => ({
                id: method.method_id,
                label: method.display_name,
                color: method.color_code || 'blue',
                isCash: method.method_type === 'cash',
                enabled: method.is_enabled == 1
            })).filter(method => method.enabled);

            // ポイント・クーポン設定を変換（point_settingsから）
            const pointSettings = data.point_settings || {};
            pointPaymentConfig = Object.values(pointSettings).map(payment => ({
                id: payment.method_id,
                label: payment.display_name,
                enabled: payment.is_enabled == 1
            })).filter(payment => payment.enabled);

            console.log('変換された支払方法:', paymentMethodConfig);
            console.log('変換されたポイント設定:', pointPaymentConfig);
            
            // デフォルト設定
            this.applyDefaultConfigs();
            
            // ページタイトルに店舗名を反映
            if (storeInfo.name && storeInfo.name !== '店舗名未設定') {
                document.title = `日次売上報告書 - ${storeInfo.name}`;
            }
            
            // 店舗情報をページに反映
            this.updateStoreDisplay();
            
        } catch (error) {
            console.error('設定適用エラー:', error);
            this.applyFallbackConfig();
        }
    },
    
    /**
     * デフォルト設定を適用
     */
    applyDefaultConfigs() {
        // 金種設定
        denominations = [
            { key: 'bill10000', label: '10,000円札', value: 10000 },
            { key: 'bill5000', label: '5,000円札', value: 5000 },
            { key: 'bill2000', label: '2,000円札', value: 2000 },
            { key: 'bill1000', label: '1,000円札', value: 1000 },
            { key: 'coin500', label: '500円玉', value: 500 },
            { key: 'coin100', label: '100円玉', value: 100 },
            { key: 'coin50', label: '50円玉', value: 50 },
            { key: 'coin10', label: '10円玉', value: 10 },
            { key: 'coin5', label: '5円玉', value: 5 },
            { key: 'coin1', label: '1円玉', value: 1 }
        ];
        
        // ファイルアップロード設定
        fileUploadConfig = {
            MAX_FILES: 5,
            MAX_FILE_SIZE: 10485760, // 10MB
            ALLOWED_TYPES: [
                'application/pdf',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/jpeg',
                'image/png',
                'image/gif'
            ],
            ALLOWED_EXTENSIONS: '.pdf,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png,.gif'
        };

        appConfig = {
            VERSION: '1.0.0',
            DEBUG: false,
            AUTO_SAVE_INTERVAL: 30000,
            VALIDATION: {
                REQUIRED_FIELDS: ['date', 'storeName', 'inputBy'],
                MAX_REMARKS_LENGTH: 1000
            }
        };
    },
    
    /**
     * フォールバック設定（API取得失敗時）
     */
    applyFallbackConfig() {
        console.warn('フォールバック設定を適用します');
        
        paymentMethodConfig = [
            { id: 'cash', label: '現金', color: 'green', isCash: true, enabled: true },
            { id: 'card', label: 'クレジットカード', color: 'blue', isCash: false, enabled: true },
            { id: 'paypay', label: 'PayPay', color: 'red', isCash: false, enabled: true },
            { id: 'linepay', label: 'LINE Pay', color: 'green', isCash: false, enabled: true }
        ];
        
        pointPaymentConfig = [
            { id: 'hotpepper', label: 'HOT PEPPER', enabled: true },
            { id: 'tabelog', label: '食べログ', enabled: true }
        ];
        
        storeInfo = { 
            name: '店舗未設定', 
            code: '', 
            id: null 
        };

        // デフォルト設定を適用
        this.applyDefaultConfigs();
    },
    
    /**
     * ユーザーセッション取得
     */
    getUserSession() {
        const session = sessionStorage.getItem('userSession') || localStorage.getItem('userSession');
        if (!session) {
            return null;
        }
        
        try {
            return JSON.parse(session);
        } catch (error) {
            console.error('セッション解析エラー:', error);
            return null;
        }
    },
    
    /**
     * 店舗情報をページに表示
     */
    updateStoreDisplay() {
        // URLパラメータをチェック
        const urlParams = new URLSearchParams(window.location.search);
        const urlStoreId = urlParams.get('store_id');
        
        let displayStoreName;
        if (urlStoreId && storeInfo.name) {
            // URLパラメータで店舗が指定されている場合はその店舗名を使用
            displayStoreName = storeInfo.name;
            console.log('🏪 URLパラメータ指定店舗名を表示:', displayStoreName);
        } else {
            // 通常の場合はセッションの店舗名を使用
            const userSession = this.getUserSession();
            displayStoreName = userSession?.storeName || storeInfo.name || '店舗未設定';
        }
        
        const storeNameElements = document.querySelectorAll('.store-name, #storeName');
        storeNameElements.forEach(element => {
            if (element.tagName === 'INPUT') {
                element.value = displayStoreName;
                // 店舗名フィールドは常に読み取り専用（ユーザーに編集させない）
                element.readOnly = true;
                element.style.backgroundColor = '#f8f9fa';
                element.style.cursor = 'not-allowed';
                element.style.opacity = '0.7';
            }
        });
        
        // 店舗コードの表示更新
        const storeCodeElements = document.querySelectorAll('.store-code, #storeCode');
        storeCodeElements.forEach(element => {
            if (element) {
                if (element.tagName === 'INPUT') {
                    element.value = storeInfo.code || '';
                } else {
                    element.textContent = storeInfo.code || '';
                }
            }
        });
    }
};

/**
 * 設定読み込み完了待機
 */
function waitForConfig() {
    return new Promise((resolve) => {
        const checkConfig = () => {
            if (paymentMethodConfig.length > 0 || pointPaymentConfig.length > 0) {
                resolve();
            } else {
                setTimeout(checkConfig, 100);
            }
        };
        checkConfig();
    });
}

/**
 * 手動初期化関数（main.jsから呼び出される）
 */
async function initializeDynamicConfig() {
    try {
        console.log('動的設定システム初期化開始');
        await ConfigLoader.loadStoreConfig();
        console.log('動的設定システム初期化完了');
        
        // 設定読み込み完了イベントを発火
        document.dispatchEvent(new CustomEvent('configLoaded', {
            detail: {
                store: storeInfo,
                paymentMethods: paymentMethodConfig,
                pointMethods: pointPaymentConfig
            }
        }));
        
        return true;
        
    } catch (error) {
        console.error('動的設定システム初期化エラー:', error);
        
        // エラーでも処理を続行（フォールバック設定で）
        document.dispatchEvent(new CustomEvent('configLoaded', {
            detail: {
                store: storeInfo,
                paymentMethods: paymentMethodConfig,
                pointMethods: pointPaymentConfig,
                error: error.message
            }
        }));
        
        return false;
    }
}

// 関数をグローバルスコープに公開
if (typeof window !== 'undefined') {
    window.initializeDynamicConfig = initializeDynamicConfig;
    window.ConfigLoader = ConfigLoader;
    
    console.log('✅ dynamic-config.js: 関数をグローバルスコープに公開しました');
}

// ConfigLoaderをグローバルに公開
window.ConfigLoader = ConfigLoader;