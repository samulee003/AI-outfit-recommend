import React from 'react';
import { WardrobeIcon, ChatBubbleIcon } from './icons';

interface HeaderProps {
    onFeedbackClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onFeedbackClick }) => {
  return (
    <header className="bg-background border-b border-border sticky top-0 z-40">
      <div className="container mx-auto max-w-7xl px-4 py-4 md:px-8">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <WardrobeIcon className="h-8 w-8 text-foreground" />
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                穿搭魔法師
              </h1>
            </div>
            <button
                onClick={onFeedbackClick}
                className="flex items-center space-x-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors py-2 px-3 rounded-lg"
                aria-label="提供意見回饋"
            >
                <ChatBubbleIcon className="h-5 w-5" />
                <span className="hidden md:inline">意見回饋</span>
            </button>
        </div>
      </div>
    </header>
  );
};