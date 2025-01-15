
import React from 'react';
import { Dialog } from '@headlessui/react';
import { motion } from 'framer-motion';

const PDFPreview = ({ isOpen, onClose, pdfUrl }) => {
  return (
    <Dialog
      as="div"
      className="fixed inset-0 z-50 overflow-y-auto"
      open={isOpen}
      onClose={onClose}
    >
      <div className="min-h-screen px-4 text-center">
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />
        <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="inline-block w-full max-w-4xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
        >
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              PDF Preview
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          
          <div className="h-[70vh] w-full">
            {pdfUrl && (
              <iframe
                src={pdfUrl}
                className="w-full h-full rounded-lg border border-gray-200"
                title="PDF Preview"
              />
            )}
          </div>
        </motion.div>
      </div>
    </Dialog>
  );
};

export default PDFPreview;