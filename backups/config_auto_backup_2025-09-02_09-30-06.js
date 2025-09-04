/**
 * 設定ファイル
 * 支払い方法、ポイント割引、金種などの設定を管理
 */

// 支払い方法設定（管理者が設定）
const paymentMethodConfig = [
    {id: 'cash', label: '現金', color: 'green', isCash: true},
    {id: 'cash2', label: '現金２', color: 'green', isCash: true},
    {id: 'card', label: 'カード', color: 'blue', isCash: false},
    {id: 'paypay', label: 'PayPay', color: 'red', isCash: false},
    {id: 'linepay', label: 'LINE Pay', color: 'green', isCash: false},
    {id: 'rakutenpay', label: '楽天ペイ', color: 'red', isCash: false},
    {id: 'aupay', label: 'au PAY', color: 'orange', isCash: false},
    {id: 'dpay', label: 'd払い', color: 'red', isCash: false}
    // 管理者がここに追加可能
];

// ポイント割引設定（売上に含める支払い方法として扱う）
const pointPaymentConfig = [
    {id: 'pointDiscount1', label: 'ポイント割引1'},
    {id: 'pointDiscount2', label: 'ポイント割引2'},
    {id: 'pointDiscount3', label: 'dポイント割引'},
    {id: 'pointDiscount4', label: 'Tポイント割引'},
    {id: 'pointDiscount5', label: '会員割引'},
    {id: 'pointDiscount6', label: 'アプリ割引'},
    {id: 'pointDiscount7', label: 'クーポン割引'}
    // 管理者がここに追加可能
];

// 金種設定
const denominations = [
    {key: 'bill10000', label: '10,000円札', value: 10000},
    {key: 'bill5000', label: '5,000円札', value: 5000},
    {key: 'bill1000', label: '1,000円札', value: 1000},
    {key: 'coin500', label: '500円玉', value: 500},
    {key: 'coin100', label: '100円玉', value: 100},
    {key: 'coin50', label: '50円玉', value: 50},
    {key: 'coin10', label: '10円玉', value: 10},
    {key: 'coin5', label: '5円玉', value: 5},
    {key: 'coin1', label: '1円玉', value: 1}
];

// 勘定科目設定
const accountCategories = [
    {value: '', label: '勘定科目'},
    {value: '消耗品費', label: '消耗品費'},
    {value: '雑費', label: '雑費'},
    {value: '通信費', label: '通信費'},
    {value: '水道光熱費', label: '水道光熱費'},
    {value: '修繕費', label: '修繕費'},
    {value: '交通費', label: '交通費'},
    {value: 'その他', label: 'その他'}
];

// ファイルアップロード設定
const fileUploadConfig = {
    MAX_FILES: 5,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif'
    ],
    ALLOWED_EXTENSIONS: '.pdf,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png,.gif'
};

// API設定（後でバックエンド連携時に使用）
const apiConfig = {
    BASE_URL: '', // バックエンドAPIのベースURL
    ENDPOINTS: {
        STORE_CONFIG: '/api/store_config.php',
        DAILY_REPORT: '/api/daily_report.php',
        ADMIN: '/api/admin.php'
    }
};

// アプリケーション設定
const appConfig = {
    VERSION: '1.0.0',
    DEBUG: false, // 本番環境ではfalseに設定
    AUTO_SAVE_INTERVAL: 30000, // 30秒（自動保存間隔）
    VALIDATION: {
        REQUIRED_FIELDS: ['date', 'storeName', 'inputBy'],
        MAX_REMARKS_LENGTH: 1000
    }
};