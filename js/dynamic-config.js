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

/**
 * API通信ユーティリティ
 */
const API = {
    /**
     * APIリクエスト送信
     */
    async request(action, data = {}) {
        try {
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
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'APIエラーが発生しました');
            }
            
            return result;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }
};

/**
 * 設定ローダー
 */
const ConfigLoader = {
    /**
     * ユーザーセッションから店舗設定を読み込み
     */
    async loadStoreConfig() {
        try {
            // ローディング表示
            this.showLoading('店舗設定を読み込み中...');
            
            // セッションからユーザー情報を取得
            const userSession = this.getUserSession();
            if (!userSession) {
                throw new Error('ユーザーセッションが見つかりません');
            }

            console.log('ユーザーセッション情報:', userSession); // デバッグ用

            // store_idの確認
            if (!userSession.store_id) {
                console.warn('ユーザーセッションにstore_idが含まれていません。フォールバック設定を使用します。');
                this.applyFallbackConfig();
                this.hideLoading();
                return;
            }
            
            // 店舗設定をAPIから取得
            const response = await API.request('getStoreSettings', {
                storeId: userSession.store_id  // キー名を修正
            });

            console.log('API応答:', response); // デバッグ用
            
            // グローバル変数に設定
            this.applyStoreConfig(response);
            
            console.log('店舗設定の読み込み完了:', {
                store: storeInfo,
                paymentMethods: paymentMethodConfig.length,
                pointMethods: pointPaymentConfig.length
            });
            
            // ローディング非表示
            this.hideLoading();
            
            return response;
            
        } catch (error) {
            this.hideLoading();
            console.error('店舗設定の読み込みエラー:', error);
            
            // フォールバック設定を適用
            this.applyFallbackConfig();
            
            throw error;
        }
    },
    
    /**
     * 設定をグローバル変数に適用
     */
    applyStoreConfig(response) {
        try {
            // レスポンス構造を確認
            if (!response || !response.data) {
                console.warn('APIレスポンスの構造が期待と異なります:', response);
                this.applyFallbackConfig();
                return;
            }

            const data = response.data;

            // 店舗情報
            storeInfo = {
                id: data.store_id,
                name: data.store_name || '店舗名未設定',
                code: data.store_code || ''
            };
            
            // 支払方法設定を変換
            paymentMethodConfig = (data.payment_methods || []).map(method => ({
                id: method.method_id,
                label: method.name || method.method_name,
                color: method.color_code || 'blue',
                isCash: method.method_type === 'cash',
                enabled: true
            }));
            
            // ポイント・クーポン設定を変換
            pointPaymentConfig = (data.point_payments || []).map(payment => ({
                id: payment.method_id,
                label: payment.name || payment.method_name,
                enabled: true
            }));
            
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
        // 店舗名の表示更新
        const storeNameElements = document.querySelectorAll('.store-name, #storeName');
        storeNameElements.forEach(element => {
            if (element) {
                if (element.tagName === 'INPUT') {
                    element.value = storeInfo.name || '店舗未設定';
                    element.readOnly = true; // 店舗名は変更不可
                } else {
                    element.textContent = storeInfo.name || '店舗未設定';
                }
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
    },
    
    /**
     * ローディング表示
     */
    showLoading(message = '読み込み中...') {
        // 既存のローディングがあれば削除
        this.hideLoading();
        
        const loading = document.createElement('div');
        loading.id = 'config-loading';
        loading.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-size: 18px;
        `;
        loading.innerHTML = `
            <div style="text-align: center;">
                <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 0 auto 10px;"></div>
                <div>${message}</div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(loading);
    },
    
    /**
     * ローディング非表示
     */
    hideLoading() {
        const loading = document.getElementById('config-loading');
        if (loading) {
            loading.remove();
        }
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
 * 初期化（ページ読み込み完了後に自動実行）
 */
document.addEventListener('DOMContentLoaded', async function() {
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
    }
});