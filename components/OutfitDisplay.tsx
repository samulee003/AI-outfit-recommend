import React from 'react';
import { SparklesIcon, ExclamationIcon, UserCircleIcon, DownloadIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';

interface OutfitDisplayProps {
  title: string;
  userModelImage: string | null;
  generatedOutfitImage: string | null;
  generatedOutfitText: string | null;
  onGenerate: () => void;
  isLoading: boolean;
  error: string | null;
  isActionable: boolean;
}

const ImagePanel: React.FC<{ title: string; imageSrc: string | null; onDownload?: () => void; children?: React.ReactNode }> = ({ title, imageSrc, onDownload, children }) => (
  <div className="relative flex-1 flex flex-col items-center p-4 bg-base-200 rounded-lg">
    <h3 className="text-sm font-semibold text-gray-500 mb-2">{title}</h3>
    <div className="w-full aspect-[3/4] rounded-lg bg-base-300 flex items-center justify-center overflow-hidden">
      {imageSrc ? (
        <img src={imageSrc} alt={title} className="w-full h-full object-contain" />
      ) : (
        children
      )}
    </div>
    {imageSrc && onDownload && (
        <button 
            onClick={onDownload}
            className="absolute top-3 right-3 p-2 bg-black bg-opacity-40 text-white rounded-full hover:bg-opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 focus:ring-white transition-all"
            aria-label="Download generated image"
        >
            <DownloadIcon className="w-5 h-5" />
        </button>
    )}
  </div>
);


export const OutfitDisplay: React.FC<OutfitDisplayProps> = ({
  title,
  userModelImage,
  generatedOutfitImage,
  generatedOutfitText,
  onGenerate,
  isLoading,
  error,
  isActionable,
}) => {
  const isBasicMode = title.includes('Get AI Outfit');

  const handleDownload = () => {
    if (!generatedOutfitImage) return;
    const link = document.createElement('a');
    link.href = generatedOutfitImage;
    link.download = `ai-outfit-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300 h-full flex flex-col">
      <h2 className="text-xl font-bold text-gray-800 mb-1">{title}</h2>
      <p className="text-sm text-gray-500 mb-4">
        {isBasicMode ? "Let AI find the perfect style for you." : "See your new style come to life!"}
      </p>

      <div className="flex flex-col md:flex-row gap-4 flex-grow mb-4">
        <ImagePanel title="Your Model" imageSrc={userModelImage}>
           {!userModelImage && <UserCircleIcon className="w-24 h-24 text-gray-400" />}
        </ImagePanel>
        <ImagePanel 
            title="AI Generated Outfit" 
            imageSrc={generatedOutfitImage}
            onDownload={handleDownload}
        >
          {isLoading && (
             <div className="flex flex-col items-center justify-center text-center text-gray-500">
                <LoadingSpinner />
                <p className="mt-2 text-sm font-medium">Generating your look...</p>
                <p className="text-xs">This may take a moment.</p>
             </div>
          )}
          {!isLoading && !generatedOutfitImage && <SparklesIcon className="w-24 h-24 text-gray-400" />}
        </ImagePanel>
      </div>

      {error && (
        <div className="my-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded-lg flex items-start space-x-2">
          <ExclamationIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {generatedOutfitText && !error && (
        <div className="my-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg">
            <p className="text-sm font-semibold mb-1">AI Assistant Note:</p>
            <p className="text-sm">{generatedOutfitText}</p>
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={!isActionable || isLoading}
        className={`w-full flex items-center justify-center space-x-2 text-lg font-bold py-3 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50
          ${!isActionable || isLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-brand-primary text-white hover:bg-brand-dark focus:ring-brand-secondary'}`}
      >
        {isLoading ? <LoadingSpinner /> : <SparklesIcon className="h-6 w-6" />}
        <span>{isLoading ? 'Generating...' : (isBasicMode ? 'Get AI Outfit' : 'Visualize Outfit')}</span>
      </button>
    </div>
  );
};