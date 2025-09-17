/**
 * UI操作処理
 * 動的要素生成、DOM操作、イベントハンドリング
 */

/**
 * 支払い方法セクションを動的生成
 */
function generatePaymentMethods() {
    console.log('支払い方法セクションの生成を開始');
    
    const salesSection = document.querySelector('.section-green');
    if (!salesSection) {
        console.error('.section-green要素が見つかりません');
        throw new Error('売上セクションが見つかりません');
    }
    
    const sectionTitle = salesSection.querySelector('.section-title');
    const salesTotalSection = salesSection.querySelector('.section-total');
    
    if (!sectionTitle) {
        console.error('売上セクションのタイトルが見つかりません');
        throw new Error('売上セクションのタイトルが見つかりません');
    }
    
    if (!salesTotalSection) {
        console.error('売上合計セクションが見つかりません');
        throw new Error('売上合計セクションが見つかりません');
    }
    
    // 既存の支払い方法をクリア
    const existingMethods = salesSection.querySelectorAll('.payment-method');
    existingMethods.forEach(method => method.remove());
    console.log(`既存の支払い方法 ${existingMethods.length} 件をクリアしました`);
    
    if (!paymentMethodConfig || !Array.isArray(paymentMethodConfig)) {
        throw new Error('paymentMethodConfig が正しく定義されていません');
    }
    
    paymentMethodConfig.forEach((method, index) => {
        try {
            const methodDiv = document.createElement('div');
            methodDiv.className = 'payment-method';
            methodDiv.innerHTML = `
                <div class="method-title">${method.label}</div>
                <div class="tax-grid">
                    <div class="tax-header">税率10%</div>
                    <div class="tax-header">税率8%</div>
                    <div class="tax-header">合計</div>
                    <div><input type="number" id="${method.id}10" class="tax-input" placeholder="0"></div>
                    <div><input type="number" id="${method.id}8" class="tax-input" placeholder="0"></div>
                    <div class="tax-total" id="${method.id}Total">¥0</div>
                </div>
            `;
            
            // セクションタイトルの後、売上合計の前に挿入
            salesSection.insertBefore(methodDiv, salesTotalSection);
            console.log(`支払い方法「${method.label}」を生成しました`);
            
        } catch (error) {
            console.error(`支払い方法「${method.label}」の生成でエラー:`, error);
            throw new Error(`支払い方法「${method.label}」の生成に失敗しました`);
        }
    });
    
    console.log(`支払い方法セクションの生成完了（${paymentMethodConfig.length}件）`);
}

/**
 * ポイント・クーポン支払セクションを動的生成（税率対応版）
 */
function generateDiscountSection() {
    console.log('ポイント・クーポン支払セクションの生成を開始');
    
    const container = document.querySelector('.section-point');
    if (!container) {
        console.error('.section-point要素が見つかりません');
        throw new Error('ポイント・クーポン支払セクションが見つかりません');
    }
    
    const sectionTitle = container.querySelector('.section-title');
    const totalSection = container.querySelector('.section-total');
    
    if (!sectionTitle) {
        console.error('ポイント・クーポン支払セクションのタイトルが見つかりません');
        throw new Error('ポイント・クーポン支払セクションのタイトルが見つかりません');
    }
    
    if (!totalSection) {
        console.error('ポイント・クーポン支払合計セクションが見つかりません');
        throw new Error('ポイント・クーポン支払合計セクションが見つかりません');
    }
    
    // 既存の項目をクリア
    const existingMethods = container.querySelectorAll('.payment-method');
    existingMethods.forEach(method => method.remove());
    console.log(`既存のポイント・クーポン支払 ${existingMethods.length} 件をクリアしました`);
    
    if (!pointPaymentConfig || !Array.isArray(pointPaymentConfig)) {
        throw new Error('pointPaymentConfig が正しく定義されていません');
    }
    
    pointPaymentConfig.forEach((payment, index) => {
        try {
            const paymentDiv = document.createElement('div');
            paymentDiv.className = 'payment-method';
            paymentDiv.innerHTML = `
                <div class="method-title">${payment.label}</div>
                <div class="tax-grid">
                    <div class="tax-header">税率10%</div>
                    <div class="tax-header">税率8%</div>
                    <div class="tax-header">合計</div>
                    <div><input type="number" id="${payment.id}10" class="tax-input" placeholder="0"></div>
                    <div><input type="number" id="${payment.id}8" class="tax-input" placeholder="0"></div>
                    <div class="tax-total" id="${payment.id}Total">¥0</div>
                </div>
            `;
            
            // セクションタイトルの後、合計の前に挿入
            container.insertBefore(paymentDiv, totalSection);
            console.log(`ポイント・クーポン支払「${payment.label}」を生成しました`);
            
        } catch (error) {
            console.error(`ポイント・クーポン支払「${payment.label}」の生成でエラー:`, error);
            throw new Error(`ポイント・クーポン支払「${payment.label}」の生成に失敗しました`);
        }
    });
    
    console.log(`ポイント・クーポン支払セクションの生成完了（${pointPaymentConfig.length}件）`);
}

/**
 * 金種行生成
 */
function generateDenominationRows() {
    console.log('金種行の生成を開始');
    
    const container = document.getElementById('denominationRows');
    if (!container) {
        console.error('denominationRows要素が見つかりません');
        throw new Error('金種行のコンテナが見つかりません');
    }
    
    container.innerHTML = '';
    
    if (!denominations || !Array.isArray(denominations)) {
        throw new Error('denominations が正しく定義されていません');
    }

    denominations.forEach((denom, index) => {
        try {
            const row = document.createElement('div');
            row.className = 'cash-row';
            row.innerHTML = `
                <div class="denomination-label">${denom.label}</div>
                <div>
                    <input type="number" class="count-input" placeholder="0" 
                           data-type="register" data-denom="${denom.key}" onchange="updateCashCalculation()">
                </div>
                <div>
                    <input type="number" class="count-input" placeholder="0" 
                           data-type="safe" data-denom="${denom.key}" onchange="updateCashCalculation()">
                </div>
                <div class="count-display" id="count_${denom.key}">0枚</div>
                <div class="amount-display" id="amount_${denom.key}">¥0</div>
            `;
            container.appendChild(row);
            console.log(`金種「${denom.label}」の行を生成しました`);
            
        } catch (error) {
            console.error(`金種「${denom.label}」の行生成でエラー:`, error);
            throw new Error(`金種「${denom.label}」の行生成に失敗しました`);
        }
    });
    
    console.log(`金種行の生成完了（${denominations.length}件）`);
}

/**
 * 経費レコード追加
 */
function addExpenseRecord() {
    console.log('経費レコードを追加中');
    
    const container = document.getElementById('expenseRecords');
    if (!container) {
        console.error('expenseRecords要素が見つかりません');
        showError('経費レコードのコンテナが見つかりません');
        return;
    }
    
    if (!accountCategories || !Array.isArray(accountCategories)) {
        console.error('accountCategories が正しく定義されていません');
        showError('勘定科目の設定が正しくありません');
        return;
    }
    
    try {
        const newRecord = document.createElement('div');
        newRecord.className = 'expense-record';
        
        // 勘定科目のオプションを生成
        const accountOptions = accountCategories.map(category => 
            `<option value="${category.value}">${category.label}</option>`
        ).join('');
        
        newRecord.innerHTML = `
            <input type="text" class="expense-input" placeholder="購入先" data-field="vendor" data-id="${nextExpenseId}">
            <select class="expense-select" data-field="account" data-id="${nextExpenseId}">
                ${accountOptions}
            </select>
            <input type="text" class="expense-input" placeholder="品物・内容" data-field="item" data-id="${nextExpenseId}">
            <div class="expense-amount-wrapper">
                <span class="expense-amount-symbol">¥</span>
                <input type="number" class="expense-amount-input" placeholder="0" data-field="amount" data-id="${nextExpenseId}">
            </div>
            <button class="delete-button" onclick="removeExpenseRecord(${nextExpenseId})">
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
            </button>
        `;
        container.appendChild(newRecord);
        
        expenseRecords.push({id: nextExpenseId, vendor: '', account: '', item: '', amount: ''});
        console.log(`経費レコード ID:${nextExpenseId} を追加しました`);
        nextExpenseId++;
        
        updateDeleteButtonStates();
        
    } catch (error) {
        console.error('経費レコード追加でエラー:', error);
        showError('経費レコードの追加に失敗しました');
    }
}

/**
 * 経費レコード削除
 * @param {number} id 削除するレコードのID
 */
function removeExpenseRecord(id) {
    console.log(`経費レコード ID:${id} の削除を試行中`);
    
    if (expenseRecords.length <= 1) {
        console.warn('最後の経費レコードは削除できません');
        showError('最低1つの経費レコードは必要です');
        return;
    }
    
    try {
        const recordElement = document.querySelector(`[data-id="${id}"]`)?.closest('.expense-record');
        if (recordElement) {
            recordElement.remove();
            console.log(`経費レコード ID:${id} のDOM要素を削除しました`);
        } else {
            console.warn(`経費レコード ID:${id} のDOM要素が見つかりません`);
        }
        
        expenseRecords = expenseRecords.filter(record => record.id !== id);
        console.log(`経費レコード ID:${id} をデータから削除しました`);
        
        updateDeleteButtonStates();
        updateAllCalculations();
        
    } catch (error) {
        console.error(`経費レコード ID:${id} の削除でエラー:`, error);
        showError('経費レコードの削除に失敗しました');
    }
}

/**
 * 削除ボタンの状態更新
 */
function updateDeleteButtonStates() {
    try {
        const deleteButtons = document.querySelectorAll('.delete-button');
        deleteButtons.forEach(button => {
            button.disabled = expenseRecords.length <= 1;
        });
        console.log(`削除ボタンの状態を更新しました（${deleteButtons.length}個）`);
    } catch (error) {
        console.error('削除ボタン状態更新でエラー:', error);
    }
}

/**
 * イベントリスナー設定
 */
function setupEventListeners() {
    console.log('イベントリスナーの設定を開始');
    
    try {
        // 売上項目の計算（動的に生成されたIDに対応）
        if (paymentMethodConfig && Array.isArray(paymentMethodConfig)) {
            paymentMethodConfig.forEach(method => {
                const element10 = document.getElementById(`${method.id}10`);
                const element8 = document.getElementById(`${method.id}8`);
                
                if (element10) {
                    element10.addEventListener('input', updateAllCalculations);
                    console.log(`売上項目 ${method.id}10 にリスナーを設定`);
                } else {
                    console.warn(`売上項目 ${method.id}10 の要素が見つかりません`);
                }
                
                if (element8) {
                    element8.addEventListener('input', updateAllCalculations);
                    console.log(`売上項目 ${method.id}8 にリスナーを設定`);
                } else {
                    console.warn(`売上項目 ${method.id}8 の要素が見つかりません`);
                }
            });
        }

        // ポイント・クーポン支払の計算（税率対応版）
        if (pointPaymentConfig && Array.isArray(pointPaymentConfig)) {
            pointPaymentConfig.forEach(payment => {
                const element10 = document.getElementById(`${payment.id}10`);
                const element8 = document.getElementById(`${payment.id}8`);
                
                if (element10) {
                    element10.addEventListener('input', updateAllCalculations);
                    console.log(`ポイント・クーポン支払 ${payment.id}10 にリスナーを設定`);
                } else {
                    console.warn(`ポイント・クーポン支払 ${payment.id}10 の要素が見つかりません`);
                }
                
                if (element8) {
                    element8.addEventListener('input', updateAllCalculations);
                    console.log(`ポイント・クーポン支払 ${payment.id}8 にリスナーを設定`);
                } else {
                    console.warn(`ポイント・クーポン支払 ${payment.id}8 の要素が見つかりません`);
                }
            });
        }

        // 入金・雑収入の計算
        const incomeFields = ['nyukin', 'miscIncome', 'foundMoney'];
        incomeFields.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', updateAllCalculations);
                console.log(`入金・雑収入 ${id} にリスナーを設定`);
            } else {
                console.warn(`入金・雑収入 ${id} の要素が見つかりません`);
            }
        });

        // 前日現金残の計算
        const previousCashElement = document.getElementById('previousCashBalance');
        if (previousCashElement) {
            previousCashElement.addEventListener('input', updateAllCalculations);
            console.log('前日現金残にリスナーを設定');
        } else {
            console.warn('前日現金残の要素が見つかりません');
        }

        // 経費の計算（動的要素に対応）
        document.addEventListener('input', function(e) {
            if (e.target.dataset.field === 'amount') {
                updateAllCalculations();
            }
        });
        console.log('経費項目の動的リスナーを設定');
        
        console.log('イベントリスナーの設定完了');
        
    } catch (error) {
        console.error('イベントリスナー設定でエラー:', error);
        throw new Error('イベントリスナーの設定に失敗しました');
    }
}

/**
 * 備考・報告事項のイベントリスナー設定
 */
function setupRemarksListeners() {
    console.log('備考・報告事項リスナーの設定を開始');
    
    try {
        const remarksTextarea = document.getElementById('remarks');
        const charCount = document.getElementById('charCount');
        
        if (!remarksTextarea) {
            console.warn('remarks要素が見つかりません');
            return;
        }
        
        if (!charCount) {
            console.warn('charCount要素が見つかりません');
            return;
        }
        
        remarksTextarea.addEventListener('input', function() {
            try {
                const currentLength = remarksTextarea.value.length;
                charCount.textContent = currentLength;
                
                // 文字数による色分け
                const charCountElement = charCount.parentElement;
                if (charCountElement) {
                    charCountElement.classList.remove('warning', 'error');
                    
                    if (currentLength > 900) {
                        charCountElement.classList.add('error');
                    } else if (currentLength > 800) {
                        charCountElement.classList.add('warning');
                    }
                }
                
            } catch (error) {
                console.error('備考文字数カウント処理でエラー:', error);
            }
        });
        
        console.log('備考・報告事項リスナーの設定完了');
        
    } catch (error) {
        console.error('備考・報告事項リスナー設定でエラー:', error);
        console.warn('備考・報告事項の機能が制限される可能性があります');
    }
}

/**
 * フォームにデータを読み込む（税率対応版）
 * @param {Object} data 読み込むデータ
 */
function loadDataIntoForm(data) {
    console.log('フォームへのデータ読み込みを開始');
    
    try {
        // 基本情報
        const dateElement = document.getElementById('date');
        const storeNameElement = document.getElementById('storeName');
        const inputByElement = document.getElementById('inputBy');
        
        if (dateElement && data.date) {
            dateElement.value = data.date;
            console.log('日付を設定しました:', data.date);
        }
        
        if (storeNameElement && data.storeName) {
            // 管理者モードでも店舗名を強制設定
            const isAdminMode = storeNameElement.getAttribute('data-admin-mode') === 'true';
            
            if (isAdminMode) {
                const wasReadOnly = storeNameElement.readOnly;
                const wasDisabled = storeNameElement.disabled;
                
                storeNameElement.readOnly = false;
                storeNameElement.disabled = false;
                storeNameElement.value = data.storeName;
                
                storeNameElement.readOnly = wasReadOnly;
                storeNameElement.disabled = wasDisabled;
            } else {
                storeNameElement.value = data.storeName;
            }
            console.log('店舗名を設定しました:', data.storeName);
        }
        
        if (inputByElement && data.inputBy) {
            inputByElement.value = data.inputBy;
            console.log('担当者を設定しました:', data.inputBy);
        }
        
        // 売上情報（動的に対応）
        if (data.sales && paymentMethodConfig) {
            paymentMethodConfig.forEach(method => {
                const element10 = document.getElementById(`${method.id}10`);
                const element8 = document.getElementById(`${method.id}8`);
                
                if (element10 && data.sales[`${method.id}10`] !== undefined) {
                    element10.value = data.sales[`${method.id}10`] || 0;
                }
                if (element8 && data.sales[`${method.id}8`] !== undefined) {
                    element8.value = data.sales[`${method.id}8`] || 0;
                }
            });
        }
        
        // ポイント・クーポン支払情報
        if (data.pointPayments && pointPaymentConfig) {
            pointPaymentConfig.forEach(payment => {
                const element10 = document.getElementById(`${payment.id}10`);
                const element8 = document.getElementById(`${payment.id}8`);
                
                if (element10 && data.pointPayments[`${payment.id}10`] !== undefined) {
                    element10.value = data.pointPayments[`${payment.id}10`] || 0;
                }
                if (element8 && data.pointPayments[`${payment.id}8`] !== undefined) {
                    element8.value = data.pointPayments[`${payment.id}8`] || 0;
                }
            });
        }
        
        // 入金・雑収入
        if (data.income) {
            const nyukinElement = document.getElementById('nyukin');
            const miscIncomeElement = document.getElementById('miscIncome');
            const foundMoneyElement = document.getElementById('foundMoney');
            
            if (nyukinElement && data.income.nyukin !== undefined) {
                nyukinElement.value = data.income.nyukin || 0;
            }
            if (miscIncomeElement && data.income.miscIncome !== undefined) {
                miscIncomeElement.value = data.income.miscIncome || 0;
            }
            if (foundMoneyElement && data.income.foundMoney !== undefined) {
                foundMoneyElement.value = data.income.foundMoney || 0;
            }
        }
        
        // 前日現金残
        if (data.previousCashBalance !== undefined) {
            const previousCashElement = document.getElementById('previousCashBalance');
            if (previousCashElement) {
                previousCashElement.value = data.previousCashBalance || 0;
            }
        }
        
        // 現金管理データ
        if (data.cash && denominations) {
            console.log('現金データの復元を開始:', data.cash);
            
            // 新形式の合計金額をログ出力
            if (data.cash.totals) {
                console.log('保存された合計金額:', {
                    registerTotal: `¥${data.cash.totals.registerTotal?.toLocaleString() || 0}`,
                    safeTotal: `¥${data.cash.totals.safeTotal?.toLocaleString() || 0}`,
                    totalCash: `¥${data.cash.totals.totalCash?.toLocaleString() || 0}`
                });
            }
            
            denominations.forEach(denom => {
                const registerInput = document.querySelector(`[data-type="register"][data-denom="${denom.key}"]`);
                const safeInput = document.querySelector(`[data-type="safe"][data-denom="${denom.key}"]`);
                
                if (registerInput && data.cash[denom.key]?.register !== undefined) {
                    registerInput.value = data.cash[denom.key].register || 0;
                }
                if (safeInput && data.cash[denom.key]?.safe !== undefined) {
                    safeInput.value = data.cash[denom.key].safe || 0;
                }
            });
            
            console.log('現金データの復元完了');
        }
        
        // 経費データ
        if (data.expenses && Array.isArray(data.expenses) && data.expenses.length > 0) {
            expenseRecords = [];
            nextExpenseId = 1;
            const expenseContainer = document.getElementById('expenseRecords');
            if (expenseContainer) {
                expenseContainer.innerHTML = '';
            }
            
            data.expenses.forEach((expense, index) => {
                addExpenseRecord();
                const currentId = nextExpenseId - 1;
                
                const vendorInput = document.querySelector(`[data-field="vendor"][data-id="${currentId}"]`);
                const accountSelect = document.querySelector(`[data-field="account"][data-id="${currentId}"]`);
                const itemInput = document.querySelector(`[data-field="item"][data-id="${currentId}"]`);
                const amountInput = document.querySelector(`[data-field="amount"][data-id="${currentId}"]`);
                
                if (vendorInput) vendorInput.value = expense.vendor || '';
                if (accountSelect) accountSelect.value = expense.account || '';
                if (itemInput) itemInput.value = expense.item || '';
                if (amountInput) amountInput.value = expense.amount || 0;
            });
        }
        
        // 備考・報告事項
        if (data.remarks) {
            const remarksElement = document.getElementById('remarks');
            if (remarksElement) {
                remarksElement.value = data.remarks;
                const charCount = document.getElementById('charCount');
                if (charCount) {
                    charCount.textContent = data.remarks.length;
                }
            }
        }

        // 添付ファイル復元
        if (data.attachedFiles && Array.isArray(data.attachedFiles) && data.attachedFiles.length > 0) {
            generateFileInputs();
            
            data.attachedFiles.forEach((fileData, index) => {
                if (fileData && fileData.attachmentNumber && fileData.fileName) {
                    const attachmentIndex = fileData.attachmentNumber - 1;
                    if (attachmentIndex >= 0 && attachmentIndex < attachedFiles.length) {
                        const restoredFile = createFileFromBase64(fileData);
                        
                        if (restoredFile) {
                            attachedFiles[attachmentIndex] = {
                                id: fileData.attachmentNumber,
                                file: restoredFile,
                                fileName: fileData.fileName,
                                fileSize: fileData.fileSize,
                                hasFile: true
                            };
                            
                            updateFileDisplayFromData(fileData.attachmentNumber, fileData);
                        }
                    }
                }
            });
        }

        // 手動税率入力データ
        if (data.manualTaxInputs) {
            const manual10Input = document.getElementById('manual10Percent');
            const manual8Input = document.getElementById('manual8Percent');
            
            if (manual10Input && data.manualTaxInputs.manual10Percent !== null && data.manualTaxInputs.manual10Percent !== undefined) {
                manual10Input.value = data.manualTaxInputs.manual10Percent;
            }
            if (manual8Input && data.manualTaxInputs.manual8Percent !== null && data.manualTaxInputs.manual8Percent !== undefined) {
                manual8Input.value = data.manualTaxInputs.manual8Percent;
            }
            console.log('手動税率入力データを復元しました:', data.manualTaxInputs);
        }
        
        // 計算を更新
        updateAllCalculations();
    
        // *** 重要：ステータスに応じた処理 ***
        if (data.status) {
            console.log('読み込まれたデータのステータス:', data.status);
            console.log('現在のユーザー種別:', window.isAdminUser ? '管理者' : '一般ユーザー');
            
            // 確定ボタンの状態を更新
            updateConfirmButtonState(data.status);
            
            // 確定済みの場合は全フォームを読み取り専用にする
            if (data.status === 'approved') {
                console.log('確定済みのため、確定済みデータが読み込まれました');
                setFormReadOnly(true);
                showConfirmedMessage();
                updateSubmitButtonForConfirmed();
            } else {
                // 確定済みでない場合は編集可能
                setFormReadOnly(false);
                hideConfirmedMessage();
                updateSubmitButtonForNormal();
                console.log('編集可能状態に設定しました');
            }
        }else {
            console.log('ステータス情報がありません。編集可能状態にします。');
            // ステータス情報がない場合は編集可能
            setFormReadOnly(false);
            hideConfirmedMessage();
            updateSubmitButtonForNormal();
        }
        
        console.log('フォームへのデータ読み込み完了');
        
    } catch (error) {
        console.error('フォームデータ読み込みでエラー:', error);
        throw error;
    }
}

/**
 * 送信ボタンを確定済み状態に更新（一般ユーザー用）
 */
function updateSubmitButtonForConfirmed() {
    const submitButton = document.querySelector('.submit-button');
    if (!submitButton) {
        console.warn('送信ボタンが見つかりません');
        return;
    }
    
    // 確定済み表示に変更
    submitButton.innerHTML = `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        確定済み
    `;
    submitButton.className = 'submit-button confirmed';
    submitButton.disabled = true;
    
    console.log('✅ 送信ボタンを確定済み状態に変更しました');
}

/**
 * 送信ボタンを通常状態に更新（一般ユーザー用）
 */
function updateSubmitButtonForNormal() {
    const submitButton = document.querySelector('.submit-button');
    if (!submitButton) {
        console.warn('送信ボタンが見つかりません');
        return;
    }
    
    // 通常の送信ボタンに戻す
    submitButton.innerHTML = `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H9V7h6v2z"/>
        </svg>
        経理課に送信
    `;
    submitButton.className = 'submit-button';
    submitButton.disabled = false;
    
    console.log('✅ 送信ボタンを通常状態に戻しました');
}

/*
 * 確定済みメッセージを表示
 */
function showConfirmedMessage() {
    // 既存のメッセージがあれば削除
    hideConfirmedMessage();
    
    const messageDiv = document.createElement('div');
    messageDiv.id = 'confirmedMessage';
    messageDiv.style.cssText = `
        background: linear-gradient(135deg, #fef3c7, #fed7aa);
        border: 2px solid #d97706;
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
        text-align: center;
        font-weight: bold;
        color: #92400e;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: fadeIn 0.3s ease-in;
    `;
    
    messageDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <span style="font-size: 1.2rem;">🔒</span>
            <span>この日報は確定済みです。編集はできません。</span>
        </div>
    `;
    
    // ヘッダーの下に挿入
    const headerElement = document.querySelector('.header');
    if (headerElement && headerElement.parentNode) {
        headerElement.parentNode.insertBefore(messageDiv, headerElement.nextSibling);
    }
}

/**
 * 確定済みメッセージを非表示
 */
function hideConfirmedMessage() {
    const existingMessage = document.getElementById('confirmedMessage');
    if (existingMessage) {
        existingMessage.remove();
    }
}

/**
 * フォーム全体を読み取り専用にする
 */
function setFormReadOnly(readOnly) {
    try {
        // 全ての入力フィールドを取得
        const inputs = document.querySelectorAll('input[type="number"], input[type="text"], input[type="date"], textarea, select');
        
        inputs.forEach(input => {
            if (readOnly) {
                input.setAttribute('readonly', 'true');
                input.style.backgroundColor = '#f8f9fa';
                input.style.cursor = 'not-allowed';
                input.style.opacity = '0.7';
            } else {
                input.removeAttribute('readonly');
                input.style.backgroundColor = '';
                input.style.cursor = '';
                input.style.opacity = '';
            }
        });
        
        // ファイル入力も無効化
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.disabled = readOnly;
        });
        
        // 経費追加ボタンなどの操作ボタンも無効化
        const actionButtons = document.querySelectorAll('.add-button, .delete-button, .clear-file-button');
        actionButtons.forEach(button => {
            button.disabled = readOnly;
            if (readOnly) {
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
            } else {
                button.style.opacity = '';
                button.style.cursor = '';
            }
        });
        
        console.log(`フォームを${readOnly ? '読み取り専用' : '編集可能'}に設定しました`);
        
    } catch (error) {
        console.error('フォーム読み取り専用設定でエラー:', error);
    }
}

/**
 * 印刷処理
 */
function handlePrint() {
    try {
        console.log('印刷処理を開始');
        window.print();
    } catch (error) {
        console.error('印刷処理でエラー:', error);
        showError('印刷処理でエラーが発生しました');
    }
}

/**
 * 現在の日付を取得してフォーマット
 * @returns {string} YYYY-MM-DD形式の日付
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

/**
 * エラーメッセージを表示
 * @param {string} message エラーメッセージ
 */
function showError(message) {
    try {
        console.error('エラーメッセージ:', message);
        alert(message); // 後でより良いUI（モーダル等）に置き換え予定
    } catch (error) {
        console.error('エラーメッセージ表示でエラー:', error);
    }
}

/**
 * 成功メッセージを表示
 * @param {string} message 成功メッセージ
 */
function showSuccess(message) {
    try {
        console.log('成功メッセージ:', message);
        alert(message); // 後でより良いUI（トースト等）に置き換え予定
    } catch (error) {
        console.error('成功メッセージ表示でエラー:', error);
    }
}

/**
 * アプリケーション状態のリセット
 */

/**
 * 確定状態を詳細表示（改善版）
 * @param {string} status ステータス
 * @param {string} date 日付
 * @param {string} storeName 店舗名
 */
function displayConfirmationStatus(status, date, storeName) {
    try {
        // 既存の状態表示を削除
        const existingStatus = document.getElementById('confirmationStatusDisplay');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        let statusDisplay = null;
        
        if (status === 'approved') {
            // 確定済み状態の詳細表示
            statusDisplay = document.createElement('div');
            statusDisplay.id = 'confirmationStatusDisplay';
            statusDisplay.style.cssText = `
                background: linear-gradient(135deg, #fef3c7, #fed7aa);
                border: 2px solid #d97706;
                border-radius: 12px;
                padding: 1rem;
                margin: 1rem 0;
                text-align: center;
                font-weight: bold;
                color: #92400e;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                animation: statusFadeIn 0.5s ease-in;
            `;
            
            statusDisplay.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                    <span style="font-size: 1.5rem;">🔒</span>
                    <span style="font-size: 1.1rem;">確定済み日報</span>
                </div>
                <div style="font-size: 0.9rem; opacity: 0.8;">
                    ${date} - ${storeName}
                </div>
                <div style="font-size: 0.85rem; margin-top: 0.5rem; opacity: 0.7;">
                    ${window.isAdminUser ? '管理者権限により閲覧・編集可能' : 'この日報は確定済みのため編集できません'}
                </div>
            `;
            
        } else if (status === 'submitted') {
            // 提出済み（未確定）状態の表示
            statusDisplay = document.createElement('div');
            statusDisplay.id = 'confirmationStatusDisplay';
            statusDisplay.style.cssText = `
                background: linear-gradient(135deg, #dbeafe, #bfdbfe);
                border: 2px solid #3b82f6;
                border-radius: 12px;
                padding: 1rem;
                margin: 1rem 0;
                text-align: center;
                font-weight: bold;
                color: #1e40af;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                animation: statusFadeIn 0.5s ease-in;
            `;
            
            statusDisplay.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                    <span style="font-size: 1.5rem;">📋</span>
                    <span style="font-size: 1.1rem;">提出済み（未確定）</span>
                </div>
                <div style="font-size: 0.9rem; opacity: 0.8;">
                    ${date} - ${storeName}
                </div>
                <div style="font-size: 0.85rem; margin-top: 0.5rem; opacity: 0.7;">
                    ${window.isAdminUser ? '管理者権限により確定操作が可能です' : '管理者による確定をお待ちください'}
                </div>
            `;
        }
        
        // 状態表示を挿入
        if (statusDisplay) {
            const headerElement = document.querySelector('.header');
            if (headerElement && headerElement.parentNode) {
                headerElement.parentNode.insertBefore(statusDisplay, headerElement.nextSibling);
            }
            
            // アニメーション用CSS追加
            if (!document.getElementById('statusAnimationCSS')) {
                const style = document.createElement('style');
                style.id = 'statusAnimationCSS';
                style.textContent = `
                    @keyframes statusFadeIn {
                        0% { 
                            opacity: 0; 
                            transform: translateY(-10px); 
                        }
                        100% { 
                            opacity: 1; 
                            transform: translateY(0); 
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
    } catch (error) {
        console.error('確定状態表示でエラー:', error);
    }
}


// 関数をグローバルスコープに明示的に公開
window.generatePaymentMethods = generatePaymentMethods;
window.generateDiscountSection = generateDiscountSection;
window.generateDenominationRows = generateDenominationRows;
window.setupEventListeners = setupEventListeners;
window.setupRemarksListeners = setupRemarksListeners;
window.loadDataIntoForm = loadDataIntoForm;
window.setFormReadOnly = setFormReadOnly;
window.showError = showError;
window.showSuccess = showSuccess;

console.log('✅ ui.js: 関数をグローバルスコープに公開しました');