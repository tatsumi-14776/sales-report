# デバッグログ削除スクリプト

$jsFiles = @(
    "js\ui.js",
    "js\main.js", 
    "js\calculations.js",
    "js\fileManager.js",
    "js\dynamic-config.js",
    "js\dataManager.js"
)

foreach ($file in $jsFiles) {
    if (Test-Path $file) {
        Write-Host "処理中: $file"
        
        # ファイル内容を読み込み
        $content = Get-Content $file -Raw
        
        # 不要なconsole.logを削除（エラーログは残す）
        $content = $content -replace "console\.log\('.*?生成を開始.*?\);\r?\n", ""
        $content = $content -replace "console\.log\('.*?生成完了.*?\);\r?\n", ""
        $content = $content -replace "console\.log\('.*?設定を開始.*?\);\r?\n", ""
        $content = $content -replace "console\.log\('.*?設定完了.*?\);\r?\n", ""
        $content = $content -replace "console\.log\('.*?件をクリア.*?\);\r?\n", ""
        $content = $content -replace "console\.log\('.*?を生成しました.*?\);\r?\n", ""
        $content = $content -replace "console\.log\('.*?初期化.*?\);\r?\n", ""
        $content = $content -replace "console\.log\('.*?完了.*?\);\r?\n", ""
        $content = $content -replace "console\.log\('.*?デバッグ.*?\);\r?\n", ""
        $content = $content -replace "console\.log\('✅.*?\);\r?\n", ""
        $content = $content -replace "console\.log\('🔍.*?\);\r?\n", ""
        $content = $content -replace "console\.log\('🎉.*?\);\r?\n", ""
        $content = $content -replace "console\.log\(`.*?`\);\r?\n", ""
        
        # ファイルに書き戻し
        $content | Set-Content $file -NoNewline
        
        Write-Host "完了: $file"
    }
}

Write-Host "すべてのファイルの処理が完了しました。"
