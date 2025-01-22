const ConfirmDialog = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-popup">
      <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden border border-gray-700">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-semibold text-orange-500">Discard All Changes</h3>
          </div>
          
          <p className="text-gray-300">
            Are you sure you want to discard all changes? This action cannot be undone and all unsaved changes will be lost.
          </p>
          
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all duration-300"
            >
              Discard Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
