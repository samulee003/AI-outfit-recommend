import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ClothingItem, StyleRecommendation, ClothingType, ShoppingAssistantResult } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ImagePart {
  base64: string;
  mimeType: string;
}

const getCurrentSeason = (): string => {
  const month = new Date().getMonth(); // 0-11 (Jan-Dec)
  // Simple Northern Hemisphere check
  if (month >= 2 && month <= 4) return '春季'; // Mar, Apr, May
  if (month >= 5 && month <= 7) return '夏季'; // Jun, Jul, Aug
  if (month >= 8 && month <= 10) return '秋季'; // Sep, Oct, Nov
  return '冬季'; // Dec, Jan, Feb
};

const parseDataUrl = (dataUrl: string): ImagePart | null => {
    const match = dataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (match) {
        return { mimeType: match[1], base64: match[2] };
    }
    return null;
};


async function callImageEditAPI(base64ImageData: string, mimeType: string, prompt: string, referenceImages: ImagePart[] = []): Promise<{ imageBase64: string | null; text: string | null }> {
    try {
        const parts: any[] = [
            { inlineData: { data: base64ImageData, mimeType: mimeType } },
        ];

        for (const refImg of referenceImages) {
            parts.push({ inlineData: { data: refImg.base64, mimeType: refImg.mimeType } });
        }

        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });

        let imageBase64: string | null = null;
        let text: string | null = null;
        
        if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    imageBase64 = part.inlineData.data;
                } else if (part.text) {
                    text = part.text;
                }
            }
        }

        if (!imageBase64 && !text) {
            throw new Error("Gemini API 回應無效。找不到圖片或文字。");
        }

        return { imageBase64, text };

    } catch (error) {
        console.error("Error calling Gemini API for image editing:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API 錯誤: ${error.message}`);
        }
        throw new Error("與 Gemini API 通訊時發生未知錯誤。");
    }
}

export async function generateVirtualTryOn(
    userModel: ImagePart,
    top: ClothingItem | null,
    bottom: ClothingItem | null
): Promise<{ imageBase64: string | null; text: string | null }> {
    
    const promptParts = [
        "你是一位執行虛擬試穿的 AI 造型師。",
        "第一張圖是模特兒，後續的圖片是要穿上的衣物單品。",
        "你的任務是真實地編輯模特兒的圖片，讓他們穿上新衣服。"
    ];
    
    const referenceImages: ImagePart[] = [];

    if (top) {
        const parsed = parseDataUrl(top.imageUrl);
        if (parsed) referenceImages.push(parsed);
    }
    if (bottom) {
        const parsed = parseDataUrl(bottom.imageUrl);
        if (parsed) referenceImages.push(parsed);
    }

    if (top && bottom) {
        promptParts.push(`請將模特兒目前的衣物替換為提供的上半身 ('${top.description}') 和下半身 ('${bottom.description}')。`);
    } else if (top) {
        promptParts.push(`請僅將模特兒的上半身替換為提供的單品 ('${top.description}')。不要改變他們的下半身。`);
    } else if (bottom) {
        promptParts.push(`請僅將模特兒的下半身替換為提供的單品 ('${bottom.description}')。不要改變他們的上半身。`);
    }

    promptParts.push("關鍵要點：你必須保持人物原始的姿勢、臉部和背景完全相同。只有衣物應該被修改以自然地貼合模特兒。");
    promptParts.push("最後，用簡短友善的「AI 助理筆記」來描述這套新穿搭。");

    const prompt = promptParts.join(' ');

    return callImageEditAPI(userModel.base64, userModel.mimeType, prompt, referenceImages);
}


export async function generateAndRecommendOutfit(base64ImageData: string, mimeType: string): Promise<{ imageBase64: string | null; text: string | null }> {
  const styles = [
    '休閒時尚', '街頭風', '商務休閒', '極簡主義', '波希米亞風',
    '學院風', '運動休閒', '復古風格', '智慧休閒', '搖滾風',
    '經典風', '前衛風', '混搭風', '都會精緻風'
  ];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const currentSeason = getCurrentSeason();

  const prompt = `**主要任務：虛擬試穿圖片生成**

你是一位專業的 AI 造型師。你的主要目標是編輯提供的圖片，讓圖中人物穿上一套全新的服裝。

**穿搭需求：**
- **主題：** ${randomStyle}
- **季節：** ${currentSeason}
- **構成：** 這套穿搭必須是完整的造型，包含上半身和下半身。

**關鍵圖片編輯規則：**
- 你 **必須** 將人物原本的衣物替換為你設計的新穿搭。
- 你 **必須** 保留人物原始的姿勢、臉部、表情以及完整的背景。唯一要改變的只有衣物。

**次要任務：造型師報告**

成功生成圖片後，請提供一段文字描述。文字 **必須** 遵循以下確切格式：

**核心造型概念：**
[簡要說明此造型的靈感來源。]

**穿搭細節：**
- **上半身：** [描述新的上半身衣物。]
- **下半身：** [描述新的下半身衣物。]
- **鞋款：** [建議合適的鞋款。]

**造型師筆記：**
[提供專業分析，說明為何這套穿搭很成功，著重於風格、色彩和版型。]`;
  
  return callImageEditAPI(base64ImageData, mimeType, prompt);
}


export async function getStyleRecommendations(closet: ClothingItem[], feedback?: Record<string, 'liked' | 'disliked'>): Promise<StyleRecommendation[]> {
    const closetDescriptions = closet.map(item => `id: "${item.id}", 描述: "${item.description}" (${item.type === 'TOP' ? '上半身' : '下半身'})`).join('\n');
    
    let prompt = `你是一位時尚造型師。請根據以下的衣物單品，推薦 3 套風格獨特的穿搭。對於每一套推薦，請提供一個 "styleName" (風格名稱)、一個 "description" (描述)，以及要組合的衣物的確切 "topId" 和 "bottomId" (來自下方清單)。`;

    if (feedback && Object.keys(feedback).length > 0) {
        const feedbackLines = Object.entries(feedback).map(([styleName, pref]) =>
            `- 對於「${styleName}」風格，使用者表示${pref === 'liked' ? '喜歡' : '不喜歡'}。`
        );
        prompt += `\n\n請務必考慮以下使用者的偏好：\n${feedbackLines.join('\n')}\n請生成全新的、符合使用者偏好的推薦。`;
    }

    prompt += `\n\n我的衣櫥 (格式為: id: "uuid", 描述: "desc" (類型)):\n${closetDescriptions}\n\n請回傳一個符合 schema 的有效 JSON 陣列。如果一套穿搭只用到上半身，請省略 bottomId，反之亦然。`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            styleName: { type: Type.STRING },
                            description: { type: Type.STRING },
                            topId: { type: Type.STRING, description: "從衣櫥清單中推薦的上半身衣物 ID。" },
                            bottomId: { type: Type.STRING, description: "從衣櫥清單中推薦的下半身衣物 ID。" },
                        },
                        required: ["styleName", "description"],
                    },
                },
            },
        });

        const jsonText = response.text.trim();
        const recommendations = JSON.parse(jsonText);
        return recommendations;

    } catch (error) {
        console.error("Error calling Gemini API for style recommendations:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API 錯誤: ${error.message}`);
        }
        throw new Error("獲取風格推薦時發生未知錯誤。");
    }
}

export async function describeClothingItem(base64ImageData: string, mimeType: string): Promise<{ description: string; type: ClothingType; tags: string[] }> {
  const prompt = "分析這件單品衣物的圖片。你的任務是提供三項資訊：1. 一個簡潔但具描述性的名稱（例如，「藍色條紋棉質襯衫」）。2. 將其分類為 'TOP'（上半身）或 'BOTTOM'（下半身）。3. 產生一個包含 3-5 個描述性標籤的陣列，標籤應涵蓋顏色、材質、風格或類別（例如，[\"藍色\", \"棉質\", \"休閒\", \"襯衫\"]）。";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { data: base64ImageData, mimeType: mimeType } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "對衣物單品的描述性名稱。",
            },
            type: {
              type: Type.STRING,
              enum: ["TOP", "BOTTOM"],
              description: "衣物單品的類型。",
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "描述衣物的標籤陣列。"
            }
          },
          required: ["description", "type", "tags"],
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);

    if (result.description && (result.type === 'TOP' || result.type === 'BOTTOM') && Array.isArray(result.tags)) {
        return {
            description: result.description,
            type: result.type as ClothingType,
            tags: result.tags,
        };
    } else {
        throw new Error("來自 AI 的回應 schema 無效。");
    }

  } catch (error) {
    console.error("Error calling Gemini API for clothing description:", error);
    if (error instanceof Error) {
      throw new Error(`Gemini API 錯誤: ${error.message}`);
    }
    throw new Error("描述衣物單品時發生未知錯誤。");
  }
}

export async function generateClothingItem(style: string, color: string, type: ClothingType, customDescription: string): Promise<string> {
  const prompt = `一張高品質、專業拍攝的單件衣物棚拍照片：一件來自某個時裝系列的${type === 'TOP' ? '上半身' : '下半身'}。
風格：${style}。
色調：${color}。
描述：${customDescription}。
此單品以平鋪或在假人模特兒身上的方式展示，背景為純白色，沒有真人模特兒。專注於布料的質地和細節。`;

  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
    });
    
    if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages[0].image.imageBytes;
    } else {
        throw new Error("AI 未回傳任何圖片。");
    }
  } catch (error) {
    console.error("Error calling Gemini API for clothing generation:", error);
     if (error instanceof Error) {
        throw new Error(`Gemini API 錯誤: ${error.message}`);
    }
    throw new Error("生成衣物單品時發生未知錯誤。");
  }
}

export async function findSimilarItems(imageBase64: string, mimeType: string, outfitDescription: string): Promise<ShoppingAssistantResult[]> {
    const prompt = `你是一位時尚購物助理。你的任務是分析提供的穿搭圖片和造型師筆記，並為其中的主要單品產生 Google 購物的搜尋查詢。

分析下方的圖片和文字描述，找出 2 到 3 件最關鍵的衣物單品（例如，上衣、褲子、外套）。對於每一件單品：
1.  提供一個簡潔的名稱（itemName）。
2.  建立一個高度相關的 Google 購物搜尋查詢（searchQuery），這個查詢應該包含顏色、材質、款式和類型等關鍵字，以獲得最精準的結果。

你的回覆必須是符合提供之 schema 的 JSON 陣列。

---
造型師筆記：
${outfitDescription}
---`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { data: imageBase64, mimeType } },
                    { text: prompt },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            itemName: {
                                type: Type.STRING,
                                description: "衣物單品的簡潔名稱（例如：米色亞麻襯衫）",
                            },
                            searchQuery: {
                                type: Type.STRING,
                                description: "用於 Google 購物的優化搜尋查詢",
                            },
                        },
                        required: ["itemName", "searchQuery"],
                    },
                },
            },
        });
        
        const jsonText = response.text.trim();
        const results = JSON.parse(jsonText);
        return results;

    } catch (error) {
        console.error("Error calling Gemini API for shopping assistance:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API 錯誤: ${error.message}`);
        }
        throw new Error("尋找相似單品時發生未知錯誤。");
    }
}