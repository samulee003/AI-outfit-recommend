import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { VirtualModelUploader } from './components/VirtualModelUploader';
import { ClosetManager } from './components/ClosetManager';
import { OutfitDisplay } from './components/OutfitDisplay';
import { ModeSwitcher } from './components/ModeSwitcher';
import { generateOutfit, getStyleRecommendations, generateAndRecommendOutfit } from './services/geminiService';
import { ClothingItem, StyleRecommendation } from './types';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<'basic' | 'advanced'>('advanced');
  const [userModel, setUserModel] = useState<{ base64: string; mimeType: string; } | null>(null);
  const [closet, setCloset] = useState<ClothingItem[]>([]);
  const [recommendations, setRecommendations] = useState<StyleRecommendation[]>([]);
  const [selectedTop, setSelectedTop] = useState<ClothingItem | null>(null);
  const [selectedBottom, setSelectedBottom] = useState<ClothingItem | null>(null);
  const [generatedOutfitImage, setGeneratedOutfitImage] = useState<string | null>(null);
  const [generatedOutfitText, setGeneratedOutfitText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRecommending, setIsRecommending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedCloset = localStorage.getItem('virtualCloset');
      if (savedCloset) {
        setCloset(JSON.parse(savedCloset));
      }
    } catch (e) {
      console.error("Failed to load closet from localStorage", e);
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

  const handleModelUpload = (base64: string, mimeType: string) => {
    setUserModel({ base64, mimeType });
    setGeneratedOutfitImage(null); 
    setGeneratedOutfitText(null);
    setError(null);
  };

  const handleAddItemsToCloset = (items: Omit<ClothingItem, 'id'>[]) => {
    const newItems = items.map(item => ({ ...item, id: Date.now() + Math.random() }));
    const updatedCloset = [...closet, ...newItems];
    setCloset(updatedCloset);
    try {
       localStorage.setItem('virtualCloset', JSON.stringify(updatedCloset));
    } catch (e) {
        console.error("Failed to save closet to localStorage", e);
    }
  };
  
  const handleGetRecommendations = async () => {
      if (closet.length < 2) {
          setRecommendationError("Please add at least two items to your closet to get recommendations.");
          return;
      }
      setIsRecommending(true);
      setRecommendationError(null);
      setRecommendations([]);
      try {
          const result = await getStyleRecommendations(closet);
          setRecommendations(result);
      } catch (err) {
          console.error(err);
          setRecommendationError(err instanceof Error ? err.message : "Failed to get recommendations.");
      } finally {
          setIsRecommending(false);
      }
  };

  const handleRecommendationSelect = (recommendation: StyleRecommendation) => {
      const foundTop = closet.find(item => item.id === recommendation.topId) || null;
      const foundBottom = closet.find(item => item.id === recommendation.bottomId) || null;

      setSelectedTop(foundTop);
      setSelectedBottom(foundBottom);
  };


  const handleGenerateOutfit = useCallback(async () => {
    if (!userModel) {
      setError("Please upload your photo to create a virtual model first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedOutfitImage(null);
    setGeneratedOutfitText(null);

    try {
      let result: { imageBase64: string | null; text: string | null; };
      
      if (appMode === 'basic') {
        result = await generateAndRecommendOutfit(userModel.base64, userModel.mimeType);
      } else {
        if (!selectedTop && !selectedBottom) {
          setError("Please select an outfit recommendation or manually select items to try on.");
          setIsLoading(false);
          return;
        }
        
        let prompt = "Task: Virtual try-on with scene generation. Use the reference images provided for the clothing to dress the person in the main photo. ";
        const itemsToWear = [];
        if (selectedTop) itemsToWear.push(`Put the **Top** on them.`);
        if (selectedBottom) itemsToWear.push(`Put the **Bottom** on them.`);
        prompt += itemsToWear.join(' ');
        prompt += ". Also, completely replace the original background with a new, scenic background that complements the new outfit's style. Important: Keep the person's face and pose exactly the same. Finally, provide a brief description of the new outfit and background.";
        
        result = await generateOutfit(
            userModel.base64, 
            userModel.mimeType, 
            prompt,
            selectedTop?.imageUrl || null,
            selectedBottom?.imageUrl || null
        );
      }

      if (result.text) {
        setGeneratedOutfitText(result.text);
      }

      if (result.imageBase64) {
        setGeneratedOutfitImage(`data:image/png;base64,${result.imageBase64}`);
      } else {
        setError("The AI was unable to generate an image for this outfit. It may have provided a reason in the text result.");
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during image generation.");
    } finally {
      setIsLoading(false);
    }
  }, [appMode, userModel, selectedTop, selectedBottom]);

  return (
    <div className="min-h-screen bg-base-100 font-sans text-gray-800">
      <Header />
      <main className="p-4 md:p-8 lg:p-12">
        <div className="container mx-auto max-w-7xl">
          <ModeSwitcher currentMode={appMode} onModeChange={setAppMode} />
          
          {appMode === 'advanced' ? (
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
                <div className="lg:col-span-4 space-y-8">
                  <VirtualModelUploader title="1. Create Your Model" onModelUpload={handleModelUpload} />
                  <ClosetManager
                    title="2. Manage Your Closet"
                    closet={closet}
                    recommendations={recommendations}
                    onAddItems={handleAddItemsToCloset}
                    onGetRecommendations={handleGetRecommendations}
                    onSelectRecommendation={handleRecommendationSelect}
                    isRecommending={isRecommending}
                    error={recommendationError}
                    selectedTopId={selectedTop?.id}
                    selectedBottomId={selectedBottom?.id}
                  />
                </div>
                <div className="lg:col-span-8">
                  <OutfitDisplay
                    title="3. Visualize Your Outfit"
                    userModelImage={userModel?.base64 ? `data:${userModel.mimeType};base64,${userModel.base64}` : null}
                    generatedOutfitImage={generatedOutfitImage}
                    generatedOutfitText={generatedOutfitText}
                    onGenerate={handleGenerateOutfit}
                    isLoading={isLoading}
                    error={error}
                    isActionable={!!userModel && (!!selectedTop || !!selectedBottom)}
                  />
                </div>
              </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
              <div className="lg:col-span-5">
                 <VirtualModelUploader title="1. Upload Your Photo" onModelUpload={handleModelUpload} />
              </div>
              <div className="lg:col-span-7">
                <OutfitDisplay
                    title="2. Get AI Outfit"
                    userModelImage={userModel?.base64 ? `data:${userModel.mimeType};base64,${userModel.base64}` : null}
                    generatedOutfitImage={generatedOutfitImage}
                    generatedOutfitText={generatedOutfitText}
                    onGenerate={handleGenerateOutfit}
                    isLoading={isLoading}
                    error={error}
                    isActionable={!!userModel}
                  />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;