import React from 'react';
import { SparklesIcon, ExclamationIcon, UserCircleIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';

interface OutfitDisplayProps {
  userModelImage: string | null;
  generatedOutfitImage: string | null;
  generatedOutfitText: string | null;
  onGenerate: () => void;
  isLoading: boolean;
  error: string | null;
  isActionable: boolean;
}

const ImagePanel: React.FC<{ title: string; imageSrc: string | null; children?: React.ReactNode }> = ({ title, imageSrc, children }) => (
  <div className="flex-1 flex flex-col items-center p-4 bg-base-200 rounded-lg">
    <h3 className="text-sm font-semibold text-gray-500 mb-2">{title}</h3>
    <div className="w-full aspect-[3/4] rounded-lg bg-base-300 flex items-center justify-center overflow-hidden">
      {imageSrc ? (
        <img src={imageSrc} alt={title} className="w-full h-full object-contain" />
      ) : (
        children
      )}
    </div>
  </div>
);


export const OutfitDisplay: React.FC<OutfitDisplayProps> = ({
  userModelImage,
  generatedOutfitImage,
  generatedOutfitText,
  onGenerate,
  isLoading,
  error,
  isActionable,
}) => {
  return (
    <div className="bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300 h-full flex flex-col">
      <h2 className="text-xl font-bold text-gray-800 mb-1">3. Visualize Your Outfit</h2>
      <p className="text-sm text-gray-500 mb-4">See your new style come to life!</p>

      <div className="flex flex-col md:flex-row gap-4 flex-grow mb-4">
        {/* Fix: Pass userModelImage to the imageSrc prop as required by ImagePanel. */}
        <ImagePanel title="Your Model" imageSrc={userModelImage}>
           {!userModelImage && <UserCircleIcon className="w-24 h-24 text-gray-400" />}
        </ImagePanel>
        {/* Fix: Pass generatedOutfitImage to the imageSrc prop as required by ImagePanel. */}
        <ImagePanel title="AI Generated Outfit" imageSrc={generatedOutfitImage}>
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
      
      <div className="flex-grow flex gap-4">
        {userModelImage && <div className="flex-1 hidden md:block"></div>}
        <div className="flex-1">
            { generatedOutfitImage ? 
                <img src={generatedOutfitImage} alt="Generated Outfit" className="w-full h-auto aspect-[3/4] object-contain rounded-lg bg-base-200 p-1 mb-2" /> :
                <div className="w-full aspect-[3/4] hidden md:block"></div>
            }
        </div>
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
        <span>{isLoading ? 'Generating...' : 'Visualize Outfit'}</span>
      </button>
    </div>
  );
};