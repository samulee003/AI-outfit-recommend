import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'white' | 'primary' | 'secondary';
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'primary',
  className = '',
  label = 'Loading...'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-4',
    lg: 'w-8 h-8 border-4'
  };

  const colorClasses = {
    white: 'border-white border-t-transparent',
    primary: 'border-brand-primary border-t-transparent',
    secondary: 'border-brand-secondary border-t-transparent'
  };

  return (
    <div 
      className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin ${className}`}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
};
