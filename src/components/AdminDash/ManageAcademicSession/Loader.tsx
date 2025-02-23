import React from 'react';
import { motion } from 'framer-motion';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  percentage?: number;
  message?: string;
  showOverlay?: boolean;
}

const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  color = 'white',
  percentage,
  message = 'Processing...',
  showOverlay = true
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const loaderContent = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <motion.div
          className={`${sizeClasses[size]} rounded-full border-[3px] border-t-transparent`}
          style={{ borderColor: `${color}33`, borderTopColor: 'transparent' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        {percentage !== undefined && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium" style={{ color }}>
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
      {message && (
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color }}>
            {message}
          </p>
        </div>
      )}
    </div>
  );

  if (!showOverlay) {
    return loaderContent;
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-gray-900/95 backdrop-blur-sm flex items-center justify-center" 
      style={{ 
        touchAction: 'none',
        userSelect: 'none',
        pointerEvents: 'all'
      }}
      onTouchStart={(e) => e.preventDefault()}
      onTouchMove={(e) => e.preventDefault()}
      onTouchEnd={(e) => e.preventDefault()}
      onKeyDown={(e) => e.preventDefault()}
      tabIndex={-1}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700"
      >
        {loaderContent}
      </motion.div>
    </div>
  );
};

export default Loader;
