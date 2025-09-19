<?php
/**
 * データベース設定クラス
 * 開発環境と本番環境の設定を一元管理
 */
class DatabaseConfig {
    // 環境設定（開発環境: 'development', 本番環境: 'production'）
    private static $environment = 'development';
    
    // 開発環境の設定
    private static $developmentConfig = [
        'host' => 'localhost',
        'dbname' => 'sales_report',
        'username' => 'root',
        'password' => '',
        'charset' => 'utf8mb4'
    ];
    
    // 本番環境の設定（必要に応じて変更）
    private static $productionConfig = [
        'host' => 'mysql10080.xserver.jp',
        'dbname' => 'xs506451_salesreport',
        'username' => 'xs506451_yanagi',
        'password' => 'atya38565690',
        'charset' => 'utf8mb4'
    ];
    
    /**
     * 現在の環境設定を取得
     */
    private static function getCurrentConfig() {
        return self::$environment === 'production' 
            ? self::$productionConfig 
            : self::$developmentConfig;
    }
    
    /**
     * データベース接続を取得
     */
    public static function getConnection() {
        $config = self::getCurrentConfig();
        
        try {
            $dsn = "mysql:host={$config['host']};dbname={$config['dbname']};charset={$config['charset']}";
            $pdo = new PDO($dsn, $config['username'], $config['password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);
            
            return $pdo;
            
        } catch (PDOException $e) {
            error_log("データベース接続エラー: " . $e->getMessage());
            throw new Exception("データベース接続に失敗しました");
        }
    }
    
    /**
     * 環境を設定
     */
    public static function setEnvironment($env) {
        if (in_array($env, ['development', 'production'])) {
            self::$environment = $env;
        }
    }
    
    /**
     * 現在の環境を取得
     */
    public static function getEnvironment() {
        return self::$environment;
    }
}
