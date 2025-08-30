import React, { useState, useCallback } from 'react';
import { VirtualModelUploader } from './VirtualModelUploader';
import { LoadingSpinner } from './LoadingSpinner';
import { OotdAnalysisResult, IdentifiedItem, ClothingItem, ClothingType } from '../types';
import { SparklesIcon, CheckIcon, PlusIcon, ExclamationIcon } from './icons';

interface OotdAnalyzerProps {
    onAnalyze: (base64: string, mimeType: string) => void;
    onAddItemsToCloset: (items: Omit<ClothingItem, 'id'>[]) => void;
    isLoading: boolean;
    error: string | null;
    result: OotdAnalysisResult | null;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
    >
        {children}
    </button>
);

export const OotdAnalyzer: React.FC<OotdAnalyzerProps> = ({ onAnalyze, onAddItemsToCloset, isLoading, error, result }) => {
    const [ootdImage, setOotdImage] = useState<{ base64: string; mimeType: string; dataUrl: string; } | null>(null);
    const [activeTab, setActiveTab] = useState<'critique' | 'upgrade' | 'add'>('critique');
    const [selectedItems, setSelectedItems] = useState<IdentifiedItem[]>([]);
    const [itemsAdded, setItemsAdded] = useState(false);

    const handleModelUpload = useCallback((base64: string, mimeType: string) => {
        const dataUrl = `data:${mimeType};base64,${base64}`;
        setOotdImage({ base64, mimeType, dataUrl });
        onAnalyze(base64, mimeType);
    }, [onAnalyze]);
    
    const handleToggleItem = (item: IdentifiedItem) => {
        setSelectedItems(prev =>
            prev.some(i => i.description === item.description)
                ? prev.filter(i => i.description !== item.description)
                : [...prev, item]
        );
    };

    const handleAddSelectedItems = () => {
        if (selectedItems.length > 0 && ootdImage) {
            const newItems = selectedItems.map(item => ({
                description: item.description,
                type: item.type,
                imageUrl: ootdImage.dataUrl, // Use OOTD image as placeholder
                tags: ['OOTD'],
            }));
            onAddItemsToCloset(newItems);
            setItemsAdded(true);
            setTimeout(() => setItemsAdded(false), 3000); // Reset after 3 seconds
        }
    };

    if (!ootdImage) {
        return <VirtualModelUploader title="分析您的今日穿搭 (OOTD)" onModelUpload={handleModelUpload} />;
    }

    return (
        <div className="bg-card p-6 rounded-2xl shadow-subtle">
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
                    <LoadingSpinner />
                    <p className="mt-3 text-md font-medium text-primary">正在分析您的造型...</p>
                    <p className="text-sm">AI 造型師正在仔細審視每個細節。</p>
                </div>
            )}
            {error && !isLoading && (
                <div className="my-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-start space-x-2">
                    <ExclamationIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold">分析失敗</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}
            {result && !isLoading && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-foreground mb-1">AI 分析報告</h2>
                        <p className="text-sm text-muted-foreground mb-4">您的專屬造型師已完成點評。</p>
                    </div>
                    <div className="flex items-center space-x-2 border-b border-border pb-2">
                        <TabButton active={activeTab === 'critique'} onClick={() => setActiveTab('critique')}>AI 點評</TabButton>
                        <TabButton active={activeTab === 'upgrade'} onClick={() => setActiveTab('upgrade')}>升級建議</TabButton>
                        <TabButton active={activeTab === 'add'} onClick={() => setActiveTab('add')}>新增至衣櫥</TabButton>
                    </div>
                    <div className="animate-fade-in">
                        {activeTab === 'critique' && (
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <h3 className="font-semibold text-primary mb-2">專業造型師點評：</h3>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{result.critique}</p>
                            </div>
                        )}
                        {activeTab === 'upgrade' && (
                           <div>
                                {result.upgradeSuggestions.length > 0 ? (
                                    result.upgradeSuggestions.map((s, index) => (
                                        <div key={index} className="space-y-4 p-4 bg-muted/50 rounded-lg">
                                            <div>
                                               <h3 className="font-semibold text-primary mb-2">升級建議 #{index + 1}</h3>
                                               <p className="text-sm italic">"{s.suggestion}"</p>
                                            </div>
                                           {s.upgradedImageBase64 && (
                                                <div className="flex flex-col md:flex-row gap-4">
                                                    <div className="flex-1">
                                                        <h4 className="text-xs text-center font-semibold text-muted-foreground mb-1">原始穿搭</h4>
                                                        <img src={ootdImage.dataUrl} alt="Original OOTD" className="rounded-lg w-full" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-xs text-center font-semibold text-muted-foreground mb-1">升級後效果</h4>
                                                        <img src={`data:image/png;base64,${s.upgradedImageBase64}`} alt="Upgraded OOTD" className="rounded-lg w-full" />
                                                    </div>
                                                </div>
                                           )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">AI 認為您目前的穿搭已經很完美，沒有需要升級的地方！</p>
                                )}
                           </div>
                        )}
                        {activeTab === 'add' && (
                           <div className="p-4 bg-muted/50 rounded-lg">
                                <h3 className="font-semibold text-primary mb-2">識別出的單品</h3>
                                <p className="text-xs text-muted-foreground mb-4">選擇您想加入數位衣櫥的單品。圖片將使用您的 OOTD 照片作為預覽。</p>
                                <div className="space-y-2">
                                    {result.identifiedItems.map((item, index) => (
                                        <button key={index} onClick={() => handleToggleItem(item)} className="w-full flex items-center justify-between text-left p-3 bg-card rounded-lg border hover:border-primary transition-colors">
                                            <div>
                                                <p className="font-semibold text-sm">{item.description}</p>
                                                <p className="text-xs text-muted-foreground">{item.type === 'TOP' ? '上半身' : '下半身'}</p>
                                            </div>
                                            <div className={`w-6 h-6 flex items-center justify-center rounded-full border-2 transition-all ${selectedItems.some(i => i.description === item.description) ? 'bg-primary border-primary' : 'bg-transparent border-border'}`}>
                                                {selectedItems.some(i => i.description === item.description) && <CheckIcon className="w-4 h-4 text-primary-foreground" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleAddSelectedItems}
                                    disabled={selectedItems.length === 0 || itemsAdded}
                                    className="mt-4 w-full flex items-center justify-center space-x-2 text-sm font-bold py-2 px-4 rounded-lg transition-colors duration-300 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
                                >
                                    {itemsAdded ? <CheckIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
                                    <span>{itemsAdded ? `${selectedItems.length} 件已新增！` : `將 ${selectedItems.length} 件新增至衣櫥`}</span>
                                </button>
                           </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
