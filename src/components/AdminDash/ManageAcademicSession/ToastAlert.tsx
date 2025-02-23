import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect } from 'react';
import { IoWarningOutline, IoCheckmarkCircleOutline, IoInformationCircleOutline, IoCloseCircleOutline } from 'react-icons/io5';

interface ToastAlertProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const alertStyles = {
  success: {
    icon: IoCheckmarkCircleOutline,
    bg: 'from-green-500/30 to-emerald-500/30',
    border: 'border-green-500/30',
    text: 'text-green-400'
  },
  error: {
    icon: IoCloseCircleOutline,
    bg: 'from-red-500/30 to-pink-500/30',
    border: 'border-red-500/30',
    text: 'text-red-400'
  },
  warning: {
    icon: IoWarningOutline,
    bg: 'from-yellow-500/30 to-orange-500/30',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400'
  },
  info: {
    icon: IoInformationCircleOutline,
    bg: 'from-blue-500/30 to-indigo-500/30',
    border: 'border-blue-500/30',
    text: 'text-blue-400'
  }
};

const ToastAlert: React.FC<ToastAlertProps> = ({
  message,
  type = 'info',
  isVisible,
  onClose,
  duration = 3000
}) => {
  const AlertIcon = alertStyles[type].icon;

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-4 right-4 z-50">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`bg-gradient-to-r ${alertStyles[type].bg} backdrop-blur-md border ${alertStyles[type].border} rounded-lg shadow-lg bg-opacity-90`}
          >
            <div className="flex items-center gap-3 p-4 backdrop-blur-sm">
              <AlertIcon className={`w-5 h-5 ${alertStyles[type].text}`} />
              <p className={`text-sm font-medium ${alertStyles[type].text}`}>
                {message}
              </p>
              <button
                onClick={onClose}
                className={`ml-2 ${alertStyles[type].text} hover:opacity-70 transition-opacity`}
              >
                <IoCloseCircleOutline className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ToastAlert;
