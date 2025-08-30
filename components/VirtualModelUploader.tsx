import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon, UserIcon, CameraIcon } from './icons';

interface VirtualModelUploaderProps {
  title: string;
  onModelUpload: (base64: string, mimeType: string) => void;
}

export const VirtualModelUploader: React.FC<VirtualModelUploaderProps> = ({ title, onModelUpload }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File | null) => {
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('檔案類型無效。請上傳 JPG, PNG, 或 WEBP 圖片。');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('檔案過大。請上傳小於 5MB 的圖片。');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setPreview(reader.result as string);
        onModelUpload(base64String, file.type);
      };
      reader.onerror = () => {
        setError('讀取檔案失敗。');
      };
      reader.readAsDataURL(file);
    }
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
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="model-upload"
          className="hidden"
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
        />
        {preview ? (
          <img src={preview} alt="Virtual model preview" className="w-full h-auto max-h-64 object-contain rounded-lg" />
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <UploadIcon className="h-12 w-12 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            <p className="mt-2 text-sm text-foreground">
              <span className="font-semibold text-primary">點擊上傳</span> 或拖放檔案
            </p>
            <p className="text-xs text-muted-foreground">支援 PNG, JPG, WEBP (最大 5MB)</p>
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
        />
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg transition-colors duration-300 bg-foreground text-background hover:bg-foreground/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground"
        >
          <CameraIcon className="h-5 w-5" />
          <span className="font-semibold text-sm">拍照上傳</span>
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
};