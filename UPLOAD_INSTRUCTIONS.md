# 🚀 GitHub 上傳指令完整指南

## 📦 專案已準備完成

所有檔案都已經準備好，現在可以上傳到 GitHub 了！

---

## 方法一：使用自動化腳本（推薦）

### Windows (PowerShell)

```powershell
# 在專案根目錄執行
.\Deploy-ToGitHub.ps1
```

### macOS / Linux (Bash)

```bash
# 在專案根目錄執行
./deploy-to-github.sh
```

---

## 方法二：手動執行 Git 指令

### Step 1: 在 GitHub 建立 Repository

1. 前往 https://github.com/new
2. Repository name: `LumenSASDO-2.0`
3. Description: `智能化農產品採購決策平台 - 四 AI 協作矩陣`
4. **不要**勾選 "Initialize this repository with a README"
5. 點擊 "Create repository"

---

### Step 2: 設定 Git 使用者資訊（首次使用）

```bash
git config user.name "windcgz"
git config user.email "your-email@example.com"
```

---

### Step 3: 初始化並提交（已完成）

專案已經初始化並添加所有檔案，你只需要執行：

```bash
# 確認檔案狀態
git status

# 預期看到 14 個檔案準備提交
```

---

### Step 4: 設定 Remote 並推送

```bash
# 設定 GitHub remote
git remote add origin https://github.com/windcgz/LumenSASDO-2.0.git

# 推送到 GitHub
git push -u origin main
```

---

## 📋 提交內容清單

✅ **核心文檔（4 個）**
- README.md - 專案總覽與快速開始
- docs/API.md - 完整 API 文檔
- docs/ARCHITECTURE.md - 系統架構設計
- docs/DEPLOYMENT.md - 部署指南

✅ **專案設定（6 個）**
- .gitignore - Git 忽略規則
- LICENSE - MIT 授權
- CHANGELOG.md - 版本變更記錄
- CONTRIBUTING.md - 貢獻指南
- schema.sql - 資料庫結構
- .github/workflows/deploy.yml - CI/CD 設定

✅ **Worker 程式碼（4 個）**
- workers/cron-scraper/src/index.ts - Worker 主程式
- workers/cron-scraper/package.json - NPM 設定
- workers/cron-scraper/tsconfig.json - TypeScript 設定
- workers/cron-scraper/wrangler.toml - Cloudflare 設定

---

## ⚠️ 重要提醒

### 推送前檢查

- [ ] 確認已在 GitHub 建立 repository
- [ ] 確認 Git 認證已設定（SSH key 或 Personal Access Token）
- [ ] 確認所有檔案都已添加

### 推送後步驟

1. **前往 GitHub 確認**
   ```
   https://github.com/windcgz/LumenSASDO-2.0
   ```

2. **設定 GitHub Secrets（CI/CD 需要）**
   - Settings > Secrets and variables > Actions
   - 新增 `CLOUDFLARE_API_TOKEN`
   - 新增 `CLOUDFLARE_ACCOUNT_ID`

3. **啟用 GitHub Actions**
   - Actions 頁面會自動偵測 workflow
   - 確認 CI/CD 設定正確

---

## 🔧 常見問題排除

### 問題 1: 認證失敗

**錯誤訊息：**
```
remote: Permission denied (publickey).
```

**解決方法：**

**選項 A：使用 HTTPS + Personal Access Token**
```bash
# 1. 在 GitHub 建立 Personal Access Token
#    Settings > Developer settings > Personal access tokens > Generate new token

# 2. 使用 HTTPS URL
git remote set-url origin https://github.com/windcgz/LumenSASDO-2.0.git

# 3. 推送時輸入 token 作為密碼
git push -u origin main
```

**選項 B：設定 SSH Key**
```bash
# 1. 生成 SSH Key
ssh-keygen -t ed25519 -C "your-email@example.com"

# 2. 複製公鑰
cat ~/.ssh/id_ed25519.pub

# 3. 在 GitHub 新增 SSH Key
#    Settings > SSH and GPG keys > New SSH key

# 4. 使用 SSH URL
git remote set-url origin git@github.com:windcgz/LumenSASDO-2.0.git

# 5. 推送
git push -u origin main
```

---

### 問題 2: Repository 不存在

**錯誤訊息：**
```
remote: Repository not found.
```

**解決方法：**
1. 確認已在 GitHub 建立 repository
2. Repository 名稱必須是 `LumenSASDO-2.0`
3. 確認 URL 正確

---

### 問題 3: 分支名稱不一致

**錯誤訊息：**
```
error: failed to push some refs
```

**解決方法：**
```bash
# 確認本地分支名稱
git branch

# 應該顯示 * main

# 如果不是 main，重新命名
git branch -m master main
git push -u origin main
```

---

## 📊 提交訊息格式

本次提交使用以下格式：

```
docs: 完整專案文檔與基礎架構

✅ 已完成：
- README.md - 專案總覽
- API Documentation - 完整 API 文檔
- Architecture Documentation - 系統架構設計
- Deployment Guide - 部署指南
- GitHub Actions CI/CD workflow
- Cloudflare Workers 基礎程式碼
- Database schema (D1)
- MIT License
- Contributing guidelines
- Changelog

📊 專案狀態：
- Version: 1.0.0
- 文檔完成度: 100%
- 核心功能: 農產品價格監控
- 技術棧: Cloudflare Workers + D1 + TypeScript
```

---

## 🎯 成功標準

推送成功後，你應該看到：

```
✅ 14 個檔案成功上傳
✅ GitHub repository 顯示所有檔案
✅ README.md 在首頁正確顯示
✅ GitHub Actions workflow 已偵測
```

---

## 📞 需要協助？

如果遇到任何問題：

1. 檢查 Git 輸出的錯誤訊息
2. 參考上方的「常見問題排除」
3. 確認 GitHub 設定正確
4. 檢查網路連線

---

**準備好了嗎？執行腳本開始上傳！** 🚀
