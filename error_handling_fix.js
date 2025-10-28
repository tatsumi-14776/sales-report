// 過去データ検索時のエラーハンドリングを修正（loadSampleData関数用）
// エラーメッセージを適切に表示
if (cashError.message && cashError.message.includes('過去1週間のデータに有効な現金残高が見つかりませんでした')) {
    showError(cashError.message);
} else {
    showError(result.message || '指定された日付・店舗のデータが見つかりません');
}
