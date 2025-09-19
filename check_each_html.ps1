# 各HTMLファイルで使用されているクラス名を個別に抽出
$htmlFiles = @(
    "index.html",
    "admin.html", 
    "login.html",
    "daily-reports-dashboard.html",
    "user-management.html",
    "store-settings.html",
    "payment-methods.html",
    "test.html"
)

$allUsedClasses = @()

foreach ($file in $htmlFiles) {
    if (Test-Path $file) {
        Write-Host "=== $file ==="
        $content = Get-Content $file -Raw
        $classMatches = [regex]::Matches($content, 'class="([^"]*)"')
        $fileClasses = @()
        
        foreach ($match in $classMatches) {
            $classes = $match.Groups[1].Value -split '\s+'
            $fileClasses += $classes
        }
        
        $uniqueFileClasses = $fileClasses | Where-Object { $_ -ne '' } | Sort-Object -Unique
        Write-Host "使用クラス数: $($uniqueFileClasses.Count)"
        
        if ($uniqueFileClasses.Count -gt 0) {
            $uniqueFileClasses | ForEach-Object { Write-Host "  $_" }
            $allUsedClasses += $uniqueFileClasses
        } else {
            Write-Host "  クラスが見つかりませんでした"
        }
        Write-Host ""
    }
}

# JavaScriptファイルからも抽出
Write-Host "=== JavaScriptファイル ==="
Get-ChildItem -Path "js" -Filter "*.js" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    # className = 'xxx' パターン
    $classNameMatches = [regex]::Matches($content, "className\s*=\s*'([^']*)'")
    foreach ($match in $classNameMatches) {
        $allUsedClasses += $match.Groups[1].Value
    }
    # class="xxx" パターン（テンプレート内）
    $classAttrMatches = [regex]::Matches($content, 'class="([^"]*)"')
    foreach ($match in $classAttrMatches) {
        $classes = $match.Groups[1].Value -split '\s+'
        $allUsedClasses += $classes
    }
}

# 全体の統計
$uniqueAllClasses = $allUsedClasses | Where-Object { $_ -ne '' } | Sort-Object -Unique
Write-Host "=== 全体統計 ==="
Write-Host "総使用クラス数: $($uniqueAllClasses.Count)"
