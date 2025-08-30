import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { VirtualModelUploader } from './components/VirtualModelUploader';
import { ClosetManager } from './components/ClosetManager';
import { OutfitDisplay } from './components/OutfitDisplay';
import { ModeSwitcher } from './components/ModeSwitcher';
import { ShoppingAssistantModal } from './components/ShoppingAssistantModal';
import { OnboardingGuide } from './components/OnboardingGuide';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { OotdAnalyzer } from './components/OotdAnalyzer';
import { generateVirtualTryOn, getStyleRecommendations, generateAndRecommendOutfit, findSimilarItems, analyzeOotd } from './services/geminiService';
import { ClothingItem, StyleRecommendation, SavedOutfit, ShoppingAssistantResult, OotdAnalysisResult, StyleProfile } from './types';
import { PreviewModal } from './components/PreviewModal';
import { ChatBubbleIcon } from './components/icons';

// --- Feedback Modal Component ---
interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const feedbackEmail = "samu003@gmail.com";
    const emailSubject = encodeURIComponent("穿搭魔法師 App 回饋與建議");
    const emailBody = encodeURIComponent(`嗨，穿搭魔法師團隊：\n\n我想分享一些關於 App 的想法...\n\n`);
    const mailtoLink = `mailto:${feedbackEmail}?subject=${emailSubject}&body=${emailBody}`;

    const handleSendFeedback = () => {
        window.location.href = mailtoLink;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-card rounded-2xl shadow-xl w-full max-w-md space-y-4 p-6 relative"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-2xl"
                    aria-label="關閉"
                >
                    &times;
                </button>
                
                <div className="text-center">
                    <ChatBubbleIcon className="h-12 w-12 text-primary mx-auto mb-2" />
                    <h2 className="text-2xl font-bold text-foreground">意見回饋</h2>
                    <p className="text-muted-foreground mt-1">您的想法對我們至關重要！</p>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg border border-border">
                     <p className="text-sm font-semibold text-foreground">有任何建議或發現問題嗎？</p>
                     <p className="text-xs text-muted-foreground mt-1 mb-3">請透過電子郵件告訴我們，幫助我們變得更好。</p>
                     <button 
                        onClick={handleSendFeedback}
                        className="inline-block py-2 px-6 bg-primary text-primary-foreground font-bold rounded-lg shadow-md hover:bg-primary/90 transition-all"
                    >
                        傳送回饋
                    </button>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [appMode, setAppMode] = useState<'basic' | 'advanced' | 'ootd'>('basic');
  const [userModel, setUserModel] = useState<{ base64: string; mimeType: string; } | null>(null);
  const [closet, setCloset] = useState<ClothingItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [recommendations, setRecommendations] = useState<StyleRecommendation[]>([]);
  const [recommendationFeedback, setRecommendationFeedback] = useState<Record<string, 'liked' | 'disliked'>>({});
  const [selectedTop, setSelectedTop] = useState<ClothingItem | null>(null);
  const [selectedBottom, setSelectedBottom] = useState<ClothingItem | null>(null);
  const [generatedOutfitImage, setGeneratedOutfitImage] = useState<string | null>(null);
  const [generatedOutfitText, setGeneratedOutfitText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRecommending, setIsRecommending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  // Style Profile State
  const [styleProfile, setStyleProfile] = useState<StyleProfile>({ keywords: [], occasion: '', notes: '' });

  // Shopping Assistant State
  const [isFindingSimilarItems, setIsFindingSimilarItems] = useState<boolean>(false);
  const [shoppingAssistantResults, setShoppingAssistantResults] = useState<ShoppingAssistantResult[] | null>(null);
  const [shoppingAssistantError, setShoppingAssistantError] = useState<string | null>(null);
  const [isShoppingModalOpen, setIsShoppingModalOpen] = useState<boolean>(false);

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  
  // Image Preview State
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState<boolean>(false);

  // OOTD Analyzer State
  const [isAnalyzingOotd, setIsAnalyzingOotd] = useState<boolean>(false);
  const [ootdAnalysisResult, setOotdAnalysisResult] = useState<OotdAnalysisResult | null>(null);
  const [ootdError, setOotdError] = useState<string | null>(null);
  
  // Feedback Modal State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewOutfit, setPreviewOutfit] = useState<SavedOutfit | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedCloset = localStorage.getItem('virtualCloset');
      const parsedCloset = savedCloset ? JSON.parse(savedCloset) : [];
      setCloset(parsedCloset);

      const savedLooks = localStorage.getItem('virtualLookbook');
      if (savedLooks) {
        setSavedOutfits(JSON.parse(savedLooks));
      }
      const savedFeedback = localStorage.getItem('virtualFeedback');
      if (savedFeedback) {
        setRecommendationFeedback(JSON.parse(savedFeedback));
      }
      const savedProfile = localStorage.getItem('styleProfile');
      if (savedProfile) {
        setStyleProfile(JSON.parse(savedProfile));
      }

      // Check for onboarding
      const hasOnboarded = localStorage.getItem('hasOnboarded');
      if (!hasOnboarded && parsedCloset.length === 0) {
        setShowOnboarding(true);
      }

    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);
  
  // Reset selections when mode changes
  useEffect(() => {
    setSelectedTop(null);
    setSelectedBottom(null);
    setGeneratedOutfitImage(null);
    setGeneratedOutfitText(null);
    setError(null);
    setOotdAnalysisResult(null);
    setOotdError(null);
  }, [appMode]);
  
  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    try {
        localStorage.setItem('hasOnboarded', 'true');
    } catch (e) {
        console.error("Failed to save onboarding status to localStorage", e);
    }
  };

  const updateClosetInStorage = useCallback((updatedCloset: ClothingItem[]) => {
    setCloset(updatedCloset);
    try {
       localStorage.setItem('virtualCloset', JSON.stringify(updatedCloset));
    } catch (e) {
        console.error("Failed to save closet to localStorage", e);
    }
  }, []);

  const updateLookbookInStorage = useCallback((updatedLookbook: SavedOutfit[]) => {
    setSavedOutfits(updatedLookbook);
    try {
        localStorage.setItem('virtualLookbook', JSON.stringify(updatedLookbook));
    } catch (e) {
        console.error("Failed to save lookbook to localStorage", e);
    }
  }, []);
  
  const handleSaveStyleProfile = useCallback((profile: StyleProfile) => {
    setStyleProfile(profile);
    try {
        localStorage.setItem('styleProfile', JSON.stringify(profile));
    } catch (e) {
        console.error("Failed to save style profile to localStorage", e);
    }
  }, []);

  const handleModelUpload = (base64: string, mimeType: string) => {
    setUserModel({ base64, mimeType });
    setGeneratedOutfitImage(null); 
    setGeneratedOutfitText(null);
    setError(null);
    if (showOnboarding) {
        handleOnboardingClose();
    }
  };

  const handleAddItemsToCloset = useCallback((items: Omit<ClothingItem, 'id'>[]) => {
    const newItems = items.map(item => ({ ...item, id: crypto.randomUUID() }));
    const updatedCloset = [...closet, ...newItems];
    updateClosetInStorage(updatedCloset);
     if (showOnboarding) {
        handleOnboardingClose();
    }
  }, [closet, updateClosetInStorage, showOnboarding]);
  
  const handleDeleteItemFromCloset = useCallback((itemId: string) => {
    const updatedCloset = closet.filter(item => item.id !== itemId);
    updateClosetInStorage(updatedCloset);
  }, [closet, updateClosetInStorage]);

  const handleUpdateClosetItem = useCallback((updatedItem: ClothingItem) => {
    const updatedCloset = closet.map(item => item.id === updatedItem.id ? updatedItem : item);
    updateClosetInStorage(updatedCloset);
  }, [closet, updateClosetInStorage]);

  const handleSaveOutfit = useCallback(() => {
    if (generatedOutfitImage && generatedOutfitText) {
      const newOutfit: SavedOutfit = {
        id: crypto.randomUUID(),
        imageUrl: generatedOutfitImage,
        text: generatedOutfitText,
        createdAt: new Date().toISOString(),
      };
      const updatedLookbook = [newOutfit, ...savedOutfits];
      updateLookbookInStorage(updatedLookbook);
    }
  }, [generatedOutfitImage, generatedOutfitText, savedOutfits, updateLookbookInStorage]);

  const handleDeleteSavedOutfit = useCallback((outfitId: string) => {
    const updatedLookbook = savedOutfits.filter(outfit => outfit.id !== outfitId);
    updateLookbookInStorage(updatedLookbook);
  }, [savedOutfits, updateLookbookInStorage]);
  
  const handleRecommendationFeedback = useCallback((styleName: string, feedback: 'liked' | 'disliked') => {
    const updatedFeedback = { ...recommendationFeedback };
    
    if (updatedFeedback[styleName] === feedback) {
      delete updatedFeedback[styleName]; // Toggle off
    } else {
      updatedFeedback[styleName] = feedback; // Set or change feedback
    }

    setRecommendationFeedback(updatedFeedback);
    try {
        localStorage.setItem('virtualFeedback', JSON.stringify(updatedFeedback));
    } catch (e) {
        console.error("Failed to save feedback to localStorage", e);
    }
  }, [recommendationFeedback]);

  const handleGetRecommendations = useCallback(async () => {
      if (closet.length < 2) {
          setRecommendationError("請至少在您的衣櫥中加入兩件衣物以獲得推薦。");
          return;
      }
      setIsRecommending(true);
      setRecommendationError(null);
      setRecommendations([]);
      try {
          const result = await getStyleRecommendations(closet, recommendationFeedback, styleProfile);
          setRecommendations(result);
      } catch (err) {
          console.error(err);
          setRecommendationError(err instanceof Error ? err.message : "獲取推薦失敗。");
      } finally {
          setIsRecommending(false);
      }
  }, [closet, recommendationFeedback, styleProfile]);

  const handleRecommendationSelect = useCallback((recommendation: StyleRecommendation) => {
      const foundTop = closet.find(item => item.id === recommendation.topId) || null;
      const foundBottom = closet.find(item => item.id === recommendation.bottomId) || null;

      setSelectedTop(foundTop);
      setSelectedBottom(foundBottom);
      setGeneratedOutfitImage(null);
      setGeneratedOutfitText(null);
      setError(null);
  }, [closet]);

  const handleClosetItemSelect = useCallback((item: ClothingItem) => {
    if (item.type === 'TOP') {
        setSelectedTop(prev => (prev?.id === item.id ? null : item));
    } else if (item.type === 'BOTTOM') {
        setSelectedBottom(prev => (prev?.id === item.id ? null : item));
    }
    setGeneratedOutfitImage(null);
    setGeneratedOutfitText(null);
    setError(null);
  }, []);


  const handleGenerateOutfit = useCallback(async () => {
    if (!userModel) {
      setError("請先上傳您的照片以建立虛擬模型。");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedOutfitImage(null);
    setGeneratedOutfitText(null);
    setShoppingAssistantResults(null); // Clear previous shopping results

    try {
      let result: { imageBase64: string | null; text: string | null; };
      
      if (appMode === 'basic') {
        result = await generateAndRecommendOutfit(userModel.base64, userModel.mimeType, styleProfile);
      } else {
        if (!selectedTop && !selectedBottom) {
          setError("請選擇一套推薦穿搭，或手動選擇衣物進行試穿。");
          setIsLoading(false);
          return;
        }
        
        result = await generateVirtualTryOn(
            userModel,
            selectedTop,
            selectedBottom
        );
      }

      if (result.text) {
        setGeneratedOutfitText(result.text);
      }

      if (result.imageBase64) {
        setGeneratedOutfitImage(`data:image/png;base64,${result.imageBase64}`);
      } else {
        setError("AI 無法為此穿搭生成圖片。文字結果中可能提供了原因。");
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "圖片生成過程中發生未知錯誤。");
    } finally {
      setIsLoading(false);
    }
  }, [appMode, userModel, selectedTop, selectedBottom, styleProfile]);

  const handleFindSimilarItems = async () => {
    if (!generatedOutfitImage || !generatedOutfitText) return;

    setIsFindingSimilarItems(true);
    setShoppingAssistantError(null);
    setShoppingAssistantResults(null);
    setIsShoppingModalOpen(true);
    
    try {
        const base64Data = generatedOutfitImage.split(',')[1];
        const mimeType = generatedOutfitImage.match(/data:(image\/\w+);/)?.[1] || 'image/png';
        const results = await findSimilarItems(base64Data, mimeType, generatedOutfitText);
        setShoppingAssistantResults(results);
    } catch (err) {
        const message = err instanceof Error ? err.message : "尋找相似單品時發生未知錯誤。";
        setShoppingAssistantError(message);
        console.error(err);
    } finally {
        setIsFindingSimilarItems(false);
    }
  };
  
  const handlePreviewImage = useCallback((imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setIsImagePreviewOpen(true);
  }, []);

  const handleCloseImagePreview = () => {
    setIsImagePreviewOpen(false);
    setPreviewImageUrl(null);
  };
  
  const handleAnalyzeOotd = useCallback(async (base64: string, mimeType: string) => {
    setIsAnalyzingOotd(true);
    setOotdError(null);
    setOotdAnalysisResult(null);
    try {
      const result = await analyzeOotd(base64, mimeType);
      setOotdAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setOotdError(err instanceof Error ? err.message : "分析您的穿搭時發生未知錯誤。");
    } finally {
      setIsAnalyzingOotd(false);
    }
  }, []);

  const handlePreviewRecommendation = useCallback(async (recommendation: StyleRecommendation) => {
      if (!userModel) {
        setError("請先上傳您的照片以建立虛擬模型。");
        return;
      }
      
      setIsPreviewModalOpen(true);
      setIsPreviewLoading(true);
      setPreviewError(null);
      setPreviewOutfit(null);
  
      try {
          const top = closet.find(item => item.id === recommendation.topId) || null;
          const bottom = closet.find(item => item.id === recommendation.bottomId) || null;
  
          if (!top && !bottom) {
              throw new Error("推薦中未找到有效的衣物。");
          }
  
          const result = await generateVirtualTryOn(userModel, top, bottom);
  
          if (result.imageBase64 && result.text) {
              setPreviewOutfit({
                  id: crypto.randomUUID(),
                  imageUrl: `data:image/png;base64,${result.imageBase64}`,
                  text: result.text,
                  createdAt: new Date().toISOString(),
              });
          } else {
              throw new Error("無法生成預覽。 " + (result.text || ""));
          }
      } catch (err) {
          const message = err instanceof Error ? err.message : "生成預覽時發生未知錯誤。";
          setPreviewError(message);
      } finally {
          setIsPreviewLoading(false);
      }
  }, [userModel, closet]);

  const handleClosePreviewModal = () => {
      setIsPreviewModalOpen(false);
  };

  const handleSaveFromPreview = (outfit: SavedOutfit) => {
      if (outfit) {
          const updatedLookbook = [outfit, ...savedOutfits];
          updateLookbookInStorage(updatedLookbook);
      }
      handleClosePreviewModal();
  };
  
  const dataURLtoFile = (dataurl: string, filename: string): File | null => {
      const arr = dataurl.split(',');
      if (arr.length < 2) return null;
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) return null;
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while(n--){
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, {type:mime});
  }

  const addWatermark = (base64Image: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                const watermarkText = '由 穿搭魔法師 生成';
                ctx.font = `${Math.max(14, canvas.width / 50)}px sans-serif`;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                ctx.fillText(watermarkText, canvas.width - 10, canvas.height - 10);
            }
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            resolve(base64Image); // Return original image on error
        };
        img.src = base64Image;
    });
  };

  const handleShareFromPreview = async (outfit: SavedOutfit) => {
      if (!outfit) return;
      
      const watermarkedImage = await addWatermark(outfit.imageUrl);
      const imageFile = dataURLtoFile(watermarkedImage, `ai-outfit-preview-${Date.now()}.png`);

      if (!imageFile) {
          alert("分享失敗：無法處理圖片。");
          return;
      }
      const shareData = {
          title: "我的 AI 推薦穿搭",
          text: `快來看看「穿搭魔法師」為我推薦的新造型！\n\n${outfit.text}`,
          files: [imageFile],
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
          try {
              await navigator.share(shareData);
          } catch (err) {
              console.error("分享失敗:", err);
          }
      } else {
          alert("您的瀏覽器不支援分享功能。");
      }
  };

  const handleOpenFeedbackModal = () => setIsFeedbackModalOpen(true);
  const handleCloseFeedbackModal = () => setIsFeedbackModalOpen(false);


  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <OnboardingGuide isOpen={showOnboarding} onClose={handleOnboardingClose} />
      <Header onFeedbackClick={handleOpenFeedbackModal} />
      <main className="p-4 md:p-8 lg:p-12">
        <div className="container mx-auto max-w-7xl">
          <ModeSwitcher currentMode={appMode} onModeChange={setAppMode} />
          
          {appMode === 'ootd' ? (
             <div className="mt-8 animate-fade-in">
               <OotdAnalyzer 
                  onAnalyze={handleAnalyzeOotd}
                  onAddItemsToCloset={handleAddItemsToCloset}
                  isLoading={isAnalyzingOotd}
                  error={ootdError}
                  result={ootdAnalysisResult}
               />
             </div>
          ) : appMode === 'advanced' ? (
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 animate-fade-in">
                <div className="lg:col-span-5 space-y-8">
                  <VirtualModelUploader title="1. 建立您的模型" onModelUpload={handleModelUpload} />
                  <ClosetManager
                    title="2. 準備您的穿搭"
                    closet={closet}
                    savedOutfits={savedOutfits}
                    recommendations={recommendations}
                    styleProfile={styleProfile}
                    onSaveStyleProfile={handleSaveStyleProfile}
                    onAddItems={handleAddItemsToCloset}
                    onUpdateItem={handleUpdateClosetItem}
                    onDeleteItem={handleDeleteItemFromCloset}
                    onDeleteSavedOutfit={handleDeleteSavedOutfit}
                    onGetRecommendations={handleGetRecommendations}
                    onSelectRecommendation={handleRecommendationSelect}
                    onSelectItem={handleClosetItemSelect}
                    isRecommending={isRecommending}
                    error={recommendationError}
                    selectedTopId={selectedTop?.id}
                    selectedBottomId={selectedBottom?.id}
                    recommendationFeedback={recommendationFeedback}
                    onRecommendationFeedback={handleRecommendationFeedback}
                    onPreviewRecommendation={handlePreviewRecommendation}
                    onPreviewImage={handlePreviewImage}
                  />
                </div>
                <div className="lg:col-span-7">
                  <OutfitDisplay
                    title="3. 預覽您的穿搭"
                    userModelImage={userModel?.base64 ? `data:${userModel.mimeType};base64,${userModel.base64}` : null}
                    generatedOutfitImage={generatedOutfitImage}
                    generatedOutfitText={generatedOutfitText}
                    onGenerate={handleGenerateOutfit}
                    onSave={handleSaveOutfit}
                    onFindSimilar={handleFindSimilarItems}
                    onImagePreview={handlePreviewImage}
                    isLoading={isLoading}
                    error={error}
                    isActionable={!!userModel && (!!selectedTop || !!selectedBottom)}
                  />
                </div>
              </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 animate-fade-in">
              <div className="lg:col-span-5">
                 <VirtualModelUploader title="1. 上傳您的照片" onModelUpload={handleModelUpload} />
              </div>
              <div className="lg:col-span-7">
                <OutfitDisplay
                    title="2. 獲取 AI 穿搭"
                    userModelImage={userModel?.base64 ? `data:${userModel.mimeType};base64,${userModel.base64}` : null}
                    generatedOutfitImage={generatedOutfitImage}
                    generatedOutfitText={generatedOutfitText}
                    onGenerate={handleGenerateOutfit}
                    onSave={handleSaveOutfit}
                    onFindSimilar={handleFindSimilarItems}
                    onImagePreview={handlePreviewImage}
                    isLoading={isLoading}
                    error={error}
                    isActionable={!!userModel}
                  />
              </div>
            </div>
          )}
        </div>
      </main>
      <ShoppingAssistantModal
        isOpen={isShoppingModalOpen}
        onClose={() => setIsShoppingModalOpen(false)}
        isLoading={isFindingSimilarItems}
        results={shoppingAssistantResults}
        error={shoppingAssistantError}
      />
      <ImagePreviewModal
        isOpen={isImagePreviewOpen}
        imageUrl={previewImageUrl}
        onClose={handleCloseImagePreview}
      />
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={handleClosePreviewModal}
        isLoading={isPreviewLoading}
        error={previewError}
        outfit={previewOutfit}
        onSave={handleSaveFromPreview}
        onShare={handleShareFromPreview}
      />
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={handleCloseFeedbackModal}
      />
    </div>
  );
};

export default App;