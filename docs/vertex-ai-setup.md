# Google Cloud Vertex AI 設定指南

使用 Vertex AI 可以繞過 Gemini API 的地理位置限制。以下是完整的設定步驟：

## 🚀 快速設定步驟

### 1. 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 記下你的 **Project ID**

### 2. 啟用必要的 API

在 Google Cloud Console 中啟用以下 API：
- Vertex AI API
- Cloud Resource Manager API

```bash
# 使用 gcloud CLI 啟用 API
gcloud services enable aiplatform.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
```

### 3. 建立服務帳戶

1. 前往 **IAM & Admin > Service Accounts**
2. 點擊 **Create Service Account**
3. 填入服務帳戶詳細資訊
4. 授予以下角色：
   - `Vertex AI User`
   - `AI Platform Developer`

### 4. 下載服務帳戶金鑰

1. 在服務帳戶列表中，點擊你剛建立的服務帳戶
2. 前往 **Keys** 標籤
3. 點擊 **Add Key > Create new key**
4. 選擇 **JSON** 格式
5. 下載金鑰檔案並保存到安全位置

### 5. 設定環境變數

更新你的 `.env` 檔案：

```env
# Google Cloud Vertex AI Configuration
GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./path/to/your/service-account-key.json

# AI Service Selection
AI_SERVICE_TYPE=vertex-ai
```

### 6. 安裝 Google Cloud SDK (可選)

如果你想使用 gcloud CLI：

```bash
# Windows
# 下載並安裝 Google Cloud SDK from https://cloud.google.com/sdk/docs/install

# macOS
brew install --cask google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
```

## 🔧 設定驗證

### 方法 1: 服務帳戶金鑰檔案 (推薦)

```env
GOOGLE_APPLICATION_CREDENTIALS=./credentials/service-account-key.json
```

### 方法 2: 使用 gcloud CLI

```bash
gcloud auth application-default login
```

## 🧪 測試設定

建立測試檔案 `test-vertex-ai.js`：

```javascript
import { testVertexAIConnection } from './services/geminiService.vertexai.js';

async function test() {
  console.log('🧪 Testing Vertex AI connection...');
  const isWorking = await testVertexAIConnection();
  
  if (isWorking) {
    console.log('✅ Vertex AI is working correctly!');
  } else {
    console.log('❌ Vertex AI connection failed');
  }
}

test();
```

執行測試：
```bash
node test-vertex-ai.js
```

## 🌍 支援的地區

Vertex AI 在以下地區可用：
- `us-central1` (推薦)
- `us-east1`
- `us-west1`
- `europe-west1`
- `europe-west4`
- `asia-east1`
- `asia-northeast1`

## 💰 費用考量

- Vertex AI Gemini 有免費額度
- 超過免費額度後按使用量計費
- 詳細價格請參考 [Vertex AI 價格頁面](https://cloud.google.com/vertex-ai/pricing)

## 🔒 安全性最佳實踐

1. **不要將服務帳戶金鑰提交到版本控制**
2. **定期輪換服務帳戶金鑰**
3. **使用最小權限原則**
4. **監控 API 使用量**

## 🐛 常見問題

### 問題：Permission denied 錯誤
**解決方案：**
- 確認服務帳戶有正確的 IAM 角色
- 檢查 API 是否已啟用

### 問題：Project not found 錯誤
**解決方案：**
- 確認 Project ID 正確
- 確認專案已啟用計費

### 問題：Authentication 錯誤
**解決方案：**
- 檢查 `GOOGLE_APPLICATION_CREDENTIALS` 路徑
- 確認金鑰檔案格式正確

## 📞 支援

如果遇到問題：
1. 檢查 [Vertex AI 文件](https://cloud.google.com/vertex-ai/docs)
2. 查看 Google Cloud Console 中的錯誤日誌
3. 確認所有環境變數設定正確

---

設定完成後，應用程式將自動使用 Vertex AI 服務，繞過地理位置限制！ 🎉