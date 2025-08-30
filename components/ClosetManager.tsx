import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ClothingItem, ClothingType, StyleRecommendation, SavedOutfit, StyleProfile } from '../types';
// FIX: Replaced missing WardrobeIcon with CubeIcon for UI consistency.
import { PlusIcon, SparklesIcon, ExclamationIcon, UploadIcon, TrashIcon, MagicWandIcon, PencilIcon, ThumbUpIcon, ThumbDownIcon, EyeIcon, CubeIcon, BookmarkIcon, CogIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';
import { generateClothingItem, describeClothingItem } from '../services/geminiService';

// Prop types for memoized components
interface MemoizedClothingItemProps {
    item: ClothingItem;
    isSelected: boolean;
    onSelectItem: (item: ClothingItem) => void;
    onEditClick: (item: ClothingItem) => void;
    onDeleteClick: (itemId: string) => void;
}

interface MemoizedRecommendationProps {
    rec: StyleRecommendation;
    feedback: 'liked' | 'disliked' | undefined;
    onSelect: (rec: StyleRecommendation) => void;
    onFeedback: (styleName: string, feedback: 'liked' | 'disliked') => void;
    onPreview: (rec: StyleRecommendation) => void;
}

interface MemoizedSavedOutfitProps {
    outfit: SavedOutfit;
    onDelete: (outfitId: string) => void;
    onPreview: (imageUrl: string) => void;
}


interface ClosetManagerProps {
    title: string;
    closet: ClothingItem[];
    savedOutfits: SavedOutfit[];
    recommendations: StyleRecommendation[];
    styleProfile: StyleProfile;
    onSaveStyleProfile: (profile: StyleProfile) => void;
    onAddItems: (items: Omit<ClothingItem, 'id'>[]) => void;
    onUpdateItem: (item: ClothingItem) => void;
    onDeleteItem: (itemId: string) => void;
    onDeleteSavedOutfit: (outfitId: string) => void;
    onGetRecommendations: () => void;
    onSelectRecommendation: (recommendation: StyleRecommendation) => void;
    onSelectItem: (item: ClothingItem) => void;
    onPreviewRecommendation: (recommendation: StyleRecommendation) => void;
    onPreviewImage: (imageUrl: string) => void;
    isRecommending: boolean;
    error: string | null;
    selectedTopId?: string | null;
    selectedBottomId?: string | null;
    recommendationFeedback: Record<string, 'liked' | 'disliked'>;
    onRecommendationFeedback: (styleName: string, feedback: 'liked' | 'disliked') => void;
}

interface StagedItem {
    id: number;
    file: File;
    imageUrl: string;
    description: string;
    type: ClothingType;
    tags: string[];
    isAnalyzing: boolean;
    analysisError: string | null;
}

type ActiveTab = 'closet' | 'advisor' | 'generator' | 'lookbook' | 'style';


const parseDataUrl = (dataUrl: string): { base64: string; mimeType: string } | null => {
    const match = dataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (match) {
        return { mimeType: match[1], base64: match[2] };
    }
    return null;
};

const EditItemModal: React.FC<{
    item: ClothingItem;
    onSave: (updatedItem: ClothingItem) => void;
    onClose: () => void;
}> = ({ item, onSave, onClose }) => {
    const [description, setDescription] = useState(item.description);
    const [type, setType] = useState(item.type);
    const [tags, setTags] = useState((item.tags || []).join(', '));

    const handleSave = () => {
        const updatedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
        onSave({ ...item, description, type, tags: updatedTags });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md space-y-4 animate-fade-in">
                <h3 className="text-lg font-bold">編輯衣物</h3>
                <img src={item.imageUrl} alt={item.description} className="w-24 h-24 object-cover rounded-md mx-auto" />
                 <div>
                    <label className="block text-sm font-medium text-foreground/80">描述</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground/80">類型</label>
                     <select value={type} onChange={e => setType(e.target.value as ClothingType)} className="mt-1 block w-full border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="TOP">上半身</option>
                        <option value="BOTTOM">下半身</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground/80">標籤 (以逗號分隔)</label>
                    <input type="text" value={tags} onChange={e => setTags(e.target.value)} className="mt-1 block w-full border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button onClick={onClose} className="py-2 px-4 border border-border rounded-md shadow-sm text-sm font-medium text-foreground hover:bg-accent">取消</button>
                    <button onClick={handleSave} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90">儲存變更</button>
                </div>
            </div>
        </div>
    );
};

const ItemUploaderForm: React.FC<{ onAddItems: (items: Omit<ClothingItem, 'id'>[]) => void; close: () => void; }> = ({ onAddItems, close }) => {
    const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fileToDataUrl = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const processFiles = useCallback(async (files: FileList) => {
        const filesToProcess: File[] = [];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        let processingError = '';

        Array.from(files).forEach((file) => {
            if (stagedItems.length + filesToProcess.length >= 10) {
                 processingError = '一次最多可新增 10 件衣物。';
                 return;
            }
            if (!allowedTypes.includes(file.type)) {
                processingError = '檔案類型無效。請使用 JPG、PNG、WEBP 或 GIF。';
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                processingError = '圖片必須小於 5MB。';
                return;
            }
            filesToProcess.push(file);
        });

        if (processingError) {
            setError(processingError);
            return;
        }
        
        const newItems: StagedItem[] = filesToProcess.map((file, index) => ({
            id: Date.now() + index,
            file,
            imageUrl: URL.createObjectURL(file),
            description: '',
            type: 'TOP',
            tags: [],
            isAnalyzing: true,
            analysisError: null,
        }));
        
        setStagedItems(prev => [...prev, ...newItems]);
        setError('');
        
        for (const item of newItems) {
            try {
                const dataUrl = await fileToDataUrl(item.file);
                const parsed = parseDataUrl(dataUrl);
                if (!parsed) throw new Error("無法解析圖片檔案。");

                const result = await describeClothingItem(parsed.base64, parsed.mimeType);

                setStagedItems(prev => prev.map(stagedItem =>
                    stagedItem.id === item.id
                        ? { ...stagedItem, description: result.description, type: result.type, tags: result.tags, isAnalyzing: false }
                        : stagedItem
                ));
            } catch (err) {
                console.error("Error analyzing item:", err);
                const errorMessage = err instanceof Error ? err.message : "分析失敗";
                setStagedItems(prev => prev.map(stagedItem =>
                    stagedItem.id === item.id
                        ? { ...stagedItem, isAnalyzing: false, analysisError: errorMessage }
                        : stagedItem
                ));
            }
        }
    }, [stagedItems.length]);
    
    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            processFiles(event.target.files);
        }
    }, [processFiles]);
    
    const handleDragEvents = useCallback((e: React.DragEvent<HTMLDivElement>, action: 'over' | 'leave' | 'drop') => {
        e.preventDefault();
        e.stopPropagation();
        if (action === 'over') setIsDragging(true);
        if (action === 'leave') setIsDragging(false);
        if (action === 'drop') {
            setIsDragging(false);
            processFiles(e.dataTransfer.files);
        }
    }, [processFiles]);

    const updateItem = (id: number, field: 'description' | 'type', value: string) => {
        setStagedItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeItem = (id: number) => {
        setStagedItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSubmit = async () => {
        if (stagedItems.some(item => item.isAnalyzing)) {
            setError("請等待 AI 分析完成。");
            return;
        }
        
        const itemsToAdd = stagedItems.filter(item => item.description.trim() !== '');
        if (itemsToAdd.length === 0 && stagedItems.length > 0) {
             setError('請至少為一件衣物新增描述。');
             return;
        }
        if (stagedItems.some(item => item.description.trim() === '')) {
            setError('所有衣物都必須有描述。');
            return;
        }

        try {
            const itemsToSavePromises = itemsToAdd.map(async (item) => {
                const imageUrl = await fileToDataUrl(item.file);
                return {
                    type: item.type,
                    description: item.description,
                    imageUrl: imageUrl,
                    tags: item.tags,
                };
            });

            const itemsToSave = await Promise.all(itemsToSavePromises);
            onAddItems(itemsToSave);
            close();
        } catch (e) {
            console.error("Error converting files to base64:", e);
            setError("處理您的圖片時發生錯誤，請再試一次。");
        }
    };
    
    const isAnalyzingAny = stagedItems.some(item => item.isAnalyzing);
    
    return (
      <div className="space-y-4 p-1">
        {stagedItems.length === 0 ? (
            <div 
                onDragOver={(e) => handleDragEvents(e, 'over')}
                onDragLeave={(e) => handleDragEvents(e, 'leave')}
                onDrop={(e) => handleDragEvents(e, 'drop')}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
            >
                <UploadIcon className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-center text-foreground">
                    <span className="font-semibold text-primary">點擊上傳</span> 或拖放檔案
                </p>
                <p className="text-xs text-muted-foreground">最多 10 張圖片 (每張最大 5MB)</p>
                <input ref={fileInputRef} type="file" className="sr-only" multiple onChange={handleFileChange} accept="image/*" />
            </div>
        ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {stagedItems.map(item => (
                    <div key={item.id} className="relative flex items-start space-x-3 p-2 bg-card rounded-md border animate-fade-in">
                        {item.isAnalyzing && (
                            <div className="absolute inset-0 bg-card/80 flex items-center justify-center rounded-md z-10">
                                <div className="flex flex-col items-center">
                                    <div className="w-5 h-5 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
                                    <span className="text-xs mt-1 text-primary font-medium">分析中...</span>
                                </div>
                            </div>
                        )}
                        <img src={item.imageUrl} alt="preview" className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1 space-y-2">
                            <input type="text" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="AI 正在分析..." className="block w-full border border-border rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted/50" disabled={item.isAnalyzing}/>
                            <select value={item.type} onChange={e => updateItem(item.id, 'type', e.target.value as ClothingType)} className="block w-full border border-border rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted/50" disabled={item.isAnalyzing}>
                                <option value="TOP">上半身</option>
                                <option value="BOTTOM">下半身</option>
                            </select>
                            {item.analysisError && <p className="text-xs text-destructive">分析失敗: {item.analysisError}</p>}
                        </div>
                        <button onClick={() => removeItem(item.id)} className="p-1 text-muted-foreground hover:text-destructive">
                           <TrashIcon className="h-5 w-5"/>
                        </button>
                    </div>
                ))}
            </div>
        )}
        
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end space-x-2 pt-2">
            <button onClick={close} className="py-2 px-4 border border-border rounded-md shadow-sm text-sm font-medium text-foreground hover:bg-accent">取消</button>
            <button onClick={handleSubmit} disabled={stagedItems.length === 0 || isAnalyzingAny} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed">
                新增 {stagedItems.length > 0 ? stagedItems.length : ''} 件衣物
            </button>
        </div>
      </div>
    );
};

const AIFashionGenerator: React.FC<{ onAddItems: (items: Omit<ClothingItem, 'id'>[]) => void; }> = ({ onAddItems }) => {
    const [style, setStyle] = useState('日式');
    const [color, setColor] = useState('大地色系');
    const [type, setType] = useState<ClothingType>('TOP');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedItem, setGeneratedItem] = useState<{ imageUrl: string; description: string; type: ClothingType; tags: string[] } | null>(null);
    
    const handleGenerate = async () => {
        setIsLoading(true);
        setIsAnalyzing(false);
        setError(null);
        setGeneratedItem(null);
        try {
            const imageBase64 = await generateClothingItem(style, color, type, description);
            
            setIsLoading(false);
            setIsAnalyzing(true);

            const analysisResult = await describeClothingItem(imageBase64, 'image/png');
            
            setGeneratedItem({
                imageUrl: `data:image/png;base64,${imageBase64}`,
                description: analysisResult.description,
                type: analysisResult.type,
                tags: analysisResult.tags,
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : "生成或分析衣物失敗。");
        } finally {
            setIsLoading(false);
            setIsAnalyzing(false);
        }
    };

    const handleAddToCloset = () => {
        if (generatedItem) {
            onAddItems([generatedItem]);
            setGeneratedItem(null); // Clear after adding
        }
    };
    
    const styles = ['日式', '韓式', '美式', '中式', '休閒風', '海洋風', '正裝', '運動風'];
    const isLoadingAny = isLoading || isAnalyzing;

    return (
        <div className="p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-muted-foreground">風格</label>
                    <select value={style} onChange={e => setStyle(e.target.value)} className="mt-1 block w-full border border-border rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        {styles.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-xs font-medium text-muted-foreground">衣物類型</label>
                    <select value={type} onChange={e => setType(e.target.value as ClothingType)} className="mt-1 block w-full border border-border rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="TOP">上半身</option>
                        <option value="BOTTOM">下半身</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground">色調</label>
                    <input type="text" value={color} onChange={e => setColor(e.target.value)} placeholder="例如：大地色系、粉彩色" className="mt-1 block w-full border border-border rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                 <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground">簡短描述 (可選)</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="例如：寬鬆的亞麻襯衫" className="mt-1 block w-full border border-border rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
            </div>
            <button onClick={handleGenerate} disabled={isLoadingAny} className="mt-4 w-full flex items-center justify-center space-x-2 text-sm font-bold py-2 px-4 rounded-lg transition-colors duration-300 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground">
                {isLoadingAny ? <LoadingSpinner /> : <MagicWandIcon className="h-5 w-5" />}
                <span>{isLoading ? '生成中...' : isAnalyzing ? '分析中...' : '生成衣物'}</span>
            </button>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            {generatedItem && (
                 <div className="mt-4 p-2 border-t animate-fade-in">
                    <p className="text-sm font-semibold mb-2">生成結果：</p>
                    <div className="flex items-start space-x-3 p-2 bg-card rounded-md border">
                        <img src={generatedItem.imageUrl} alt="Generated Item" className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1 space-y-2">
                             <input type="text" value={generatedItem.description} onChange={(e) => setGeneratedItem({...generatedItem, description: e.target.value})} className="block w-full border border-border rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                             <button onClick={handleAddToCloset} className="w-full py-1 px-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-green-600 hover:bg-green-700">
                                加入衣櫥
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Memoized Components for Performance Optimization
const MemoizedClothingItem: React.FC<MemoizedClothingItemProps> = React.memo(({ item, isSelected, onSelectItem, onEditClick, onDeleteClick }) => {
    const handleSelect = useCallback(() => {
        onSelectItem(item);
    }, [onSelectItem, item]);
    
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectItem(item);
        }
    }, [onSelectItem, item]);

    const handleEdit = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onEditClick(item);
    }, [onEditClick, item]);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("您確定要刪除此衣物嗎？")) {
            onDeleteClick(item.id);
        }
    }, [onDeleteClick, item.id]);

    return (
        <div
            tabIndex={0}
            role="button"
            aria-pressed={isSelected}
            onClick={handleSelect}
            onKeyDown={handleKeyDown}
            className={`group relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-200 ${isSelected ? 'border-transparent ring-2 ring-primary ring-offset-2 ring-offset-muted' : 'border-transparent'}`}
        >
            <img src={item.imageUrl} alt={item.description} className="w-full h-full object-cover aspect-square transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <button onClick={handleEdit} className="p-1.5 bg-card/80 rounded-full text-foreground hover:bg-card"><PencilIcon className="w-4 h-4" /></button>
                <button onClick={handleDelete} className="p-1.5 bg-card/80 rounded-full text-foreground hover:bg-card hover:text-destructive"><TrashIcon className="w-4 h-4" /></button>
            </div>
            {isSelected && (
                <div className="absolute inset-0 bg-primary/60 flex items-center justify-center pointer-events-none">
                    <svg className="w-8 h-8 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}
        </div>
    );
});

const MemoizedRecommendation: React.FC<MemoizedRecommendationProps> = React.memo(({ rec, feedback, onSelect, onFeedback, onPreview }) => {
    const handleSelect = useCallback(() => {
        onSelect(rec);
    }, [onSelect, rec]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(rec);
        }
    }, [onSelect, rec]);

    const handleLike = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onFeedback(rec.styleName, 'liked');
    }, [onFeedback, rec.styleName]);

    const handleDislike = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onFeedback(rec.styleName, 'disliked');
    }, [onFeedback, rec.styleName]);

    const handlePreview = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onPreview(rec);
    }, [onPreview, rec]);
    
    return (
         <div 
            onClick={handleSelect}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            className="p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors animate-fade-in cursor-pointer"
         >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-bold text-sm text-foreground">{rec.styleName}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{rec.description}</p>
              </div>
               <button
                  onClick={handlePreview}
                  aria-label="預覽此穿搭"
                  className="ml-2 p-1.5 rounded-full text-muted-foreground/60 hover:text-primary hover:bg-primary/10"
                >
                    <EyeIcon className="h-4 w-4" />
                </button>
            </div>
            <div className="flex items-center justify-end space-x-2 mt-1 -mb-1">
                <button
                    onClick={handleLike}
                    aria-label="喜歡此推薦"
                    className={`p-1 rounded-full transition-colors ${feedback === 'liked' ? 'text-white bg-green-500' : 'text-muted-foreground/50 hover:text-green-600 hover:bg-green-100'}`}
                >
                    <ThumbUpIcon className="h-4 w-4" />
                </button>
                <button
                    onClick={handleDislike}
                    aria-label="不喜歡此推薦"
                    className={`p-1 rounded-full transition-colors ${feedback === 'disliked' ? 'text-white bg-red-500' : 'text-muted-foreground/50 hover:text-red-600 hover:bg-red-100'}`}
                >
                    <ThumbDownIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
});

const MemoizedSavedOutfit: React.FC<MemoizedSavedOutfitProps> = React.memo(({ outfit, onDelete, onPreview }) => {
    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(outfit.id);
    }, [onDelete, outfit.id]);

    const handlePreview = useCallback(() => {
        onPreview(outfit.imageUrl);
    }, [onPreview, outfit.imageUrl]);


    return (
        <div className="relative group bg-card p-2 rounded-md shadow-sm animate-fade-in">
            <div className="flex items-start space-x-3">
                <button onClick={handlePreview} className="flex-shrink-0">
                  <img src={outfit.imageUrl} alt="Saved outfit" className="w-20 h-20 object-cover rounded" />
                </button>
                <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{new Date(outfit.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-foreground mt-1 line-clamp-3">{outfit.text}</p>
                </div>
            </div>
            <button
                onClick={handleDelete}
                className="absolute top-1 right-1 p-1 bg-black/30 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                aria-label="刪除此造型"
            >
                <TrashIcon className="h-4 w-4" />
            </button>
        </div>
    );
});


const TabButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex flex-col items-center justify-center space-y-1 text-xs font-semibold py-2 px-1 rounded-md transition-colors duration-200 ${isActive ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:bg-background/50'}`}
    >
        {children}
    </button>
);

const StyleProfileManager: React.FC<{
    initialProfile: StyleProfile;
    onSave: (profile: StyleProfile) => void;
}> = ({ initialProfile, onSave }) => {
    const [profile, setProfile] = useState(initialProfile);
    const [isSaved, setIsSaved] = useState(false);

    const styleKeywords = ['極簡', '街頭', '復古', '商務休閒', '運動', '正裝', '波希米亞', '學院風'];

    const handleKeywordToggle = (keyword: string) => {
        setProfile(prev => {
            const newKeywords = prev.keywords.includes(keyword)
                ? prev.keywords.filter(k => k !== keyword)
                : [...prev.keywords, keyword];
            return { ...prev, keywords: newKeywords };
        });
    };

    const handleSave = () => {
        onSave(profile);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div>
                <label className="text-sm font-semibold text-muted-foreground mb-2 block">風格關鍵字</label>
                <div className="flex flex-wrap gap-2">
                    {styleKeywords.map(kw => (
                        <button key={kw} onClick={() => handleKeywordToggle(kw)}
                            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${profile.keywords.includes(kw) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-accent'}`}
                        >
                            {kw}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label htmlFor="occasion" className="text-sm font-semibold text-muted-foreground mb-1 block">穿搭場合</label>
                <input id="occasion" type="text" value={profile.occasion} onChange={e => setProfile({...profile, occasion: e.target.value})}
                    placeholder="例如：日常通勤、週末出遊"
                    className="block w-full border border-border rounded-md shadow-sm py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
             <div>
                <label htmlFor="notes" className="text-sm font-semibold text-muted-foreground mb-1 block">個人筆記 (Do's & Don'ts)</label>
                <textarea id="notes" value={profile.notes} onChange={e => setProfile({...profile, notes: e.target.value})}
                    placeholder="例如：不喜歡亮色系、偏好寬鬆版型"
                    rows={3}
                    className="block w-full border border-border rounded-md shadow-sm py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button onClick={handleSave} className="w-full flex items-center justify-center text-sm font-bold py-2 px-4 rounded-lg transition-colors duration-300 bg-primary text-primary-foreground hover:bg-primary/90">
                {isSaved ? '已儲存！' : '儲存風格設定'}
            </button>
        </div>
    );
};


export const ClosetManager: React.FC<ClosetManagerProps> = ({ 
    title, closet, savedOutfits, recommendations, styleProfile,
    onSaveStyleProfile, onAddItems, onUpdateItem, onDeleteItem, onDeleteSavedOutfit, 
    onGetRecommendations, onSelectRecommendation, onSelectItem,
    onPreviewRecommendation, onPreviewImage,
    isRecommending, error, 
    selectedTopId, selectedBottomId, 
    recommendationFeedback, onRecommendationFeedback 
}) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<ActiveTab>('closet');


    const allTags = useMemo(() => {
        const tags = new Set<string>();
        closet.forEach(item => {
            (item.tags || []).forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [closet]);

    const filteredCloset = useMemo(() => {
        if (activeFilters.length === 0) return closet;
        return closet.filter(item => 
            activeFilters.every(filter => (item.tags || []).includes(filter))
        );
    }, [closet, activeFilters]);

    const toggleFilter = useCallback((tag: string) => {
        setActiveFilters(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    }, []);
    
    return (
    <div className="bg-card p-6 rounded-2xl shadow-subtle">
        {editingItem && <EditItemModal item={editingItem} onSave={onUpdateItem} onClose={() => setEditingItem(null)} />}
        <h2 className="text-xl font-bold text-foreground mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground mb-4">透過管理您的衣櫥與 AI 互動，打造完美造型。</p>
        
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-4">
            <TabButton isActive={activeTab === 'closet'} onClick={() => setActiveTab('closet')}>
                <CubeIcon className="w-4 h-4" />
                <span>我的衣櫥</span>
            </TabButton>
             <TabButton isActive={activeTab === 'advisor'} onClick={() => setActiveTab('advisor')}>
                <SparklesIcon className="w-4 h-4" />
                <span>AI 顧問</span>
            </TabButton>
             <TabButton isActive={activeTab === 'generator'} onClick={() => setActiveTab('generator')}>
                <MagicWandIcon className="w-4 h-4" />
                <span>AI 生成器</span>
            </TabButton>
             <TabButton isActive={activeTab === 'lookbook'} onClick={() => setActiveTab('lookbook')}>
                <BookmarkIcon className="w-4 h-4" />
                <span>造型手冊</span>
            </TabButton>
            <TabButton isActive={activeTab === 'style'} onClick={() => setActiveTab('style')}>
                <CogIcon className="w-4 h-4" />
                <span>我的風格</span>
            </TabButton>
        </div>

        <div className="animate-fade-in">
            {activeTab === 'closet' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-muted-foreground">我的衣櫥 ({closet.length})</h3>
                        <button onClick={() => setShowAddForm(!showAddForm)} className="text-sm font-medium text-primary hover:text-primary/80 flex items-center space-x-1">
                            <PlusIcon className="h-4 w-4" />
                            <span>{showAddForm ? '關閉' : '新增衣物'}</span>
                        </button>
                    </div>
                    {showAddForm && <div className="p-4 bg-muted/50 rounded-lg mb-2 animate-fade-in"><ItemUploaderForm onAddItems={onAddItems} close={() => setShowAddForm(false)} /></div>}
                    
                    {allTags.length > 0 && (
                        <div className="p-2 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                               <h4 className="text-xs font-semibold text-muted-foreground">智慧篩選器</h4>
                               {activeFilters.length > 0 && (
                                 <button onClick={() => setActiveFilters([])} className="text-xs text-primary hover:underline">清除</button>
                               )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => toggleFilter(tag)}
                                        className={`px-2 py-0.5 text-xs font-medium rounded-full border transition-colors ${activeFilters.includes(tag) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-accent'}`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-muted p-2 rounded-lg min-h-[80px]">
                        {filteredCloset.map(item => (
                           <MemoizedClothingItem
                                key={item.id}
                                item={item}
                                isSelected={item.id === selectedTopId || item.id === selectedBottomId}
                                onSelectItem={onSelectItem}
                                onEditClick={setEditingItem}
                                onDeleteClick={onDeleteItem}
                           />
                        ))}
                        {closet.length > 0 && filteredCloset.length === 0 && <p className="col-span-full text-center text-xs text-muted-foreground py-4">找不到符合篩選條件的衣物。</p>}
                        {closet.length === 0 && !showAddForm && (
                            <div className="col-span-full text-center py-4 px-2">
                                <p className="text-xs text-muted-foreground mb-2">您的衣櫥是空的！</p>
                                <button onClick={() => setShowAddForm(true)} className="text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 py-1.5 px-3 rounded-lg">
                                    新增您的第一件衣物
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'advisor' && (
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">AI 風格顧問</h3>
                    <button onClick={onGetRecommendations} disabled={isRecommending || closet.length < 2} className="w-full flex items-center justify-center space-x-2 text-sm font-bold py-2 px-4 rounded-lg transition-colors duration-300 bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed">
                        {isRecommending ? <LoadingSpinner /> : <SparklesIcon className="h-5 w-5" />}
                        <span>{isRecommending ? '思考中...' : '獲取風格推薦'}</span>
                    </button>
                    {error && <div className="mt-2 text-sm text-destructive flex items-start space-x-1"><ExclamationIcon className="h-4 w-4 mt-0.5" /><p>{error}</p></div>}
                    
                    <div className="mt-3 space-y-2">
                        {recommendations.map((rec) => (
                            <MemoizedRecommendation
                                key={rec.styleName}
                                rec={rec}
                                feedback={recommendationFeedback[rec.styleName]}
                                onSelect={onSelectRecommendation}
                                onFeedback={onRecommendationFeedback}
                                onPreview={onPreviewRecommendation}
                            />
                        ))}
                        {closet.length > 0 && recommendations.length === 0 && !isRecommending && !error && (
                             <div className="text-center py-4 px-2 bg-muted/50 rounded-lg mt-3">
                                <p className="text-xs text-muted-foreground">點擊上方按鈕，讓 AI 為您的衣櫥提供靈感！</p>
                            </div>
                        )}
                         {closet.length < 2 && (
                             <div className="text-center py-4 px-2 bg-muted/50 rounded-lg mt-3">
                                <p className="text-xs text-muted-foreground">請先在您的衣櫥中加入至少兩件衣物。</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'generator' && (
                <div>
                     <h3 className="text-sm font-semibold text-muted-foreground mb-2">AI 時尚生成器</h3>
                     <AIFashionGenerator onAddItems={onAddItems} />
                </div>
            )}

            {activeTab === 'lookbook' && (
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">我的造型手冊 ({savedOutfits.length})</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto bg-muted p-2 rounded-lg">
                        {savedOutfits.length > 0 ? savedOutfits.map(outfit => (
                           <MemoizedSavedOutfit
                               key={outfit.id}
                               outfit={outfit}
                               onDelete={onDeleteSavedOutfit}
                               onPreview={onPreviewImage}
                           />
                        )) : (
                             <div className="text-center py-8 px-2">
                                <p className="text-xs text-muted-foreground">將您喜歡的 AI 穿搭儲存於此！</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'style' && (
                 <div>
                     <h3 className="text-sm font-semibold text-muted-foreground mb-2">我的風格設定</h3>
                     <StyleProfileManager initialProfile={styleProfile} onSave={onSaveStyleProfile} />
                </div>
            )}
        </div>
    </div>
  );
};