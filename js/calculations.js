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
    updateSummaryCalculation();
    updateCashDifferenceCalculation();
    updatePrintSummary();
}

/**
 * 売上計算更新
 */
function updateSalesCalculation() {
    let salesTotal = 0;
    
    // 動的な支払い方法の計算
    paymentMethodConfig.forEach(method => {
        const element10 = document.getElementById(`${method.id}10`);
        const element8 = document.getElementById(`${method.id}8`);
        
        if (element10 && element8) {
            const amount10 = parseFloat(element10.value) || 0;
            const amount8 = parseFloat(element8.value) || 0;
            const methodTotal = amount10 + amount8;
            
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
    
    pointPaymentConfig.forEach(payment => {
        const element10 = document.getElementById(`${payment.id}10`);
        const element8 = document.getElementById(`${payment.id}8`);
        
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
    paymentMethodConfig.forEach(method => {
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
    pointPaymentConfig.forEach(payment => {
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
    
    // 売上総額と税率別集計を表示
    updateElementValue('summaryTotalSales', totalSales);
    updateElementValue('summary10Percent', total10Percent);
    updateElementValue('summary8Percent', total8Percent);

    // 現金売上（現金項目のみを合計）
    let cashSales = 0;
    paymentMethodConfig.forEach(method => {
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