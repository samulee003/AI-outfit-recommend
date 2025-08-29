import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ImageProps {
  src: string;
  alt: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'wide';
  objectFit?: 'cover' | 'contain' | 'fill';
  className?: string;
  fallback?: React.ReactNode;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export const Image: React.FC<ImageProps> = ({
  src,
  alt,
  aspectRatio = 'square',
  objectFit = 'cover',
  className = '',
  fallback,
  loading = 'lazy',
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const aspectRatioClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    wide: 'aspect-[16/9]'
  };

  const objectFitClasses = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill'
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  if (hasError && fallback) {
    return (
      <div className={`${aspectRatioClasses[aspectRatio]} ${className} flex items-center justify-center bg-gray-100 rounded-md`}>
        {fallback}
      </div>
    );
  }

  return (
    <div className={`relative ${aspectRatioClasses[aspectRatio]} ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
          <LoadingSpinner size="md" color="primary" label="Loading image" />
        </div>
      )}
      
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={`
          w-full h-full rounded-md transition-opacity duration-300
          ${objectFitClasses[objectFit]}
          ${isLoading ? 'opacity-0' : 'opacity-100'}
        `}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};