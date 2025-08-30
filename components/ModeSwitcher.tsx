import React from 'react';
import { CubeTransparentIcon, CubeIcon, CameraFlashIcon } from './icons';

type AppMode = 'basic' | 'advanced' | 'ootd';

interface ModeSwitcherProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const ModeOption: React.FC<{
  label: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, description, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className="relative z-10 w-full text-left p-2 rounded-lg transition-colors duration-300"
    role="tab"
    aria-selected={isActive}
  >
    <div className="flex items-center space-x-3 xl:space-x-4 p-1 xl:p-2">
      <div className={`p-2 rounded-full transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
        {icon}
      </div>
      <div>
        <p className={`font-bold text-sm transition-colors ${isActive ? 'text-primary' : 'text-foreground'}`}>{label}</p>
        <p className={`text-xs transition-colors ${isActive ? 'text-primary/90' : 'text-muted-foreground'}`}>{description}</p>
      </div>
    </div>
  </button>
);


export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ currentMode, onModeChange }) => {
  const modeIndex = { basic: 0, advanced: 1, ootd: 2 }[currentMode];
  return (
    <div className="relative bg-muted p-1 rounded-xl flex items-center" role="tablist">
      <span
        className={`absolute top-1 bottom-1 w-[calc(33.3333%-2px)] bg-card rounded-lg shadow-sm transition-transform duration-300 ease-in-out transform`}
        style={{ transform: `translateX(${modeIndex * 100}%)` }}
        aria-hidden="true"
      />
      <div className="w-1/3">
        <ModeOption
            label="基礎版"
            description="AI 一鍵生成穿搭"
            icon={<CubeTransparentIcon className="w-5 h-5" />}
            isActive={currentMode === 'basic'}
            onClick={() => onModeChange('basic')}
        />
      </div>
      <div className="w-1/3">
        <ModeOption
            label="進階版"
            description="管理個人衣櫥"
            icon={<CubeIcon className="w-5 h-5" />}
            isActive={currentMode === 'advanced'}
            onClick={() => onModeChange('advanced')}
        />
      </div>
       <div className="w-1/3">
        <ModeOption
            label="OOTD 分析"
            description="智慧點評每日穿搭"
            icon={<CameraFlashIcon className="w-5 h-5" />}
            isActive={currentMode === 'ootd'}
            onClick={() => onModeChange('ootd')}
        />
      </div>
    </div>
  );
};