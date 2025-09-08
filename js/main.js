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

        // 関数の存在チェック（デバッグ用）
        console.log('関数存在チェック:', {
            generatePaymentMethods: typeof generatePaymentMethods,
            generateDiscountSection: typeof generateDiscountSection,
            generateDenominationRows: typeof generateDenominationRows,
            generateFileInputs: typeof generateFileInputs
        });

        // 初期経費レコードを設定
        if (expenseRecords.length === 0) {
            expenseRecords.push({id: 1, vendor: '', account: '', item: '', amount: ''});
        }
        
        // UI要素の生成（存在チェック付き）
        if (typeof generatePaymentMethods === 'function') {
            generatePaymentMethods();
        } else {
            console.error('generatePaymentMethods 関数が見つかりません');
            throw new Error('generatePaymentMethods 関数が未定義です');
        }
        
        if (typeof generateDiscountSection === 'function') {
            generateDiscountSection();
        } else {
            console.error('generateDiscountSection 関数が見つかりません');
            throw new Error('generateDiscountSection 関数が未定義です');
        }
        
        if (typeof generateDenominationRows === 'function') {
            generateDenominationRows();
        } else {
            console.error('generateDenominationRows 関数が見つかりません');
            throw new Error('generateDenominationRows 関数が未定義です');
        }
        
        if (typeof generateFileInputs === 'function') {
            generateFileInputs();
        } else {
            console.error('generateFileInputs 関数が見つかりません');
            throw new Error('generateFileInputs 関数が未定義です');
        }
        
        // イベントリスナーの設定
        if (typeof setupEventListeners === 'function') {
            setupEventListeners();
        }
        
        if (typeof setupRemarksListeners === 'function') {
            setupRemarksListeners();
        }
        
        if (typeof setupNumberInputFocus === 'function') {
            setupNumberInputFocus();
        }
        
        // 初期計算
        if (typeof updateAllCalculations === 'function') {
            updateAllCalculations();
        }
        
        // データ管理機能
        if (typeof setupBeforeUnloadWarning === 'function') {
            setupBeforeUnloadWarning();
        }
        
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

        // 管理者セクションの初期表示制御（追加）
        const adminConfirmSection = document.getElementById('adminConfirmSection');
        if (adminConfirmSection) {
            if (window.isAdminUser) {
                adminConfirmSection.style.display = 'block';
                console.log('管理者確定セクションを表示しました');
            } else {
                adminConfirmSection.style.display = 'none';
            }
        }
        
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
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM読み込み完了。動的設定を初期化します...');
    
    try {
        // 動的設定の初期化を実行
        if (typeof initializeDynamicConfig === 'function') {
            await initializeDynamicConfig();
            console.log('動的設定初期化完了');
        } else {
            console.warn('initializeDynamicConfig関数が見つかりません');
        }
    } catch (error) {
        console.error('動的設定初期化エラー:', error);
        // フォールバック処理
        setTimeout(() => {
            if (!isAppInitialized) {
                console.warn('設定読み込みに失敗しました。フォールバック処理を実行します。');
                try {
                    initializeApplication();
                } catch (initError) {
                    console.error('フォールバック初期化エラー:', initError);
                    showError('アプリケーションの初期化に失敗しました');
                }
            }
        }, 1000);
    }
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
 * 日報確定処理（管理者のみ）
 */
async function handleConfirm() {
    if (!window.isAdminUser) {
        showError('管理者のみ確定操作が可能です');
        return;
    }
    
    try {
        const formData = collectAllFormData();
        
        if (!formData.date || !formData.storeName) {
            showError('日付と店舗名が必要です');
            return;
        }
        
        const confirmMessage = `以下の日報を確定します：\n\n` +
            `日付: ${formData.date}\n` +
            `店舗: ${formData.storeName}\n\n` +
            `確定すると店舗ユーザーは編集できなくなります。\n` +
            `よろしいですか？`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // 店舗IDを取得
        const storeId = await getStoreIdByName(formData.storeName);
        if (!storeId) {
            showError('店舗情報の取得に失敗しました');
            return;
        }
        
        // API呼び出し
        const response = await fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'confirmReport',
                report_date: formData.date,
                store_id: storeId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('日報を確定しました');
            updateConfirmButtonState('confirmed');
        } else {
            showError('確定に失敗しました: ' + result.message);
        }
        
    } catch (error) {
        console.error('確定処理エラー:', error);
        showError('確定処理中にエラーが発生しました');
    }
}

/**
 * 日報確定解除処理（管理者のみ）
 */
async function handleUnconfirm() {
    if (!window.isAdminUser) {
        showError('管理者のみ確定解除操作が可能です');
        return;
    }
    
    try {
        const formData = collectAllFormData();
        
        if (!formData.date || !formData.storeName) {
            showError('日付と店舗名が必要です');
            return;
        }
        
        const confirmMessage = `以下の日報の確定を解除します：\n\n` +
            `日付: ${formData.date}\n` +
            `店舗: ${formData.storeName}\n\n` +
            `解除すると店舗ユーザーが再度編集可能になります。\n` +
            `よろしいですか？`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // 店舗IDを取得
        const storeId = await getStoreIdByName(formData.storeName);
        if (!storeId) {
            showError('店舗情報の取得に失敗しました');
            return;
        }
        
        // API呼び出し
        const response = await fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'unconfirmReport',
                report_date: formData.date,
                store_id: storeId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('日報の確定を解除しました');
            updateConfirmButtonState('draft');
        } else {
            showError('確定解除に失敗しました: ' + result.message);
        }
        
    } catch (error) {
        console.error('確定解除処理エラー:', error);
        showError('確定解除処理中にエラーが発生しました');
    }
}

/**
 * 確定ボタンの状態更新
 */
function updateConfirmButtonState(status) {
    const submitButton = document.getElementById('submitButton');
    const confirmButton = document.getElementById('confirmButton');
    const unconfirmButton = document.getElementById('unconfirmButton');
    const confirmStatus = document.getElementById('confirmStatus');
    const adminConfirmSection = document.getElementById('adminConfirmSection');
    
    if (!submitButton) {
        return;
    }
    
    // 管理者の場合のみ確定セクションを表示
    if (window.isAdminUser && adminConfirmSection) {
        adminConfirmSection.style.display = 'block';
        
        if (status === 'confirmed') {
            // 確定済み状態
            if (confirmButton) confirmButton.style.display = 'none';
            if (unconfirmButton) unconfirmButton.style.display = 'block';
            if (confirmStatus) confirmStatus.style.display = 'none';
            
            submitButton.innerHTML = `
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                確定済み
            `;
            submitButton.className = 'submit-button confirmed';
            submitButton.disabled = true;
        } else {
            // 未確定状態
            if (confirmButton) confirmButton.style.display = 'block';
            if (unconfirmButton) unconfirmButton.style.display = 'none';
            if (confirmStatus) confirmStatus.style.display = 'none';
            
            submitButton.innerHTML = `
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H9V7h6v2z"/>
                </svg>
                経理課に送信
            `;
            submitButton.className = 'submit-button';
            submitButton.disabled = false;
        }
    } else {
        // 一般ユーザーの場合
        if (adminConfirmSection) adminConfirmSection.style.display = 'none';
        
        if (status === 'confirmed') {
            submitButton.innerHTML = `
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                確定済み
            `;
            submitButton.className = 'submit-button confirmed';
            submitButton.disabled = true;
        } else {
            submitButton.innerHTML = `
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H9V7h6v2z"/>
                </svg>
                経理課に送信
            `;
            submitButton.className = 'submit-button';
            submitButton.disabled = false;
        }
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

// 🛡️ 安全性チェック：必要な関数がすべて定義されているか確認
console.log('🔍 必要な関数の定義状況:');
const requiredFunctions = [
    'generatePaymentMethods',
    'generateDiscountSection', 
    'generateDenominationRows',
    'generateFileInputs',
    'updateAllCalculations',
    'setupEventListeners'
];

let missingFunctions = [];
requiredFunctions.forEach(funcName => {
    if (typeof window[funcName] !== 'function') {
        missingFunctions.push(funcName);
        console.error(`❌ ${funcName} が未定義です`);
    } else {
        console.log(`✅ ${funcName} は正常に定義されています`);
    }
});

if (missingFunctions.length > 0) {
    console.error('⚠️ 未定義の関数があります:', missingFunctions);
    console.error('📋 対処法: 以下のJSファイルが正しく読み込まれているか確認してください:');
    console.error('   - ui.js (generatePaymentMethods, generateDiscountSection, generateDenominationRows)');
    console.error('   - fileManager.js (generateFileInputs)');
    console.error('   - calculations.js (updateAllCalculations)');
} else {
    console.log('🎉 すべての必要な関数が正常に定義されています');
}