import React from 'react';
import { WardrobeIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-brand-primary shadow-md">
      <div className="container mx-auto max-w-7xl px-4 py-4 md:px-8">
        <div className="flex items-center space-x-3">
          <WardrobeIcon className="h-8 w-8 text-brand-text" />
          <h1 className="text-2xl font-bold text-brand-text tracking-tight">
            AI Virtual Wardrobe
          </h1>
        </div>
      </div>
    </header>
  );
};
