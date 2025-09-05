/**
 * ファイル管理
 * ファイルアップロード、添付ファイル管理
 */

// ファイル管理用変数
let attachedFiles = [];
let nextFileId = 1;

/**
 * ファイル入力欄を初期化
 */
function generateFileInputs() {
    const container = document.getElementById('fileInputs');
    if (!container) return;
    
    container.innerHTML = '';
    attachedFiles = [];
    
    // 添付①〜⑤の入力欄を生成
    for (let i = 1; i <= fileUploadConfig.MAX_FILES; i++) {
        createFileInput(i);
        attachedFiles.push({
            id: i,
            file: null,
            fileName: '',
            fileSize: 0,
            hasFile: false
        });
    }
}

/**
 * 個別のファイル入力欄を作成
 * @param {number} attachmentNumber 添付番号（1-5）
 */
function createFileInput(attachmentNumber) {
    const container = document.getElementById('fileInputs');
    if (!container) return;
    
    const fileInputRow = document.createElement('div');
    fileInputRow.className = 'file-input-row';
    fileInputRow.id = `fileRow_${attachmentNumber}`;
    
    const numberText = ['①', '②', '③', '④', '⑤'][attachmentNumber - 1];
    
    fileInputRow.innerHTML = `
        <div class="file-input-label">添付${numberText}</div>
        <div class="file-input-wrapper">
            <input type="file" 
                   id="file_${attachmentNumber}" 
                   class="file-input" 
                   accept="${fileUploadConfig.ALLOWED_EXTENSIONS}"
                   onchange="handleFileSelect(${attachmentNumber})">
        </div>
        <div class="file-info" id="fileInfo_${attachmentNumber}">
            <div class="file-status">
                <span class="file-name">ファイル未選択</span>
            </div>
            <span class="file-size"></span>
        </div>
        <button class="clear-file-button" 
                id="clearBtn_${attachmentNumber}" 
                onclick="clearFileInput(${attachmentNumber})" 
                style="display: none;" 
                title="ファイルをクリア">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
    `;
    
    container.appendChild(fileInputRow);
}

/**
 * ファイル選択時の処理
 * @param {number} attachmentNumber 添付番号
 */
function handleFileSelect(attachmentNumber) {
    const fileInput = document.getElementById(`file_${attachmentNumber}`);
    if (!fileInput || !fileInput.files.length) {
        clearFileDisplay(attachmentNumber);
        return;
    }

    const file = fileInput.files[0];
    
    // ファイルサイズチェック
    if (file.size > fileUploadConfig.MAX_FILE_SIZE) {
        const maxSizeMB = Math.round(fileUploadConfig.MAX_FILE_SIZE / 1024 / 1024);
        showError(`ファイルサイズが大きすぎます。${maxSizeMB}MB以下のファイルを選択してください。`);
        fileInput.value = '';
        clearFileDisplay(attachmentNumber);
        return;
    }

    // ファイルタイプチェック
    if (!fileUploadConfig.ALLOWED_TYPES.includes(file.type)) {
        showError('サポートされていないファイル形式です。PDF、Excel、Word、または画像ファイルを選択してください。');
        fileInput.value = '';
        clearFileDisplay(attachmentNumber);
        return;
    }

    // 重複ファイル名チェック
    const isDuplicate = attachedFiles.some(f => 
        f.hasFile && f.fileName === file.name && f.id !== attachmentNumber
    );
    
    if (isDuplicate) {
        showError('同じファイル名のファイルが既に添付されています。');
        fileInput.value = '';
        clearFileDisplay(attachmentNumber);
        return;
    }

    // ファイル情報を保存
    const fileIndex = attachedFiles.findIndex(f => f.id === attachmentNumber);
    if (fileIndex !== -1) {
        attachedFiles[fileIndex].file = file;
        attachedFiles[fileIndex].fileName = file.name;
        attachedFiles[fileIndex].fileSize = file.size;
        attachedFiles[fileIndex].hasFile = true;
    }

    // ファイル情報を表示
    updateFileDisplay(attachmentNumber, file);
}

/**
 * ファイル表示を更新
 * @param {number} attachmentNumber 添付番号
 * @param {File} file ファイルオブジェクト
 */
function updateFileDisplay(attachmentNumber, file) {
    const fileInput = document.getElementById(`file_${attachmentNumber}`);
    const fileInfo = document.getElementById(`fileInfo_${attachmentNumber}`);
    const clearButton = document.getElementById(`clearBtn_${attachmentNumber}`);
    
    if (!fileInput || !fileInfo || !clearButton) return;
    
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
    
    fileInput.classList.add('has-file');
    
    fileInfo.innerHTML = `
        <div class="file-status">
            <svg class="file-status-icon success" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div class="file-details">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${fileSizeMB}MB</span>
            </div>
        </div>
    `;
    
    clearButton.style.display = 'flex';
    clearButton.classList.add('active');
}

/**
 * ファイル表示をクリア
 * @param {number} attachmentNumber 添付番号
 */
function clearFileDisplay(attachmentNumber) {
    const fileInput = document.getElementById(`file_${attachmentNumber}`);
    const fileInfo = document.getElementById(`fileInfo_${attachmentNumber}`);
    const clearButton = document.getElementById(`clearBtn_${attachmentNumber}`);
    
    if (!fileInput || !fileInfo || !clearButton) return;
    
    fileInput.classList.remove('has-file');
    
    fileInfo.innerHTML = `
        <div class="file-status">
            <div class="file-details">
                <span class="file-name">ファイル未選択</span>
                <span class="file-size"></span>
            </div>
        </div>
    `;
    
    clearButton.style.display = 'none';
    clearButton.classList.remove('active');
    
    // データからも削除
    const fileIndex = attachedFiles.findIndex(f => f.id === attachmentNumber);
    if (fileIndex !== -1) {
        attachedFiles[fileIndex].file = null;
        attachedFiles[fileIndex].fileName = '';
        attachedFiles[fileIndex].fileSize = 0;
        attachedFiles[fileIndex].hasFile = false;
    }
}

/**
 * ファイル入力をクリア
 * @param {number} attachmentNumber 添付番号
 */
function clearFileInput(attachmentNumber) {
    const fileInput = document.getElementById(`file_${attachmentNumber}`);
    if (fileInput) {
        fileInput.value = '';
    }
    clearFileDisplay(attachmentNumber);
}

/**
 * 添付ファイルデータ収集
 * @returns {Array} ファイルデータの配列
 */
function collectFileData() {
    return attachedFiles
        .filter(f => f.hasFile && f.file !== null)
        .map(f => ({
            attachmentNumber: f.id,
            fileName: f.fileName,
            fileSize: f.fileSize,
            fileType: f.file.type,
            // 実際のファイルデータは Base64 エンコードして保存
            // 本番環境では適切なファイルアップロード処理を実装
            fileData: null // placeholder - 後でBase64エンコード処理を追加
        }));
}

/**
 * ファイルをBase64にエンコード
 * @param {File} file ファイルオブジェクト
 * @returns {Promise<string>} Base64エンコードされた文字列
 */
function encodeFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * すべての添付ファイルをBase64エンコード
 * @returns {Promise<Array>} エンコードされたファイルデータの配列
 */
async function collectEncodedFileData() {
    const attachedFileList = attachedFiles.filter(f => f.hasFile && f.file !== null);
    const encodedFiles = [];
    
    for (const fileData of attachedFileList) {
        try {
            const base64Data = await encodeFileToBase64(fileData.file);
            encodedFiles.push({
                attachmentNumber: fileData.id,
                fileName: fileData.fileName,
                fileSize: fileData.fileSize,
                fileType: fileData.file.type,
                fileData: base64Data
            });
        } catch (error) {
            console.error(`ファイル ${fileData.fileName} のエンコードに失敗:`, error);
            showError(`ファイル ${fileData.fileName} の処理に失敗しました。`);
        }
    }
    
    return encodedFiles;
}

/**
 * ファイルタイプからアイコンを取得
 * @param {string} fileType MIMEタイプ
 * @returns {string} アイコンのSVG文字列
 */
function getFileTypeIcon(fileType) {
    if (fileType.startsWith('image/')) {
        return `<svg class="file-status-icon" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>`;
    } else if (fileType === 'application/pdf') {
        return `<svg class="file-status-icon" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
        </svg>`;
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
        return `<svg class="file-status-icon" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16,17V15H14V17H16M14,13H16V11H14V13M20,3H4A2,2 0 0,0 2,5V19A2,2 0 0,0 4,21H20A2,2 0 0,0 22,19V5A2,2 0 0,0 20,3M20,19H4V5H20V19Z"/>
        </svg>`;
    } else if (fileType.includes('word') || fileType.includes('document')) {
        return `<svg class="file-status-icon" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>`;
    } else {
        return `<svg class="file-status-icon" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>`;
    }
}

/**
 * 添付ファイル数の統計取得
 * @returns {Object} ファイル統計オブジェクト
 */
function getFileStats() {
    const attachedCount = attachedFiles.filter(f => f.hasFile).length;
    const totalSize = attachedFiles
        .filter(f => f.hasFile)
        .reduce((total, f) => total + f.fileSize, 0);
    
    return {
        attachedCount,
        totalSize: totalSize / 1024 / 1024, // MB単位
        remainingSlots: fileUploadConfig.MAX_FILES - attachedCount
    };
}

/**
 * ドラッグ&ドロップ機能を有効化（将来の拡張用）
 */
function enableDragAndDrop() {
    const fileInputs = document.querySelectorAll('.file-input');
    
    fileInputs.forEach(input => {
        const wrapper = input.closest('.file-input-wrapper');
        if (!wrapper) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            wrapper.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            wrapper.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            wrapper.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            wrapper.classList.add('drag-over');
        }
        
        function unhighlight() {
            wrapper.classList.remove('drag-over');
        }
        
        wrapper.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                input.files = files;
                const attachmentNumber = parseInt(input.id.split('_')[1]);
                handleFileSelect(attachmentNumber);
            }
        }
    });
}

/**
 * Base64データから擬似Fileオブジェクトを作成
 */
function createFileFromBase64(fileData) {
    try {
        // Base64文字列からBlobを作成
        const base64String = fileData.fileData.split(',')[1]; // data:mime;base64, の部分を除去
        const byteCharacters = atob(base64String);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: fileData.fileType });
        
        // File風のオブジェクトを作成
        const file = new File([blob], fileData.fileName, {
            type: fileData.fileType,
            lastModified: Date.now()
        });
        
        return file;
    } catch (error) {
        console.error('Base64からFileオブジェクトの作成に失敗:', error);
        return null;
    }
}

/**
 * 保存されたファイルデータからUI表示を更新（改善版）
 */
function updateFileDisplayFromData(attachmentNumber, fileData) {
    const fileInput = document.getElementById(`file_${attachmentNumber}`);
    const fileInfo = document.getElementById(`fileInfo_${attachmentNumber}`);
    const clearButton = document.getElementById(`clearBtn_${attachmentNumber}`);
    
    if (!fileInput || !fileInfo || !clearButton) return;
    
    const fileSizeMB = (fileData.fileSize / 1024 / 1024).toFixed(1);
    
    fileInput.classList.add('has-file');
    
    // 🎨 より明確でわかりやすいダウンロード表示
    fileInfo.innerHTML = `
        <div class="file-status">
            <svg class="file-status-icon success" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div class="file-details">
                <div style="margin-bottom: 0.75rem; padding: 0.5rem; background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 0.375rem;">
                    <div style="font-size: 0.875rem; color: #374151; font-weight: 500;">
                        ${fileData.fileName}
                    </div>
                </div>
                <button class="file-name downloadable highlight" 
                        onclick="downloadRestoredFile(${attachmentNumber})" 
                        title="このファイルをPCにダウンロードします"
                        style="border: none; font-family: inherit; width: 100%;">
                    📥 PCにダウンロード
                </button>
            </div>
        </div>
    `;
    
    clearButton.style.display = 'flex';
    clearButton.classList.add('active');
    
    // 🔥 初回表示時に3秒間点滅して注意を引く
    const downloadButton = fileInfo.querySelector('.file-name.downloadable');
    if (downloadButton) {
        // 少し遅らせてからアニメーションを開始
        setTimeout(() => {
            downloadButton.classList.add('highlight');
        }, 100);
        
        // 3秒後にアニメーションを停止
        setTimeout(() => {
            downloadButton.classList.remove('highlight');
        }, 3100);
    }
}
/**
 * 復元されたファイルをダウンロードする
 * @param {number} attachmentNumber 添付番号
 */
function downloadRestoredFile(attachmentNumber) {
    try {
        console.log(`ファイル ${attachmentNumber} のダウンロードを開始`);
        
        // 添付ファイルデータを取得
        const fileIndex = attachmentNumber - 1;
        if (fileIndex < 0 || fileIndex >= attachedFiles.length || !attachedFiles[fileIndex] || !attachedFiles[fileIndex].hasFile) {
            console.error('ダウンロード対象のファイルが見つかりません');
            alert('ダウンロード対象のファイルが見つかりません');
            return;
        }
        
        const fileData = attachedFiles[fileIndex];
        console.log('ダウンロード対象ファイル:', fileData);
        
        // Fileオブジェクトから Blob URL を作成
        let downloadUrl, fileName;
        
        if (fileData.file && fileData.file instanceof File) {
            // 通常のFileオブジェクトの場合（復元されたファイルも含む）
            downloadUrl = URL.createObjectURL(fileData.file);
            fileName = fileData.file.name;
            console.log('標準Fileオブジェクトからダウンロード準備完了:', fileName);
        } else {
            console.error('ファイルデータの形式が不正です:', fileData);
            alert('ファイルデータの形式が不正です');
            return;
        }
        
        // ダウンロードリンクを作成して実行
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = fileName;
        downloadLink.style.display = 'none';
        
        // ページに追加して自動クリック
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // クリーンアップ
        document.body.removeChild(downloadLink);
        
        // Blob URLを解放（メモリリーク防止）
        setTimeout(() => {
            URL.revokeObjectURL(downloadUrl);
        }, 100);
        
        console.log(`ファイル ${fileName} のダウンロード完了`);
        
    } catch (error) {
        console.error('ファイルダウンロードでエラー:', error);
        alert('ファイルのダウンロードに失敗しました: ' + error.message);
    }
}