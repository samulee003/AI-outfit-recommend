import React from 'react';
import { ShoppingAssistantResult } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ExclamationIcon } from './icons';

interface ShoppingAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    results: ShoppingAssistantResult[] | null;
    error: string | null;
}

export const ShoppingAssistantModal: React.FC<ShoppingAssistantModalProps> = ({ isOpen, onClose, isLoading, results, error }) => {
    if (!isOpen) return null;

    const handleSearch = (query: string) => {
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=shop`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-card rounded-2xl shadow-xl w-full max-w-lg space-y-4 p-6"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-foreground">智慧購物助理</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">&times;</button>
                </div>

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <div className="w-8 h-8 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
                        <p className="mt-3 text-md font-medium">正在為您尋找相似單品...</p>
                        <p className="text-sm">AI 正在分析穿搭細節。</p>
                    </div>
                )}

                {error && (
                    <div className="my-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-start space-x-2">
                        <ExclamationIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">
                            <span className="font-semibold">搜尋失敗：</span>
                            {error}
                        </p>
                    </div>
                )}
                
                {results && results.length > 0 && (
                     <div className="space-y-3 pt-2">
                        <p className="text-sm text-muted-foreground">我們分析出了以下單品，點擊即可在網路上搜尋！</p>
                        {results.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                                <span className="font-semibold text-foreground">{item.itemName}</span>
                                <button 
                                    onClick={() => handleSearch(item.searchQuery)}
                                    className="text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-md py-1.5 px-3 transition-colors"
                                >
                                    在 Google 上搜尋
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                 {results && results.length === 0 && !isLoading && (
                    <p className="text-center text-muted-foreground py-8">抱歉，我們無法從這張圖片中分析出可搜尋的單品。</p>
                )}


                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="py-2 px-5 border border-border rounded-md shadow-sm text-sm font-medium text-foreground hover:bg-accent">關閉</button>
                </div>
            </div>
        </div>
    );
};