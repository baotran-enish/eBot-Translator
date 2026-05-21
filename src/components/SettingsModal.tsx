import { useState, useEffect } from 'react';
import { Settings, X, ExternalLink, Key } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setApiKey(localStorage.getItem('gemini_api_key') || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
            <Key size={20} />
            API Settings
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            If you have reached the rate limit, you can use your own Gemini API key. 
            Your key is stored safely in your browser only.
          </p>
          
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex flex-col gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <span className="flex items-center gap-2">Get your API key here <ExternalLink size={14} /></span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              Create API key &rarr; Create key &rarr; Copy key &rarr; Paste the key in below.
            </span>
          </a>
          
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Gemini API Key"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100 text-sm"
          />
          
          <button
            onClick={handleSave}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm transition-colors"
          >
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
}
