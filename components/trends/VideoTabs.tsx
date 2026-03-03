// app/components/VideoTabs.tsx
'use client';

import { Youtube, Instagram, Facebook } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

const tabs = [
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'red' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'pink' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'blue' },
];

const getTabStyles = (tabId: string, activeTab: string, color: string) => {
  const isActive = activeTab === tabId;
  
  const colorStyles = {
    red: {
      active: 'bg-red-500 text-white shadow-lg shadow-red-500/30',
      hover: 'hover:bg-red-50 hover:text-red-600'
    },
    pink: {
      active: 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/30',
      hover: 'hover:bg-pink-50 hover:text-pink-600'
    },
    blue: {
      active: 'bg-blue-500 text-white shadow-lg shadow-blue-500/30',
      hover: 'hover:bg-blue-50 hover:text-blue-600'
    }
  };

  const baseStyles = 'flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 font-medium';
  
  if (isActive) {
    return cn(baseStyles, colorStyles[color as keyof typeof colorStyles].active);
  }
  
  return cn(
    baseStyles,
    'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200',
    colorStyles[color as keyof typeof colorStyles].hover
  );
};

export default function VideoTabs({ activeTab, onTabChange, children }: VideoTabsProps) {
  const handleTabClick = (tabId: string) => {
    if (tabId !== activeTab) {
      onTabChange(tabId);
    }
  };

  return (
    <div>
      <div className="flex justify-center space-x-4 mb-8">
        {tabs.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => handleTabClick(id)}
            className={getTabStyles(id, activeTab, color)}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="mt-6">
        {children}
      </div>
    </div>
  );
}