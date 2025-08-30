import React from 'react';

interface ImagePreviewModalProps {
    isOpen: boolean;
    imageUrl: string | null;
    onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ isOpen, imageUrl, onClose }) => {
    if (!isOpen || !imageUrl) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="relative max-w-4xl max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <img src={imageUrl} alt="Generated outfit preview" className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg" />
                <button 
                    onClick={onClose} 
                    className="absolute -top-2 -right-2 bg-card rounded-full p-1.5 text-foreground hover:bg-accent shadow-lg"
                    aria-label="關閉預覽"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
