import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white/80 dark:bg-black/80 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 mt-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            © 2025 ChummaOrder. All rights reserved.
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>for VITians</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;