/**
 * データ管理
 * データの保存、読み込み、バリデーション、API連携
 */

/**
 * 当日データ読込処理
 */
function loadTodayData() {
    console.log('当日データ読込処理を開始');
    
    try {
        const today = getCurrentDate();
        const dateElement = document.getElementById('date');
        if (dateElement) {
            dateElement.value = today;
            console.log('今日の日付を設定しました:', today);
        } else {
            console.warn('date要素が見つかりません');
        }
        
        const storeNameElement = document.getElementById('storeName');
        const storeName = storeNameElement ? storeNameElement.value.trim() : '';
        
        if (!storeName) {
            showError('店舗名を入力してからデータを読み込んでください');
            return;
        }
        
        // ローディング表示を開始
        showLoadingIndicator(true);
        
        loadSampleData(today, storeName);
        
    } catch (error) {
        console.error('当日データ読込処理でエラー:', error);
        showError('当日データの読み込み中にエラーが発生しました');
        // エラー時もローディングを非表示
        showLoadingIndicator(false);
    }
}

/**
 * データ読込処理
 */
function handleLoadData() {
    console.log('データ読込処理を開始');
    
    try {
        const dateElement = document.getElementById('date');
        const storeNameElement = document.getElementById('storeName');
        
        // URLパラメータから値を取得
        const urlParams = new URLSearchParams(window.location.search);
        const urlDate = urlParams.get('date');
        const urlStoreId = urlParams.get('store_id');
        const viewMode = urlParams.get('mode');

        let selectedDate = dateElement ? dateElement.value : '';
        let storeName = storeNameElement ? storeNameElement.value.trim() : '';

        // URLパラメータがある場合は優先
        if (urlDate) {
            selectedDate = urlDate;
            if (dateElement) {
                dateElement.value = urlDate;
            }
        }

        if (!selectedDate) {
            showError('読み込む日付を選択してください');
            return;
        }

        // URLパラメータで店舗IDが指定されている場合は店舗名チェックをスキップ
        if (!urlStoreId && !storeName) {
            showError('店舗名を入力してください');
            return;
        }

        // ローディング表示を開始
        showLoadingIndicator(true);

        console.log(`データ読み込み対象: ${selectedDate} - ${storeName || 'URLパラメータ店舗ID:' + urlStoreId}`);

        // URLパラメータで店舗IDが指定されている場合は直接使用
        if (urlStoreId && viewMode) {
            console.log('URLパラメータからの店舗ID指定読み込み実行');
            loadSampleDataByStoreId(selectedDate, parseInt(urlStoreId), storeName);
        } else {
            loadSampleData(selectedDate, storeName);
        }
    } catch (error) {
        console.error('データ読込処理でエラー:', error);
        showError('データの読み込み中にエラーが発生しました');
        // エラー時もローディングを非表示
        showLoadingIndicator(false);
    }
}

/**
 * データ読込（データベースから）
 * @param {string} date 日付
 * @param {string} storeName 店舗名
 */
async function loadSampleData(date, storeName) {
    console.log(`データ読込を開始: ${date} - ${storeName}`);
    
    try {
        // 店舗IDを取得（管理者対応）
        let storeId = await getStoreId(storeName);
        
        if (!storeId) {
            console.log(`店舗「${storeName}」が見つからないため、新規店舗として扱います`);
            // 新規店舗の場合は店舗IDを生成
            storeId = await createNewStore(storeName);
        }
        
        console.log(`対象店舗ID: ${storeId}, 店舗名: ${storeName}, 日付: ${date}`);
        
        // APIからデータを取得
        const response = await fetch(`api.php?action=getReport&report_date=${encodeURIComponent(date)}&store_id=${storeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log('=== API成功レスポンス詳細 ===');
            console.log('データベースからデータを取得しました:', result.data);
            console.log('result.data.attached_files:', result.data.attached_files);
            console.log('attached_files のタイプ:', typeof result.data.attached_files);
            console.log('attached_files の内容:', JSON.stringify(result.data.attached_files));
            
            if (typeof loadDataIntoForm === 'function') {
                // データベースから取得したデータをフォーム用に変換
                console.log('=== convertDatabaseToFormData 呼び出し前 ===');
                const formData = convertDatabaseToFormData(result.data);
                console.log('=== convertDatabaseToFormData 呼び出し後 ===');
                console.log('変換後のformData.attachedFiles:', formData.attachedFiles);
                
                // 保存時の設定がある場合は、それを使用してUIを再構築
                if (formData.savedPaymentMethodConfig || formData.savedPointPaymentConfig) {
                    console.log('保存時の設定でUIを再構築します');
                    await rebuildUIWithSavedConfig(formData.savedPaymentMethodConfig, formData.savedPointPaymentConfig);
                }
                
                console.log('=== loadDataIntoForm 呼び出し前 ===');
                loadDataIntoForm(formData);
                console.log('=== loadDataIntoForm 呼び出し後 ===');
                
                // データ読み込み完了後にローディングを非表示
                showLoadingIndicator(false);
            } else {
                console.error('loadDataIntoForm関数が見つかりません');
                showError('データ読み込み機能が利用できません');
                showLoadingIndicator(false);
            }
            
        } else {
            console.log('指定されたデータが見つかりません:', result.message);
            showError(result.message || '指定された日付・店舗のデータが見つかりません');
            showLoadingIndicator(false);
        }
        
    } catch (error) {
        console.error('データ読込でエラー:', error);
        showError('データの読み込みに失敗しました: ' + error.message);
        showLoadingIndicator(false);
    }
}

/**
 * データベースデータをフォームデータに変換
 * @param {Object} dbData データベースから取得したデータ
 * @returns {Object} フォーム用データ
 */
function convertDatabaseToFormData(dbData) {
    console.log('=== データベースデータをフォーム用に変換中 ===');
    console.log('生のデータベースデータ:', dbData);
    
    try {
        const formData = {
            date: dbData.report_date || '',
            storeName: dbData.store_name || '',
            inputBy: dbData.user_id || '',
            remarks: dbData.remarks || '',
            status: dbData.status || 'draft'  // 追加
        };
        
        // 売上データを正しく復元
        console.log('=== 売上データ復元開始 ===');
        console.log('dbData.sales_data (生):', dbData.sales_data);
                if (dbData.attached_files) {
            try {
                const attachedFilesData = typeof dbData.attached_files === 'string' ? 
                    JSON.parse(dbData.attached_files) : dbData.attached_files;
                formData.attachedFiles = attachedFilesData;
                console.log('添付ファイルデータ復元完了:', formData.attachedFiles);
            } catch (e) {
                console.warn('添付ファイルデータのパースに失敗:', e);
                formData.attachedFiles = [];
            }
        } else {
            formData.attachedFiles = [];
        }

        if (dbData.sales_data) {
            try {
                const salesData = typeof dbData.sales_data === 'string' ? 
                    JSON.parse(dbData.sales_data) : dbData.sales_data;
                formData.sales = salesData;
                console.log('売上データ復元完了:', formData.sales);
            } catch (e) {
                console.warn('売上データのパースに失敗:', e);
                formData.sales = {};
            }
        } else {
            formData.sales = {};
        }
        
        // ポイント・クーポン支払データを正しく復元
        console.log('=== ポイント支払データ復元開始 ===');
        console.log('dbData.point_payments_data (生):', dbData.point_payments_data);
        if (dbData.point_payments_data) {
            try {
                const pointData = typeof dbData.point_payments_data === 'string' ? 
                    JSON.parse(dbData.point_payments_data) : dbData.point_payments_data;
                formData.pointPayments = pointData;
                console.log('ポイント支払データ復元完了:', formData.pointPayments);
            } catch (e) {
                console.warn('ポイント支払データのパースに失敗:', e);
                formData.pointPayments = {};
            }
        } else {
            formData.pointPayments = {};
        }
        
        // 入金・雑収入データを正しく復元
        console.log('=== 入金データ復元開始 ===');
        console.log('dbData.income_data (生):', dbData.income_data);
        if (dbData.income_data) {
            try {
                const incomeData = typeof dbData.income_data === 'string' ? 
                    JSON.parse(dbData.income_data) : dbData.income_data;
                formData.income = incomeData;
                console.log('入金・雑収入データ復元完了:', formData.income);
            } catch (e) {
                console.warn('入金データのパースに失敗:', e);
                formData.income = { nyukin: 0, miscIncome: 0, foundMoney: 0 };
            }
        } else {
            formData.income = { nyukin: 0, miscIncome: 0, foundMoney: 0 };
        }
        
        // 経費データを正しく復元
        console.log('=== 経費データ復元開始 ===');
        console.log('dbData.expense_data (生):', dbData.expense_data);
        if (dbData.expense_data) {
            try {
                const expenseData = typeof dbData.expense_data === 'string' ? 
                    JSON.parse(dbData.expense_data) : dbData.expense_data;
                formData.expenses = Array.isArray(expenseData) ? expenseData : [];
                console.log('経費データ復元完了:', formData.expenses);
            } catch (e) {
                console.warn('経費データのパースに失敗:', e);
                formData.expenses = [];
            }
        } else {
            formData.expenses = [];
        }
        
        // 現金管理データを正しく復元
        console.log('=== 現金データ復元開始 ===');
        console.log('dbData.cash_data (生):', dbData.cash_data);
        if (dbData.cash_data) {
            try {
                const cashData = typeof dbData.cash_data === 'string' ? 
                    JSON.parse(dbData.cash_data) : dbData.cash_data;
                formData.cash = cashData;
                console.log('現金データ復元完了:', formData.cash);
            } catch (e) {
                console.warn('現金データのパースに失敗:', e);
                formData.cash = {};
            }
        } else {
            formData.cash = {};
        }
        
        // 現金管理データを正しく復元
        console.log('=== 現金データ復元開始 ===');
        console.log('dbData.cash_data (生):', dbData.cash_data);
        if (dbData.cash_data) {
            try {
                const cashData = typeof dbData.cash_data === 'string' ? 
                    JSON.parse(dbData.cash_data) : dbData.cash_data;
                formData.cash = cashData;
                console.log('現金データ復元完了:', formData.cash);
            } catch (e) {
                console.warn('現金データのパースに失敗:', e);
                formData.cash = {};
            }
        } else {
            formData.cash = {};
        }
        
        // 前日現金残と現金過不足
        if (dbData.previous_cash_balance !== undefined) {
            formData.previousCashBalance = parseFloat(dbData.previous_cash_balance) || 0;
            console.log('前日現金残復元完了:', formData.previousCashBalance);
        }
        if (dbData.cash_difference !== undefined) {
            formData.cashDifference = parseFloat(dbData.cash_difference) || 0;
            console.log('現金過不足復元完了:', formData.cashDifference);
        }
        
        // 保存時の支払方法設定を復元
        console.log('=== 支払方法設定復元開始 ===');
        if (dbData.payment_method_config) {
            try {
                const savedPaymentConfig = typeof dbData.payment_method_config === 'string' ? 
                    JSON.parse(dbData.payment_method_config) : dbData.payment_method_config;
                formData.savedPaymentMethodConfig = savedPaymentConfig;
                console.log('保存時の支払方法設定復元完了:', formData.savedPaymentMethodConfig);
            } catch (e) {
                console.warn('支払方法設定のパースに失敗:', e);
                formData.savedPaymentMethodConfig = null;
            }
        } else {
            formData.savedPaymentMethodConfig = null;
        }
        
        if (dbData.point_payment_config) {
            try {
                const savedPointConfig = typeof dbData.point_payment_config === 'string' ? 
                    JSON.parse(dbData.point_payment_config) : dbData.point_payment_config;
                formData.savedPointPaymentConfig = savedPointConfig;
                console.log('保存時のポイント支払設定復元完了:', formData.savedPointPaymentConfig);
            } catch (e) {
                console.warn('ポイント支払設定のパースに失敗:', e);
                formData.savedPointPaymentConfig = null;
            }
        } else {
            formData.savedPointPaymentConfig = null;
        }
        
        // 添付ファイルデータを復元
        console.log('=== 添付ファイルデータ復元開始 ===');
        console.log('dbData.attached_files (生):', dbData.attached_files);
        console.log('dbData.attached_files のタイプ:', typeof dbData.attached_files);
        
        if (dbData.attached_files) {
            try {
                const attachedFilesData = typeof dbData.attached_files === 'string' ? 
                    JSON.parse(dbData.attached_files) : dbData.attached_files;
                console.log('パース後の添付ファイルデータ:', attachedFilesData);
                console.log('配列かどうか:', Array.isArray(attachedFilesData));
                console.log('データの長さ:', attachedFilesData.length);
                
                formData.attachedFiles = Array.isArray(attachedFilesData) ? attachedFilesData : [];
                console.log('添付ファイルデータ復元完了:', formData.attachedFiles);
                
                // 各ファイルの詳細をログ出力
                if (formData.attachedFiles.length > 0) {
                    formData.attachedFiles.forEach((file, index) => {
                        console.log(`ファイル${index + 1}:`, {
                            fileName: file.fileName,
                            fileSize: file.fileSize,
                            attachmentNumber: file.attachmentNumber,
                            hasBase64Data: !!file.base64Data
                        });
                    });
                }
            } catch (e) {
                console.error('添付ファイルデータのパースでエラー:', e);
                console.warn('添付ファイルデータのパースに失敗:', e);
                formData.attachedFiles = [];
            }
        } else {
            console.log('添付ファイルデータが存在しません');
            formData.attachedFiles = [];
        }

        // 手動税率入力データを復元
        if (dbData.manual_tax_inputs) {
            try {
                const manualTaxData = typeof dbData.manual_tax_inputs === 'string' ? 
                    JSON.parse(dbData.manual_tax_inputs) : dbData.manual_tax_inputs;
                formData.manualTaxInputs = manualTaxData;
                console.log('手動税率入力データ復元完了:', formData.manualTaxInputs);
            } catch (e) {
                console.warn('手動税率入力データのパースに失敗:', e);
                formData.manualTaxInputs = { manual10Percent: null, manual8Percent: null };
            }
        } else {
            formData.manualTaxInputs = { manual10Percent: null, manual8Percent: null };
        }
        
        console.log('変換完了（全体）:', formData);
        return formData;
        
    } catch (error) {
        console.error('データ変換でエラー:', error);
        throw new Error('データの変換に失敗しました');
    }
}

/**
 * 保存された設定でUIを再構築
 * @param {Array} savedPaymentConfig 保存時の支払方法設定
 * @param {Array} savedPointConfig 保存時のポイント支払設定
 */
async function rebuildUIWithSavedConfig(savedPaymentConfig, savedPointConfig) {
    console.log('=== 保存された設定でUIを再構築 ===');
    console.log('保存時の支払方法設定:', savedPaymentConfig);
    console.log('保存時のポイント支払設定:', savedPointConfig);
    
    try {
        // 一時的にグローバル設定を保存された設定で置き換え
        if (savedPaymentConfig) {
            window.paymentMethodConfig = savedPaymentConfig;
            console.log('支払方法設定を復元しました');
        }
        
        if (savedPointConfig) {
            window.pointPaymentConfig = savedPointConfig;
            console.log('ポイント支払設定を復元しました');
        }
        
        // UIの支払方法セクションを再構築
        if (typeof generatePaymentMethodsHTML === 'function') {
            const salesSection = document.getElementById('salesPaymentMethods');
            if (salesSection && savedPaymentConfig) {
                salesSection.innerHTML = generatePaymentMethodsHTML(savedPaymentConfig, 'sales');
                console.log('売上支払方法セクションを再構築しました');
            }
        }
        
        // UIのポイント支払セクションを再構築
        if (typeof generatePointPaymentHTML === 'function') {
            const pointSection = document.getElementById('pointPaymentMethods');
            if (pointSection && savedPointConfig) {
                pointSection.innerHTML = generatePointPaymentHTML(savedPointConfig);
                console.log('ポイント支払セクションを再構築しました');
            }
        }
        
        // 注意メッセージを表示
        const message = `
            <div class="alert alert-warning" style="margin: 10px 0; padding: 10px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
                <strong>⚠️ 注意:</strong> この日報は保存時の支払方法設定で表示されています。<br>
                現在の設定と異なる場合があります。
            </div>
        `;
        
        const formContainer = document.querySelector('.form-container') || document.body;
        const existingAlert = formContainer.querySelector('.alert-warning');
        if (!existingAlert) {
            formContainer.insertAdjacentHTML('afterbegin', message);
        }
        
    } catch (error) {
        console.error('UI再構築でエラー:', error);
        showError('過去の設定での表示に失敗しました。現在の設定で表示します。');
    }
}

/**
 * 店舗IDを直接指定してデータ読込
 * @param {string} date 日付
 * @param {number} storeId 店舗ID
 * @param {string} storeName 店舗名
 */
async function loadSampleDataByStoreId(date, storeId, storeName) {
    console.log(`🚀 店舗ID指定でデータ読込を開始: ${date} - 店舗ID:${storeId} (${storeName})`);
    
    try {
        console.log(`⚡ パフォーマンス最適化: 保存データから直接取得します`);
        
        // 店舗情報取得をスキップして、保存データから直接取得（パフォーマンス向上）
        // APIからデータを取得
        const response = await fetch(`api.php?action=getReport&report_date=${encodeURIComponent(date)}&store_id=${storeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log('=== API成功レスポンス詳細 ===');
            console.log('✅ データベースからデータを取得しました:', result.data);
            
            if (typeof loadDataIntoForm === 'function') {
                // データベースから取得したデータをフォーム用に変換
                const formData = convertDatabaseToFormData(result.data);
                console.log('変換後のformData:', formData);
                
                // 🚀 店舗名を保存データから取得（パフォーマンス最適化）
                let finalStoreName = storeName; // パラメータで渡された値をベースに
                
                // 保存データに店舗名が含まれている場合は優先
                if (result.data && result.data.storeName) {
                    finalStoreName = result.data.storeName;
                    console.log(`🏪 保存データから店舗名を取得: "${finalStoreName}"`);
                } else if (formData.storeName) {
                    finalStoreName = formData.storeName;
                    console.log(`🏪 変換データから店舗名を取得: "${finalStoreName}"`);
                } else {
                    console.log(`🏪 パラメータの店舗名を使用: "${finalStoreName}"`);
                }
                
                formData.storeName = finalStoreName;
                console.log(`� 最終確定店舗名: "${formData.storeName}"`);
                
                console.log(`⚡ パフォーマンス最適化: 店舗ID:${storeId}, 店舗名:"${finalStoreName}", 日付:${date}`);
                console.log('🏪 設定に使用した storeName パラメータ:', storeName);
                
                // 最終確認
                console.log('=== loadDataIntoForm呼び出し前の最終データ ===');
                console.log('formData.storeName:', formData.storeName);
                console.log('typeof formData.storeName:', typeof formData.storeName);
                console.log('formData.storeName length:', formData.storeName ? formData.storeName.length : 'null/undefined');
                
                // 保存時の設定がある場合は、それを使用してUIを再構築
                if (formData.savedPaymentMethodConfig || formData.savedPointPaymentConfig) {
                    console.log('保存時の設定でUIを再構築します');
                    await rebuildUIWithSavedConfig(formData.savedPaymentMethodConfig, formData.savedPointPaymentConfig);
                }
                
                console.log('📝 loadDataIntoForm を呼び出します');
                loadDataIntoForm(formData);
                
                // データ読み込み完了後にローディングを非表示
                showLoadingIndicator(false);
            } else {
                console.error('loadDataIntoForm関数が見つかりません');
                showError('データ読み込み機能が利用できません');
                showLoadingIndicator(false);
            }
            
        } else {
            console.log('指定されたデータが見つかりません:', result.message);
            showError(result.message || '指定された日付・店舗のデータが見つかりません');
            showLoadingIndicator(false);
        }
        
    } catch (error) {
        console.error('データ読込でエラー:', error);
        showError('データの読み込みに失敗しました: ' + error.message);
        showLoadingIndicator(false);
    }
}

/**
 * データベースにレポートデータを保存（添付ファイル対応版）
 */
async function saveReportToDatabase(reportData) {
    console.log('データベース保存開始:', reportData);
    
    try {
        // ユーザーセッションからログイン中のユーザー情報を取得
        const userSession = getUserSession();
        if (!userSession) {
            throw new Error('ユーザーセッションが見つかりません。再度ログインしてください。');
        }

        // 店舗名を取得
        const storeName = reportData.storeName || document.getElementById('storeName')?.value.trim();
        if (!storeName) {
            throw new Error('店舗名が入力されていません。');
        }

        // 店舗IDを取得（最適化版を使用）
        let storeId = await getStoreId(storeName);
        if (!storeId) {
            console.log(`店舗「${storeName}」が見つからないため、新規作成します`);
            storeId = await createNewStore(storeName);
        }
        
        const userId = reportData.inputBy || userSession.username; 
        
        console.log('保存用情報:', {
            userId: userId,
            storeId: storeId,
            storeName: storeName,
            date: reportData.date,
            session: userSession
        });

        if (!userId) {
            throw new Error('担当者名が入力されていません。');
        }
        
        // 添付ファイルをBase64エンコード
        let encodedFiles = [];
        try {
            if (typeof collectEncodedFileData === 'function') {
                encodedFiles = await collectEncodedFileData();
                console.log('=== 添付ファイル保存詳細 ===');
                console.log('エンコードされた添付ファイル数:', encodedFiles.length);
                console.log('エンコードされた添付ファイル:', encodedFiles);
                
                // 各ファイルの詳細をログ
                encodedFiles.forEach((file, index) => {
                    console.log(`保存ファイル${index + 1}:`, {
                        fileName: file.fileName,
                        fileSize: file.fileSize,
                        attachmentNumber: file.attachmentNumber,
                        hasBase64Data: !!file.base64Data,
                        base64Length: file.base64Data ? file.base64Data.length : 0
                    });
                });
            } else {
                console.warn('collectEncodedFileData関数が見つかりません');
            }
        } catch (fileError) {
            console.error('ファイルエンコードでエラー:', fileError);
            throw new Error('添付ファイルの処理に失敗しました');
        }
        
        // APIリクエスト用のデータを準備（添付ファイル追加）
        const requestData = {
            action: 'saveReport',
            report_date: reportData.date,
            store_id: storeId,
            user_id: userId,
            sales_data: JSON.stringify(reportData.sales || {}),
            point_payments_data: JSON.stringify(reportData.pointPayments || {}),
            income_data: JSON.stringify({
                nyukin: parseFloat(reportData.income?.nyukin) || 0,
                miscIncome: parseFloat(reportData.income?.miscIncome) || 0,
                foundMoney: parseFloat(reportData.income?.foundMoney) || 0
            }),
            expense_data: JSON.stringify(reportData.expenses || []),
            cash_data: JSON.stringify(reportData.cash || {}),
            manual_tax_inputs: JSON.stringify(reportData.manualTaxInputs || {}),
            // 保存時の支払方法設定も一緒に保存
            payment_method_config: paymentMethodConfig || null,
            point_payment_config: pointPaymentConfig || null,
            previous_cash_balance: parseFloat(reportData.previousCashBalance) || 0,
            cash_difference: 0,
            remarks: reportData.remarks || '',
            attached_files: encodedFiles // 添付ファイルデータを追加
        };
        
        console.log('APIリクエストデータ（詳細）:', requestData);
        
        // APIへのPOSTリクエスト
        const response = await fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const responseText = await response.text();
        console.log('API生レスポンス:', responseText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
        }
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error(`APIからの応答が正しくありません: ${responseText.substring(0, 200)}`);
        }
        
        console.log('API応答:', result);
        
        if (result.success) {
            console.log('データベース保存成功');
            return true;
        } else {
            throw new Error(result.message || 'データベース保存に失敗');
        }
        
    } catch (error) {
        console.error('データベース保存でエラー:', error);
        throw error;
    }
}

/**
 * ユーザーセッション情報を取得する関数
 */
function getUserSession() {
    try {
        const session = sessionStorage.getItem('userSession') || localStorage.getItem('userSession');
        if (session) {
            return JSON.parse(session);
        }
        return null;
    } catch (error) {
        console.error('ユーザーセッション取得エラー:', error);
        return null;
    }
}

/**
 * 手動税率入力データの取得
 * @returns {Object} 手動税率入力データ
 */
function getManualTaxInputs() {
    try {
        const manual10Element = document.getElementById('manual10Percent');
        const manual8Element = document.getElementById('manual8Percent');
        
        return {
            manual10Percent: manual10Element && manual10Element.value.trim() !== '' ? parseFloat(manual10Element.value) : null,
            manual8Percent: manual8Element && manual8Element.value.trim() !== '' ? parseFloat(manual8Element.value) : null
        };
    } catch (error) {
        console.error('手動税率入力データの取得でエラー:', error);
        return {
            manual10Percent: null,
            manual8Percent: null
        };
    }
}

/**
 * 前日現金残を自動読み込み（最大1週間遡る）
 * @param {string} currentDate - 現在の日付 (YYYY-MM-DD)
 */
async function loadPreviousCashBalance(currentDate) {
    console.log('🔄 前日現金残の自動読み込みを開始:', currentDate);
    
    try {
        // URLパラメータをチェック
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('date') || urlParams.has('store') || urlParams.has('action')) {
            console.log('⏸️ URLパラメータが存在するため、前日現金残の自動読み込みをスキップ');
            return;
        }
        
        // セッションから店舗IDを取得（管理者対応）
        const storeId = await getStoreId();
        
        if (!storeId || storeId === 0) {
            console.log('⏸️ 店舗IDが取得できないため、前日現金残の自動読み込みをスキップ');
            return;
        }
        
        const currentDateObj = new Date(currentDate);
        const maxDaysBack = 7; // 最大1週間遡る
        
        for (let daysBack = 1; daysBack <= maxDaysBack; daysBack++) {
            const targetDate = new Date(currentDateObj);
            targetDate.setDate(currentDateObj.getDate() - daysBack);
            const targetDateStr = targetDate.toISOString().split('T')[0];
            
            console.log(`📅 ${daysBack}日前のデータを確認中: ${targetDateStr}`);
            
            try {
                // APIから過去のデータを取得
                const response = await fetch(`api.php?action=getReport&report_date=${encodeURIComponent(targetDateStr)}&store_id=${storeId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    console.log(`⚠️ ${targetDateStr}のデータ取得に失敗: HTTP ${response.status}`);
                    continue;
                }
                
                const result = await response.json();
                
                // APIレスポンスの詳細をログ出力
                console.log(`📊 ${targetDateStr}のAPIレスポンス:`, {
                    success: result.success,
                    hasData: !!result.data,
                    message: result.message
                });
                
                if (result.success && result.data) {
                    const data = result.data;
                    
                    console.log(`${targetDateStr}のデータ構造:`, {
                        hasCash: !!data.cash,
                        hasTotals: !!(data.cash && data.cash.totals),
                        totalCashValue: data.cash?.totals?.totalCash,
                        cashKeys: data.cash ? Object.keys(data.cash) : []
                    });
                    
                    // 売上データが存在するかチェック
                    const salesDataInfo = {
                        hasSales: !!data.sales,
                        salesKeys: data.sales ? Object.keys(data.sales) : [],
                        salesWithValues: []
                    };
                    
                    if (data.sales) {
                        Object.keys(data.sales).forEach(key => {
                            const value = data.sales[key];
                            if (value && value > 0) {
                                salesDataInfo.salesWithValues.push(`${key}: ${value}`);
                            }
                        });
                    }
                    
                    const hasSalesData = salesDataInfo.salesWithValues.length > 0;
                    
                    console.log(`🛒 ${targetDateStr}の売上データ詳細:`, salesDataInfo);
                    console.log(`✅ ${targetDateStr}の売上データ存在チェック:`, hasSalesData);
                    
                    // 保存された合計金額を確認
                    let totalCashAmount = null;
                    let dataSource = '';
                    
                    if (data.cash && data.cash.totals && typeof data.cash.totals.totalCash === 'number') {
                        // 新形式：合計金額が保存されている場合
                        totalCashAmount = data.cash.totals.totalCash;
                        dataSource = '新形式（保存済み合計金額）';
                        console.log(`${targetDateStr}の${dataSource}を使用: ¥${totalCashAmount.toLocaleString()}`);
                    } else if (data.cash && denominations) {
                        // 旧形式：金種データから計算
                        let calculatedTotal = 0;
                        denominations.forEach(denom => {
                            if (data.cash[denom.key]) {
                                const registerCount = data.cash[denom.key].register || 0;
                                const safeCount = data.cash[denom.key].safe || 0;
                                const denomAmount = (registerCount + safeCount) * denom.value;
                                calculatedTotal += denomAmount;
                                if (denomAmount > 0) {
                                    console.log(`  ${denom.label}: ${registerCount + safeCount}枚 = ¥${denomAmount.toLocaleString()}`);
                                }
                            }
                        });
                        totalCashAmount = calculatedTotal;
                        dataSource = '旧形式（金種から計算）';
                        console.log(`${targetDateStr}の${dataSource}: ¥${totalCashAmount.toLocaleString()}`);
                    } else {
                        console.log(`${targetDateStr}には現金データがありません`);
                    }
                    
                    if (hasSalesData && totalCashAmount !== null && totalCashAmount > 0) {
                        console.log(`✅ ${targetDateStr}の有効なデータを発見 (${dataSource})`);
                        console.log(`   売上データ: あり`);
                        console.log(`   当日現金残: ¥${totalCashAmount.toLocaleString()}`);
                        
                        // 前日現金残入力欄に設定
                        const previousCashElement = document.getElementById('previousCashBalance');
                        if (previousCashElement) {
                            previousCashElement.value = totalCashAmount;
                            console.log(`🎯 前日現金残を設定: ¥${totalCashAmount.toLocaleString()}`);
                            
                            // 計算を更新
                            if (typeof updateAllCalculations === 'function') {
                                updateAllCalculations();
                            }
                            
                            // 成功したので処理を終了
                            return;
                        }
                    } else {
                        const reasons = [];
                        if (!hasSalesData) reasons.push('売上データなし');
                        if (totalCashAmount === null) reasons.push('現金データなし');
                        if (totalCashAmount === 0) reasons.push('現金残0円');
                        console.log(`❌ ${targetDateStr}は条件不適合: ${reasons.join(', ')}`);
                    }
                } else {
                    if (!result.success) {
                        console.log(`❌ ${targetDateStr}のAPI呼び出しが失敗: ${result.message || 'エラーメッセージなし'}`);
                    } else {
                        console.log(`📭 ${targetDateStr}のデータが見つかりません (result.data が空)`);
                    }
                }
                
            } catch (error) {
                console.log(`💥 ${targetDateStr}のデータ取得でエラー:`, error.message || error);
                continue;
            }
        }
        
        console.log('❌ 過去1週間のデータに有効な現金残が見つかりませんでした');
        console.log('💡 手動で前日現金残を入力してください');
        
    } catch (error) {
        console.error('❌ 前日現金残の自動読み込みでエラー:', error);
    }
}

/**
 * 経費データ収集
 * @returns {Array} 経費データの配列
 */
function collectExpenseData() {
    console.log('経費データ収集を開始');
    
    try {
        const expenses = [];
        const expenseRecords = document.querySelectorAll('.expense-record');
        
        console.log(`経費レコード数: ${expenseRecords.length}`);
        
        expenseRecords.forEach((record, index) => {
            try {
                const vendorInput = record.querySelector('[data-field="vendor"]');
                const accountSelect = record.querySelector('[data-field="account"]');
                const itemInput = record.querySelector('[data-field="item"]');
                const amountInput = record.querySelector('[data-field="amount"]');
                
                if (vendorInput && accountSelect && itemInput && amountInput) {
                    const expense = {
                        id: parseInt(vendorInput.dataset.id) || index + 1,
                        vendor: vendorInput.value.trim(),
                        account: accountSelect.value,
                        item: itemInput.value.trim(),
                        amount: parseFloat(amountInput.value) || 0
                    };
                    
                    // 空の経費レコードは除外（金額が0でない、またはいずれかのフィールドに入力がある場合のみ追加）
                    if (expense.amount > 0 || expense.vendor || expense.account || expense.item) {
                        expenses.push(expense);
                        console.log(`経費レコード ${index + 1} を収集:`, expense);
                    }
                } else {
                    console.warn(`経費レコード ${index + 1} の必要な要素が見つかりません`);
                }
                
            } catch (recordError) {
                console.error(`経費レコード ${index + 1} の処理でエラー:`, recordError);
            }
        });
        
        console.log(`経費データ収集完了: ${expenses.length} 件`);
        return expenses;
        
    } catch (error) {
        console.error('経費データ収集でエラー:', error);
        return [];
    }
}

/**
 * 現金データ収集
 * @returns {Object} 現金データオブジェクト
 */
function collectCashData() {
    console.log('現金データ収集を開始');
    
    try {
        const cashData = {};
        let registerTotal = 0;
        let safeTotal = 0;
        let totalCash = 0;
        
        if (!denominations || !Array.isArray(denominations)) {
            console.error('denominations が正しく定義されていません');
            return {};
        }
        
        denominations.forEach(denom => {
            try {
                const registerInput = document.querySelector(`[data-type="register"][data-denom="${denom.key}"]`);
                const safeInput = document.querySelector(`[data-type="safe"][data-denom="${denom.key}"]`);
                
                if (registerInput && safeInput) {
                    const registerCount = parseInt(registerInput.value) || 0;
                    const safeCount = parseInt(safeInput.value) || 0;
                    
                    cashData[denom.key] = {
                        register: registerCount,
                        safe: safeCount
                    };
                    
                    // 合計金額を計算
                    const registerAmount = registerCount * denom.value;
                    const safeAmount = safeCount * denom.value;
                    
                    registerTotal += registerAmount;
                    safeTotal += safeAmount;
                    totalCash += registerAmount + safeAmount;
                    
                    console.log(`現金データ ${denom.key} を収集:`, cashData[denom.key], `(レジ: ¥${registerAmount.toLocaleString()}, 金庫: ¥${safeAmount.toLocaleString()})`);
                } else {
                    console.warn(`現金データ ${denom.key} の入力要素が見つかりません`);
                    cashData[denom.key] = { register: 0, safe: 0 };
                }
                
            } catch (denomError) {
                console.error(`現金データ ${denom.key} の処理でエラー:`, denomError);
                cashData[denom.key] = { register: 0, safe: 0 };
            }
        });
        
        // 合計金額を追加
        cashData.totals = {
            registerTotal: registerTotal,
            safeTotal: safeTotal,
            totalCash: totalCash
        };
        
        console.log('現金データ収集完了:', cashData);
        console.log('合計金額:', {
            registerTotal: `¥${registerTotal.toLocaleString()}`,
            safeTotal: `¥${safeTotal.toLocaleString()}`,
            totalCash: `¥${totalCash.toLocaleString()}`
        });
        
        return cashData;
        
    } catch (error) {
        console.error('現金データ収集でエラー:', error);
        return {};
    }
}

/**
 * フォームデータをすべて収集
 * @returns {Object} 収集されたデータオブジェクト
 */
function collectAllFormData() {
    console.log('全フォームデータ収集を開始');
    
    try {
        // 基本情報
        const dateElement = document.getElementById('date');
        const storeNameElement = document.getElementById('storeName');
        const inputByElement = document.getElementById('inputBy');
        
        const basicData = {
            date: dateElement ? dateElement.value : '',
            storeName: storeNameElement ? storeNameElement.value.trim() : '',
            inputBy: inputByElement ? inputByElement.value.trim() : ''
        };
        
        console.log('基本データ収集完了:', basicData);

        // 手動税率入力データの取得
        const manualTaxInputs = getManualTaxInputs();
        console.log('手動税率入力データ収集完了:', manualTaxInputs);

        // 動的な売上データ収集
        const sales = {};
        if (paymentMethodConfig && Array.isArray(paymentMethodConfig)) {
            paymentMethodConfig.forEach(method => {
                try {
                    const element10 = document.getElementById(`${method.id}10`);
                    const element8 = document.getElementById(`${method.id}8`);
                    sales[`${method.id}10`] = element10 ? (parseFloat(element10.value) || 0) : 0;
                    sales[`${method.id}8`] = element8 ? (parseFloat(element8.value) || 0) : 0;
                } catch (salesError) {
                    console.error(`売上データ ${method.id} の収集でエラー:`, salesError);
                    sales[`${method.id}10`] = 0;
                    sales[`${method.id}8`] = 0;
                }
            });
        }
        console.log('売上データ収集完了:', sales);

        // 動的なポイント・クーポン支払データ収集
        const pointPayments = {};
        if (pointPaymentConfig && Array.isArray(pointPaymentConfig)) {
            pointPaymentConfig.forEach(payment => {
                try {
                    const element10 = document.getElementById(`${payment.id}10`);
                    const element8 = document.getElementById(`${payment.id}8`);
                    pointPayments[`${payment.id}10`] = element10 ? (parseFloat(element10.value) || 0) : 0;
                    pointPayments[`${payment.id}8`] = element8 ? (parseFloat(element8.value) || 0) : 0;
                } catch (pointError) {
                    console.error(`ポイント・クーポン支払データ ${payment.id} の収集でエラー:`, pointError);
                    pointPayments[`${payment.id}10`] = 0;
                    pointPayments[`${payment.id}8`] = 0;
                }
            });
        }
        console.log('ポイント・クーポン支払データ収集完了:', pointPayments);

        // 入金・雑収入
        const nyukinElement = document.getElementById('nyukin');
        const miscIncomeElement = document.getElementById('miscIncome');
        const foundMoneyElement = document.getElementById('foundMoney');
        
        const income = {
            nyukin: nyukinElement ? (parseFloat(nyukinElement.value) || 0) : 0,
            miscIncome: miscIncomeElement ? (parseFloat(miscIncomeElement.value) || 0) : 0,
            foundMoney: foundMoneyElement ? (parseFloat(foundMoneyElement.value) || 0) : 0
        };
        console.log('入金・雑収入データ収集完了:', income);

        // 前日現金残
        const previousCashElement = document.getElementById('previousCashBalance');
        const previousCashBalance = previousCashElement ? (parseFloat(previousCashElement.value) || 0) : 0;
        console.log('前日現金残データ収集完了:', previousCashBalance);

        // 備考・報告事項
        const remarksElement = document.getElementById('remarks');
        const remarks = remarksElement ? remarksElement.value.trim() : '';
        console.log('備考データ収集完了');

        // 各データを収集
        const expenses = collectExpenseData();
        const cash = collectCashData();
        const attachedFiles = typeof collectFileData === 'function' ? collectFileData() : [];

        const allData = {
            ...basicData,
            sales,
            pointPayments,
            income,
            previousCashBalance,
            expenses,
            cash,
            attachedFiles,
            remarks,
            manualTaxInputs,
            submittedAt: new Date().toISOString()
        };
        
        console.log('全フォームデータ収集完了');
        console.log('収集されたデータ:', JSON.stringify(allData, null, 2));
        return allData;
        
    } catch (error) {
        console.error('全フォームデータ収集でエラー:', error);
        return {
            date: '',
            storeName: '',
            inputBy: '',
            sales: {},
            pointPayments: {},
            income: { nyukin: 0, miscIncome: 0, foundMoney: 0 },
            previousCashBalance: 0,
            expenses: [],
            cash: {},
            attachedFiles: [],
            remarks: '',
            submittedAt: new Date().toISOString()
        };
    }
}

/**
 * データのバリデーション
 * @param {Object} data バリデーション対象のデータ
 * @returns {Object} バリデーション結果 {isValid: boolean, errors: Array}
 */
function validateFormData(data) {
    console.log('データバリデーションを開始');
    console.log('バリデーション対象データ:', JSON.stringify(data, null, 2));
    
    try {
        const errors = [];

        // 設定の確認
        if (!appConfig || !appConfig.VALIDATION || !appConfig.VALIDATION.REQUIRED_FIELDS) {
            console.warn('バリデーション設定が見つかりません');
            return { isValid: true, errors: [] }; // 設定が無い場合は通す
        }

        // 必須項目チェック
        appConfig.VALIDATION.REQUIRED_FIELDS.forEach(field => {
            if (!data[field] || data[field].toString().trim() === '') {
                switch (field) {
                    case 'date':
                        errors.push('日付を入力してください');
                        break;
                    case 'storeName':
                        errors.push('店舗名を入力してください');
                        break;
                    case 'inputBy':
                        errors.push('担当者を入力してください');
                        break;
                    default:
                        errors.push(`${field}を入力してください`);
                }
            }
        });

        // 日付の妥当性チェック
        if (data.date) {
            try {
                const inputDate = new Date(data.date);
                const today = new Date();
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(today.getDate() - 7);
                
                if (inputDate > today) {
                    errors.push('未来の日付は入力できません');
                }
                
                if (inputDate < oneWeekAgo) {
                    errors.push('1週間より前の日付は入力できません（過去データの修正が必要な場合は管理者にお問い合わせください）');
                }
            } catch (dateError) {
                console.error('日付バリデーションでエラー:', dateError);
                errors.push('日付の形式が正しくありません');
            }
        }

        // 備考の文字数チェック
        if (data.remarks && appConfig.VALIDATION.MAX_REMARKS_LENGTH) {
            if (data.remarks.length > appConfig.VALIDATION.MAX_REMARKS_LENGTH) {
                errors.push(`備考は${appConfig.VALIDATION.MAX_REMARKS_LENGTH}文字以内で入力してください`);
            }
        }

        // 売上データの妥当性チェック
        let totalSales = 0;
        try {
            console.log('売上データチェック開始');
            console.log('data.sales:', data.sales);
            console.log('data.pointPayments:', data.pointPayments);
            
            Object.values(data.sales || {}).forEach(amount => {
                const numAmount = parseFloat(amount) || 0;
                console.log('売上項目:', amount, '→', numAmount);
                if (numAmount < 0) {
                    errors.push('売上金額に負の値は入力できません');
                }
                totalSales += numAmount;
            });

            Object.values(data.pointPayments || {}).forEach(amount => {
                const numAmount = parseFloat(amount) || 0;
                console.log('ポイント項目:', amount, '→', numAmount);
                if (numAmount < 0) {
                    errors.push('ポイント・クーポン支払金額に負の値は入力できません');
                }
                totalSales += numAmount;
            });

            console.log('売上合計:', totalSales);
            if (totalSales === 0) {
                console.warn('売上データが0のためエラーを追加');
                errors.push('売上データが入力されていません');
            }
        } catch (salesValidationError) {
            console.error('売上データバリデーションでエラー:', salesValidationError);
            errors.push('売上データの検証中にエラーが発生しました');
        }


        // ファイルの妥当性チェック
        try {
            if (data.attachedFiles && fileUploadConfig && data.attachedFiles.length > fileUploadConfig.MAX_FILES) {
                errors.push(`添付ファイル数が上限（${fileUploadConfig.MAX_FILES}件）を超えています`);
            }
        } catch (fileValidationError) {
            console.error('ファイルバリデーションでエラー:', fileValidationError);
        }

        console.log(`バリデーション完了: ${errors.length > 0 ? 'エラー有り' : '問題なし'}`);
        if (errors.length > 0) {
            console.log('バリデーションエラー一覧:', errors);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
        
    } catch (error) {
        console.error('データバリデーションでエラー:', error);
        return {
            isValid: false,
            errors: ['データの検証中にエラーが発生しました']
        };
    }
}

/**
 * 送信処理
 */
async function handleSubmit() {
    console.log('送信処理を開始');
    
    try {
        // データ収集
        const reportData = collectAllFormData();
        console.log('収集されたデータ:', reportData);
        
        // バリデーション
        const validation = validateFormData(reportData);
        if (!validation.isValid) {
            const errorMessage = '入力内容に問題があります：\n\n' + validation.errors.join('\n');
            showError(errorMessage);
            return;
        }

        // ファイルデータをエンコード
        let encodedFiles = [];
        try {
            if (typeof collectEncodedFileData === 'function') {
                encodedFiles = await collectEncodedFileData();
            }
            reportData.attachedFiles = encodedFiles;
        } catch (fileError) {
            console.error('ファイルエンコードでエラー:', fileError);
            showError('添付ファイルの処理中にエラーが発生しました。ファイルを確認してください。');
            return;
        }

        // 確認メッセージ
        const confirmMessage = `以下の内容で送信します：\n\n` +
            `日付: ${reportData.date}\n` +
            `店舗: ${reportData.storeName}\n` +
            `担当者: ${reportData.inputBy}\n` +
            `添付ファイル: ${encodedFiles.length}件\n\n` +
            `送信してよろしいですか？`;
        
        if (!confirm(confirmMessage)) {
            console.log('送信がキャンセルされました');
            return;
        }

        // データベースに保存
        try {
            const success = await saveReportToDatabase(reportData);
            if (success) {
                console.log('データベースに保存しました');
                showSuccess('データが保存され、経理課に送信されました！');
            } else {
                throw new Error('データベースへの保存に失敗しました');
            }
        } catch (saveError) {
            console.error('保存エラー:', saveError);
            showError('データの保存に失敗しました: ' + saveError.message);
            return;
        }
        
        console.log('送信データ:', reportData);
        
    } catch (error) {
        console.error('送信エラー:', error);
        showError('送信中にエラーが発生しました。もう一度お試しください。');
    }
}

/**
 * サーバーへのデータ送信（将来の実装用）
 * @param {Object} data 送信するデータ
 * @returns {Promise} API呼び出しの結果
 */
async function submitToServer(data) {
    try {
        if (!apiConfig || !apiConfig.BASE_URL) {
            throw new Error('APIの設定が未完了です');
        }

        const response = await fetch(apiConfig.BASE_URL + apiConfig.ENDPOINTS.DAILY_REPORT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'サーバーエラーが発生しました');
        }

        return await response.json();
        
    } catch (error) {
        console.error('サーバー送信でエラー:', error);
        throw error;
    }
}

/**
 * 店舗設定データの取得（将来の実装用）
 * @param {string} storeCode 店舗コード
 * @returns {Promise<Object>} 店舗設定データ
 */
async function fetchStoreConfig(storeCode) {
    try {
        if (!apiConfig || !apiConfig.BASE_URL) {
            // APIが未設定の場合はデフォルト設定を返す
            return {
                paymentMethods: paymentMethodConfig || [],
                pointPayments: pointPaymentConfig || []
            };
        }

        const response = await fetch(
            `${apiConfig.BASE_URL}${apiConfig.ENDPOINTS.STORE_CONFIG}?store_code=${storeCode}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        if (!response.ok) {
            throw new Error('店舗設定の取得に失敗しました');
        }

        return await response.json();
        
    } catch (error) {
        console.error('店舗設定取得でエラー:', error);
        throw error;
    }
}

/**
 * 自動保存機能
 */
let autoSaveTimer = null;

/**
 * 自動保存を開始
 */
function startAutoSave() {
    console.log('自動保存機能を開始');
    
    try {
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
        }

        const interval = (appConfig && appConfig.AUTO_SAVE_INTERVAL) ? appConfig.AUTO_SAVE_INTERVAL : 30000;

        autoSaveTimer = setInterval(async () => {
            try {
                const data = collectAllFormData();
                if (data.date && data.storeName) {
                    // 自動保存データをデータベースに保存
                    const autoSaveData = {
                        ...data,
                        autoSavedAt: new Date().toISOString(),
                        isAutoSave: true // 自動保存フラグ
                    };
                    
                    // データベースへの自動保存（エラーが発生しても自動保存は継続）
                    try {
                        await saveReportToDatabase(autoSaveData);
                        if (appConfig && appConfig.DEBUG) {
                            console.log('自動保存完了（データベース）:', data.date, data.storeName);
                        }
                    } catch (saveError) {
                        console.warn('自動保存エラー（継続）:', saveError.message);
                    }
                }
            } catch (error) {
                console.error('自動保存エラー:', error);
            }
        }, interval);
        
        console.log(`自動保存を開始しました（間隔: ${interval}ms）`);
        
    } catch (error) {
        console.error('自動保存開始でエラー:', error);
    }
}

/**
 * 自動保存を停止
 */
function stopAutoSave() {
    try {
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
            autoSaveTimer = null;
            console.log('自動保存を停止しました');
        }
    } catch (error) {
        console.error('自動保存停止でエラー:', error);
    }
}

/**
 * 自動保存データの復元
 * データベースから最新の自動保存データを取得して復元
 */
async function restoreAutoSaveData() {
    console.log('自動保存データの復元を試行');
    
    try {
        const dateElement = document.getElementById('date');
        const storeNameElement = document.getElementById('storeName');
        
        if (!dateElement || !storeNameElement) {
            console.warn('日付または店舗名要素が見つかりません');
            return;
        }
        
        const date = dateElement.value;
        const storeName = storeNameElement.value.trim();
        
        if (!date || !storeName) {
            console.log('日付または店舗名が未入力のため自動保存データの復元をスキップします');
            return;
        }
        
        // データベースから自動保存データを取得
        const storeId = sessionStorage.getItem('storeId') || 8;
        const response = await fetch(`api.php?action=getReport&report_date=${encodeURIComponent(date)}&store_id=${storeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            
            if (result.success && result.data) {
                const data = convertDatabaseToFormData(result.data);
                
                // 自動保存データかどうかを確認（作成日時から判断）
                const updatedAt = new Date(result.data.updated_at);
                const message = `保存されたデータがあります（${updatedAt.toLocaleString()}）。\n復元しますか？`;
                
                if (confirm(message)) {
                    if (typeof loadDataIntoForm === 'function') {
                        loadDataIntoForm(data);
                        showSuccess('保存データを復元しました');
                    } else {
                        console.error('loadDataIntoForm関数が見つかりません');
                        showError('データ復元機能が利用できません');
                    }
                }
            } else {
                console.log('自動保存データが見つかりませんでした');
            }
        } else {
            console.log('自動保存データの取得に失敗しました');
        }
        
    } catch (error) {
        console.error('自動保存データ復元でエラー:', error);
    }
}

/**
 * ページを離れる前の確認
 */
function setupBeforeUnloadWarning() {
    console.log('ページ離脱警告を設定');
    
    try {
        window.addEventListener('beforeunload', function(e) {
            try {
                const data = collectAllFormData();
                const hasData = data.date && data.storeName && (
                    Object.values(data.sales).some(v => v > 0) ||
                    Object.values(data.pointPayments).some(v => v > 0) ||
                    data.income.nyukin > 0 ||
                    data.income.miscIncome > 0 ||
                    data.income.foundMoney > 0 ||
                    data.expenses.length > 0 ||
                    data.remarks
                );
                
                if (hasData) {
                    e.preventDefault();
                    e.returnValue = '入力中のデータが失われる可能性があります。本当にページを離れますか？';
                    return e.returnValue;
                }
            } catch (error) {
                console.error('ページ離脱チェックでエラー:', error);
            }
        });
        
        console.log('ページ離脱警告の設定完了');
        
    } catch (error) {
        console.error('ページ離脱警告設定でエラー:', error);
    }
}

/**
 * 現在のユーザーセッションから店舗IDを取得
 * @returns {number|null} 店舗ID
 */
function getCurrentStoreId() {
    try {
        const userSession = JSON.parse(sessionStorage.getItem('userSession') || localStorage.getItem('userSession') || '{}');
        const storeId = userSession.store_id;
        const userRole = userSession.role;
        
        // 管理者の場合はセッション固定の店舗IDを使用しない
        if (userRole === 'admin') {
            console.log('👑 管理者ユーザー: セッション店舗IDをスキップ');
            return null;
        }
        
        if (storeId && storeId > 0) {
            console.log(`✅ セッションから店舗ID取得: ${storeId} (${userSession.storeName || '店舗名不明'})`);
            return storeId;
        } else {
            console.log('❌ セッションに有効な店舗IDが見つかりません:', userSession);
            return null;
        }
    } catch (error) {
        console.error('セッション情報の取得でエラー:', error);
        return null;
    }
}

/**
 * 店舗IDを取得（ユーザー種別に応じた最適化）
 * @param {string} storeName - 店舗名（フォールバック用）
 * @returns {Promise<number|null>} 店舗ID
 */
async function getStoreId(storeName = null) {
    const userSession = JSON.parse(sessionStorage.getItem('userSession') || localStorage.getItem('userSession') || '{}');
    const userRole = userSession.role;
    
    // 1. 一般ユーザーの場合：セッションから店舗ID取得を優先
    if (userRole !== 'admin') {
        const sessionStoreId = getCurrentStoreId();
        if (sessionStoreId) {
            return sessionStoreId;
        }
    }
    
    // 2. 管理者または一般ユーザーでセッション取得失敗の場合：現在の店舗名から取得
    let targetStoreName = storeName;
    
    if (!targetStoreName) {
        const storeNameElement = document.getElementById('storeName');
        if (storeNameElement && storeNameElement.value) {
            targetStoreName = storeNameElement.value;
        }
    }
    
    if (targetStoreName) {
        console.log(`� ${userRole === 'admin' ? '管理者' : 'ユーザー'}モード: 店舗名から店舗ID取得 (${targetStoreName})`);
        return await getStoreIdByName(targetStoreName);
    }
    
    console.log('❌ 店舗IDを取得できませんでした');
    return null;
}

/**
 * 店舗名から店舗IDを取得
 * @param {string} storeName 店舗名
 * @returns {Promise<number|null>} 店舗ID（見つからない場合はnull）
 */
async function getStoreIdByName(storeName) {
    try {
        console.log(`店舗名「${storeName}」の店舗IDを検索中...`);
        
        const response = await fetch(`api.php?action=getStoreByName&store_name=${encodeURIComponent(storeName)}`, {
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
            console.log(`店舗「${storeName}」の店舗ID: ${result.data.id}`);
            return result.data.id;
        } else {
            console.log(`店舗「${storeName}」が見つかりませんでした`);
            return null;
        }
        
    } catch (error) {
        console.error('店舗ID取得でエラー:', error);
        return null;
    }
}

/**
 * 新規店舗を作成
 * @param {string} storeName 店舗名
 * @returns {Promise<number>} 新しく作成された店舗ID
 */
async function createNewStore(storeName) {
    try {
        console.log(`新規店舗「${storeName}」を作成中...`);
        
        const response = await fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'createStore',
                store_name: storeName
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            console.log(`新規店舗「${storeName}」を作成しました。店舗ID: ${result.data.id}`);
            return result.data.id;
        } else {
            throw new Error(result.message || '店舗の作成に失敗しました');
        }
        
    } catch (error) {
        console.error('新規店舗作成でエラー:', error);
        throw error;
    }
}

/**
 * 並列処理版データ読み込み（フォールバック用）
 * パフォーマンス最適化: 店舗情報と保存データを同時取得
 * @param {string} date 日付
 * @param {number} storeId 店舗ID
 * @param {string} storeName 店舗名（オプション）
 * @returns {Promise<Object>} 統合されたデータ
 */
async function loadDataWithParallelFetch(date, storeId, storeName) {
    console.log(`⚡ 並列処理でデータ読み込み開始: ${date} - 店舗ID:${storeId}`);
    
    try {
        // 並列でAPIを実行
        const [storeInfoPromise, reportDataPromise] = await Promise.allSettled([
            // 店舗情報取得
            fetch('user-management.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_stores' })
            }).then(response => response.json()),
            
            // 保存データ取得
            fetch(`api.php?action=getReport&report_date=${encodeURIComponent(date)}&store_id=${storeId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }).then(response => response.json())
        ]);

        // 保存データの結果を確認
        let reportData = null;
        if (reportDataPromise.status === 'fulfilled' && reportDataPromise.value.success) {
            reportData = reportDataPromise.value.data;
            console.log('✅ 保存データ取得成功');
        } else {
            console.warn('❌ 保存データ取得失敗:', reportDataPromise.reason);
        }

        // 店舗情報の結果を確認（フォールバック用）
        let finalStoreName = storeName;
        if (storeInfoPromise.status === 'fulfilled' && storeInfoPromise.value.success) {
            const storeList = storeInfoPromise.value.data || storeInfoPromise.value.stores;
            const store = storeList?.find(s => s.id == storeId);
            if (store) {
                const apiStoreName = store.name || store.store_name;
                console.log(`🏪 店舗情報APIから店舗名取得: "${apiStoreName}"`);
                
                // 保存データに店舗名がない場合のみ使用
                if (!reportData?.storeName) {
                    finalStoreName = apiStoreName;
                }
            }
        } else {
            console.warn('⚠️ 店舗情報API失敗（フォールバック動作）');
        }

        // 保存データから店舗名を優先取得
        if (reportData?.storeName) {
            finalStoreName = reportData.storeName;
            console.log(`🎯 保存データから店舗名確定: "${finalStoreName}"`);
        }

        return {
            success: !!reportData,
            data: reportData,
            storeName: finalStoreName,
            message: reportData ? '並列処理によるデータ取得完了' : 'データが見つかりません'
        };

    } catch (error) {
        console.error('並列処理でエラー:', error);
        throw error;
    }
}

// グローバル関数として公開
window.getStoreIdByName = getStoreIdByName;
window.getManualTaxInputs = getManualTaxInputs;
window.getCurrentStoreId = getCurrentStoreId;
window.getStoreId = getStoreId;
window.loadDataWithParallelFetch = loadDataWithParallelFetch;
window.loadPreviousCashBalance = loadPreviousCashBalance;