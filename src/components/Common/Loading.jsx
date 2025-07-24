import React from 'react';
import { Utensils, AlertCircle, Coffee } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import Footer from './Footer';

const Loading = () => {
  const isConfigured = isSupabaseConfigured();

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex flex-col modern-gradient">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-20 h-20 glass-morphism rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/30" style={{ boxShadow: '0 0 30px rgba(255, 59, 48, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)' }}>
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-4">Database Not Connected</h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Please connect to Supabase to use the food ordering system. Click the "Connect to Supabase" button in the top right corner.
            </p>
            <div className="glass-morphism rounded-xl p-6 border border-red-500/20">
              <p className="text-sm text-gray-300 leading-relaxed">
                <strong className="text-indigo-400">Note:</strong> You need to set up your Supabase project and configure the environment variables to proceed.
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col modern-gradient">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 modern-spinner rounded-full animate-spin mx-auto mb-6"></div>
          <div className="flex items-center justify-center space-x-3">
            <Coffee className="w-6 h-6 text-orange-500" />
            <span className="text-xl font-medium text-gray-200">Loading Menu...</span>
          </div>
          <p className="text-gray-400 text-sm mt-2">Preparing your dining experience</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Loading;
