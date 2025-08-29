import React, { useState, useCallback } from 'react';
import { UploadIcon, UserIcon } from './icons';

interface VirtualModelUploaderProps {
  onModelUpload: (base64: string, mimeType: string) => void;
}

export const VirtualModelUploader: React.FC<VirtualModelUploaderProps> = ({ onModelUpload }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Invalid file type. Please upload a JPG, PNG, or WEBP image.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File is too large. Please upload an image smaller than 5MB.');
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
        setError('Failed to read the file.');
      };
      reader.readAsDataURL(file);
    }
  }, [onModelUpload]);

  return (
    <div className="bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300">
      <h2 className="text-xl font-bold text-gray-800 mb-1">1. Create Your Model</h2>
      <p className="text-sm text-gray-500 mb-4">Upload a full-body photo to begin.</p>
      
      <div className="relative border-2 border-dashed border-base-300 rounded-xl p-4 text-center group hover:border-brand-secondary transition-colors duration-300">
        <input
          type="file"
          id="model-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
        />
        {preview ? (
          <img src={preview} alt="Virtual model preview" className="w-full h-auto max-h-64 object-contain rounded-lg" />
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <UploadIcon className="h-12 w-12 text-gray-400 group-hover:text-brand-secondary transition-colors" />
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-semibold text-brand-secondary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, WEBP (max 5MB)</p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};
