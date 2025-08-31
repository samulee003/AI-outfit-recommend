const express = require('express');
const { GoogleGenAI, Modality, Type } = require("@google/genai");

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const app = express();
const port = process.env.PORT || 8080;

// Middleware to parse JSON bodies, with a higher limit for base64 strings
app.use(express.json({ limit: '15mb' }));

// Initialize the Gemini AI client safely on the server
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper Functions (moved from frontend service) ---

const getCurrentSeason = () => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return '春季';
  if (month >= 5 && month <= 7) return '夏季';
  if (month >= 8 && month <= 10) return '秋季';
  return '冬季';
};

const parseDataUrl = (dataUrl) => {
    const match = dataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (match) {
        return { mimeType: match[1], base64: match[2] };
    }
    return null;
};

// --- Internal API Logic (moved from frontend service) ---

async function callImageEditAPI(base64ImageData, mimeType, prompt, referenceImages = []) {
    const parts = [
        { inlineData: { data: base64ImageData, mimeType: mimeType } },
        ...referenceImages.map(refImg => ({ inlineData: { data: refImg.base64, mimeType: refImg.mimeType } })),
        { text: prompt }
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    let imageBase64 = null;
    let text = null;

    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
                imageBase64 = part.inlineData.data;
            } else if (part.text) {
                text = part.text;
            }
        }
    }
    
    if (!imageBase64 && !text) {
        if (!imageBase64) {
            throw new Error("Gemini API 回應無效。找不到圖片。");
        }
    }

    return { imageBase64, text };
}

// --- API Endpoints ---

// Generic error handler for API routes
const handleApiError = (res, error, endpoint) => {
    console.error(`Error in ${endpoint}:`, error);
    res.status(500).json({ error: error instanceof Error ? error.message : "伺服器發生未知錯誤。" });
};

app.post('/api/generate-virtual-try-on', async (req, res) => {
    try {
        const { userModel, top, bottom } = req.body;
        let instruction = "";
        if (top && bottom) {
            instruction = `將主圖中模特兒的衣物，替換為參考圖中的上半身 ('${top.description}') 和下半身 ('${bottom.description}')。`;
        } else if (top) {
            instruction = `僅將主圖中模特兒的上半身衣物，替換為參考圖中的單品 ('${top.description}')。保持下半身不變。`;
        } else if (bottom) {
            instruction = `僅將主圖中模特兒的下半身衣物，替換為參考圖中的單品 ('${bottom.description}')。保持上半身不變。`;
        }

        const prompt = `**任務：虛擬試穿**... (instructions as before)`;
        const referenceImages = [];
        if (top) { const parsed = parseDataUrl(top.imageUrl); if (parsed) referenceImages.push(parsed); }
        if (bottom) { const parsed = parseDataUrl(bottom.imageUrl); if (parsed) referenceImages.push(parsed); }

        const result = await callImageEditAPI(userModel.base64, userModel.mimeType, prompt, referenceImages);
        res.json(result);
    } catch (error) {
        handleApiError(res, error, req.path);
    }
});


app.post('/api/generate-and-recommend-outfit', async (req, res) => {
    try {
        const { base64ImageData, mimeType, styleProfile } = req.body;
        const currentSeason = getCurrentSeason();

        let designPrompt = `你是一位 AI 時尚設計師。根據這張模特兒的照片，為他們設計一套適合「${currentSeason}」的穿搭。`;
        if (styleProfile) {
           // ... logic to add style profile to prompt
        } else {
           // ... logic for random style
        }
        designPrompt += `\n\n你的任務是只回傳一個清晰、具體的穿搭文字描述...`;

        const designResponse = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: { parts: [{ inlineData: { data: base64ImageData, mimeType } }, { text: designPrompt }] } });
        const outfitDescription = designResponse.text.trim();
        if (!outfitDescription) throw new Error("AI 設計師未能產生穿搭描述。");

        const editPrompt = `**任務：虛擬試穿**... (instructions as before using outfitDescription)`;
        const editResult = await callImageEditAPI(base64ImageData, mimeType, editPrompt);

        if (editResult.imageBase64) {
            res.json(editResult);
        } else {
            throw new Error("AI did not return an image.");
        }
    } catch (error) {
        console.error("Error in generateAndRecommendOutfit endpoint:", error);
        res.status(500).json({ error: "抱歉，AI 暫時無法完成這次的虛擬試穿。請稍後再試一次。" });
    }
});

app.post('/api/get-style-recommendations', async (req, res) => {
    try {
        const { closet, feedback, styleProfile } = req.body;
        const closetDescriptions = closet.map(item => `id: "${item.id}", 描述: "${item.description}" (${item.type === 'TOP' ? '上半身' : '下半身'})`).join('\n');
        let prompt = `你是一位時尚造型師... (instructions as before)`;
        // ... add styleProfile and feedback to prompt
        prompt += `\n\n我的衣櫥 (格式為: id: "uuid", 描述: "desc" (類型)):\n${closetDescriptions}\n\n請回傳一個符合 schema 的有效 JSON 陣列。`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { /* as before */ }
            }
        });
        res.json(JSON.parse(response.text.trim()));
    } catch (error) {
        handleApiError(res, error, req.path);
    }
});

app.post('/api/describe-clothing-item', async (req, res) => {
    try {
        const { base64ImageData, mimeType } = req.body;
        const prompt = "分析這件單品衣物的圖片...";
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ inlineData: { data: base64ImageData, mimeType } }, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: { /* as before */ }
            }
        });
        const result = JSON.parse(response.text.trim());
        if (result.description && (result.type === 'TOP' || result.type === 'BOTTOM') && Array.isArray(result.tags)) {
            res.json(result);
        } else {
            throw new Error("來自 AI 的回應 schema 無效。");
        }
    } catch (error) {
        handleApiError(res, error, req.path);
    }
});

app.post('/api/generate-clothing-item', async (req, res) => {
    try {
        const { style, color, type, customDescription } = req.body;
        const prompt = `一張高品質、專業拍攝的單件衣物棚拍照片...`;
        const response = await ai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt, config: { /* as before */ } });
        if (response.generatedImages && response.generatedImages.length > 0) {
            res.json({ imageBase64: response.generatedImages[0].image.imageBytes });
        } else {
            throw new Error("AI 未回傳任何圖片。");
        }
    } catch (error) {
        handleApiError(res, error, req.path);
    }
});

app.post('/api/find-similar-items', async (req, res) => {
    try {
        const { imageBase64, mimeType, outfitDescription } = req.body;
        const prompt = `你是一位時尚購物助理...`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ inlineData: { data: imageBase64, mimeType } }, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: { /* as before */ }
            }
        });
        res.json(JSON.parse(response.text.trim()));
    } catch (error) {
        handleApiError(res, error, req.path);
    }
});

app.post('/api/validate-user-model-image', async (req, res) => {
    try {
        const { base64ImageData, mimeType } = req.body;
        const prompt = `你是一個嚴格的圖片品質檢驗員...`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ inlineData: { data: base64ImageData, mimeType } }, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: { /* as before */ }
            }
        });
        const result = JSON.parse(response.text.trim());
        if (typeof result.isValid === 'boolean') {
            res.json(result);
        } else {
            throw new Error("AI 回應的 schema 無效。");
        }
    } catch (error) {
        handleApiError(res, error, req.path);
    }
});

app.post('/api/analyze-ootd', async (req, res) => {
    try {
        const { base64ImageData, mimeType } = req.body;
        const analysisPrompt = `你是一位頂尖的時尚評論家和造型師...`;
        const textAnalysisResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ inlineData: { data: base64ImageData, mimeType } }, { text: analysisPrompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: { /* as before */ }
            }
        });
        const analysisResult = JSON.parse(textAnalysisResponse.text.trim());
        if (!analysisResult.upgradeSuggestions || analysisResult.upgradeSuggestions.length === 0) {
            return res.json({ ...analysisResult, upgradeSuggestions: [] });
        }
        
        const imageGenerationPromises = analysisResult.upgradeSuggestions.map(async (suggestion) => {
            try {
                const imageEditPrompt = `**任務：視覺化造型升級**...`;
                const { imageBase64 } = await callImageEditAPI(base64ImageData, mimeType, imageEditPrompt);
                return { suggestion: suggestion.suggestion, upgradedImageBase64: imageBase64 || '' };
            } catch (error) {
                console.error(`Failed to generate image for suggestion: "${suggestion.suggestion}"`, error);
                return { suggestion: suggestion.suggestion, upgradedImageBase64: '' };
            }
        });
        
        const finalSuggestions = await Promise.all(imageGenerationPromises);
        res.json({
            critique: analysisResult.critique,
            identifiedItems: analysisResult.identifiedItems,
            upgradeSuggestions: finalSuggestions,
        });
    } catch (error) {
        handleApiError(res, error, req.path);
    }
});


// Serve static files from the root directory
app.use(express.static('.'));

app.listen(port, () => {
  console.log(`Style Magician server listening on port ${port}`);
});
