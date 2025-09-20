import React, { useState, useEffect, useCallback } from 'react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini-api-key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('gemini-api-key', apiKey);
    setIsKeySaved(true);
    setTimeout(() => {
        setIsKeySaved(false);
        onClose(); // Close modal and trigger re-check in App
    }, 1500); 
  };
  
  const handleClear = () => {
    localStorage.removeItem('gemini-api-key');
    setApiKey('');
    onClose(); // Close modal and trigger re-check in App
  };

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Settings</h2>
        
        <div className="space-y-4">
            <div>
                <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Google Gemini API Key
                </label>
                <input
                    type="password"
                    id="api-key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key here"
                    className="mt-1 block w-full p-3 text-md text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
                />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Your API key is stored securely in your browser's local storage. Get your key from{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:underline">
                    Google AI Studio
                </a>.
            </p>
        </div>

        <div className="mt-6 flex justify-between items-center">
            <button onClick={handleClear} className="text-sm text-red-600 dark:text-red-400 hover:underline px-3 py-2 rounded-md -ml-3">
                Clear Key
            </button>
            <div className="flex items-center gap-4">
                 {isKeySaved && <span className="text-sm text-green-600 animate-fade-in">Saved!</span>}
                <button
                    onClick={handleSave}
                    disabled={!apiKey.trim()}
                    className="px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    Save & Close
                </button>
            </div>
        </div>

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
