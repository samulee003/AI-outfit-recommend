import React, { useState, useCallback } from 'react';
import { ClothingItem, ClothingType, StyleRecommendation } from '../types';
import { PlusIcon, SparklesIcon, ExclamationIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';

interface ClosetManagerProps {
    closet: ClothingItem[];
    recommendations: StyleRecommendation[];
    onAddItem: (item: Omit<ClothingItem, 'id'>) => void;
    onGetRecommendations: () => void;
    onSelectRecommendation: (recommendation: StyleRecommendation) => void;
    isRecommending: boolean;
    error: string | null;
    selectedTopId?: number | null;
    selectedBottomId?: number | null;
}

const AddItemForm: React.FC<{ onAddItem: (item: Omit<ClothingItem, 'id'>) => void; close: () => void; }> = ({ onAddItem, close }) => {
    const [description, setDescription] = useState('');
    const [type, setType] = useState<ClothingType>('TOP');
    const [image, setImage] = useState<{ base64Url: string, file: File } | null>(null);
    const [error, setError] = useState('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError('Image must be smaller than 2MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage({ base64Url: reader.result as string, file });
                setError('');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        if (!description || !image) {
            setError('Please provide an image and a description.');
            return;
        }
        onAddItem({ description, type, imageUrl: image.base64Url });
        close();
    };
    
    return (
      <div className="space-y-4 p-1">
        <div>
          <label className="block text-sm font-medium text-gray-700">Item Photo</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            {image ? (
                <img src={image.base64Url} alt="preview" className="max-h-24 object-contain" />
            ) : (
                <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 4v.01M28 8l-6-6-6 6M28 8v12a4 4 0 01-4 4H12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-brand-primary hover:text-brand-dark focus-within:outline-none">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                    </label>
                </div>
                </div>
            )}
            </div>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., blue striped shirt" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"/>
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
          <select id="type" value={type} onChange={e => setType(e.target.value as ClothingType)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm">
            <option value="TOP">Top</option>
            <option value="BOTTOM">Bottom</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end space-x-2">
            <button onClick={close} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-dark">Add Item</button>
        </div>
      </div>
    );
};

export const ClosetManager: React.FC<ClosetManagerProps> = ({ closet, recommendations, onAddItem, onGetRecommendations, onSelectRecommendation, isRecommending, error, selectedTopId, selectedBottomId }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    
    const isItemSelected = (item: ClothingItem) => {
        return item.id === selectedTopId || item.id === selectedBottomId;
    };
    
    return (
    <div className="bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300">
        <h2 className="text-xl font-bold text-gray-800 mb-1">2. Manage Your Closet</h2>
        <p className="text-sm text-gray-500 mb-4">Add your clothes and get AI style advice.</p>
        
        <div className="space-y-4">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-gray-600">My Closet ({closet.length})</h3>
                    <button onClick={() => setShowAddForm(!showAddForm)} className="text-sm font-medium text-brand-primary hover:text-brand-dark flex items-center space-x-1">
                        <PlusIcon className="h-4 w-4" />
                        <span>{showAddForm ? 'Close' : 'Add Item'}</span>
                    </button>
                </div>
                 {showAddForm && <div className="p-4 bg-gray-50 rounded-lg mb-2"><AddItemForm onAddItem={onAddItem} close={() => setShowAddForm(false)} /></div>}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-gray-100 p-2 rounded-lg min-h-[80px]">
                    {closet.map(item => (
                        <div key={item.id} className={`relative rounded-lg overflow-hidden border-2 ${isItemSelected(item) ? 'border-brand-secondary' : 'border-transparent'}`}>
                             <img src={item.imageUrl} alt={item.description} className="w-full h-full object-cover aspect-square" />
                        </div>
                    ))}
                    {closet.length === 0 && <p className="col-span-full text-center text-xs text-gray-500 py-4">Your closet is empty. Add items to get started!</p>}
                </div>
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
