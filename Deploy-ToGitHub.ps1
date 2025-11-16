# LumenSASDO 2.0 - GitHub 上傳指令腳本 (PowerShell)
# 此腳本會將專案推送到 GitHub

Write-Host "🚀 LumenSASDO 2.0 - GitHub 部署腳本" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 步驟 1: 檢查是否在正確的目錄
if (!(Test-Path "README.md")) {
    Write-Host "❌ 錯誤：請在專案根目錄執行此腳本" -ForegroundColor Red
    exit 1
}

Write-Host "📁 當前目錄：" -ForegroundColor Yellow
Get-Location
Write-Host ""

# 步驟 2: Git 設定（如果尚未設定）
Write-Host "👤 設定 Git 使用者資訊..." -ForegroundColor Yellow
try {
    git config user.name "windcgz" 2>$null
    git config user.email "your-email@example.com" 2>$null
    Write-Host "✅ Git 設定完成" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Git 設定可能已存在" -ForegroundColor Yellow
}
Write-Host ""

# 步驟 3: 查看檔案狀態
Write-Host "📋 檔案狀態：" -ForegroundColor Yellow
git status --short
Write-Host ""

# 步驟 4: 提交所有變更
Write-Host "💾 提交變更到本地 repository..." -ForegroundColor Yellow
git add -A

$commitMessage = @"
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
"@

git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 提交成功" -ForegroundColor Green
} else {
    Write-Host "❌ 提交失敗" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 步驟 5: 設定 GitHub remote
Write-Host "🔗 設定 GitHub remote..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/windcgz/LumenSASDO-2.0.git

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Remote 設定成功" -ForegroundColor Green
} else {
    Write-Host "⚠️  Remote 可能已存在" -ForegroundColor Yellow
}
Write-Host ""

# 步驟 6: 推送到 GitHub
Write-Host "🚀 準備推送到 GitHub..." -ForegroundColor Cyan
Write-Host "⚠️  請確認你已經：" -ForegroundColor Yellow
Write-Host "   1. 在 GitHub 建立了 'LumenSASDO-2.0' repository" -ForegroundColor White
Write-Host "   2. 設定了 GitHub 認證（SSH key 或 Personal Access Token）" -ForegroundColor White
Write-Host ""
Read-Host "按 Enter 繼續推送，或 Ctrl+C 取消"

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 成功推送到 GitHub！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 你的專案連結：" -ForegroundColor Cyan
    Write-Host "   https://github.com/windcgz/LumenSASDO-2.0" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔄 下一步：" -ForegroundColor Cyan
    Write-Host "   1. 前往 GitHub 查看專案" -ForegroundColor White
    Write-Host "   2. 設定 GitHub Secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)" -ForegroundColor White
    Write-Host "   3. 開始部署到 Cloudflare！" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ 推送失敗" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 可能的原因：" -ForegroundColor Yellow
    Write-Host "   1. GitHub repository 尚未建立" -ForegroundColor White
    Write-Host "   2. 認證失敗（需要設定 SSH key 或 PAT）" -ForegroundColor White
    Write-Host "   3. 網路連線問題" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 解決方法：" -ForegroundColor Yellow
    Write-Host "   手動推送：" -ForegroundColor White
    Write-Host "   git push -u origin main" -ForegroundColor Cyan
}
