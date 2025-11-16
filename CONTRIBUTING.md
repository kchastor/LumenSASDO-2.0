# Contributing to LumenSASDO 2.0

感謝你有興趣為 LumenSASDO 2.0 做出貢獻！🎉

## 🤝 如何貢獻

### 回報問題（Bug Reports）

如果你發現了 bug，請開啟一個 Issue 並包含：

1. **清楚的標題** - 簡短描述問題
2. **重現步驟** - 如何觸發這個問題
3. **預期行為** - 你期望發生什麼
4. **實際行為** - 實際發生了什麼
5. **環境資訊** - Node.js 版本、作業系統等
6. **截圖或日誌**（如果適用）

### 功能建議（Feature Requests）

我們歡迎新功能建議！請開啟 Issue 並說明：

1. **功能描述** - 你想要什麼功能
2. **使用案例** - 為什麼需要這個功能
3. **替代方案**（如果有）
4. **額外資訊** - 任何相關的資料或範例

### 提交 Pull Request

1. **Fork 專案**
   ```bash
   # 在 GitHub 點擊 Fork 按鈕
   ```

2. **Clone 到本地**
   ```bash
   git clone https://github.com/YOUR-USERNAME/LumenSASDO-2.0.git
   cd LumenSASDO-2.0
   ```

3. **建立分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **進行開發**
   - 遵循專案的程式碼風格
   - 撰寫清楚的 commit 訊息
   - 新增必要的測試

5. **測試你的變更**
   ```bash
   cd workers/cron-scraper
   npm install
   wrangler dev
   ```

6. **提交變更**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   git push origin feature/amazing-feature
   ```

7. **開啟 Pull Request**
   - 前往 GitHub 開啟 PR
   - 填寫 PR 模板
   - 等待審查

## 📝 程式碼規範

### TypeScript Style Guide

```typescript
// ✅ Good
async function fetchPrices(limit: number): Promise<PriceData[]> {
  const result = await db.query('SELECT * FROM prices LIMIT ?', [limit]);
  return result.map(row => transformPrice(row));
}

// ❌ Bad
async function fetchPrices(limit) {
  let result = await db.query('SELECT * FROM prices LIMIT ' + limit);
  return result;
}
```

### Commit Message Convention

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
test: add tests
chore: update dependencies
```

### 檔案結構

```
workers/
├── cron-scraper/
│   ├── src/
│   │   ├── index.ts        # 主入口
│   │   ├── handlers/       # 路由處理器
│   │   ├── services/       # 業務邏輯
│   │   └── utils/          # 工具函式
│   ├── tests/              # 測試檔案
│   ├── package.json
│   └── wrangler.toml
```

## 🧪 測試

### 執行測試

```bash
cd workers/cron-scraper
npm test
```

### 撰寫測試

```typescript
import { describe, it, expect } from 'vitest';
import { fetchPrices } from './services/prices';

describe('fetchPrices', () => {
  it('should return prices with correct structure', async () => {
    const prices = await fetchPrices(10);
    expect(prices).toHaveLength(10);
    expect(prices[0]).toHaveProperty('crop_name');
  });
});
```

## 📚 文檔

- 新增功能時，請更新相關文檔
- API 變更時，請更新 `docs/API.md`
- 架構變更時，請更新 `docs/ARCHITECTURE.md`
- 記得更新 `CHANGELOG.md`

## 🔍 Code Review 流程

1. **自我檢查**
   - [ ] 程式碼符合風格指南
   - [ ] 所有測試通過
   - [ ] 文檔已更新
   - [ ] Commit 訊息清楚

2. **提交 PR**
   - 填寫完整的 PR 描述
   - 標註相關的 Issue

3. **等待審查**
   - 維護者會在 48 小時內回應
   - 根據回饋進行修改

4. **合併**
   - PR 通過後會被合併到 main 分支
   - 自動觸發 CI/CD 部署

## 🏷️ Issue Labels

- `bug` - Bug 回報
- `enhancement` - 功能增強
- `documentation` - 文檔相關
- `good first issue` - 適合新手
- `help wanted` - 需要協助
- `question` - 問題討論

## 📞 聯絡方式

- 💬 GitHub Discussions
- 📧 Email: [聯絡信箱]
- 🐛 GitHub Issues

## 🙏 感謝

感謝所有貢獻者的付出！每個 PR、Issue、建議都讓這個專案變得更好。

---

**Happy Coding!** 🚀
