import React from 'react';
import { CubeTransparentIcon, CubeIcon } from './icons';

type AppMode = 'basic' | 'advanced';

interface ModeSwitcherProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const ModeButton: React.FC<{
  label: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, description, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 p-4 rounded-lg text-left transition-all duration-300 border-2 ${
      isActive
        ? 'bg-brand-light border-brand-secondary shadow-md'
        : 'bg-base-200 border-transparent hover:bg-base-300 hover:border-base-300'
    }`}
  >
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded-full ${isActive ? 'bg-brand-secondary text-white' : 'bg-gray-300 text-gray-600'}`}>
        {icon}
      </div>
      <div>
        <p className={`font-bold ${isActive ? 'text-brand-dark' : 'text-gray-800'}`}>{label}</p>
        <p className={`text-xs ${isActive ? 'text-brand-dark' : 'text-gray-600'}`}>{description}</p>
      </div>
    </div>
  </button>
);


export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ currentMode, onModeChange }) => {
  return (
    <div className="bg-base-100 p-2 rounded-xl shadow-lg border border-base-300 flex items-center space-x-2">
       <ModeButton 
         label="基礎版"
         description="AI 一鍵生成穿搭"
         icon={<CubeTransparentIcon className="w-5 h-5" />}
         isActive={currentMode === 'basic'}
         onClick={() => onModeChange('basic')}
       />
        <ModeButton 
         label="進階版"
         description="管理個人衣櫥"
         icon={<CubeIcon className="w-5 h-5" />}
         isActive={currentMode === 'advanced'}
         onClick={() => onModeChange('advanced')}
       />
    </div>
  );
};
