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
        
        // 初期化完了
        isAppInitialized = true;
        console.log('✅ アプリケーション機能の初期化が完了しました');
        
    } catch (error) {
        console.error('アプリケーション初期化でエラー:', error);
        throw error;
    }
}

/**
 * 管理者用店舗選択ドロップダウンのチェックと設定
 */
function checkAndSetupAdminStoreSelection() {
    console.log('=== 管理者店舗選択チェック開始 ===');
    
    // グローバルフラグまたは要素の属性から管理者モードをチェック
    const storeNameElement = document.getElementById('storeName');
    const isAdmin = window.isAdminUser || (storeNameElement && storeNameElement.getAttribute('data-admin-mode') === 'true');
    
    console.log('管理者フラグ:', window.isAdminUser);
    console.log('要素の管理者属性:', storeNameElement ? storeNameElement.getAttribute('data-admin-mode') : 'null');
    console.log('管理者判定:', isAdmin);
    
    if (isAdmin && storeNameElement) {
        console.log('管理者用店舗選択ドロップダウンを設定します');
        setupAdminStoreSelection(storeNameElement);
    } else {
        console.log('管理者ではないか、店舗名要素が見つかりません');
    }
}

/**
 * 設定読み込み前の代替処理
 * 設定が読み込まれる前に最低限の機能を提供
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM読み込み完了。設定読み込みを待機中...');
    
    // 管理者用店舗選択ドロップダウンの設定
    checkAndSetupAdminStoreSelection();
    
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

/**
 * 管理者用店舗選択ドロップダウンの設定
 * @param {HTMLElement} storeInputElement 既存の店舗名入力要素
 */
async function setupAdminStoreSelection(storeInputElement) {
    try {
        console.log('=== setupAdminStoreSelection 実行開始 ===');
        console.log('対象要素:', storeInputElement);
        console.log('要素のID:', storeInputElement.id);
        console.log('要素のクラス:', storeInputElement.className);
        
        // 現在の入力フィールドを選択フィールドに置き換え
        const parent = storeInputElement.parentElement;
        console.log('親要素:', parent);
        
        // 新しい選択フィールドを作成
        const selectElement = document.createElement('select');
        selectElement.id = 'storeName';
        selectElement.className = 'info-input wide';
        selectElement.required = true;
        
        console.log('新しいselectElement作成:', selectElement);
        
        // 既存の入力フィールドを削除
        console.log('既存要素を削除中...');
        storeInputElement.remove();
        
        // 新しい選択フィールドを追加
        console.log('新しい選択フィールドを追加中...');
        parent.appendChild(selectElement);
        
        // 店舗一覧を取得してオプションを追加
        console.log('店舗オプション読み込み開始...');
        await loadStoreOptions(selectElement);
        
        // 店舗選択時のイベントリスナーを追加
        selectElement.addEventListener('change', async function(event) {
            const selectedStoreName = event.target.value;
            console.log('店舗が選択されました:', selectedStoreName);
            
            if (selectedStoreName) {
                try {
                    // 店舗IDを取得
                    const storeId = await getStoreIdByName(selectedStoreName);
                    console.log('選択された店舗のID:', storeId);
                    
                    // セッションに店舗情報を更新
                    const userSession = JSON.parse(sessionStorage.getItem('userSession') || '{}');
                    userSession.store_id = storeId;
                    userSession.storeName = selectedStoreName;
                    sessionStorage.setItem('userSession', JSON.stringify(userSession));
                    console.log('セッション情報を更新しました:', userSession);
                    
                    // 設定を再読み込み
                    if (window.ConfigLoader) {
                        console.log('店舗設定を再読み込みします...');
                        await window.ConfigLoader.loadStoreConfig();
                        console.log('店舗設定の再読み込み完了');
                    }
                    
                } catch (error) {
                    console.error('店舗選択時のエラー:', error);
                }
            }
        });
        
        console.log('=== setupAdminStoreSelection 実行完了 ===');
        
    } catch (error) {
        console.error('管理者用店舗選択の設定でエラー:', error);
        console.error('エラースタック:', error.stack);
    }
}

/**
 * 店舗一覧を取得してselectにオプションを追加
 * @param {HTMLSelectElement} selectElement 店舗選択要素
 */
async function loadStoreOptions(selectElement) {
    try {
        console.log('店舗一覧を取得中...');
        
        const response = await fetch('api.php?action=getAllStores', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            // デフォルトオプション
            selectElement.innerHTML = '<option value="">店舗を選択してください</option>';
            
            // 店舗一覧をオプションとして追加
            result.data.forEach(store => {
                const option = document.createElement('option');
                option.value = store.store_name;
                option.textContent = store.store_name;
                selectElement.appendChild(option);
            });
            
            console.log(`${result.data.length}件の店舗を読み込みました`);
            
        } else {
            console.error('店舗一覧の取得に失敗:', result.message);
            // エラー時のデフォルトオプション
            selectElement.innerHTML = '<option value="">店舗一覧の取得に失敗しました</option>';
        }
        
    } catch (error) {
        console.error('店舗一覧取得でエラー:', error);
        selectElement.innerHTML = '<option value="">エラー: 店舗一覧を取得できませんでした</option>';
    }
}

// グローバル関数として公開
window.setupAdminStoreSelection = setupAdminStoreSelection;
window.loadStoreOptions = loadStoreOptions;
console.log('main.js: setupAdminStoreSelection関数をwindowオブジェクトに登録しました');