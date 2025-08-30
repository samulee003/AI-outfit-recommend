import React from 'react';
import { SavedOutfit } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ExclamationIcon, BookmarkIcon, ShareIcon } from './icons';

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    error: string | null;
    outfit: SavedOutfit | null;
    onSave: (outfit: SavedOutfit) => void;
    onShare: (outfit: SavedOutfit) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, isLoading, error, outfit, onSave, onShare }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-card rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h3 className="text-xl font-bold text-foreground">AI 推薦預覽</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl" aria-label="關閉">&times;</button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <LoadingSpinner />
                            <p className="mt-3 text-md font-medium">正在生成您的造型預覽...</p>
                            <p className="text-sm">這可能需要一些時間。</p>
                        </div>
                    )}

                    {error && (
                        <div className="my-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-start space-x-2">
                            <ExclamationIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">
                                <span className="font-semibold">預覽失敗：</span>
                                {error}
                            </p>
                        </div>
                    )}
                    
                    {outfit && (
                        <div className="space-y-4">
                            <img src={outfit.imageUrl} alt="Outfit preview" className="rounded-lg w-full aspect-[3/4] object-contain bg-muted" />
                            <div>
                               <p className="text-sm font-semibold mb-1 text-primary">AI 造型師筆記：</p>
                               <p className="text-sm whitespace-pre-wrap text-foreground/90">{outfit.text}</p>
                            </div>
                        </div>
                    )}
                </div>
                
                {outfit && !isLoading && !error && (
                    <div className="p-6 border-t border-border flex justify-end space-x-2">
                        <button onClick={() => onShare(outfit)} className="py-2 px-4 border border-border rounded-md shadow-sm text-sm font-medium text-foreground hover:bg-accent flex items-center space-x-2">
                           <ShareIcon className="w-4 h-4" /> <span>分享</span>
                        </button>
                        <button onClick={() => onSave(outfit)} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 flex items-center space-x-2">
                           <BookmarkIcon className="w-4 h-4" /> <span>儲存至造型手冊</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
