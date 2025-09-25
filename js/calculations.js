/**
 * 計算処理
 * 売上、経費、現金管理などの計算機能
 */

/**
 * 全ての計算を更新
 */
function updateAllCalculations() {
    updateSalesCalculation();
    updatePointPaymentCalculation();
    updateIncomeCalculation();
    updateExpenseCalculation();
    updateCashCalculation(); 
    updateSummaryCalculation();
    updateCashDifferenceCalculation();
    updatePrintSummary();
}

/**
 * 売上計算更新
 */
function updateSalesCalculation() {
    let salesTotal = 0;
    
    // 動的な支払い方法の計算（最新の設定を使用）
    const currentPaymentConfig = window.paymentMethodConfig || paymentMethodConfig || [];
    console.log('🔍 売上計算で使用する設定:', currentPaymentConfig.length, '件');
    console.log('🔍 設定詳細:', currentPaymentConfig.map(m => m.id));

    currentPaymentConfig.forEach(method => {
        const element10 = document.getElementById(`${method.id}10`);
        const element8 = document.getElementById(`${method.id}8`);

        console.log(`🔍 ${method.id}: DOM要素存在チェック`, {
            element10: !!element10,
            element8: !!element8,
            value10: element10?.value,
            value8: element8?.value
        });
        
        if (element10 && element8) {
            const amount10 = parseFloat(element10.value) || 0;
            const amount8 = parseFloat(element8.value) || 0;
            const methodTotal = amount10 + amount8;
            // 🔧 追加：計算詳細ログ
            if (methodTotal > 0) {
                console.log(`✅ ${method.id}: 計算対象 ${methodTotal}円`);
            }
            
            // 各支払い方法の合計を表示
            const totalElement = document.getElementById(`${method.id}Total`);
            if (totalElement) {
                totalElement.textContent = `¥${methodTotal.toLocaleString()}`;
            }
            
            // 総売上に加算
            salesTotal += methodTotal;
        }
    });

    // 総売上表示
    const salesTotalElement = document.getElementById('salesTotal');
    if (salesTotalElement) {
        salesTotalElement.textContent = `¥${salesTotal.toLocaleString()}`;
    }
}

/**
 * ポイント・クーポン支払計算更新（税率対応版）
 */
function updatePointPaymentCalculation() {
    let pointPaymentTotal = 0;
    
    // 最新のポイント支払設定を使用
    const currentPointConfig = window.pointPaymentConfig || pointPaymentConfig || [];
    console.log('🔍 ポイント計算で使用する設定:', currentPointConfig.length, '件');
    
    currentPointConfig.forEach(payment => {
        const element10 = document.getElementById(`${payment.id}10`);
        const element8 = document.getElementById(`${payment.id}8`);

        console.log(`🔍 ポイント ${payment.id}: DOM要素存在チェック`, {
            element10: !!element10,
            element8: !!element8,
            value10: element10?.value,
            value8: element8?.value
        });
        
        if (element10 && element8) {
            const amount10 = parseFloat(element10.value) || 0;
            const amount8 = parseFloat(element8.value) || 0;
            const paymentTotal = amount10 + amount8;
            
            // 各ポイント・クーポン支払の合計を表示
            const totalElement = document.getElementById(`${payment.id}Total`);
            if (totalElement) {
                totalElement.textContent = `¥${paymentTotal.toLocaleString()}`;
            }
            
            // 総ポイント・クーポン支払に加算
            pointPaymentTotal += paymentTotal;
        }
    });
    
    // ポイント・クーポン支払合計を表示
    const pointPaymentTotalElement = document.getElementById('pointPaymentTotal');
    if (pointPaymentTotalElement) {
        pointPaymentTotalElement.textContent = `¥${pointPaymentTotal.toLocaleString()}`;
    }
}

/**
 * 入金・雑収入計算更新
 */
function updateIncomeCalculation() {
    const nyukin = parseFloat(document.getElementById('nyukin')?.value) || 0;
    const miscIncome = parseFloat(document.getElementById('miscIncome')?.value) || 0;
    const foundMoney = parseFloat(document.getElementById('foundMoney')?.value) || 0; // 追加
    const incomeTotal = nyukin + miscIncome + foundMoney; // foundMoneyを追加
    
    const incomeTotalElement = document.getElementById('incomeTotal');
    if (incomeTotalElement) {
        incomeTotalElement.textContent = `¥${incomeTotal.toLocaleString()}`;
    }
}

/**
 * 経費計算更新
 */
function updateExpenseCalculation() {
    const expenseTotal = calculateExpenseTotal();
    
    const expenseTotalElement = document.getElementById('expenseTotal');
    if (expenseTotalElement) {
        expenseTotalElement.textContent = `¥${expenseTotal.toLocaleString()}`;
    }
}

/**
 * 経費合計を計算
 * @returns {number} 経費合計
 */
function calculateExpenseTotal() {
    const expenseInputs = document.querySelectorAll('[data-field="amount"]');
    return Array.from(expenseInputs).reduce((total, input) => {
        const value = parseFloat(input.value) || 0;
        return total + value;
    }, 0);
}

/**
 * 日報集計計算更新（税率対応版）
 */
function updateSummaryCalculation() {
    // 売上総額（通常の支払い方法 + ポイント・クーポン支払）
    let totalSales = 0;
    let total10Percent = 0;
    let total8Percent = 0;
    
    // 通常の支払い方法
    const currentPaymentConfig = window.paymentMethodConfig || paymentMethodConfig || [];
    currentPaymentConfig.forEach(method => {
        const element10 = document.getElementById(`${method.id}10`);
        const element8 = document.getElementById(`${method.id}8`);
        
        if (element10 && element8) {
            const amount10 = parseFloat(element10.value) || 0;
            const amount8 = parseFloat(element8.value) || 0;
            total10Percent += amount10;
            total8Percent += amount8;
            totalSales += amount10 + amount8;
        }
    });
    
    // ポイント・クーポン支払
    const currentPointConfig = window.pointPaymentConfig || pointPaymentConfig || [];
    currentPointConfig.forEach(payment => {
        const element10 = document.getElementById(`${payment.id}10`);
        const element8 = document.getElementById(`${payment.id}8`);
        
        if (element10 && element8) {
            const amount10 = parseFloat(element10.value) || 0;
            const amount8 = parseFloat(element8.value) || 0;
            total10Percent += amount10;
            total8Percent += amount8;
            totalSales += amount10 + amount8;
        }
    });
    
    // 売上総額と税率別集計を表示（手動入力対応版）
    updateElementValue('summaryTotalSales', totalSales);

    // 手動入力値をチェック
    const manual10Input = document.getElementById('manualPercent10');
    const manual8Input = document.getElementById('manualPercent8');

    const manual10Value = manual10Input && manual10Input.value !== '' ? parseFloat(manual10Input.value) || 0 : null;
    const manual8Value = manual8Input && manual8Input.value !== '' ? parseFloat(manual8Input.value) || 0 : null;

    // 手動入力がある場合はその値を使用、ない場合は自動計算値を使用
    const display10Percent = manual10Value !== null ? manual10Value : total10Percent;
    const display8Percent = manual8Value !== null ? manual8Value : total8Percent;

    updateElementValue('summaryPercent10', display10Percent);
    updateElementValue('summaryPercent8', display8Percent);

    // 手動入力時の視覚的フィードバック
    if (manual10Input) {
        manual10Input.style.backgroundColor = manual10Value !== null ? '#fef3c7' : '';
    }
    if (manual8Input) {
        manual8Input.style.backgroundColor = manual8Value !== null ? '#fef3c7' : '';
    }

    // 現金売上（現金項目のみを合計）
    let cashSales = 0;
    currentPaymentConfig.forEach(method => {
        if (method.isCash) {
            const element10 = document.getElementById(`${method.id}10`);
            const element8 = document.getElementById(`${method.id}8`);
            
            if (element10 && element8) {
                const amount10 = parseFloat(element10.value) || 0;
                const amount8 = parseFloat(element8.value) || 0;
                cashSales += amount10 + amount8;
            }
        }
    });
    updateElementValue('summaryCashSales', cashSales);

    // 雑収入と拾得金を取得
    const miscIncome = parseFloat(document.getElementById('miscIncome')?.value) || 0;
    const foundMoney = parseFloat(document.getElementById('foundMoney')?.value) || 0;

    // 合計に反映
    updateElementValue('summaryMiscIncome', miscIncome + foundMoney); // 雑収入と拾得金を合算

    // 出金額（経費）
    const expenses = calculateExpenseTotal();
    updateElementValue('summaryExpenses', expenses);

    // 入金額
    const deposit = parseFloat(document.getElementById('nyukin')?.value) || 0;
    updateElementValue('summaryDeposit', deposit);

    // 前日現金残を取得
    const previousCash = parseFloat(document.getElementById('previousCashBalance')?.value) || 0;
    updateElementValue('summaryPreviousCash', previousCash);
    
    // 本日現金残の計算（入金は銀行への振込なので減算）
    const todayBalance = previousCash + cashSales + miscIncome + foundMoney - expenses - deposit;
    updateElementValue('todayCashBalance', todayBalance);

    // 理論残高の更新
    updateElementValue('theoreticalBalance', todayBalance);
}

/**
 * 現金過不足計算
 */
function updateCashDifferenceCalculation() {
    const theoreticalBalanceElement = document.getElementById('theoreticalBalance');
    const theoreticalBalanceText = theoreticalBalanceElement?.textContent?.replace(/[¥,]/g, '') || '0';
    const theoreticalBalance = parseFloat(theoreticalBalanceText) || 0;
    
    const actualBalanceElement = document.getElementById('totalCash');
    const actualBalanceText = actualBalanceElement?.textContent?.replace(/[¥,]/g, '') || '0';
    const actualBalance = parseFloat(actualBalanceText) || 0;
    
    // 実際残高を表示
    updateElementValue('actualBalance', actualBalance);
    
    // 過不足を計算
    const difference = actualBalance - theoreticalBalance;
    const differenceElement = document.getElementById('cashDifference');
    
    if (differenceElement) {
        differenceElement.textContent = `${difference >= 0 ? '+' : ''}¥${difference.toLocaleString()}`;
        
        // 色分け
        if (difference > 0) {
            differenceElement.style.color = '#059669'; // プラス：緑
        } else if (difference < 0) {
            differenceElement.style.color = '#dc2626'; // マイナス：赤
        } else {
            differenceElement.style.color = '#374151'; // ゼロ：グレー
        }
    }
}

/**
 * 現金計算更新
 */
function updateCashCalculation() {
    let registerTotal = 0;
    let safeTotal = 0;

    denominations.forEach(denom => {
        const registerInput = document.querySelector(`[data-type="register"][data-denom="${denom.key}"]`);
        const safeInput = document.querySelector(`[data-type="safe"][data-denom="${denom.key}"]`);
        
        if (registerInput && safeInput) {
            const registerCount = parseInt(registerInput.value) || 0;
            const safeCount = parseInt(safeInput.value) || 0;
            const totalCount = registerCount + safeCount;
            const totalAmount = totalCount * denom.value;

            // 各金種の枚数と金額を更新
            const countElement = document.getElementById(`count_${denom.key}`);
            const amountElement = document.getElementById(`amount_${denom.key}`);
            
            if (countElement) {
                countElement.textContent = `${totalCount}枚`;
            }
            if (amountElement) {
                amountElement.textContent = `¥${totalAmount.toLocaleString()}`;
            }

            registerTotal += registerCount * denom.value;
            safeTotal += safeCount * denom.value;
        }
    });

    // 合計を更新
    updateElementValue('registerTotal', registerTotal);
    updateElementValue('safeTotal', safeTotal);
    updateElementValue('totalCash', registerTotal + safeTotal);
    
    // 現金過不足計算も更新
    updateCashDifferenceCalculation();
}

/**
 * 印刷用サマリー更新
 */
function updatePrintSummary() {
    const elementsToSync = [
        {from: 'summaryTotalSales', to: 'printTotalSales'},
        {from: 'summaryCashSales', to: 'printCashSales'},
        {from: 'todayCashBalance', to: 'printTodayBalance'},
        {from: 'cashDifference', to: 'printCashDifference'}
    ];

    elementsToSync.forEach(sync => {
        const sourceElement = document.getElementById(sync.from);
        const targetElement = document.getElementById(sync.to);
        
        if (sourceElement && targetElement) {
            targetElement.textContent = sourceElement.textContent;
        }
    });
}

/**
 * 要素の値を通貨形式で更新するヘルパー関数
 * @param {string} elementId 要素ID
 * @param {number} value 値
 */
function updateElementValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = `¥${value.toLocaleString()}`;
    }
}

/**
 * 数値のフォーマット関数
 * @param {number} value 数値
 * @returns {string} フォーマットされた文字列
 */
function formatCurrency(value) {
    return `¥${value.toLocaleString()}`;
}

/**
 * パーセントのフォーマット関数
 * @param {number} value 数値
 * @returns {string} フォーマットされた文字列
 */
function formatPercent(value) {
    return `${value.toFixed(1)}%`;
}

// 関数をグローバルスコープに明示的に公開
if (typeof window !== 'undefined') {
    window.updateAllCalculations = updateAllCalculations;
    window.updateSalesCalculation = updateSalesCalculation;
    window.updateExpenseCalculation = updateExpenseCalculation;
    window.updateCashCalculation = updateCashCalculation;
    window.formatCurrency = formatCurrency;
    window.formatPercent = formatPercent;
    
    console.log('✅ calculations.js: 関数をグローバルスコープに公開しました');
}
/**
 * 手動税率入力をクリア
 */
function clearManualTaxInputs() {
    try {
        const manual10Input = document.getElementById('manualPercent10');
        const manual8Input = document.getElementById('manualPercent8');
        
        if (manual10Input) {
            manual10Input.value = '';
            manual10Input.style.backgroundColor = '';
        }
        
        if (manual8Input) {
            manual8Input.value = '';
            manual8Input.style.backgroundColor = '';
        }
        
        // 計算を更新して自動計算に戻す
        updateAllCalculations();
        
        console.log('手動税率入力をクリアしました（自動計算に戻る）');
        
    } catch (error) {
        console.error('手動税率入力クリアでエラー:', error);
        showError('税率入力のクリアに失敗しました');
    }
}

// 手動税率入力の処理
function clearManualTaxInputs() {
    document.getElementById('manualPercent10').value = '';
    document.getElementById('manualPercent8').value = '';
    updateAllCalculations();
}

// 手動税率入力時の処理（片方に値を入力したら相手側が空の場合は0にする）
function handleManualTaxInput(inputId) {
    const manual10Input = document.getElementById('manualPercent10');
    const manual8Input = document.getElementById('manualPercent8');

    if (inputId === 'manualPercent10') {
        if (manual10Input.value && manual10Input.value !== '') {
            // 10%に値が入力された場合、8%が空欄なら0にする
            if (!manual8Input.value || manual8Input.value === '') {
                manual8Input.value = '0';
            }
        }
    } else if (inputId === 'manualPercent8') {
        if (manual8Input.value && manual8Input.value !== '') {
            // 8%に値が入力された場合、10%が空欄なら0にする
            if (!manual10Input.value || manual10Input.value === '') {
                manual10Input.value = '0';
            }
        }
    }
    
    updateAllCalculations();
}

// 関数をグローバルスコープに公開
if (typeof window !== 'undefined') {
    window.clearManualTaxInputs = clearManualTaxInputs;
}