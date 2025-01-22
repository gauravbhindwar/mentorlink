"use client";
import { useState, useEffect, useRef } from 'react';

const RemarksDialog = ({ 
  isOpen, 
  onClose, 
  initialValue, 
  originalValue, 
  onSave, 
  onReset 
}) => {
  // Add state to control textarea value
  const [value, setValue] = useState(initialValue);
  const [isModified, setIsModified] = useState(false);

  // Add ref for textarea
  const textareaRef = useRef(null);

  // Update value when initialValue changes
  useEffect(() => {
    setValue(initialValue);
    setIsModified(initialValue !== originalValue && initialValue !== '');
  }, [initialValue, originalValue]);

  // Focus textarea when dialog opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
      // Optional: Place cursor at the end of text
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isOpen]);

  // Add keyboard event handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleReset = () => {
    setValue(''); // Clear the text in dialog
    onReset(); // Call parent reset handler
    setIsModified(false);
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    onSave(newValue);
    setIsModified(newValue !== originalValue && newValue !== '');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-popup"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden border border-gray-700"
        role="document"
      >
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 id="dialog-title" className="text-lg font-semibold text-orange-500">Edit Remarks</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-lg"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            className={`w-full h-32 border rounded-lg px-4 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none custom-scrollbar
              ${isModified 
                ? 'bg-orange-500/10 border-orange-500/50 text-red-300' 
                : 'bg-gray-700/50 border-gray-600 text-white'
              }`}
            placeholder="Enter your remarks here..."
            aria-label="Remarks text"
          />
          
          <div className="flex justify-between items-center">
            {/* Always show Reset button if there are changes */}
            <button
              onClick={handleReset}
              className={`px-4 py-2 text-sm transition-all duration-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                value ? 'text-orange-500 hover:bg-orange-500/10' 
                : 'text-gray-500 cursor-not-allowed opacity-50'
              }`}
              disabled={!value}
              aria-label="Clear remarks"
            >
              Clear Remarks
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-lg text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemarksDialog;
