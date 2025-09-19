# HTMLファイルとJavaScriptファイルで使用されているクラス名を抽出
$usedClasses = @()

# HTMLファイルからクラス名を抽出
Write-Host "=== HTMLファイルから使用クラス抽出 ==="
Get-ChildItem -Filter "*.html" | ForEach-Object {
    $content = Get-Content $_.Name -Raw
    $classMatches = [regex]::Matches($content, 'class="([^"]*)"')
    foreach ($match in $classMatches) {
        $classes = $match.Groups[1].Value -split '\s+'
        $usedClasses += $classes
    }
}

# JavaScriptファイルからクラス名を抽出
Write-Host "=== JavaScriptファイルから使用クラス抽出 ==="
Get-ChildItem -Path "js" -Filter "*.js" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    # className = 'xxx' パターン
    $classNameMatches = [regex]::Matches($content, "className\s*=\s*'([^']*)'")
    foreach ($match in $classNameMatches) {
        $usedClasses += $match.Groups[1].Value
    }
    # class="xxx" パターン（テンプレート内）
    $classAttrMatches = [regex]::Matches($content, 'class="([^"]*)"')
    foreach ($match in $classAttrMatches) {
        $classes = $match.Groups[1].Value -split '\s+'
        $usedClasses += $classes
    }
}

# 重複を除去してソート
$uniqueUsedClasses = $usedClasses | Where-Object { $_ -ne '' } | Sort-Object -Unique

Write-Host "使用されているクラス名:"
$uniqueUsedClasses | ForEach-Object { Write-Host "  $_" }

# CSSファイルからクラス定義を抽出
Write-Host "`n=== CSSファイルからクラス定義抽出 ==="
$cssContent = Get-Content "styles.css" -Raw
$cssClassMatches = [regex]::Matches($cssContent, '\.([a-zA-Z_-][a-zA-Z0-9_-]*)')
$definedClasses = @()
foreach ($match in $cssClassMatches) {
    $definedClasses += $match.Groups[1].Value
}
$uniqueDefinedClasses = $definedClasses | Sort-Object -Unique

Write-Host "定義されているクラス名:"
$uniqueDefinedClasses | ForEach-Object { Write-Host "  $_" }

# 未使用クラスを特定
Write-Host "`n=== 未使用クラス ==="
$unusedClasses = $uniqueDefinedClasses | Where-Object { $_ -notin $uniqueUsedClasses }
if ($unusedClasses) {
    $unusedClasses | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "未使用のクラスはありません"
}

Write-Host "`n未使用クラス数: $($unusedClasses.Count)"
Write-Host "定義済みクラス数: $($uniqueDefinedClasses.Count)"
Write-Host "使用中クラス数: $($uniqueUsedClasses.Count)"
