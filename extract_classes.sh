#!/bin/bash

echo "=== HTMLファイルから使用クラス抽出 ==="
grep -ho 'class="[^"]*"' *.html | sed 's/class="//g' | sed 's/"//g' | tr ' ' '\n' | sort -u | grep -v '^$'

echo ""
echo "=== JavaScriptファイルから使用クラス抽出 ==="
grep -ho "className.*['\"][^'\"]*['\"]" js/*.js | sed "s/.*['\"]//g" | sed "s/['\"].*//g" | sort -u | grep -v '^$'
grep -ho "class.*['\"][^'\"]*['\"]" js/*.js | sed "s/.*['\"]//g" | sed "s/['\"].*//g" | sort -u | grep -v '^$'

echo ""
echo "=== CSSファイルからクラス定義抽出 ==="
grep -ho '\.[a-zA-Z_-][a-zA-Z0-9_-]*' styles.css | sed 's/^\.//g' | sort -u | grep -v '^$'
