import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ClothingItem, StyleRecommendation, ClothingType, ShoppingAssistantResult, OotdAnalysisResult, UpgradeSuggestion } from "../types";

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
            // It's possible for the model to just return an image if it deems no text necessary.
            // Only throw error if BOTH are null.
            if (!imageBase64) {
               throw new Error("Gemini API 回應無效。找不到圖片。");
            }
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
    
    let instruction = "";
    if (top && bottom) {
        instruction = `將主圖中模特兒的衣物，替換為參考圖中的上半身 ('${top.description}') 和下半身 ('${bottom.description}')。`;
    } else if (top) {
        instruction = `僅將主圖中模特兒的上半身衣物，替換為參考圖中的單品 ('${top.description}')。保持下半身不變。`;
    } else if (bottom) {
        instruction = `僅將主圖中模特兒的下半身衣物，替換為參考圖中的單品 ('${bottom.description}')。保持上半身不變。`;
    }

    const prompt = `**任務：虛擬試穿**
**輸入：**
- **主圖：** 第一張圖片，是模特兒的原始照片。
- **參考圖：** 後續的圖片，是要穿上的衣物單品。

**指令：**
1. **替換衣物：** ${instruction}
2. **嚴格限制：** 絕對不要更改模特兒的姿勢、臉部表情、髮型或背景。背景必須與原始照片完全一致。
3. **文字輸出：** 提供一段簡短友善的「AI 造型師筆記」，描述這套新穿搭。
`;
    
    const referenceImages: ImagePart[] = [];

    if (top) {
        const parsed = parseDataUrl(top.imageUrl);
        if (parsed) referenceImages.push(parsed);
    }
    if (bottom) {
        const parsed = parseDataUrl(bottom.imageUrl);
        if (parsed) referenceImages.push(parsed);
    }

    return callImageEditAPI(userModel.base64, userModel.mimeType, prompt, referenceImages);
}


export async function generateAndRecommendOutfit(base64ImageData: string, mimeType: string): Promise<{ imageBase64: string | null; text: string | null }> {
    // Step 1: Use a text model to generate a detailed outfit description.
    const styles = [
        '休閒時尚', '街頭風', '商務休閒', '極簡主義', '波希米亞風',
        '學院風', '運動休閒', '復古風格', '智慧休閒', '搖滾風',
        '經典風', '前衛風', '混搭風', '都會精緻風'
    ];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const currentSeason = getCurrentSeason();

    const designPrompt = `你是一位 AI 時尚設計師。根據這張模特兒的照片，為他們設計一套適合「${currentSeason}」的「${randomStyle}」風格穿搭。
    
你的任務是只回傳一個清晰、具體的穿搭文字描述，供另一位 AI 造型師進行圖片編輯。

描述中必須包含：
1.  **上半身**：詳細描述衣物的款式、顏色、材質。
2.  **下半身**：詳細描述衣物的款式、顏色、材質。
3.  **鞋款**：建議搭配的鞋款。

請直接輸出穿搭描述，不要包含任何額外的問候語或標題。例如：「一件米白色的寬鬆亞麻襯衫，搭配一條深藍色的九分斜紋褲，腳上穿著一雙白色的帆布鞋。」`;

    const designResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                { inlineData: { data: base64ImageData, mimeType: mimeType } },
                { text: designPrompt },
            ],
        },
    });
    
    const outfitDescription = designResponse.text.trim();
    if (!outfitDescription) {
        throw new Error("AI 設計師未能產生穿搭描述。");
    }

    // Step 2: Try to use the generated description to edit the image.
    try {
        const editPrompt = `**任務：虛擬試穿**
**輸入：**
- **主圖：** 模特兒的原始照片。

**指令：**
1. **替換衣物：** 根據以下描述，將模特兒身上的衣物替換掉：
   **穿搭描述：** "${outfitDescription}"
2. **嚴格限制：** 絕對不要更改模特兒的姿勢、臉部表情、髮型或背景。背景必須與原始照片完全一致。
3. **文字輸出：** 將原始的穿搭描述 "${outfitDescription}" 作為「AI 造型師筆記」回傳，並在前面加上一句友善的引言。`;
      
        const editResult = await callImageEditAPI(base64ImageData, mimeType, editPrompt);
        
        if (editResult.imageBase64) {
            return editResult;
        } else {
            // If the AI call succeeded but failed to produce an image, throw a specific user-friendly error.
            console.warn("虛擬試穿 API 未能生成圖片。原因:", editResult.text || "未知");
            throw new Error("AI did not return an image.");
        }

    } catch (error) {
        console.error("生成虛擬試穿圖片時發生錯誤:", error);
        // As requested by the user, provide a simple message to try again later, instead of a fallback.
        throw new Error("抱歉，AI 暫時無法完成這次的虛擬試穿。請稍後再試一次。");
    }
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

export async function validateUserModelImage(base64ImageData: string, mimeType: string): Promise<{ isValid: boolean; reason: string | null }> {
  const prompt = `你是一個嚴格的圖片品質檢驗員。你的任務是判斷這張圖片是否符合虛擬試穿模型的所有要求。要求如下：
1.  **單人全身照：** 圖片中必須且只能有一位人物，且必須包含從頭到腳的完整身體。
2.  **清晰度：** 圖片必須清晰，不能模糊或過度曝光/曝光不足。

請根據以上標準，回傳一個 JSON 物件。`;

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
            isValid: {
              type: Type.BOOLEAN,
              description: "圖片是否符合所有要求。",
            },
            reason: {
              type: Type.STRING,
              description: "如果圖片無效 (isValid 為 false)，提供一個簡短、友善且具指導性的原因。例如：'這似乎不是一張全身照，請確保照片包含您的頭部和雙腳。' 或 '照片有些模糊，請嘗試使用更清晰的圖片。'",
            },
          },
          required: ["isValid"],
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);

    if (typeof result.isValid === 'boolean') {
      return {
        isValid: result.isValid,
        reason: result.reason || null,
      };
    } else {
      throw new Error("AI 回應的 schema 無效。");
    }
  } catch (error) {
    console.error("Error calling Gemini API for image validation:", error);
    if (error instanceof Error) {
      throw new Error(`Gemini API 錯誤: ${error.message}`);
    }
    throw new Error("驗證圖片時發生未知錯誤。");
  }
}

export async function analyzeOotd(base64ImageData: string, mimeType: string): Promise<OotdAnalysisResult> {
  // --- Call 1: Get Text Analysis & Suggestions ---
  const analysisPrompt = `你是一位頂尖的時尚評論家和造型師。你的任務是分析使用者上傳的當日穿搭 (OOTD) 照片，並提供專業、有建設性的回饋。

**任務清單：**
1.  **專業點評 (critique):** 提供一段專業的造型分析。從色彩、版型、層次、比例等多個維度進行點評。語氣要客觀、鼓勵，同時點出可以更好的地方。
2.  **升級建議 (upgradeSuggestions):** 提出 1 到 2 個具體、可執行的「錦上添花」建議。例如：「嘗試將運動鞋換成樂福鞋以增加都會感。」或「加上一條簡潔的項鍊來點亮視覺焦點。」
3.  **單品識別 (identifiedItems):** 識別出照片中 2 到 4 件最主要的衣物單品，並提供它們的描述和類型 ('TOP' 或 'BOTTOM')。

你的回覆必須是符合提供之 schema 的 JSON 物件。

**範例 identifiedItems:**
- {"description": "藍色牛津襯衫", "type": "TOP"}
- {"description": "卡其色斜紋褲", "type": "BOTTOM"}
`;

  const textAnalysisResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        { inlineData: { data: base64ImageData, mimeType: mimeType } },
        { text: analysisPrompt },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          critique: { type: Type.STRING, description: "對 OOTD 的專業點評。" },
          upgradeSuggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { suggestion: { type: Type.STRING, description: "一個具體的升級建議文字。" } },
              required: ["suggestion"],
            },
            description: "包含 1-2 個升級建議的陣列。",
          },
          identifiedItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING, description: "識別出的單品描述。" },
                type: { type: Type.STRING, enum: ["TOP", "BOTTOM"], description: "單品類型。" },
              },
              required: ["description", "type"],
            },
            description: "包含 2-4 個已識別單品的陣列。",
          },
        },
        required: ["critique", "upgradeSuggestions", "identifiedItems"],
      },
    },
  });

  const analysisResult = JSON.parse(textAnalysisResponse.text.trim());
  
  if (!analysisResult.upgradeSuggestions || analysisResult.upgradeSuggestions.length === 0) {
    return { ...analysisResult, upgradeSuggestions: [] };
  }
  
  // --- Call 2: Generate Upgraded Image ---
  const suggestionToVisualize = analysisResult.upgradeSuggestions[0].suggestion;
  const imageEditPrompt = `**任務：視覺化造型升級**
**指令：**
1.  **應用變更：** 根據以下建議，對主圖中的穿搭進行細微、精緻的修改：
    **建議：** "${suggestionToVisualize}"
2.  **嚴格限制：** 這是「升級」而不是「替換」。盡最大可能保持原始衣物，只修改建議中提到的部分。絕對不要更改人物的姿勢、臉部、髮型或背景。`;

  const { imageBase64 } = await callImageEditAPI(base64ImageData, mimeType, imageEditPrompt);

  if (!imageBase64) {
      // Don't throw an error, just return the text part
      console.warn("AI 成功分析了穿搭，但無法生成升級後的預覽圖。");
      return {
          ...analysisResult,
          upgradeSuggestions: analysisResult.upgradeSuggestions.map((s: {suggestion: string}) => ({ ...s, upgradedImageBase64: '' })),
      };
  }

  // --- Combine Results ---
  const finalSuggestions: UpgradeSuggestion[] = [{
      suggestion: suggestionToVisualize,
      upgradedImageBase64: imageBase64,
  }];

  if (analysisResult.upgradeSuggestions[1]) {
      finalSuggestions.push({
          suggestion: analysisResult.upgradeSuggestions[1].suggestion,
          upgradedImageBase64: '', // No image for the second one
      });
  }

  return {
    critique: analysisResult.critique,
    identifiedItems: analysisResult.identifiedItems,
    upgradeSuggestions: finalSuggestions,
  };
}