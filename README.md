# LumenSASDO 2.0

> **你遊山玩水，AI 為你工作** - 智能化農產品採購決策平台

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 專案簡介

**LumenSASDO 2.0** 是一個完整的企業級智能採購平台，整合四 AI 協作矩陣（Copilot + Perplexity + Gemini + Claude），實現從資料收集、分析、到決策的全自動化流程。

### 核心特色

- 🤖 **四 AI 協作矩陣** - Copilot（感知預策）、Perplexity（外源資蒐）、Gemini（審查維律）、Claude（開源擴建）
- ⚡ **Serverless 架構** - 基於 Cloudflare Workers，零維運成本
- 📊 **即時資料分析** - 每日自動更新農產品價格
- 💰 **智能採購建議** - AI 驅動的採購決策支援
- 🔔 **價格監控預警** - 自訂閾值，即時通知
- 📈 **趨勢預測分析** - 歷史資料分析與未來預測

---

## 🚀 快速開始

### 前置需求

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0
- Wrangler CLI ≥ 3.0.0
- Cloudflare 帳號

### 5 分鐘快速部署

```bash
# 1. Clone Repository
git clone https://github.com/windcgz/LumenSASDO-2.0.git
cd LumenSASDO-2.0

# 2. 安裝 Wrangler
npm install -g wrangler

# 3. 登入 Cloudflare
wrangler login

# 4. 建立 D1 資料庫
wrangler d1 create lumensasdo-data

# 5. 部署 Worker
cd workers/cron-scraper
npm install
wrangler deploy

# 6. 驗證部署
curl https://your-worker.workers.dev/health
```

詳細部署指南請參閱 [DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 📚 文檔

- 📖 [API 文檔](docs/API.md) - 完整的 API 使用說明
- 🏗️ [系統架構](docs/ARCHITECTURE.md) - 技術架構與設計理念
- 🚀 [部署指南](docs/DEPLOYMENT.md) - 從零到部署的完整流程
- 📝 [變更日誌](CHANGELOG.md) - 版本更新記錄

---

## 🏗️ 系統架構

```
外部資料源（農業部 API）
    ↓
Cloudflare Cron Workers（每日凌晨 3:00）
    ↓
D1 Database（SQLite）
    ↓
API Workers（RESTful API）
    ↓
Cloudflare Pages（儀表板）
```

### 四 AI 協作矩陣

```
你（遊山玩水）
    ↓
Copilot（感知預策） ← → Perplexity（外源資蒐）
    ↓                          ↓
    → Gemini（審查維律） ← ←  ←
              ↓
         Claude（開源擴建）
```

---

## 🛠️ 技術棧

### 後端
- **Cloudflare Workers** - Serverless 運算平台
- **Cloudflare D1** - SQLite 資料庫
- **TypeScript** - 型別安全的 JavaScript
- **Wrangler** - Cloudflare 官方 CLI

### 前端（規劃中）
- **Cloudflare Pages** - 靜態網站託管
- **React 18** - UI 框架
- **Tailwind CSS** - 樣式框架
- **Recharts** - 資料視覺化

### AI 整合
- **Gemini 1.5 Flash** - 快速資料分析
- **Gemini 1.5 Pro** - 深度分析（規劃中）
- **Claude 3.5 Sonnet** - 文檔生成與開發
- **GPT-4** - 備用 AI（規劃中）

---

## 📡 API 端點

### 基礎端點

```bash
# 健康檢查
GET /health

# 獲取農產品價格
GET /api/prices?limit=100&offset=0

# 搜尋農產品
GET /api/search?q=青蔥

# 監控清單管理
GET    /api/watchlist           # 查詢監控清單
POST   /api/watchlist           # 新增監控項目
PUT    /api/watchlist/:id       # 更新監控項目
DELETE /api/watchlist/:id       # 刪除監控項目

# AI 分析
POST /api/analyze/trend         # 趨勢分析
POST /api/analyze/recommend     # 採購建議
```

完整 API 文檔請參閱 [API.md](docs/API.md)

---

## 💻 本地開發

### 啟動開發伺服器

```bash
cd workers/cron-scraper

# 安裝依賴
npm install

# 啟動開發伺服器（本地 D1）
wrangler dev

# 或連接遠端 D1
wrangler dev --remote
```

### 測試 API

```bash
# 健康檢查
curl http://localhost:8787/health

# 測試價格 API
curl http://localhost:8787/api/prices?limit=10

# 測試搜尋
curl http://localhost:8787/api/search?q=青蔥
```

---

## 🗄️ 資料庫結構

### farm_prices（農產品價格）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵 |
| trans_date | TEXT | 交易日期 |
| crop_name | TEXT | 作物名稱 |
| market_name | TEXT | 市場名稱 |
| up_price | TEXT | 上價 |
| mid_price | TEXT | 中價 |
| low_price | TEXT | 下價 |
| avg_price | TEXT | 平均價 |
| trans_quantity | TEXT | 交易量 |
| created_at | TEXT | 建立時間 |

### watchlist（監控清單）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵 |
| crop_name | TEXT | 監控作物 |
| threshold_high | TEXT | 高價閾值 |
| threshold_low | TEXT | 低價閾值 |
| alert_enabled | INTEGER | 是否啟用 |
| created_at | TEXT | 建立時間 |
| updated_at | TEXT | 更新時間 |

---

## 🤖 AI 功能

### 趨勢分析

```typescript
// 分析青蔥近 30 天價格趨勢
POST /api/analyze/trend
{
  "crop_name": "青蔥",
  "days": 30
}

// 回應
{
  "trend": "上升",
  "confidence": 0.85,
  "predictions": {
    "next_7_days": { "avg_price": "48.00" },
    "next_30_days": { "avg_price": "52.00" }
  },
  "insights": [
    "近期價格呈現穩定上升趨勢",
    "建議在價格低於 42 元時採購"
  ]
}
```

### Fallback 模式

當 AI API 無法使用時，系統自動切換到本地統計分析，確保服務不中斷。

---

## 📊 使用範例

### JavaScript

```javascript
// 獲取農產品價格
const response = await fetch(
  'https://your-worker.workers.dev/api/prices?limit=20'
);
const data = await response.json();
console.log(data);
```

### Python

```python
import requests

response = requests.get(
    'https://your-worker.workers.dev/api/prices',
    params={'limit': 20}
)
print(response.json())
```

### cURL

```bash
curl "https://your-worker.workers.dev/api/prices?limit=20"
```

---

## 🔐 安全性

- ✅ HTTPS 強制加密
- ✅ CORS 跨域支援
- ✅ Rate Limiting（60 req/min）
- ✅ SQL Injection 防護
- ✅ Secrets 安全管理
- ✅ DDoS 防護（Cloudflare）

---

## 🚀 CI/CD

本專案使用 GitHub Actions 實現自動化部署：

- ✅ 自動 Lint & Type Check
- ✅ 自動部署到 Cloudflare
- ✅ PR 自動測試
- ✅ 部署狀態通知

詳見 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

---

## 📈 專案狀態

### 已完成 ✅
- [x] 農產品價格自動收集
- [x] D1 資料庫設計與實作
- [x] RESTful API 端點
- [x] AI 分析功能（Fallback 模式）
- [x] 監控清單功能
- [x] 完整文檔

### 進行中 🚧
- [ ] 雞蛋價格監控
- [ ] 大宗物資價格追蹤
- [ ] Notion 知識庫整合
- [ ] Perplexity 情報系統
- [ ] 儀表板前端

### 規劃中 📋
- [ ] AI PC 本地部署
- [ ] 移動端 App
- [ ] 多語系支援
- [ ] 進階分析報表
- [ ] 通知系統

---

## 🤝 貢獻指南

歡迎貢獻！請遵循以下步驟：

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

詳見 [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📝 授權

本專案採用 MIT License - 詳見 [LICENSE](LICENSE) 檔案

---

## 👨‍💻 作者

**張格誌（KeChih Chang）**
- 公司：科趨阿斯特經營策略顧問有限公司（籌備中）
- GitHub: [@windcgz](https://github.com/windcgz)
- Email: [聯絡信箱]

---

## 🙏 致謝

- [Cloudflare](https://www.cloudflare.com/) - 提供優秀的 Serverless 平台
- [農業部](https://www.afa.gov.tw/) - 提供農產品價格開放資料
- AI 協作團隊：Copilot、Perplexity、Gemini、Claude

---

## 🌟 Star History

如果這個專案對你有幫助，請給我們一個 ⭐！

[![Star History Chart](https://api.star-history.com/svg?repos=windcgz/LumenSASDO-2.0&type=Date)](https://star-history.com/#windcgz/LumenSASDO-2.0&Date)

---

**LumenSASDO 2.0 - 以光照亮企業從原料到智慧決策的完整閉環**

*Intelligence in Motion.*
