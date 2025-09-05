/**
 * メイン処理（完全版）
 * アプリケーションの初期化とイベント設定
 */

// アプリケーション初期化フラグ
let isAppInitialized = false;

// 経費レコード管理
let expenseRecords = [];
let nextExpenseId = 1;

// 勘定科目設定
const accountCategories = [
    {value: '', label: '勘定科目'},
    {value: '消耗品費', label: '消耗品費'},
    {value: '雑費', label: '雑費'},
    {value: '通信費', label: '通信費'},
    {value: '水道光熱費', label: '水道光熱費'},
    {value: '修繕費', label: '修繕費'},
    {value: '交通費', label: '交通費'},
    {value: 'その他', label: 'その他'}
];

// 設定読み込み完了後の処理
document.addEventListener('configLoaded', function(event) {
    console.log('設定読み込み完了。アプリケーション初期化を開始します。');
    console.log('イベント詳細:', event.detail);
    
    try {
        initializeApplication();
        console.log('✅ アプリケーション初期化完了');
    } catch (error) {
        console.error('❌ アプリケーション初期化エラー:', error);
        showError('アプリケーションの初期化に失敗しました: ' + error.message);
    }
});

/**
 * アプリケーション初期化
 */
function initializeApplication() {
    if (isAppInitialized) {
        console.log('既に初期化済みです');
        return;
    }
    
    try {
        console.log('初期化開始:', {
            paymentMethods: paymentMethodConfig?.length || 0,
            pointMethods: pointPaymentConfig?.length || 0,
            denominations: denominations?.length || 0
        });

        // 初期経費レコードを設定
        if (expenseRecords.length === 0) {
            expenseRecords.push({id: 1, vendor: '', account: '', item: '', amount: ''});
        }
        
        // UI要素の生成
        generatePaymentMethods();
        generateDiscountSection();
        generateDenominationRows();
        generateFileInputs();
        
        // イベントリスナーの設定
        setupEventListeners();
        setupRemarksListeners();
        setupNumberInputFocus();
        
        // 初期計算
        updateAllCalculations();
        
        // データ管理機能
        setupBeforeUnloadWarning();
        
        // 初期日付設定
        const dateElement = document.getElementById('date');
        if (dateElement && !dateElement.value) {
            dateElement.value = getCurrentDate();
        }

        // URLパラメータをチェックして自動データ読み込み
        checkAndAutoLoadData();

        // 初期化完了
        isAppInitialized = true;
        console.log('✅ アプリケーション機能の初期化が完了しました');
        
    } catch (error) {
        console.error('アプリケーション初期化でエラー:', error);
        throw error;
    }
}

/**
 * URLパラメータをチェックして自動データ読み込み
 */
function checkAndAutoLoadData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlDate = urlParams.get('date');
        const urlStoreId = urlParams.get('store_id');
        const viewMode = urlParams.get('mode');
        
        console.log('URLパラメータチェック:', { urlDate, urlStoreId, viewMode });
        
        if (urlDate && urlStoreId && viewMode === 'view') {
            console.log('確認モード：自動データ読み込みを実行');
            
            // 少し遅らせてUIが完全に準備されてから実行
            setTimeout(() => {
                if (typeof handleLoadData === 'function') {
                    handleLoadData();
                } else {
                    console.error('handleLoadData関数が見つかりません');
                }
            }, 500);
        } else if (urlDate) {
            // 日付のみ指定されている場合は日付を設定
            const dateElement = document.getElementById('date');
            if (dateElement) {
                dateElement.value = urlDate;
                console.log('URLパラメータから日付を設定:', urlDate);
            }
        }
        
    } catch (error) {
        console.error('URLパラメータチェックでエラー:', error);
    }
}

// 設定読み込み前の代替処理
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM読み込み完了。設定読み込みを待機中...');
    
    // 設定読み込み完了まで待機
    const maxWaitTime = 10000; // 10秒
    const startTime = Date.now();
    
    const checkConfig = () => {
        if (isAppInitialized) {
            console.log('アプリケーション初期化済み');
            return;
        }
        
        const elapsed = Date.now() - startTime;
        if (elapsed > maxWaitTime) {
            console.warn('設定読み込みがタイムアウトしました。フォールバック処理を実行します。');
            try {
                // フォールバック設定が適用されているかチェック
                if (!paymentMethodConfig || paymentMethodConfig.length === 0) {
                    console.warn('フォールバック設定も適用されていません');
                }
                initializeApplication();
            } catch (error) {
                console.error('フォールバック初期化エラー:', error);
                showError('アプリケーションの初期化に失敗しました');
            }
            return;
        }
        
        // 設定が読み込まれているかチェック
        if (paymentMethodConfig && paymentMethodConfig.length > 0) {
            console.log('設定読み込み確認。初期化を実行します。');
            try {
                initializeApplication();
            } catch (error) {
                console.error('初期化エラー:', error);
                showError('アプリケーションの初期化に失敗しました');
            }
        } else {
            // まだ読み込まれていない場合は継続待機
            setTimeout(checkConfig, 100);
        }
    };
    
    // 少し待ってからチェック開始
    setTimeout(checkConfig, 500);
});

/**
 * ページを離れる前の確認処理を改善
 */
function setupBeforeUnloadWarning() {
    if (typeof window.beforeUnloadHandlerAdded === 'undefined') {
        console.log('ページ離脱警告を設定');
        
        window.addEventListener('beforeunload', function(e) {
            try {
                // データが入力されているかチェック
                const hasData = checkForUnsavedData();
                
                if (hasData) {
                    e.preventDefault();
                    e.returnValue = '入力中のデータが失われる可能性があります。本当にページを離れますか？';
                    return e.returnValue;
                }
            } catch (error) {
                console.error('ページ離脱チェックでエラー:', error);
            }
        });
        
        window.beforeUnloadHandlerAdded = true;
        console.log('ページ離脱警告の設定完了');
    }
}

/**
 * 未保存データのチェック
 */
function checkForUnsavedData() {
    try {
        // 基本情報のチェック
        const dateElement = document.getElementById('date');
        const inputByElement = document.getElementById('inputBy');
        
        if ((dateElement && dateElement.value) || (inputByElement && inputByElement.value.trim())) {
            return true;
        }
        
        // 売上データのチェック
        if (paymentMethodConfig) {
            for (const method of paymentMethodConfig) {
                const element10 = document.getElementById(`${method.id}10`);
                const element8 = document.getElementById(`${method.id}8`);
                if ((element10 && parseFloat(element10.value) > 0) || (element8 && parseFloat(element8.value) > 0)) {
                    return true;
                }
            }
        }
        
        // ポイント支払データのチェック
        if (pointPaymentConfig) {
            for (const payment of pointPaymentConfig) {
                const element10 = document.getElementById(`${payment.id}10`);
                const element8 = document.getElementById(`${payment.id}8`);
                if ((element10 && parseFloat(element10.value) > 0) || (element8 && parseFloat(element8.value) > 0)) {
                    return true;
                }
            }
        }
        
        // 入金・雑収入のチェック
        const incomeFields = ['nyukin', 'miscIncome', 'foundMoney'];
        for (const fieldId of incomeFields) {
            const element = document.getElementById(fieldId);
            if (element && parseFloat(element.value) > 0) {
                return true;
            }
        }
        
        // 経費のチェック
        const expenseInputs = document.querySelectorAll('[data-field="amount"]');
        for (const input of expenseInputs) {
            if (parseFloat(input.value) > 0) {
                return true;
            }
        }
        
        // 現金管理のチェック
        if (denominations) {
            for (const denom of denominations) {
                const registerInput = document.querySelector(`[data-type="register"][data-denom="${denom.key}"]`);
                const safeInput = document.querySelector(`[data-type="safe"][data-denom="${denom.key}"]`);
                if ((registerInput && parseInt(registerInput.value) > 0) || (safeInput && parseInt(safeInput.value) > 0)) {
                    return true;
                }
            }
        }
        
        // 備考のチェック
        const remarksElement = document.getElementById('remarks');
        if (remarksElement && remarksElement.value.trim()) {
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('未保存データチェックでエラー:', error);
        return false;
    }
}

/**
 * アプリケーション終了時の処理
 */
window.addEventListener('beforeunload', function() {
    try {
        
    } catch (error) {
        console.error('終了処理でエラー:', error);
    }
});

/**
 * エラー表示（グローバル）
 */
function showError(message) {
    console.error('エラー:', message);
    alert(message);
}

/**
 * 成功表示（グローバル）
 */
function showSuccess(message) {
    console.log('成功:', message);
    alert(message);
}

/**
 * 現在の日付を取得（YYYY-MM-DD形式）
 */
function getCurrentDate() {
    try {
        return new Date().toISOString().split('T')[0];
    } catch (error) {
        console.error('日付取得でエラー:', error);
        return '';
    }
}

/**
 * 数値入力フィールドのフォーカス時に全選択
 */
function setupNumberInputFocus() {
    try {
        console.log('数値入力フォーカス設定を開始');
        
        document.addEventListener('focus', function(e) {
            if (e.target.type === 'number') {
                try {
                    e.target.select();
                } catch (selectError) {
                    // select()が失敗しても処理を継続
                    console.warn('入力フィールドの選択でエラー:', selectError);
                }
            }
        }, true);
        
        console.log('数値入力フォーカス設定完了');
        
    } catch (error) {
        console.error('数値入力フォーカス設定でエラー:', error);
        console.warn('数値入力の自動選択機能が無効になります');
    }
}




// デバッグ用: グローバルスコープに公開
if (typeof window !== 'undefined') {
    window.appDebug = {
        paymentMethodConfig: () => paymentMethodConfig,
        pointPaymentConfig: () => pointPaymentConfig,
        denominations: () => denominations,
        storeInfo: () => storeInfo,
        isAppInitialized: () => isAppInitialized,
        expenseRecords: () => expenseRecords,
        checkForUnsavedData: checkForUnsavedData,
        reinitialize: () => {
            isAppInitialized = false;
            initializeApplication();
        }
    };
    
    console.log('デバッグ機能をwindow.appDebugに公開しました');
}