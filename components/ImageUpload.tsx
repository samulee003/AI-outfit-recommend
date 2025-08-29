import React, { useState, useRef } from 'react';

interface ImageUploadProps {
  onImageSelect: (imageData: string, mimeType: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  placeholder?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  accept = "image/*",
  maxSize = 2,
  placeholder = "點擊或拖拽上傳圖片",
  className = ""
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setError(null);

    // 檢查檔案大小
    if (file.size > maxSize * 1024 * 1024) {
      setError(`檔案大小不能超過 ${maxSize}MB`);
      return;
    }

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      setError('請選擇圖片檔案');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      
      // 提取 base64 數據和 MIME 類型
      const [header, base64Data] = result.split(',');
      const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
      
      onImageSelect(base64Data, mimeType);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearImage = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`image-upload ${className}`}>
      <div
        className={`upload-area ${dragOver ? 'drag-over' : ''} ${preview ? 'has-image' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        {preview ? (
          <div className="preview-container">
            <img src={preview} alt="預覽" className="preview-image" />
            <div className="preview-overlay">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearImage();
                }}
                className="clear-button"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">📷</div>
            <div className="upload-text">{placeholder}</div>
            <div className="upload-hint">支援 JPG, PNG, WEBP, GIF (最大 {maxSize}MB)</div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <style jsx>{`
        .image-upload {
          width: 100%;
        }
        
        .upload-area {
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background-color: #f9fafb;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .upload-area:hover {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }
        
        .upload-area.drag-over {
          border-color: #3b82f6;
          background-color: #dbeafe;
          transform: scale(1.02);
        }
        
        .upload-area.has-image {
          padding: 0;
          border: none;
          background: transparent;
        }
        
        .preview-container {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 200px;
        }
        
        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
          max-height: 300px;
        }
        
        .preview-overlay {
          position: absolute;
          top: 8px;
          right: 8px;
        }
        
        .clear-button {
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: background-color 0.2s;
        }
        
        .clear-button:hover {
          background: rgba(0, 0, 0, 0.9);
        }
        
        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        
        .upload-icon {
          font-size: 48px;
          opacity: 0.5;
        }
        
        .upload-text {
          font-size: 16px;
          font-weight: 500;
          color: #374151;
        }
        
        .upload-hint {
          font-size: 14px;
          color: #6b7280;
        }
        
        .error-message {
          margin-top: 8px;
          padding: 8px 12px;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          color: #dc2626;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};