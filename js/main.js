/**
 * メイン処理
 * アプリケーションの初期化とイベント管理
 */

// データ管理用変数
let expenseRecords = [{id: 1, vendor: '', account: '', item: '', amount: ''}];
let nextExpenseId = 2;

/**
 * 各初期化ステップを安全に実行するヘルパー関数
 */
function safeExecute(functionName, func) {
    try {
        console.log(`実行中: ${functionName}`);
        func();
        console.log(`完了: ${functionName}`);
    } catch (error) {
        console.error(`エラー in ${functionName}:`, error);
        throw new Error(`${functionName} の実行中にエラーが発生しました: ${error.message}`);
    }
}

/**
 * DOM要素の存在確認
 */
function validateRequiredElements() {
    const requiredElements = [
        'date',
        'storeName', 
        'inputBy',
        'denominationRows',
        'fileInputs',
        'remarks'
    ];
    
    const missingElements = [];
    
    requiredElements.forEach(id => {
        if (!document.getElementById(id)) {
            missingElements.push(id);
        }
    });
    
    const requiredClasses = [
        '.section-green',
        '.section-orange',
        '#expenseRecords'
    ];
    
    requiredClasses.forEach(selector => {
        if (!document.querySelector(selector)) {
            missingElements.push(selector);
        }
    });
    
    if (missingElements.length > 0) {
        throw new Error(`必要な要素が見つかりません: ${missingElements.join(', ')}`);
    }
    
    console.log('必要な要素の存在確認完了');
}

/**
 * 設定データの検証
 */
function validateConfigData() {
    if (!paymentMethodConfig || !Array.isArray(paymentMethodConfig)) {
        throw new Error('paymentMethodConfig が正しく定義されていません');
    }
    
    if (!pointPaymentConfig || !Array.isArray(pointPaymentConfig)) {
        throw new Error('pointPaymentConfig が正しく定義されていません');
    }
    
    if (!denominations || !Array.isArray(denominations)) {
        throw new Error('denominations が正しく定義されていません');
    }
    
    if (!fileUploadConfig) {
        throw new Error('fileUploadConfig が正しく定義されていません');
    }
    
    console.log('設定データの検証完了');
}

/**
 * アプリケーション初期化
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM読み込み完了 - 初期化開始');
    
    try {
        // 1. 設定とDOM要素の検証
        safeExecute('設定データの検証', validateConfigData);
        safeExecute('必要要素の存在確認', validateRequiredElements);
        
        // 2. 基本初期化
        safeExecute('日付入力の初期化', initializeDateInput);
        
        // 3. UI要素の動的生成
        safeExecute('金種行の生成', generateDenominationRows);
        safeExecute('支払い方法の生成', generatePaymentMethods);
        safeExecute('ポイント・クーポン支払いの生成', generateDiscountSection);
        safeExecute('ファイル入力欄の生成', generateFileInputs);
        
        // 4. イベントリスナーの設定
        safeExecute('イベントリスナーの設定', setupEventListeners);
        safeExecute('備考欄リスナーの設定', setupRemarksListeners);
        safeExecute('数値入力フォーカス設定', setupNumberInputFocus);
        safeExecute('ページ離脱警告の設定', setupBeforeUnloadWarning);
        
        // 5. 計算とデータ管理
        safeExecute('初期集計の更新', updateAllCalculations);
        safeExecute('自動保存の開始', startAutoSave);
        
        // 6. オプション機能（エラーが発生しても継続）
        try {
            if (window.enableDragAndDrop && typeof enableDragAndDrop === 'function') {
                enableDragAndDrop();
                console.log('ドラッグ&ドロップ機能を有効化しました');
            }
        } catch (error) {
            console.warn('ドラッグ&ドロップ機能の有効化に失敗しました:', error);
        }
        
        // 7. 遅延実行される機能
        setTimeout(() => {
            try {
                checkForAutoSaveData();
                console.log('自動保存データの確認完了');
            } catch (error) {
                console.warn('自動保存データの確認でエラーが発生しました:', error);
            }
        }, 1000);
        
        console.log('✅ アプリケーションの初期化が完了しました');
        
        // 初期化完了を通知（デバッグ用）
        if (appConfig && appConfig.DEBUG) {
            console.log('🎉 初期化成功 - 全ての機能が利用可能です');
        }
        
    } catch (error) {
        console.error('❌ 初期化エラー:', error);
        console.error('エラースタック:', error.stack);
        
        // より詳細なエラー情報を表示
        const errorDetails = `
初期化中にエラーが発生しました。

エラーの詳細:
${error.message}

対処方法:
1. ページを再読み込みしてください
2. 問題が継続する場合は、ブラウザのコンソールを確認してください
3. 別のブラウザで試してください

技術者向け情報:
- ブラウザ: ${navigator.userAgent}
- URL: ${window.location.href}
- エラー発生時刻: ${new Date().toLocaleString()}
        `.trim();
        
        // アラートの代わりにより詳細な情報を表示
        if (confirm('アプリケーションの初期化中にエラーが発生しました。\n\n詳細なエラー情報を表示しますか？')) {
            alert(errorDetails);
        }
        
        // 部分的な機能でも動作させる試み
        try {
            initializeMinimalFunctionality();
        } catch (fallbackError) {
            console.error('最小機能の初期化も失敗しました:', fallbackError);
        }
    }
});

/**
 * 最小限の機能で初期化（フォールバック）
 */
function initializeMinimalFunctionality() {
    console.log('最小機能モードで初期化を試行中...');
    
    // 日付の設定のみ
    const dateElement = document.getElementById('date');
    if (dateElement && !dateElement.value) {
        dateElement.value = getCurrentDate();
        console.log('日付を設定しました');
    }
    
    // 基本的な計算機能のみ
    const basicInputs = document.querySelectorAll('input[type="number"]');
    basicInputs.forEach(input => {
        input.addEventListener('input', () => {
            try {
                updateAllCalculations();
            } catch (error) {
                console.warn('計算更新でエラー:', error);
            }
        });
    });
    
    console.log('最小機能の初期化完了');
}

/**
 * 日付入力の初期化
 */
function initializeDateInput() {
    const dateElement = document.getElementById('date');
    if (!dateElement) {
        throw new Error('date要素が見つかりません');
    }
    
    if (!dateElement.value) {
        dateElement.value = getCurrentDate();
    }
    
    console.log('日付を設定しました:', dateElement.value);
}

/**
 * 自動保存データの確認
 */
function checkForAutoSaveData() {
    const dateElement = document.getElementById('date');
    const storeNameElement = document.getElementById('storeName');
    
    if (!dateElement || !storeNameElement) {
        console.warn('自動保存データの確認に必要な要素が見つかりません');
        return;
    }
    
    // 店舗名が入力されている場合のみ自動保存データをチェック
    if (storeNameElement.value.trim()) {
        restoreAutoSaveData();
    }
}

/**
 * ページの可視性変更時の処理
 */
document.addEventListener('visibilitychange', function() {
    try {
        if (document.hidden) {
            // ページが隠れた時は自動保存を停止
            stopAutoSave();
        } else {
            // ページが表示された時は自動保存を再開
            startAutoSave();
        }
    } catch (error) {
        console.warn('可視性変更の処理でエラー:', error);
    }
});

/**
 * ウィンドウのリサイズ処理
 */
window.addEventListener('resize', function() {
    try {
        // レスポンシブ対応の調整（必要に応じて）
        updateLayoutForScreenSize();
    } catch (error) {
        console.warn('リサイズ処理でエラー:', error);
    }
});

/**
 * 画面サイズに応じたレイアウト調整
 */
function updateLayoutForScreenSize() {
    const container = document.querySelector('.container');
    if (!container) return;
    
    if (window.innerWidth <= 1024) {
        // タブレット/スマートフォン表示の調整
        container.classList.add('mobile-layout');
    } else {
        container.classList.remove('mobile-layout');
    }
}

/**
 * エラーハンドリングの設定
 */
window.addEventListener('error', function(event) {
    console.error('JavaScript エラー:', event.error);
    console.error('ファイル:', event.filename);
    console.error('行番号:', event.lineno);
    console.error('列番号:', event.colno);
    
    if (appConfig && appConfig.DEBUG) {
        const errorInfo = `JavaScript エラーが発生しました:
エラー: ${event.error.message}
ファイル: ${event.filename}
行: ${event.lineno}
列: ${event.colno}`;
        console.error(errorInfo);
    }
});

/**
 * 未処理の Promise エラーのキャッチ
 */
window.addEventListener('unhandledrejection', function(event) {
    console.error('未処理の Promise エラー:', event.reason);
    
    if (appConfig && appConfig.DEBUG) {
        console.error(`非同期処理でエラーが発生しました: ${event.reason}`);
    }
    
    // エラーが処理されたことを示す
    event.preventDefault();
});

/**
 * キーボードショートカットの設定
 */
document.addEventListener('keydown', function(event) {
    try {
        // Ctrl+S で保存（デフォルトの保存動作を防ぐ）
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            handleSubmit();
            return;
        }
        
        // Ctrl+P で印刷
        if (event.ctrlKey && event.key === 'p') {
            event.preventDefault();
            handlePrint();
            return;
        }
        
        // ESC で現在の操作をキャンセル
        if (event.key === 'Escape') {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.tagName === 'INPUT') {
                activeElement.blur();
            }
        }
    } catch (error) {
        console.warn('キーボードショートカット処理でエラー:', error);
    }
});

/**
 * フォーカス管理の改善
 */
function improveFocusHandling() {
    try {
        // Tab キーでの移動順序を最適化
        const focusableElements = [
            '#date',
            '#storeName', 
            '#inputBy',
            ...paymentMethodConfig.map(m => `#${m.id}10`),
            ...paymentMethodConfig.map(m => `#${m.id}8`),
            ...pointPaymentConfig.map(p => `#${p.id}10`),
            ...pointPaymentConfig.map(p => `#${p.id}8`),
            '#nyukin',
            '#miscIncome',
            '[data-field="vendor"]',
            '[data-field="account"]',
            '[data-field="item"]',
            '[data-field="amount"]',
            '#previousCashBalance',
            ...denominations.map(d => `[data-type="register"][data-denom="${d.key}"]`),
            ...denominations.map(d => `[data-type="safe"][data-denom="${d.key}"]`),
            '#remarks'
        ];
        
        let tabIndex = 1;
        focusableElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.setAttribute('tabindex', tabIndex++);
            });
        });
    } catch (error) {
        console.warn('フォーカス管理の改善でエラー:', error);
    }
}

/**
 * アクセシビリティの向上
 */
function improveAccessibility() {
    try {
        // aria-label の設定
        const taxInputs = document.querySelectorAll('.tax-input');
        taxInputs.forEach(input => {
            const parent = input.closest('.payment-method');
            const methodTitle = parent?.querySelector('.method-title')?.textContent;
            const isRate10 = input.id.includes('10');
            
            if (methodTitle) {
                input.setAttribute('aria-label', `${methodTitle} ${isRate10 ? '10%' : '8%'}税率`);
            }
        });
        
        // 必須項目のマーク
        if (appConfig && appConfig.VALIDATION && appConfig.VALIDATION.REQUIRED_FIELDS) {
            appConfig.VALIDATION.REQUIRED_FIELDS.forEach(fieldId => {
                const element = document.getElementById(fieldId);
                if (element) {
                    element.setAttribute('aria-required', 'true');
                }
            });
        }
    } catch (error) {
        console.warn('アクセシビリティ向上でエラー:', error);
    }
}

/**
 * パフォーマンス監視
 */
function monitorPerformance() {
    if (!window.performance) return;
    
    try {
        // ページ読み込み時間を記録
        window.addEventListener('load', function() {
            setTimeout(() => {
                const loadTime = performance.now();
                if (appConfig && appConfig.DEBUG) {
                    console.log(`ページ読み込み時間: ${loadTime.toFixed(2)}ms`);
                }
            }, 0);
        });
    } catch (error) {
        console.warn('パフォーマンス監視でエラー:', error);
    }
}

/**
 * バージョン情報の表示
 */
function showVersionInfo() {
    try {
        if (appConfig && appConfig.DEBUG) {
            console.log(`日次売上報告書システム v${appConfig.VERSION || 'unknown'}`);
            console.log('設定情報:', {
                paymentMethods: paymentMethodConfig ? paymentMethodConfig.length : 0,
                pointPayments: pointPaymentConfig ? pointPaymentConfig.length : 0,
                denominations: denominations ? denominations.length : 0,
                maxFiles: fileUploadConfig ? fileUploadConfig.MAX_FILES : 'unknown',
                maxFileSize: fileUploadConfig ? `${fileUploadConfig.MAX_FILE_SIZE / 1024 / 1024}MB` : 'unknown'
            });
        }
    } catch (error) {
        console.warn('バージョン情報表示でエラー:', error);
    }
}

/**
 * 開発モード用の機能
 */
function setupDevelopmentFeatures() {
    try {
        if (!appConfig || !appConfig.DEBUG) return;
        
        // デバッグ用のグローバル関数を設定
        window.debugApp = {
            showCurrentData: () => {
                console.log('現在のフォームデータ:', collectAllFormData());
            },
            clearAllData: () => {
                if (confirm('すべてのデータをクリアしますか？')) {
                    document.querySelectorAll('input[type="number"], input[type="text"], textarea, select').forEach(el => {
                        el.value = '';
                    });
                    updateAllCalculations();
                }
            },
            fillSampleData: () => {
                fillWithSampleData();
            },
            showStorageData: () => {
                const keys = Object.keys(localStorage).filter(key => key.includes('dailyReport_'));
                console.log('保存されたレポート:', keys);
                keys.forEach(key => {
                    console.log(key, JSON.parse(localStorage.getItem(key)));
                });
            }
        };
        
        console.log('デバッグ機能が利用可能です: window.debugApp');
    } catch (error) {
        console.warn('開発機能の設定でエラー:', error);
    }
}

/**
 * サンプルデータの入力（開発用）
 */
function fillWithSampleData() {
    try {
        if (!appConfig || !appConfig.DEBUG) return;
        
        const storeNameElement = document.getElementById('storeName');
        const inputByElement = document.getElementById('inputBy');
        
        if (storeNameElement) storeNameElement.value = 'テスト店舗';
        if (inputByElement) inputByElement.value = 'テスト担当者';
        
        // サンプル売上データ
        const cash10Element = document.getElementById('cash10');
        const cash8Element = document.getElementById('cash8');
        const card10Element = document.getElementById('card10');
        const card8Element = document.getElementById('card8');
        
        if (cash10Element) cash10Element.value = 5000;
        if (cash8Element) cash8Element.value = 3000;
        if (card10Element) card10Element.value = 10000;
        if (card8Element) card8Element.value = 2000;
        
        // サンプル経費
        const expenseInputs = document.querySelectorAll('[data-field="vendor"]');
        if (expenseInputs.length > 0) {
            const firstRecord = expenseInputs[0];
            const id = firstRecord.dataset.id;
            
            const vendorInput = document.querySelector(`[data-field="vendor"][data-id="${id}"]`);
            const accountSelect = document.querySelector(`[data-field="account"][data-id="${id}"]`);
            const itemInput = document.querySelector(`[data-field="item"][data-id="${id}"]`);
            const amountInput = document.querySelector(`[data-field="amount"][data-id="${id}"]`);
            
            if (vendorInput) vendorInput.value = 'サンプル購入先';
            if (accountSelect) accountSelect.value = '消耗品費';
            if (itemInput) itemInput.value = 'サンプル商品';
            if (amountInput) amountInput.value = 1000;
        }
        
        // サンプル現金データ
        const register1000 = document.querySelector('[data-type="register"][data-denom="bill1000"]');
        const safe1000 = document.querySelector('[data-type="safe"][data-denom="bill1000"]');
        const register100 = document.querySelector('[data-type="register"][data-denom="coin100"]');
        
        if (register1000) register1000.value = 10;
        if (safe1000) safe1000.value = 5;
        if (register100) register100.value = 20;
        
        // 備考
        const remarksElement = document.getElementById('remarks');
        if (remarksElement) remarksElement.value = 'これはサンプルデータです。';
        
        updateAllCalculations();
        showSuccess('サンプルデータを入力しました');
    } catch (error) {
        console.warn('サンプルデータ入力でエラー:', error);
    }
}

// アプリケーション開始時の処理
showVersionInfo();
setupDevelopmentFeatures();
monitorPerformance();

// DOM読み込み完了後に追加設定
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        try {
            improveFocusHandling();
            improveAccessibility();
        } catch (error) {
            console.warn('追加設定でエラー:', error);
        }
    }, 100);

    // 入金・雑収入セクションの入力フィールド
    const incomeInputs = [
        'nyukin',
        'miscIncome',
        'foundMoney'  // 拾得金を追加
    ];

    // 入金・雑収入の入力リスナーを設定
    incomeInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => {
                try {
                    updateIncomeCalculation();
                    updateSummaryCalculation();
                    updateCashDifferenceCalculation();
                } catch (error) {
                    console.warn(`${id}の計算更新でエラー:`, error);
                }
            });
        }
    });
});