import React from 'react';
import { motion } from 'framer-motion';
import { FaEnvelope, FaCheckCircle } from 'react-icons/fa';

const EmailProgress = ({ total, current }) => {
  const progress = (current / total) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-gradient-to-br from-gray-900/90 to-black p-8 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-orange-500/20 rounded-xl">
            <FaEnvelope className="text-2xl text-orange-500" />
          </div>
          <h3 className="text-xl font-semibold text-white">Sending Notifications</h3>
        </div>
        
        <div className="space-y-6">
          <div className="relative">
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-orange-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-400">{`${current} of ${total} sent`}</span>
              <span className="text-sm font-medium text-orange-500">{`${Math.round(progress)}%`}</span>
            </div>
          </div>

          {current === total && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center pt-4"
            >
              <FaCheckCircle className="text-3xl text-green-500 mb-2" />
              <p className="text-green-400 mb-4">All emails sent successfully!</p>
              {/* <button
                className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg 
                          font-medium hover:from-orange-600 hover:to-pink-600 transition-all duration-200 
                          transform hover:scale-[1.02] active:scale-[0.98]"
                onClick={onClose}
              >
                Continue
              </button> */}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EmailProgress;
