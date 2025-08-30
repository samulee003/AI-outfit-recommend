import React from 'react';
import { SparklesIcon, ExclamationIcon, UserCircleIcon, DownloadIcon, BookmarkIcon, ShareIcon, ShoppingBagIcon, ZoomInIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';

interface OutfitDisplayProps {
  title: string;
  userModelImage: string | null;
  generatedOutfitImage: string | null;
  generatedOutfitText: string | null;
  onGenerate: () => void;
  onSave: () => void;
  onFindSimilar: () => void;
  onImagePreview: (imageUrl: string) => void;
  isLoading: boolean;
  error: string | null;
  isActionable: boolean;
}

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

const ActionButton: React.FC<{ onClick: () => void; 'aria-label': string; children: React.ReactNode; }> = ({ onClick, 'aria-label': ariaLabel, children }) => (
    <button
        onClick={onClick}
        className="p-2 bg-black/40 text-white rounded-full hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-muted focus:ring-white transition-all"
        aria-label={ariaLabel}
    >
        {children}
    </button>
);

const ImagePanel: React.FC<{ 
  title: string; 
  imageSrc: string | null; 
  children?: React.ReactNode;
  isClickable?: boolean;
  onClick?: () => void;
}> = ({ title, imageSrc, children, isClickable, onClick }) => (
  <div className="relative flex-1 flex flex-col items-center p-3 bg-muted rounded-xl">
    <h3 className="text-sm font-semibold text-muted-foreground mb-2">{title}</h3>
    <div className="w-full aspect-[3/4] rounded-lg bg-background/50 flex items-center justify-center overflow-hidden">
      {imageSrc ? (
        isClickable ? (
          <button 
            onClick={onClick}
            className="w-full h-full relative group focus:outline-none"
            aria-label="放大預覽圖片"
          >
            <img src={imageSrc} alt={title} className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomInIcon className="w-12 h-12 text-white" />
            </div>
          </button>
        ) : (
          <img src={imageSrc} alt={title} className="w-full h-full object-contain" />
        )
      ) : (
        children
      )}
    </div>
  </div>
);


export const OutfitDisplay: React.FC<OutfitDisplayProps> = ({
  title,
  userModelImage,
  generatedOutfitImage,
  generatedOutfitText,
  onGenerate,
  onSave,
  onFindSimilar,
  onImagePreview,
  isLoading,
  error,
  isActionable,
}) => {
  const isBasicMode = title.includes('獲取 AI 穿搭');

  const handleDownload = async () => {
    if (!generatedOutfitImage) return;
    const watermarkedImage = await addWatermark(generatedOutfitImage);
    const link = document.createElement('a');
    link.href = watermarkedImage;
    link.download = `ai-outfit-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
      if (!generatedOutfitImage || !generatedOutfitText) return;
      
      const watermarkedImage = await addWatermark(generatedOutfitImage);
      const imageFile = dataURLtoFile(watermarkedImage, `ai-outfit-${Date.now()}.png`);

      if (!imageFile) {
          alert("分享失敗：無法處理圖片。");
          return;
      }
      
      const shareData = {
          title: "我的 AI 穿搭",
          text: `快來看看我的新造型！\n\n${generatedOutfitText}\n\n由「穿搭魔法師」生成`,
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
  
  return (
    <div className="bg-card p-6 rounded-2xl shadow-subtle h-full flex flex-col">
      <h2 className="text-xl font-bold text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {isBasicMode ? "讓 AI 為您找到完美風格。" : "見證您的新風格誕生！"}
      </p>

      <div className="flex flex-col md:flex-row gap-4 flex-grow mb-4">
        <ImagePanel title="您的模型" imageSrc={userModelImage}>
           {!userModelImage && <UserCircleIcon className="w-24 h-24 text-muted-foreground/30" />}
        </ImagePanel>
        <div className="relative flex-1">
            <ImagePanel 
                title="AI 生成穿搭" 
                imageSrc={generatedOutfitImage}
                isClickable={!!generatedOutfitImage}
                onClick={() => generatedOutfitImage && onImagePreview(generatedOutfitImage)}
            >
              {isLoading && (
                 <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                    <LoadingSpinner />
                    <p className="mt-2 text-sm font-medium">正在生成您的造型...</p>
                    <p className="text-xs">這可能需要一些時間。</p>
                 </div>
              )}
              {!isLoading && !generatedOutfitImage && <SparklesIcon className="w-24 h-24 text-muted-foreground/30" />}
            </ImagePanel>
             {generatedOutfitImage && (
                <div className="absolute top-3 right-3 flex flex-col space-y-2">
                    <ActionButton onClick={handleDownload} aria-label="下載生成圖片">
                        <DownloadIcon className="w-5 h-5" />
                    </ActionButton>
                    <ActionButton onClick={onSave} aria-label="儲存穿搭">
                        <BookmarkIcon className="w-5 h-5" />
                    </ActionButton>
                    {navigator.share && (
                        <ActionButton onClick={handleShare} aria-label="分享穿搭">
                            <ShareIcon className="w-5 h-5" />
                        </ActionButton>
                    )}
                </div>
            )}
        </div>
      </div>

      {error && (
        <div className="my-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-start space-x-2">
          <ExclamationIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {generatedOutfitText && !error && (
        <div className="my-4 p-3 bg-primary/10 border border-primary/20 text-primary/90 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold mb-1 text-primary">AI 造型師筆記：</p>
                <p className="text-sm whitespace-pre-wrap">{generatedOutfitText}</p>
              </div>
              <button 
                onClick={onFindSimilar}
                className="flex-shrink-0 ml-4 -mt-1 -mr-1 flex items-center space-x-1.5 text-xs font-semibold text-primary bg-primary/20 hover:bg-primary/30 rounded-full py-1 px-2.5 transition-colors"
              >
                <ShoppingBagIcon className="w-3.5 h-3.5" />
                <span>尋找相似單品</span>
              </button>
            </div>
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={!isActionable || isLoading}
        // FIX: Corrected the ternary operator syntax which had an extra ':' causing a compile error.
        className={`w-full flex items-center justify-center space-x-2 text-lg font-bold py-3 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/50
          ${!isActionable || isLoading ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
      >
        {isLoading ? <LoadingSpinner variant="light" /> : <SparklesIcon className="h-6 w-6" />}
        <span>{isLoading ? '生成中...' : (isBasicMode ? '獲取 AI 穿搭' : '生成我的穿搭')}</span>
      </button>
    </div>
  );
};
