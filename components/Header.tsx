import React from 'react';
import { WardrobeIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-background border-b border-border sticky top-0 z-40">
      <div className="container mx-auto max-w-7xl px-4 py-4 md:px-8">
        <div className="flex items-center space-x-3">
          <WardrobeIcon className="h-8 w-8 text-foreground" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            穿搭魔法師
          </h1>
        </div>
      </div>
    </header>
  );
};