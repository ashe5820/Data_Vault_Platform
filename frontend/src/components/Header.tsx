"use client";
import React from 'react';
import { Database } from 'lucide-react';

interface HeaderProps {
  currentUser: {
    name: string;
  };
}

const Header: React.FC<HeaderProps> = ({ currentUser }) => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Database className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Data Vault Platform</h1>
            <span className="ml-4 text-sm text-gray-500">Secure IP Rights Management</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Connected: {currentUser.name}</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;