import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon, UserIcon, CameraIcon } from './icons';
import { validateUserModelImage } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

interface VirtualModelUploaderProps {
  title: string;
  onModelUpload: (base64: string, mimeType: string) => void;
}

export const VirtualModelUploader: React.FC<VirtualModelUploaderProps> = ({ title, onModelUpload }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File | null) => {
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('檔案類型無效。請上傳 JPG, PNG, 或 WEBP 圖片。');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('檔案過大。請上傳小於 10MB 的圖片。');
      return;
    }

    setError(null);
    setIsValidating(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const dataUrl = reader.result as string;
        const base64String = dataUrl.split(',')[1];
        setPreview(dataUrl);

        const validation = await validateUserModelImage(base64String, file.type);

        if (validation.isValid) {
          onModelUpload(base64String, file.type);
        } else {
          setError(validation.reason || "圖片不符合要求，請重新上傳。");
          setPreview(null);
        }
      } catch (err) {
        console.error("Validation failed:", err);
        setError(err instanceof Error ? err.message : "驗證圖片時發生未知錯誤。");
        setPreview(null);
      } finally {
        setIsValidating(false);
        // Clear the input value to allow re-uploading the same file
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setError('讀取檔案失敗。');
      setIsValidating(false);
    };
  }, [onModelUpload]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0] || null);
  }, [processFile]);

  return (
    <div className="bg-card p-6 rounded-2xl shadow-subtle">
      <h2 className="text-xl font-bold text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-4">上傳一張全身照即可開始。</p>
      
      <div 
        className="relative border-2 border-dashed border-border rounded-xl p-4 text-center group hover:border-primary transition-colors duration-300 cursor-pointer"
        onClick={() => !isValidating && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="model-upload"
          className="hidden"
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          disabled={isValidating}
        />
        {isValidating && (
           <div className="absolute inset-0 bg-card/80 flex flex-col items-center justify-center rounded-xl z-10">
              <LoadingSpinner />
              <p className="mt-2 text-sm font-medium text-primary">正在驗證照片品質...</p>
           </div>
        )}
        {preview ? (
          <img src={preview} alt="Virtual model preview" className="w-full h-auto max-h-64 object-contain rounded-lg" />
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <UploadIcon className="h-12 w-12 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            <p className="mt-2 text-sm text-foreground">
              <span className="font-semibold text-primary">點擊上傳</span> 或拖放檔案
            </p>
            <p className="text-xs text-muted-foreground">支援 PNG, JPG, WEBP (最大 10MB)</p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileChange}
            className="hidden"
            disabled={isValidating}
        />
        <button
          onClick={() => !isValidating && cameraInputRef.current?.click()}
          disabled={isValidating}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg transition-colors duration-300 bg-foreground text-background hover:bg-foreground/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
        >
          <CameraIcon className="h-5 w-5" />
          <span className="font-semibold text-sm">拍照上傳</span>
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
};