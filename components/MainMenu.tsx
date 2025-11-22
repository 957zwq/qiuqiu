import React, { useState } from 'react';
import { Sparkles, Play, Loader2, RefreshCw } from 'lucide-react';
import { generateCoolNickname } from '../services/geminiService';

interface MainMenuProps {
  onStart: (name: string) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
  const [name, setName] = useState('');
  const [theme, setTheme] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateName = async () => {
    if (!theme.trim()) return;
    setIsGenerating(true);
    const newName = await generateCoolNickname(theme);
    setName(newName);
    setIsGenerating(false);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
            BLOB BATTLE
          </h1>
          <p className="text-slate-400">Consume or be Consumed</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nickname
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name..."
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                maxLength={15}
              />
              <button
                onClick={() => onStart(name || "Guest")}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-lg px-6 py-3 transition-colors flex items-center gap-2"
              >
                <Play size={20} fill="currentColor" />
                Play
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-700">
            <label className="block text-sm font-medium text-purple-300 mb-2 flex items-center gap-2">
              <Sparkles size={16} />
              AI Name Generator
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Theme (e.g., 'Space', 'Spicy', 'Ninja')..."
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
              />
              <button
                onClick={handleGenerateName}
                disabled={isGenerating || !theme}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-3 transition-colors"
              >
                {isGenerating ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <RefreshCw size={20} />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Powered by Google Gemini. Enter a theme to generate a unique handle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;