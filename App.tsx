

import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { VirtualModelUploader } from './components/VirtualModelUploader';
import { ClosetManager } from './components/ClosetManager';
import { OutfitDisplay } from './components/OutfitDisplay';
import { ModeSwitcher } from './components/ModeSwitcher';
import { ShoppingAssistantModal } from './components/ShoppingAssistantModal';
import { OnboardingGuide } from './components/OnboardingGuide';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { generateVirtualTryOn, getStyleRecommendations, generateAndRecommendOutfit, findSimilarItems } from './services/geminiService';
import { ClothingItem, StyleRecommendation, SavedOutfit, ShoppingAssistantResult } from './types';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<'basic' | 'advanced'>('advanced');
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
          const result = await getStyleRecommendations(closet, recommendationFeedback);
          setRecommendations(result);
      } catch (err) {
          console.error(err);
          setRecommendationError(err instanceof Error ? err.message : "獲取推薦失敗。");
      } finally {
          setIsRecommending(false);
      }
  }, [closet, recommendationFeedback]);

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
        result = await generateAndRecommendOutfit(userModel.base64, userModel.mimeType);
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
  }, [appMode, userModel, selectedTop, selectedBottom]);

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

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <OnboardingGuide isOpen={showOnboarding} onClose={handleOnboardingClose} />
      <Header />
      <main className="p-4 md:p-8 lg:p-12">
        <div className="container mx-auto max-w-7xl">
          <ModeSwitcher currentMode={appMode} onModeChange={setAppMode} />
          
          {appMode === 'advanced' ? (
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 animate-fade-in">
                <div className="lg:col-span-4 space-y-8">
                  <VirtualModelUploader title="1. 建立您的模型" onModelUpload={handleModelUpload} />
                  <ClosetManager
                    title="2. 管理您的衣櫥"
                    closet={closet}
                    savedOutfits={savedOutfits}
                    recommendations={recommendations}
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
                  />
                </div>
                <div className="lg:col-span-8">
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
    </div>
  );
};

export default App;