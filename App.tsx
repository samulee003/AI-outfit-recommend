import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { VirtualModelUploader } from './components/VirtualModelUploader';
import { ClosetManager } from './components/ClosetManager';
import { OutfitDisplay } from './components/OutfitDisplay';
import { generateOutfit, getStyleRecommendations } from './services/geminiService';
import { ClothingItem, StyleRecommendation } from './types';

const App: React.FC = () => {
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

  const handleModelUpload = (base64: string, mimeType: string) => {
    setUserModel({ base64, mimeType });
    setGeneratedOutfitImage(null); 
    setGeneratedOutfitText(null);
    setError(null);
  };

  const handleAddItemToCloset = (item: Omit<ClothingItem, 'id'>) => {
    const newItem = { ...item, id: Date.now() };
    const updatedCloset = [...closet, newItem];
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
      // Simple matching logic, can be improved
      const recommendationText = recommendation.description.toLowerCase();
      let foundTop: ClothingItem | null = null;
      let foundBottom: ClothingItem | null = null;

      closet.forEach(item => {
          const itemDesc = item.description.toLowerCase();
          if (recommendationText.includes(itemDesc)) {
              if (item.type === 'TOP' && !foundTop) {
                  foundTop = item;
              } else if (item.type === 'BOTTOM' && !foundBottom) {
                  foundBottom = item;
              }
          }
      });
      setSelectedTop(foundTop);
      setSelectedBottom(foundBottom);
  };


  const handleGenerateOutfit = useCallback(async () => {
    if (!userModel) {
      setError("Please upload your photo to create a virtual model first.");
      return;
    }
    if (!selectedTop && !selectedBottom) {
      setError("Please select an outfit recommendation or manually select items to try on.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedOutfitImage(null);
    setGeneratedOutfitText(null);

    let prompt = "Edit the image to make the person wear";
    if (selectedTop) prompt += ` a ${selectedTop.description}`;
    if (selectedTop && selectedBottom) prompt += " and";
    if (selectedBottom) prompt += ` a ${selectedBottom.description}`;
    prompt += ". Keep the person's pose and the background the same.";

    try {
      const result = await generateOutfit(userModel.base64, userModel.mimeType, prompt);
      if (result.imageBase64) {
        setGeneratedOutfitImage(`data:image/png;base64,${result.imageBase64}`);
      }
      if (result.text) {
        setGeneratedOutfitText(result.text);
      }
      if (!result.imageBase64) {
        setError("The model did not return an image. It might have described the outfit instead. Check the text result.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during image generation.");
    } finally {
      setIsLoading(false);
    }
  }, [userModel, selectedTop, selectedBottom]);

  return (
    <div className="min-h-screen bg-base-100 font-sans text-gray-800">
      <Header />
      <main className="p-4 md:p-8 lg:p-12">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-8">
              <VirtualModelUploader onModelUpload={handleModelUpload} />
              <ClosetManager
                closet={closet}
                recommendations={recommendations}
                onAddItem={handleAddItemToCloset}
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
        </div>
      </main>
    </div>
  );
};

export default App;