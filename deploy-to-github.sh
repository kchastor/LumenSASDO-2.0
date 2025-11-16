#!/bin/bash
# LumenSASDO 2.0 - GitHub 上傳指令腳本
# 此腳本會將專案推送到 GitHub

echo "🚀 LumenSASDO 2.0 - GitHub 部署腳本"
echo "=================================="
echo ""

# 步驟 1: 檢查是否在正確的目錄
if [ ! -f "README.md" ]; then
    echo "❌ 錯誤：請在專案根目錄執行此腳本"
    exit 1
fi

echo "📁 當前目錄："
pwd
echo ""

# 步驟 2: Git 設定（如果尚未設定）
echo "👤 設定 Git 使用者資訊..."
git config user.name "windcgz" 2>/dev/null || echo "Git 使用者名稱已設定"
git config user.email "your-email@example.com" 2>/dev/null || echo "Git 郵件已設定"
echo "✅ Git 設定完成"
echo ""

# 步驟 3: 查看檔案狀態
echo "📋 檔案狀態："
git status --short
echo ""

# 步驟 4: 提交所有變更
echo "💾 提交變更到本地 repository..."
git add -A
git commit -m "docs: 完整專案文檔與基礎架構

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
"

if [ $? -eq 0 ]; then
    echo "✅ 提交成功"
else
    echo "❌ 提交失敗"
    exit 1
fi
echo ""

# 步驟 5: 設定 GitHub remote
echo "🔗 設定 GitHub remote..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/windcgz/LumenSASDO-2.0.git

if [ $? -eq 0 ]; then
    echo "✅ Remote 設定成功"
else
    echo "⚠️  Remote 可能已存在"
fi
echo ""

# 步驟 6: 推送到 GitHub
echo "🚀 準備推送到 GitHub..."
echo "⚠️  請確認你已經："
echo "   1. 在 GitHub 建立了 'LumenSASDO-2.0' repository"
echo "   2. 設定了 GitHub 認證（SSH key 或 Personal Access Token）"
echo ""
read -p "按 Enter 繼續推送，或 Ctrl+C 取消..."

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 成功推送到 GitHub！"
    echo ""
    echo "📍 你的專案連結："
    echo "   https://github.com/windcgz/LumenSASDO-2.0"
    echo ""
    echo "🔄 下一步："
    echo "   1. 前往 GitHub 查看專案"
    echo "   2. 設定 GitHub Secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)"
    echo "   3. 開始部署到 Cloudflare！"
else
    echo ""
    echo "❌ 推送失敗"
    echo ""
    echo "💡 可能的原因："
    echo "   1. GitHub repository 尚未建立"
    echo "   2. 認證失敗（需要設定 SSH key 或 PAT）"
    echo "   3. 網路連線問題"
    echo ""
    echo "📚 解決方法："
    echo "   手動推送："
    echo "   git push -u origin main"
fi
