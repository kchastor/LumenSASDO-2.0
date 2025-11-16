-- LumenSASDO 2.0 Database Schema
-- Cloudflare D1 (SQLite)

-- 農產品價格表
CREATE TABLE IF NOT EXISTS farm_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trans_date TEXT NOT NULL,              -- 交易日期 (YYYY-MM-DD)
    crop_name TEXT NOT NULL,               -- 作物名稱
    market_name TEXT NOT NULL,             -- 市場名稱
    up_price TEXT,                         -- 上價 (元/公斤)
    mid_price TEXT,                        -- 中價 (元/公斤)
    low_price TEXT,                        -- 下價 (元/公斤)
    avg_price TEXT,                        -- 平均價 (元/公斤)
    trans_quantity TEXT,                   -- 交易量 (公斤)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(trans_date, crop_name, market_name)
);

-- 建立索引以優化查詢效能
CREATE INDEX IF NOT EXISTS idx_trans_date ON farm_prices(trans_date);
CREATE INDEX IF NOT EXISTS idx_crop_name ON farm_prices(crop_name);
CREATE INDEX IF NOT EXISTS idx_market_name ON farm_prices(market_name);
CREATE INDEX IF NOT EXISTS idx_composite ON farm_prices(trans_date, crop_name);

-- 監控清單表
CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_name TEXT NOT NULL UNIQUE,        -- 監控作物名稱
    threshold_high TEXT,                   -- 高價閾值
    threshold_low TEXT,                    -- 低價閾值
    alert_enabled INTEGER DEFAULT 1,       -- 是否啟用警報 (0=否, 1=是)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 價格警報記錄表
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_name TEXT NOT NULL,               -- 作物名稱
    alert_type TEXT NOT NULL,              -- 警報類型 (high/low)
    trigger_price TEXT NOT NULL,           -- 觸發價格
    threshold TEXT NOT NULL,               -- 設定閾值
    trans_date TEXT NOT NULL,              -- 交易日期
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_crop ON alerts(crop_name);
CREATE INDEX IF NOT EXISTS idx_alerts_date ON alerts(trans_date);

-- 雞蛋價格表 (規劃中)
-- CREATE TABLE IF NOT EXISTS egg_prices (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     trans_date TEXT NOT NULL,
--     region TEXT NOT NULL,
--     price TEXT NOT NULL,
--     created_at TEXT DEFAULT CURRENT_TIMESTAMP,
--     UNIQUE(trans_date, region)
-- );

-- 大宗物資價格表 (規劃中)
-- CREATE TABLE IF NOT EXISTS commodity_prices (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     trans_date TEXT NOT NULL,
--     commodity_name TEXT NOT NULL,
--     price TEXT NOT NULL,
--     unit TEXT NOT NULL,
--     created_at TEXT DEFAULT CURRENT_TIMESTAMP,
--     UNIQUE(trans_date, commodity_name)
-- );

-- AI 情報報告表 (規劃中)
-- CREATE TABLE IF NOT EXISTS intelligence_reports (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     report_type TEXT NOT NULL,
--     content TEXT NOT NULL,
--     source TEXT,
--     created_at TEXT DEFAULT CURRENT_TIMESTAMP
-- );
