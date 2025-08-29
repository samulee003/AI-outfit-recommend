import React, { useState, useCallback, useRef } from 'react';
import { ClothingItem, ClothingType, StyleRecommendation } from '../types';
import { PlusIcon, SparklesIcon, ExclamationIcon, UploadIcon, TrashIcon, MagicWandIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';
import { generateClothingItem } from '../services/geminiService';

interface ClosetManagerProps {
    title: string;
    closet: ClothingItem[];
    recommendations: StyleRecommendation[];
    onAddItems: (items: Omit<ClothingItem, 'id'>[]) => void;
    onGetRecommendations: () => void;
    onSelectRecommendation: (recommendation: StyleRecommendation) => void;
    isRecommending: boolean;
    error: string | null;
    selectedTopId?: number | null;
    selectedBottomId?: number | null;
}

interface StagedItem {
    id: number;
    file: File;
    imageUrl: string;
    description: string;
    type: ClothingType;
}

const ItemUploaderForm: React.FC<{ onAddItems: (items: Omit<ClothingItem, 'id'>[]) => void; close: () => void; }> = ({ onAddItems, close }) => {
    const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFiles = (files: FileList) => {
        const newItems: StagedItem[] = [];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        let processingError = '';

        Array.from(files).forEach((file, index) => {
            if (stagedItems.length + newItems.length >= 10) {
                 processingError = 'You can add up to 10 items at a time.';
                 return;
            }
            if (!allowedTypes.includes(file.type)) {
                processingError = 'Invalid file type. Please use JPG, PNG, WEBP, or GIF.';
                return;
            }
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                processingError = 'Images must be smaller than 2MB.';
                return;
            }
            newItems.push({
                id: Date.now() + index,
                file,
                imageUrl: URL.createObjectURL(file),
                description: '',
                type: 'TOP',
            });
        });

        if (processingError) {
            setError(processingError);
        } else {
            setStagedItems(prev => [...prev, ...newItems]);
            setError('');
        }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            processFiles(event.target.files);
        }
    };
    
    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, action: 'over' | 'leave' | 'drop') => {
        e.preventDefault();
        e.stopPropagation();
        if (action === 'over') setIsDragging(true);
        if (action === 'leave') setIsDragging(false);
        if (action === 'drop') {
            setIsDragging(false);
            processFiles(e.dataTransfer.files);
        }
    };

    const updateItem = (id: number, field: 'description' | 'type', value: string) => {
        setStagedItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeItem = (id: number) => {
        setStagedItems(prev => prev.filter(item => item.id !== id));
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async () => {
        const itemsToAdd = stagedItems.filter(item => item.description.trim() !== '');
        if (itemsToAdd.length === 0 && stagedItems.length > 0) {
             setError('Please add a description for at least one item.');
             return;
        }
        if (itemsToAdd.length !== stagedItems.length) {
            setError('All items must have a description.');
            return;
        }

        try {
            const itemsToSavePromises = itemsToAdd.map(async (item) => {
                const imageUrl = await fileToBase64(item.file);
                return {
                    type: item.type,
                    description: item.description,
                    imageUrl: imageUrl,
                };
            });

            const itemsToSave = await Promise.all(itemsToSavePromises);
            onAddItems(itemsToSave);
            close();
        } catch (e) {
            console.error("Error converting files to base64:", e);
            setError("There was an error processing your images. Please try again.");
        }
    };
    
    return (
      <div className="space-y-4 p-1">
        {stagedItems.length === 0 ? (
            <div 
                onDragOver={(e) => handleDragEvents(e, 'over')}
                onDragLeave={(e) => handleDragEvents(e, 'leave')}
                onDrop={(e) => handleDragEvents(e, 'drop')}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isDragging ? 'border-brand-primary bg-blue-50' : 'border-gray-300 hover:border-brand-secondary'}`}
            >
                <UploadIcon className="h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-center text-gray-600">
                    <span className="font-semibold text-brand-secondary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">Up to 10 images (Max 2MB each)</p>
                <input ref={fileInputRef} type="file" className="sr-only" multiple onChange={handleFileChange} accept="image/*" />
            </div>
        ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {stagedItems.map(item => (
                    <div key={item.id} className="flex items-start space-x-3 p-2 bg-white rounded-md border">
                        <img src={item.imageUrl} alt="preview" className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1 space-y-2">
                            <input type="text" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="e.g., blue striped shirt" className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary"/>
                            <select value={item.type} onChange={e => updateItem(item.id, 'type', e.target.value as ClothingType)} className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary">
                                <option value="TOP">Top</option>
                                <option value="BOTTOM">Bottom</option>
                            </select>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="p-1 text-gray-400 hover:text-red-600">
                           <TrashIcon className="h-5 w-5"/>
                        </button>
                    </div>
                ))}
            </div>
        )}
        
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end space-x-2 pt-2">
            <button onClick={close} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={stagedItems.length === 0} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-dark disabled:bg-gray-300 disabled:cursor-not-allowed">
                Add {stagedItems.length > 0 ? stagedItems.length : ''} Item(s)
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
    const [error, setError] = useState<string | null>(null);
    const [generatedItem, setGeneratedItem] = useState<{ imageUrl: string; description: string; type: ClothingType } | null>(null);
    
    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedItem(null);
        try {
            const finalDesc = `${style}風格, ${color}, ${description}`;
            const imageBase64 = await generateClothingItem(style, color, type, description);
            setGeneratedItem({
                imageUrl: `data:image/png;base64,${imageBase64}`,
                description: finalDesc,
                type: type,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate item.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToCloset = () => {
        if (generatedItem) {
            onAddItems([generatedItem]);
            setGeneratedItem(null); // Clear after adding
        }
    };
    
    const styles = ['日式', '韓式', '美式', '中式', '休閒風', '海洋風', '正裝', '運動風'];

    return (
        <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700">風格</label>
                    <select value={style} onChange={e => setStyle(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary">
                        {styles.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-xs font-medium text-gray-700">衣物類型</label>
                    <select value={type} onChange={e => setType(e.target.value as ClothingType)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary">
                        <option value="TOP">Top</option>
                        <option value="BOTTOM">Bottom</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700">色調</label>
                    <input type="text" value={color} onChange={e => setColor(e.target.value)} placeholder="e.g., 大地色系, 粉彩" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary" />
                </div>
                 <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700">簡短描述 (可選)</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., 寬鬆的亞麻襯衫" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary" />
                </div>
            </div>
            <button onClick={handleGenerate} disabled={isLoading} className="mt-4 w-full flex items-center justify-center space-x-2 text-sm font-bold py-2 px-4 rounded-lg transition-colors duration-300 bg-brand-primary text-white hover:bg-brand-dark disabled:bg-gray-300">
                {isLoading ? <LoadingSpinner /> : <MagicWandIcon className="h-5 w-5" />}
                <span>{isLoading ? '生成中...' : '生成衣物'}</span>
            </button>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {generatedItem && (
                 <div className="mt-4 p-2 border-t">
                    <p className="text-sm font-semibold mb-2">生成結果:</p>
                    <div className="flex items-start space-x-3 p-2 bg-white rounded-md border">
                        <img src={generatedItem.imageUrl} alt="Generated Item" className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1 space-y-2">
                             <input type="text" value={generatedItem.description} onChange={(e) => setGeneratedItem({...generatedItem, description: e.target.value})} className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary"/>
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


export const ClosetManager: React.FC<ClosetManagerProps> = ({ title, closet, recommendations, onAddItems, onGetRecommendations, onSelectRecommendation, isRecommending, error, selectedTopId, selectedBottomId }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [showGenerator, setShowGenerator] = useState(false);
    
    const isItemSelected = (item: ClothingItem) => {
        return item.id === selectedTopId || item.id === selectedBottomId;
    };
    
    return (
    <div className="bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300">
        <h2 className="text-xl font-bold text-gray-800 mb-1">{title}</h2>
        <p className="text-sm text-gray-500 mb-4">Add your clothes and get AI style advice.</p>
        
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-gray-600">My Closet ({closet.length})</h3>
                    <button onClick={() => {setShowAddForm(!showAddForm); setShowGenerator(false);}} className="text-sm font-medium text-brand-primary hover:text-brand-dark flex items-center space-x-1">
                        <PlusIcon className="h-4 w-4" />
                        <span>{showAddForm ? 'Close' : 'Add Item'}</span>
                    </button>
                </div>
                {showAddForm && <div className="p-4 bg-gray-50 rounded-lg mb-2"><ItemUploaderForm onAddItems={onAddItems} close={() => setShowAddForm(false)} /></div>}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-gray-100 p-2 rounded-lg min-h-[80px]">
                    {closet.map(item => (
                        <div key={item.id} className={`relative rounded-lg overflow-hidden border-2 ${isItemSelected(item) ? 'border-brand-secondary' : 'border-transparent'}`}>
                             <img src={item.imageUrl} alt={item.description} className="w-full h-full object-cover aspect-square" />
                        </div>
                    ))}
                    {closet.length === 0 && !showAddForm && <p className="col-span-full text-center text-xs text-gray-500 py-4">Your closet is empty. Add items to get started!</p>}
                </div>
            </div>
            
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-gray-600">AI Fashion Generator</h3>
                     <button onClick={() => {setShowGenerator(!showGenerator); setShowAddForm(false);}} className="text-sm font-medium text-brand-primary hover:text-brand-dark flex items-center space-x-1">
                        <MagicWandIcon className="h-4 w-4" />
                        <span>{showGenerator ? 'Close' : 'Generate Clothes'}</span>
                    </button>
                </div>
                {showGenerator && <AIFashionGenerator onAddItems={onAddItems} />}
            </div>

            <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">AI Style Advisor</h3>
                <button onClick={onGetRecommendations} disabled={isRecommending || closet.length < 2} className="w-full flex items-center justify-center space-x-2 text-sm font-bold py-2 px-4 rounded-lg transition-colors duration-300 bg-brand-secondary text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                    {isRecommending ? <LoadingSpinner /> : <SparklesIcon className="h-5 w-5" />}
                    <span>{isRecommending ? 'Thinking...' : 'Get Style Recommendations'}</span>
                </button>
                {error && <div className="mt-2 text-sm text-red-600 flex items-start space-x-1"><ExclamationIcon className="h-4 w-4 mt-0.5" /><p>{error}</p></div>}
                
                <div className="mt-3 space-y-2">
                    {recommendations.map((rec, index) => (
                        <div key={index} onClick={() => onSelectRecommendation(rec)} className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
                            <p className="font-bold text-sm text-gray-800">{rec.styleName}</p>
                            <p className="text-xs text-gray-600">{rec.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};