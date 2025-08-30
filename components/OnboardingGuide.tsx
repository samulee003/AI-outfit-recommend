
import React from 'react';
import { InfoIcon, CubeTransparentIcon, CubeIcon } from './icons';

interface OnboardingGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div 
                className="bg-card rounded-2xl shadow-xl w-full max-w-lg space-y-4 p-6 relative"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-2xl"
                    aria-label="關閉導覽"
                >
                    &times;
                </button>
                
                <div className="text-center">
                    <InfoIcon className="h-12 w-12 text-primary mx-auto mb-2" />
                    <h2 className="text-2xl font-bold text-foreground">歡迎來到 穿搭魔法師！</h2>
                    <p className="text-muted-foreground mt-1">您的 AI 私人造型師。</p>
                </div>
                
                <div className="space-y-4 pt-4">
                     <p className="text-sm text-foreground text-center">
                        首先，請上傳一張您的全身照以建立虛擬模型。<br/>然後，您可以選擇以下兩種模式開始體驗：
                     </p>
                     <div className="flex items-start p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <CubeTransparentIcon className="w-8 h-8 text-primary flex-shrink-0 mt-1 mr-3" />
                        <div>
                            <h3 className="font-semibold text-primary">基礎版</h3>
                            <p className="text-sm text-primary/90">想快速獲得靈感？讓 AI 一鍵為您生成一套驚喜穿搭！</p>
                        </div>
                     </div>
                      <div className="flex items-start p-4 bg-muted rounded-lg border border-border">
                        <CubeIcon className="w-8 h-8 text-muted-foreground flex-shrink-0 mt-1 mr-3" />
                        <div>
                            <h3 className="font-semibold text-foreground">進階版</h3>
                            <p className="text-sm text-muted-foreground">建立您的數位衣櫥，管理個人單品，並獲得量身訂製的風格建議。</p>
                        </div>
                     </div>
                </div>

                <div className="flex justify-center pt-4">
                    <button 
                        onClick={onClose} 
                        className="py-2.5 px-8 bg-primary text-primary-foreground font-bold rounded-lg shadow-md hover:bg-primary/90 transition-all"
                    >
                        開始體驗
                    </button>
                </div>
            </div>
        </div>
    );
};