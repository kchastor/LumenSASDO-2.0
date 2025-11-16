# LumenSASDO 2.0 - Deployment Guide

## 📋 目錄

- [快速開始](#快速開始)
- [環境需求](#環境需求)
- [本地開發](#本地開發)
- [部署到 Cloudflare](#部署到-cloudflare)
- [環境變數設定](#環境變數設定)
- [CI/CD 設定](#cicd-設定)
- [故障排除](#故障排除)
- [回滾策略](#回滾策略)

---

## 🚀 快速開始

### 5 分鐘快速部署

```bash
# 1. Clone Repository
git clone https://github.com/windcgz/LumenSASDO-2.0.git
cd LumenSASDO-2.0

# 2. 安裝 Wrangler CLI
npm install -g wrangler

# 3. 登入 Cloudflare
wrangler login

# 4. 建立 D1 資料庫
wrangler d1 create lumensasdo-data

# 5. 更新 wrangler.toml（將 database_id 填入）

# 6. 初始化資料表
wrangler d1 execute lumensasdo-data --remote --file=./schema.sql

# 7. 部署 Worker
cd workers/cron-scraper
wrangler deploy

# 8. 驗證部署
curl https://your-worker.workers.dev/health
```

**預期結果：**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-14T10:00:00Z"
}
```

---

## 🛠️ 環境需求

### 必要工具

| 工具 | 版本 | 用途 | 安裝方式 |
|------|------|------|----------|
| **Node.js** | ≥ 18.0.0 | 執行環境 | [nodejs.org](https://nodejs.org/) |
| **npm** | ≥ 9.0.0 | 套件管理 | 隨 Node.js 安裝 |
| **Wrangler** | ≥ 3.0.0 | Cloudflare CLI | `npm install -g wrangler` |
| **Git** | ≥ 2.30.0 | 版本控制 | [git-scm.com](https://git-scm.com/) |

---

### Cloudflare 帳號需求

**必要：**
- ✅ Cloudflare 免費帳號
- ✅ 已驗證的網域（可選）

**額度需求：**
- Workers: 100,000 requests/day（免費）
- D1: 5GB storage + 5M reads/day（免費）
- Pages: Unlimited sites（免費）

**申請帳號：** [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)

---

### 檢查環境

```bash
# 檢查 Node.js 版本
node --version
# 預期：v18.0.0 或更高

# 檢查 npm 版本
npm --version
# 預期：9.0.0 或更高

# 檢查 Wrangler 版本
wrangler --version
# 預期：3.0.0 或更高

# 檢查 Git 版本
git --version
# 預期：2.30.0 或更高

# 檢查 Cloudflare 登入狀態
wrangler whoami
# 預期：顯示你的帳號資訊
```

---

## 💻 本地開發

### 1️⃣ Clone 專案

```bash
# HTTPS
git clone https://github.com/windcgz/LumenSASDO-2.0.git

# SSH（需要先設定 SSH Key）
git clone git@github.com:windcgz/LumenSASDO-2.0.git

# 進入專案目錄
cd LumenSASDO-2.0
```

---

### 2️⃣ 安裝依賴

```bash
# 進入 Worker 目錄
cd workers/cron-scraper

# 安裝依賴
npm install

# 驗證安裝
npm list
```

**預期輸出：**
```
lumensasdo-cron-scraper@1.0.0
├── @cloudflare/workers-types@4.20231218.0
└── wrangler@3.78.12
```

---

### 3️⃣ 建立本地 D1 資料庫

```bash
# 建立本地資料庫
wrangler d1 create lumensasdo-data-local --local

# 初始化資料表
wrangler d1 execute lumensasdo-data-local --local --file=../../schema.sql
```

**schema.sql 範例：**
```sql
-- schema.sql
CREATE TABLE IF NOT EXISTS farm_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trans_date TEXT NOT NULL,
    crop_name TEXT NOT NULL,
    market_name TEXT NOT NULL,
    up_price TEXT,
    mid_price TEXT,
    low_price TEXT,
    avg_price TEXT,
    trans_quantity TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_date ON farm_prices(trans_date);
CREATE INDEX IF NOT EXISTS idx_crop ON farm_prices(crop_name);

CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_name TEXT NOT NULL UNIQUE,
    threshold_high TEXT,
    threshold_low TEXT,
    alert_enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

### 4️⃣ 本地開發伺服器

```bash
# 啟動開發伺服器（連接本地 D1）
wrangler dev

# 或使用遠端 D1（需要先部署）
wrangler dev --remote

# 指定端口
wrangler dev --port 8787
```

**預期輸出：**
```
⎔ Starting local server...
╭──────────────────────────────────────────────╮
│ [b] open browser, [d] debug, [x] exit        │
╰──────────────────────────────────────────────╯
[mf:inf] Worker reloaded! (123ms)
[mf:inf] Listening on http://localhost:8787
```

**測試 Worker：**
```bash
# 健康檢查
curl http://localhost:8787/health

# API 測試
curl http://localhost:8787/api/prices?limit=10
```

---

### 5️⃣ 本地測試

```bash
# 執行測試（如果有）
npm test

# 程式碼檢查
npm run lint

# 型別檢查
npm run typecheck
```

---

## ☁️ 部署到 Cloudflare

### Step 1: 登入 Cloudflare

```bash
# 互動式登入
wrangler login

# 瀏覽器會開啟，授權後回到終端機
# 預期看到：Successfully logged in.
```

---

### Step 2: 建立正式 D1 資料庫

```bash
# 建立資料庫
wrangler d1 create lumensasdo-data

# 預期輸出：
# ✅ Successfully created DB 'lumensasdo-data'
# 
# [[d1_databases]]
# binding = "DB"
# database_name = "lumensasdo-data"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**重要：** 複製 `database_id`，稍後需要用到！

---

### Step 3: 更新 wrangler.toml

編輯 `workers/cron-scraper/wrangler.toml`：

```toml
name = "lumensasdo-cron-scraper"
main = "src/index.ts"
compatibility_date = "2024-11-14"

# 將這裡的 database_id 替換成你的
[[d1_databases]]
binding = "DB"
database_name = "lumensasdo-data"
database_id = "你的-database-id-放這裡"

# Cron Triggers
[triggers]
crons = ["0 3 * * *"]  # 每日凌晨 3:00
```

---

### Step 4: 初始化資料表

```bash
# 在遠端資料庫執行 SQL
wrangler d1 execute lumensasdo-data --remote --file=../../schema.sql

# 預期輸出：
# 🌀 Mapping SQL input into an array of statements
# 🌀 Executing on remote database lumensasdo-data (xxxxxx):
# ✅ Successfully executed 3 commands
```

**驗證資料表：**
```bash
# 查看資料表
wrangler d1 execute lumensasdo-data --remote --command "SELECT name FROM sqlite_master WHERE type='table'"

# 預期輸出：
# ┌──────────────┐
# │ name         │
# ├──────────────┤
# │ farm_prices  │
# │ watchlist    │
# └──────────────┘
```

---

### Step 5: 部署 Worker

```bash
# 確保在 workers/cron-scraper 目錄
cd workers/cron-scraper

# 部署到 Cloudflare
wrangler deploy

# 預期輸出：
# Total Upload: xx.xx KiB / gzip: xx.xx KiB
# Uploaded lumensasdo-cron-scraper (x.xx sec)
# Published lumensasdo-cron-scraper (x.xx sec)
#   https://lumensasdo-cron-scraper.your-subdomain.workers.dev
# Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**記下你的 Worker URL！**

---

### Step 6: 驗證部署

```bash
# 健康檢查
curl https://lumensasdo-cron-scraper.your-subdomain.workers.dev/health

# 預期回應：
{
  "status": "healthy",
  "timestamp": "2025-11-14T10:00:00Z",
  "services": {
    "database": "ok",
    "cron_jobs": "ok"
  }
}

# 測試 API
curl "https://lumensasdo-cron-scraper.your-subdomain.workers.dev/api/prices?limit=5"
```

---

### Step 7: 手動觸發 Cron（測試資料收集）

```bash
# 方法 1：使用 Cloudflare Dashboard
# 1. 前往 https://dash.cloudflare.com
# 2. Workers & Pages > lumensasdo-cron-scraper
# 3. Triggers > Cron Triggers > Manual Trigger

# 方法 2：使用 wrangler tail 觀察
wrangler tail lumensasdo-cron-scraper

# 在另一個終端觸發（需要在 Dashboard 手動觸發）
# 然後觀察日誌輸出
```

**預期日誌：**
```
✅ 2025-11-14 10:30:00 - Cron job started
📥 2025-11-14 10:30:05 - Fetched 1500 records from API
🔄 2025-11-14 10:30:08 - Transformed data
💾 2025-11-14 10:30:10 - Batch inserted to D1
✅ 2025-11-14 10:30:12 - Cron job completed successfully
```

---

### Step 8: 驗證資料

```bash
# 查詢資料庫確認資料已寫入
wrangler d1 execute lumensasdo-data --remote --command \
  "SELECT COUNT(*) as total FROM farm_prices"

# 預期輸出：
# ┌───────┐
# │ total │
# ├───────┤
# │ 1500  │
# └───────┘

# 查看最新資料
wrangler d1 execute lumensasdo-data --remote --command \
  "SELECT * FROM farm_prices ORDER BY created_at DESC LIMIT 5"
```

---

## 🔐 環境變數設定

### Secrets 管理

Cloudflare Workers 使用 **Wrangler Secrets** 管理敏感資訊。

#### 設定 Gemini API Key（規劃中）

```bash
# 設定 Secret
wrangler secret put GEMINI_API_KEY
# 提示輸入 API Key，輸入後按 Enter
# 預期輸出：✅ Successfully created secret GEMINI_API_KEY

# 查看已設定的 Secrets
wrangler secret list
# 預期輸出：
# ┌─────────────────┬──────────────────────┐
# │ Name            │ Created              │
# ├─────────────────┼──────────────────────┤
# │ GEMINI_API_KEY  │ 2025-11-14 10:30:00  │
# └─────────────────┴──────────────────────┘
```

#### 在 Worker 中使用 Secrets

```typescript
// src/index.ts
export default {
  async fetch(request: Request, env: Env) {
    // 從 env 存取 Secret
    const apiKey = env.GEMINI_API_KEY;
    
    // 使用 API Key
    const response = await fetch('https://api.gemini.google.com/...', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
  }
}
```

---

### 環境變數（非敏感）

非敏感的設定可以直接寫在 `wrangler.toml`：

```toml
[vars]
ENVIRONMENT = "production"
API_TIMEOUT = "30000"
MAX_RETRIES = "3"
```

**在 Worker 中使用：**
```typescript
const timeout = parseInt(env.API_TIMEOUT);
const maxRetries = parseInt(env.MAX_RETRIES);
```

---

### 環境變數列表

| 變數名稱 | 類型 | 用途 | 設定方式 |
|----------|------|------|----------|
| `GEMINI_API_KEY` | Secret | Gemini AI API 金鑰 | `wrangler secret put` |
| `DATABASE_ENCRYPTION_KEY` | Secret | 資料加密金鑰（規劃中） | `wrangler secret put` |
| `ENVIRONMENT` | Var | 環境標示 | `wrangler.toml` |
| `API_TIMEOUT` | Var | API 逾時時間（ms） | `wrangler.toml` |
| `MAX_RETRIES` | Var | 最大重試次數 | `wrangler.toml` |

---

## 🤖 CI/CD 設定

### GitHub Actions 設定

#### Step 1: 建立 Cloudflare API Token

1. 前往 [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. 點擊 **Create Token**
3. 使用 **Edit Cloudflare Workers** 模板
4. 設定權限：
   - Account > Workers Scripts > Edit
   - Zone > Workers Routes > Edit
5. 複製產生的 Token

---

#### Step 2: 設定 GitHub Secrets

1. 前往 GitHub Repository > Settings > Secrets and variables > Actions
2. 新增以下 Secrets：

| Secret 名稱 | 值 |
|-------------|-----|
| `CLOUDFLARE_API_TOKEN` | 剛才複製的 API Token |
| `CLOUDFLARE_ACCOUNT_ID` | 你的 Account ID（Dashboard 右側） |

---

#### Step 3: 建立 Workflow 檔案

建立 `.github/workflows/deploy.yml`：

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        working-directory: ./workers/cron-scraper
        run: npm ci
      
      - name: Run ESLint
        working-directory: ./workers/cron-scraper
        run: npm run lint
      
      - name: Type Check
        working-directory: ./workers/cron-scraper
        run: npm run typecheck

  deploy:
    name: Deploy Worker
    runs-on: ubuntu-latest
    needs: lint
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        working-directory: ./workers/cron-scraper
        run: npm ci
      
      - name: Deploy to Cloudflare
        working-directory: ./workers/cron-scraper
        run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      
      - name: Deployment Summary
        run: |
          echo "✅ Deployment successful!"
          echo "🔗 Worker URL: https://lumensasdo-cron-scraper.your-subdomain.workers.dev"
```

---

#### Step 4: 觸發自動部署

```bash
# 提交變更
git add .
git commit -m "feat: add CI/CD workflow"
git push origin main

# GitHub Actions 會自動執行：
# 1. Lint & Type Check
# 2. Deploy to Cloudflare（僅在 main 分支）
```

**在 GitHub 查看執行狀態：**
1. 前往 Repository > Actions
2. 查看最新的 Workflow 執行
3. 確認所有步驟都是綠色 ✅

---

### 部署策略

#### 1️⃣ 主分支自動部署

```
main 分支
    ↓ [git push]
GitHub Actions
    ↓ [自動執行]
Cloudflare Workers
```

#### 2️⃣ PR 預覽部署（規劃中）

```
feature/* 分支
    ↓ [Pull Request]
GitHub Actions
    ↓ [建立預覽環境]
Cloudflare Workers (Preview)
```

---

## 🔧 故障排除

### 常見問題

#### 1️⃣ 部署失敗：Wrangler authentication error

**錯誤訊息：**
```
Error: Not authenticated
```

**解決方法：**
```bash
# 重新登入
wrangler logout
wrangler login

# 或使用 API Token
export CLOUDFLARE_API_TOKEN="your-token"
wrangler deploy
```

---

#### 2️⃣ D1 資料庫連線失敗

**錯誤訊息：**
```
Error: D1_ERROR: no such table: farm_prices
```

**解決方法：**
```bash
# 檢查資料庫是否存在
wrangler d1 list

# 檢查資料表
wrangler d1 execute lumensasdo-data --remote --command \
  "SELECT name FROM sqlite_master WHERE type='table'"

# 如果資料表不存在，重新執行 schema
wrangler d1 execute lumensasdo-data --remote --file=./schema.sql
```

---

#### 3️⃣ Cron 沒有自動執行

**檢查步驟：**

```bash
# 1. 確認 wrangler.toml 設定
cat wrangler.toml | grep -A 2 triggers

# 預期輸出：
# [triggers]
# crons = ["0 3 * * *"]

# 2. 查看 Cloudflare Dashboard
# Workers & Pages > Your Worker > Triggers > Cron Triggers

# 3. 檢查 Worker 日誌
wrangler tail lumensasdo-cron-scraper
```

---

#### 4️⃣ API 回應 500 錯誤

**除錯步驟：**

```bash
# 1. 查看即時日誌
wrangler tail lumensasdo-cron-scraper

# 2. 測試特定端點
curl -v https://your-worker.workers.dev/api/prices

# 3. 檢查資料庫狀態
wrangler d1 execute lumensasdo-data --remote --command \
  "SELECT COUNT(*) FROM farm_prices"

# 4. 查看詳細錯誤
# 在 Worker 程式碼中加入更多 console.log
```

---

#### 5️⃣ npm install 失敗

**錯誤訊息：**
```
npm ERR! code EACCES
```

**解決方法：**
```bash
# 方法 1：使用 nvm（推薦）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 方法 2：修復權限
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

---

#### 6️⃣ TypeScript 編譯錯誤

**錯誤訊息：**
```
error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
```

**解決方法：**
```bash
# 1. 檢查 tsconfig.json
cat tsconfig.json

# 2. 確保型別正確
# 將字串轉為數字
const limit = parseInt(url.searchParams.get('limit') || '100');

# 3. 重新編譯
npm run build
```

---

### 日誌分析

#### 即時日誌查看

```bash
# 基本日誌
wrangler tail lumensasdo-cron-scraper

# 過濾特定訊息
wrangler tail lumensasdo-cron-scraper | grep "ERROR"

# 包含 HTTP 請求資訊
wrangler tail lumensasdo-cron-scraper --format pretty
```

---

#### 日誌輸出範例

```
✅ 正常執行：
2025-11-14 03:00:00 INFO Cron job started
2025-11-14 03:00:05 INFO Fetched 1500 records
2025-11-14 03:00:10 INFO Successfully inserted to D1

❌ 錯誤執行：
2025-11-14 03:00:00 INFO Cron job started
2025-11-14 03:00:05 ERROR Failed to fetch API: TIMEOUT
2025-11-14 03:00:08 INFO Retrying... (1/3)
2025-11-14 03:00:13 ERROR Failed to fetch API: TIMEOUT
```

---

## 🔄 回滾策略

### 快速回滾

#### 方法 1：使用 Cloudflare Dashboard

1. 前往 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Workers & Pages > lumensasdo-cron-scraper
3. Deployments
4. 找到穩定的版本
5. 點擊 **Rollback to this deployment**

---

#### 方法 2：使用 Git + Wrangler

```bash
# 1. 查看 Git 歷史
git log --oneline

# 2. 回到穩定版本
git checkout <commit-hash>

# 3. 重新部署
cd workers/cron-scraper
wrangler deploy

# 4. 確認回滾成功
curl https://your-worker.workers.dev/health
```

---

#### 方法 3：使用 GitHub Actions 重新部署

```bash
# 1. 回到穩定的 commit
git revert <bad-commit-hash>

# 2. 推送到 main
git push origin main

# 3. GitHub Actions 自動部署穩定版本
```

---

### 資料庫回滾（謹慎使用）

```bash
# ⚠️ 警告：資料庫回滾會造成資料遺失！

# 1. 備份當前資料
wrangler d1 execute lumensasdo-data --remote --command \
  "SELECT * FROM farm_prices" > backup_$(date +%Y%m%d).json

# 2. 刪除資料表（如果需要）
wrangler d1 execute lumensasdo-data --remote --command \
  "DROP TABLE farm_prices"

# 3. 重建資料表
wrangler d1 execute lumensasdo-data --remote --file=./schema.sql

# 4. 匯入備份資料（需要自己實作）
```

---

## 📊 部署檢查清單

### 部署前

- [ ] 本地測試通過
- [ ] 程式碼審查完成
- [ ] 文檔更新
- [ ] 環境變數檢查
- [ ] 資料庫 schema 更新
- [ ] 備份現有資料

### 部署中

- [ ] CI/CD 測試通過
- [ ] 部署成功確認
- [ ] 健康檢查正常
- [ ] API 端點測試
- [ ] Cron 觸發測試

### 部署後

- [ ] 監控日誌 30 分鐘
- [ ] 效能指標正常
- [ ] 錯誤率 < 1%
- [ ] 回應時間正常
- [ ] 使用者回報檢查

---

## 🎯 最佳實踐

### 1️⃣ 藍綠部署（未來規劃）

```
Blue（當前穩定版本）
    ↓ [新版本準備好]
Green（新版本）
    ↓ [驗證無誤]
切換流量到 Green
    ↓ [有問題時]
立即切回 Blue
```

---

### 2️⃣ 漸進式部署（未來規劃）

```
10% 流量 → 新版本
    ↓ [監控 1 小時]
50% 流量 → 新版本
    ↓ [監控 1 小時]
100% 流量 → 新版本
```

---

### 3️⃣ 健康檢查

```bash
# 自動化健康檢查腳本
#!/bin/bash

WORKER_URL="https://your-worker.workers.dev"

# 檢查健康端點
response=$(curl -s "$WORKER_URL/health")
status=$(echo $response | jq -r '.status')

if [ "$status" = "healthy" ]; then
    echo "✅ Worker is healthy"
    exit 0
else
    echo "❌ Worker is unhealthy"
    echo "Response: $response"
    exit 1
fi
```

---

## 📞 取得協助

### 官方資源

- 📚 [Cloudflare Docs](https://developers.cloudflare.com/)
- 💬 [Cloudflare Community](https://community.cloudflare.com/)
- 🐛 [GitHub Issues](https://github.com/windcgz/LumenSASDO-2.0/issues)

### 聯絡方式

- 📧 Email: [your-email]
- 💬 Discord: [your-discord]
- 🐦 Twitter: [your-twitter]

---

## 🔄 變更日誌

### v1.0.0 (2025-11-14)
- ✅ 初始部署指南
- ✅ Cloudflare 部署流程
- ✅ CI/CD 設定
- ✅ 故障排除指南

---

**更新日期：** 2025-11-14  
**文檔版本：** v1.0.0  
**維護者：** LumenSASDO Team
