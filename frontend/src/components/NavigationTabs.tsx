"use client";
import React from 'react';

interface NavigationTabsProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

const NavigationTabs: React.FC<NavigationTabsProps> = ({ currentTab, setCurrentTab }) => {
  const tabs = ['upload', 'assets', 'licenses', 'audit'];
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                currentTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default NavigationTabs;