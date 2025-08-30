import React from 'react';

interface LoadingSpinnerProps {
  variant?: 'primary' | 'light';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ variant = 'primary' }) => {
  const colorClass = variant === 'light' ? 'border-white' : 'border-primary';
  return (
    <div className={`w-6 h-6 border-4 border-t-transparent ${colorClass} rounded-full animate-spin`}></div>
  );
};
