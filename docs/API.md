# LumenSASDO 2.0 - API Documentation

## 📋 目錄

- [概覽](#概覽)
- [認證](#認證)
- [API 端點](#api-端點)
  - [農產品價格 API](#農產品價格-api)
  - [監控清單 API](#監控清單-api)
  - [AI 分析 API](#ai-分析-api)
  - [健康檢查 API](#健康檢查-api)
- [錯誤處理](#錯誤處理)
- [速率限制](#速率限制)
- [使用範例](#使用範例)

---

## 🌐 概覽

LumenSASDO 2.0 提供 RESTful API，讓你可以程式化地存取農產品價格資料、管理監控清單，以及使用 AI 分析功能。

**Base URL:**
```
https://lumensasdo-cron-scraper.nk9bmn6ph5-516.workers.dev
```

**API 版本:** v1.0  
**回應格式:** JSON  
**字元編碼:** UTF-8

---

## 🔐 認證

目前 API 為公開存取，無需認證。

> **未來計畫：** 將實作 API Key 認證機制以確保安全性。

---

## 📡 API 端點

### 農產品價格 API

#### 1️⃣ 獲取所有農產品價格

**端點:** `GET /api/prices`

**描述:** 獲取最新的農產品價格列表

**查詢參數:**
| 參數 | 類型 | 必填 | 說明 | 範例 |
|------|------|------|------|------|
| `limit` | integer | ❌ | 限制回傳筆數（預設: 100） | `50` |
| `offset` | integer | ❌ | 分頁偏移量（預設: 0） | `100` |
| `date` | string | ❌ | 指定日期（YYYY-MM-DD） | `2025-11-14` |

**成功回應:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "trans_date": "2025-11-14",
      "crop_name": "青蔥",
      "market_name": "台北一",
      "up_price": "50.00",
      "mid_price": "45.00",
      "low_price": "40.00",
      "avg_price": "45.00",
      "trans_quantity": "5000.00",
      "created_at": "2025-11-14T03:00:00Z"
    },
    // ... 更多資料
  ],
  "meta": {
    "total": 1500,
    "limit": 100,
    "offset": 0,
    "has_more": true
  }
}
```

**錯誤回應:** `500 Internal Server Error`
```json
{
  "success": false,
  "error": "資料庫查詢失敗",
  "message": "Database query error"
}
```

---

#### 2️⃣ 搜尋農產品

**端點:** `GET /api/search`

**描述:** 根據關鍵字搜尋農產品

**查詢參數:**
| 參數 | 類型 | 必填 | 說明 | 範例 |
|------|------|------|------|------|
| `q` | string | ✅ | 搜尋關鍵字 | `青蔥` |
| `limit` | integer | ❌ | 限制回傳筆數 | `20` |

**成功回應:** `200 OK`
```json
{
  "success": true,
  "query": "青蔥",
  "data": [
    {
      "id": 1,
      "trans_date": "2025-11-14",
      "crop_name": "青蔥",
      "market_name": "台北一",
      "avg_price": "45.00",
      "trend": "↑"
    }
  ],
  "meta": {
    "total": 15,
    "limit": 20
  }
}
```

**錯誤回應:** `400 Bad Request`
```json
{
  "success": false,
  "error": "缺少必要參數",
  "message": "Query parameter 'q' is required"
}
```

---

### 監控清單 API

#### 3️⃣ 獲取監控清單

**端點:** `GET /api/watchlist`

**描述:** 獲取所有監控中的農產品

**成功回應:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "crop_name": "青蔥",
      "threshold_high": "60.00",
      "threshold_low": "30.00",
      "current_price": "45.00",
      "status": "normal",
      "alert_count": 0,
      "created_at": "2025-11-01T10:00:00Z",
      "updated_at": "2025-11-14T03:00:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "active_alerts": 0
  }
}
```

---

#### 4️⃣ 新增監控項目

**端點:** `POST /api/watchlist`

**描述:** 新增農產品到監控清單

**請求 Body:**
```json
{
  "crop_name": "青蔥",
  "threshold_high": "60.00",
  "threshold_low": "30.00"
}
```

**成功回應:** `201 Created`
```json
{
  "success": true,
  "message": "監控項目已新增",
  "data": {
    "id": 6,
    "crop_name": "青蔥",
    "threshold_high": "60.00",
    "threshold_low": "30.00",
    "status": "active",
    "created_at": "2025-11-14T10:30:00Z"
  }
}
```

**錯誤回應:** `400 Bad Request`
```json
{
  "success": false,
  "error": "資料驗證失敗",
  "message": "threshold_high must be greater than threshold_low"
}
```

---

#### 5️⃣ 更新監控項目

**端點:** `PUT /api/watchlist/:id`

**描述:** 更新監控項目的閾值

**請求 Body:**
```json
{
  "threshold_high": "70.00",
  "threshold_low": "25.00"
}
```

**成功回應:** `200 OK`
```json
{
  "success": true,
  "message": "監控項目已更新",
  "data": {
    "id": 1,
    "crop_name": "青蔥",
    "threshold_high": "70.00",
    "threshold_low": "25.00",
    "updated_at": "2025-11-14T10:35:00Z"
  }
}
```

---

#### 6️⃣ 刪除監控項目

**端點:** `DELETE /api/watchlist/:id`

**描述:** 從監控清單中移除項目

**成功回應:** `200 OK`
```json
{
  "success": true,
  "message": "監控項目已刪除"
}
```

**錯誤回應:** `404 Not Found`
```json
{
  "success": false,
  "error": "找不到監控項目",
  "message": "Watchlist item with id 999 not found"
}
```

---

### AI 分析 API

#### 7️⃣ 趨勢分析

**端點:** `POST /api/analyze/trend`

**描述:** 使用 AI 分析農產品價格趨勢

**請求 Body:**
```json
{
  "crop_name": "青蔥",
  "days": 30
}
```

**成功回應:** `200 OK`
```json
{
  "success": true,
  "data": {
    "crop_name": "青蔥",
    "analysis_period": "30 days",
    "trend": "上升",
    "confidence": 0.85,
    "predictions": {
      "next_7_days": {
        "avg_price": "48.00",
        "range": {
          "low": "42.00",
          "high": "54.00"
        }
      },
      "next_30_days": {
        "avg_price": "52.00",
        "range": {
          "low": "45.00",
          "high": "60.00"
        }
      }
    },
    "insights": [
      "近期價格呈現穩定上升趨勢",
      "建議在價格低於 42 元時採購",
      "季節性因素可能在 2 週後推高價格"
    ],
    "generated_at": "2025-11-14T10:40:00Z"
  }
}
```

**Fallback 模式回應:** `200 OK`
```json
{
  "success": true,
  "mode": "fallback",
  "data": {
    "crop_name": "青蔥",
    "current_price": "45.00",
    "historical_avg": "42.50",
    "trend": "略升",
    "insights": [
      "目前價格高於歷史平均 5.9%",
      "建議持續觀察後續走勢"
    ]
  }
}
```

---

#### 8️⃣ 採購建議

**端點:** `POST /api/analyze/recommend`

**描述:** 獲取 AI 採購建議

**請求 Body:**
```json
{
  "crop_names": ["青蔥", "高麗菜", "白菜"],
  "budget": 50000,
  "priority": "cost"
}
```

**成功回應:** `200 OK`
```json
{
  "success": true,
  "data": {
    "total_budget": 50000,
    "recommendations": [
      {
        "crop_name": "高麗菜",
        "recommended_quantity": "500 kg",
        "estimated_cost": 15000,
        "current_price": "30.00",
        "reason": "價格處於近期低點，建議大量採購",
        "urgency": "high"
      },
      {
        "crop_name": "白菜",
        "recommended_quantity": "400 kg",
        "estimated_cost": 12000,
        "current_price": "30.00",
        "reason": "價格穩定，可正常採購",
        "urgency": "medium"
      },
      {
        "crop_name": "青蔥",
        "recommended_quantity": "200 kg",
        "estimated_cost": 9000,
        "current_price": "45.00",
        "reason": "價格略高，建議減量或延後",
        "urgency": "low"
      }
    ],
    "total_estimated_cost": 36000,
    "budget_remaining": 14000,
    "overall_advice": "建議優先採購高麗菜和白菜，青蔥可等待價格回落",
    "generated_at": "2025-11-14T10:45:00Z"
  }
}
```

---

### 健康檢查 API

#### 9️⃣ 系統健康檢查

**端點:** `GET /health`

**描述:** 檢查系統運行狀態

**成功回應:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2025-11-14T10:50:00Z",
  "services": {
    "database": "ok",
    "cron_jobs": "ok",
    "ai_service": "ok"
  },
  "last_update": "2025-11-14T03:00:00Z"
}
```

---

#### 🔟 資料庫狀態

**端點:** `GET /health/db`

**描述:** 檢查資料庫連線與資料狀態

**成功回應:** `200 OK`
```json
{
  "database": "connected",
  "tables": {
    "farm_prices": {
      "total_records": 15000,
      "last_updated": "2025-11-14T03:00:00Z"
    },
    "watchlist": {
      "total_records": 5,
      "active_alerts": 0
    }
  },
  "timestamp": "2025-11-14T10:55:00Z"
}
```

---

## ⚠️ 錯誤處理

### 錯誤回應格式

所有錯誤回應都遵循統一格式：

```json
{
  "success": false,
  "error": "錯誤類型",
  "message": "詳細錯誤訊息",
  "code": "ERROR_CODE"
}
```

### HTTP 狀態碼

| 狀態碼 | 說明 | 常見原因 |
|--------|------|----------|
| `200` | 成功 | 請求成功處理 |
| `201` | 已建立 | 資源成功建立 |
| `400` | 錯誤請求 | 參數驗證失敗 |
| `404` | 找不到 | 資源不存在 |
| `500` | 伺服器錯誤 | 內部處理錯誤 |
| `503` | 服務不可用 | 系統維護中 |

### 常見錯誤代碼

| 錯誤代碼 | 說明 | 解決方法 |
|----------|------|----------|
| `MISSING_PARAM` | 缺少必要參數 | 檢查請求參數 |
| `INVALID_FORMAT` | 參數格式錯誤 | 確認資料型別 |
| `DATABASE_ERROR` | 資料庫錯誤 | 稍後重試或聯繫支援 |
| `AI_SERVICE_ERROR` | AI 服務錯誤 | 系統會自動切換到 Fallback 模式 |
| `RATE_LIMIT_EXCEEDED` | 超過速率限制 | 降低請求頻率 |

---

## 🚦 速率限制

**目前限制：**
- 每分鐘 60 次請求
- 每小時 1000 次請求

**超過限制回應:** `429 Too Many Requests`
```json
{
  "success": false,
  "error": "超過速率限制",
  "message": "Rate limit exceeded. Please try again in 60 seconds.",
  "retry_after": 60
}
```

> **提示：** 回應標頭會包含速率限制資訊
> - `X-RateLimit-Limit`: 限制數量
> - `X-RateLimit-Remaining`: 剩餘次數
> - `X-RateLimit-Reset`: 重置時間戳

---

## 💡 使用範例

### JavaScript (Fetch API)

```javascript
// 獲取農產品價格
async function getPrices() {
  try {
    const response = await fetch(
      'https://lumensasdo-cron-scraper.nk9bmn6ph5-516.workers.dev/api/prices?limit=50'
    );
    const data = await response.json();
    
    if (data.success) {
      console.log('價格資料:', data.data);
    } else {
      console.error('錯誤:', data.error);
    }
  } catch (error) {
    console.error('請求失敗:', error);
  }
}

// 搜尋農產品
async function searchCrop(keyword) {
  const response = await fetch(
    `https://lumensasdo-cron-scraper.nk9bmn6ph5-516.workers.dev/api/search?q=${encodeURIComponent(keyword)}`
  );
  return await response.json();
}

// 新增監控項目
async function addToWatchlist(cropName, high, low) {
  const response = await fetch(
    'https://lumensasdo-cron-scraper.nk9bmn6ph5-516.workers.dev/api/watchlist',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        crop_name: cropName,
        threshold_high: high,
        threshold_low: low
      })
    }
  );
  return await response.json();
}

// AI 趨勢分析
async function analyzeTrend(cropName, days = 30) {
  const response = await fetch(
    'https://lumensasdo-cron-scraper.nk9bmn6ph5-516.workers.dev/api/analyze/trend',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        crop_name: cropName,
        days: days
      })
    }
  );
  return await response.json();
}
```

---

### Python (requests)

```python
import requests

BASE_URL = "https://lumensasdo-cron-scraper.nk9bmn6ph5-516.workers.dev"

# 獲取農產品價格
def get_prices(limit=100):
    response = requests.get(f"{BASE_URL}/api/prices", params={"limit": limit})
    return response.json()

# 搜尋農產品
def search_crop(keyword):
    response = requests.get(f"{BASE_URL}/api/search", params={"q": keyword})
    return response.json()

# 新增監控項目
def add_watchlist(crop_name, threshold_high, threshold_low):
    data = {
        "crop_name": crop_name,
        "threshold_high": threshold_high,
        "threshold_low": threshold_low
    }
    response = requests.post(f"{BASE_URL}/api/watchlist", json=data)
    return response.json()

# AI 趨勢分析
def analyze_trend(crop_name, days=30):
    data = {
        "crop_name": crop_name,
        "days": days
    }
    response = requests.post(f"{BASE_URL}/api/analyze/trend", json=data)
    return response.json()

# 使用範例
if __name__ == "__main__":
    # 搜尋青蔥
    result = search_crop("青蔥")
    print(result)
    
    # 新增監控
    watchlist = add_watchlist("青蔥", "60.00", "30.00")
    print(watchlist)
    
    # 趨勢分析
    analysis = analyze_trend("青蔥", 30)
    print(analysis)
```

---

### cURL

```bash
# 獲取農產品價格
curl "https://lumensasdo-cron-scraper.nk9bmn6ph5-516.workers.dev/api/prices?limit=20"

# 搜尋農產品
curl "https://lumensasdo-cron-scraper.nk9bmn6ph5-516.workers.dev/api/search?q=%E9%9D%92%E8%94%A5"

# 新增監控項目
curl -X POST \
  "https://lumensasdo-cron-scraper.nk9bmn6ph5-516.workers.dev/api/watchlist" \
  -H "Content-Type: application/json" \
  -d '{
    "crop_name": "青蔥",
    "threshold_high": "60.00",
    "threshold_low": "30.00"
  }'

# AI 趨勢分析
curl -X POST \
  "https://lumensasdo-cron-scraper.nk9bmn6ph5-516.workers.dev/api/analyze/trend" \
  -H "Content-Type: application/json" \
  -d '{
    "crop_name": "青蔥",
    "days": 30
  }'

# 健康檢查
curl "https://lumensasdo-cron-scraper.nk9bmn6ph5-516.workers.dev/health"
```

---

### PowerShell

```powershell
# 設定 Base URL
$BaseUrl = "https://lumensasdo-cron-scraper.nk9bmn6ph5-516.workers.dev"

# 獲取農產品價格
function Get-FarmPrices {
    param([int]$Limit = 100)
    
    $uri = "$BaseUrl/api/prices?limit=$Limit"
    $response = Invoke-RestMethod -Uri $uri -Method Get
    return $response
}

# 搜尋農產品
function Search-Crop {
    param([string]$Keyword)
    
    $uri = "$BaseUrl/api/search?q=$([System.Web.HttpUtility]::UrlEncode($Keyword))"
    $response = Invoke-RestMethod -Uri $uri -Method Get
    return $response
}

# 新增監控項目
function Add-Watchlist {
    param(
        [string]$CropName,
        [decimal]$ThresholdHigh,
        [decimal]$ThresholdLow
    )
    
    $body = @{
        crop_name = $CropName
        threshold_high = $ThresholdHigh.ToString("0.00")
        threshold_low = $ThresholdLow.ToString("0.00")
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/watchlist" `
                                   -Method Post `
                                   -ContentType "application/json" `
                                   -Body $body
    return $response
}

# AI 趨勢分析
function Get-TrendAnalysis {
    param(
        [string]$CropName,
        [int]$Days = 30
    )
    
    $body = @{
        crop_name = $CropName
        days = $Days
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/analyze/trend" `
                                   -Method Post `
                                   -ContentType "application/json" `
                                   -Body $body
    return $response
}

# 使用範例
$prices = Get-FarmPrices -Limit 20
$search = Search-Crop -Keyword "青蔥"
$watchlist = Add-Watchlist -CropName "青蔥" -ThresholdHigh 60 -ThresholdLow 30
$analysis = Get-TrendAnalysis -CropName "青蔥" -Days 30

# 輸出結果
$prices | ConvertTo-Json -Depth 5
```

---

## 📊 資料格式說明

### 價格資料欄位

| 欄位 | 類型 | 說明 | 範例 |
|------|------|------|------|
| `id` | integer | 記錄 ID | `1` |
| `trans_date` | string | 交易日期 (YYYY-MM-DD) | `"2025-11-14"` |
| `crop_name` | string | 農產品名稱 | `"青蔥"` |
| `market_name` | string | 市場名稱 | `"台北一"` |
| `up_price` | string | 上價（元/公斤） | `"50.00"` |
| `mid_price` | string | 中價（元/公斤） | `"45.00"` |
| `low_price` | string | 下價（元/公斤） | `"40.00"` |
| `avg_price` | string | 平均價（元/公斤） | `"45.00"` |
| `trans_quantity` | string | 交易量（公斤） | `"5000.00"` |
| `created_at` | string | 資料建立時間 (ISO 8601) | `"2025-11-14T03:00:00Z"` |

### 監控清單欄位

| 欄位 | 類型 | 說明 | 範例 |
|------|------|------|------|
| `id` | integer | 監控項目 ID | `1` |
| `crop_name` | string | 農產品名稱 | `"青蔥"` |
| `threshold_high` | string | 高價閾值 | `"60.00"` |
| `threshold_low` | string | 低價閾值 | `"30.00"` |
| `current_price` | string | 目前價格 | `"45.00"` |
| `status` | string | 狀態 (`normal`/`alert_high`/`alert_low`) | `"normal"` |
| `alert_count` | integer | 觸發警報次數 | `0` |
| `created_at` | string | 建立時間 | `"2025-11-01T10:00:00Z"` |
| `updated_at` | string | 更新時間 | `"2025-11-14T03:00:00Z"` |

---

## 🔄 變更日誌

### v1.0.0 (2025-11-14)
- ✅ 初始 API 發布
- ✅ 農產品價格查詢
- ✅ 監控清單管理
- ✅ AI 分析功能（含 Fallback）
- ✅ 健康檢查端點

---

## 📞 支援與回饋

如有問題或建議，請透過以下方式聯繫：

- 📧 Email: [聯絡信箱]
- 🐙 GitHub Issues: [Repository URL]/issues
- 💬 討論區: [Discussion URL]

---

## 📝 授權

本 API 文檔採用 MIT License 授權。

---

**更新日期：** 2025-11-14  
**文檔版本：** v1.0.0  
**維護者：** LumenSASDO Team
