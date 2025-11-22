import React, { useState, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import MainMenu from './components/MainMenu';
import { GamePhase } from './types';
import { getTacticalAdvice } from './services/geminiService';
import { BrainCircuit, Trophy, XCircle } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState(GamePhase.MENU);
  const [playerName, setPlayerName] = useState('');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [advice, setAdvice] = useState<string | null>(null);
  const [isGettingAdvice, setIsGettingAdvice] = useState(false);
  const [threats, setThreats] = useState(0);

  const handleStartGame = (name: string) => {
    setPlayerName(name);
    setScore(0);
    setAdvice(null);
    setGameState(GamePhase.PLAYING);
  };

  const handleGameOver = (finalScore: number) => {
    if (finalScore > highScore) setHighScore(finalScore);
    setGameState(GamePhase.GAME_OVER);
  };

  const handleScoreUpdate = (currentScore: number, mass: number, visibleThreats: number) => {
    setScore(currentScore);
    setThreats(visibleThreats);
  };

  const requestAdvice = useCallback(async () => {
    if (isGettingAdvice) return;
    setIsGettingAdvice(true);
    const tip = await getTacticalAdvice(score, threats);
    setAdvice(tip);
    setIsGettingAdvice(false);
    
    // Clear advice after 8 seconds
    setTimeout(() => setAdvice(null), 8000);
  }, [score, threats, isGettingAdvice]);

  return (
    <div className="relative w-screen h-screen bg-slate-900 overflow-hidden">
      
      {/* Main Game Canvas */}
      <GameCanvas 
        playerName={playerName} 
        onScoreUpdate={handleScoreUpdate}
        onGameOver={handleGameOver}
        gameStatePhase={gameState}
      />

      {/* HUD - Only visible when playing */}
      {gameState === GamePhase.PLAYING && (
        <>
          {/* Top Right: Leaderboard / Score */}
          <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur text-white p-4 rounded-lg border border-slate-700 shadow-lg w-48 select-none pointer-events-none">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Current Mass</span>
              <span className="font-mono text-xl text-cyan-400">{score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">High Score</span>
              <span className="font-mono text-slate-300">{highScore}</span>
            </div>
          </div>

          {/* Bottom Left: AI Assistant */}
          <div className="absolute bottom-6 left-6 z-20 max-w-sm">
             {advice && (
                <div className="mb-3 p-3 bg-purple-900/90 border border-purple-500 text-purple-100 rounded-lg shadow-lg animate-in slide-in-from-bottom-5 fade-in duration-300 text-sm font-medium">
                  <span className="font-bold mr-2">AI Coach:</span>
                  {advice}
                </div>
             )}
             
             <button 
               onClick={requestAdvice}
               disabled={isGettingAdvice}
               className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-full shadow-lg transition-all active:scale-95 disabled:opacity-50"
             >
               <BrainCircuit size={18} className={isGettingAdvice ? "animate-pulse text-purple-400" : "text-purple-400"} />
               <span className="text-sm font-bold">Get Tactical Advice</span>
             </button>
          </div>
        </>
      )}

      {/* Main Menu Overlay */}
      {gameState === GamePhase.MENU && (
        <MainMenu onStart={handleStartGame} />
      )}

      {/* Game Over Overlay */}
      {gameState === GamePhase.GAME_OVER && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-900/20 backdrop-blur-sm">
          <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-red-500/30 text-center animate-in zoom-in duration-300">
            <XCircle size={64} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-4xl font-black text-white mb-2">Wasted</h2>
            <p className="text-slate-400 mb-6">You were consumed by a larger cell.</p>
            
            <div className="bg-slate-900 p-4 rounded-lg mb-8 flex justify-center gap-8">
              <div className="text-center">
                <div className="text-xs text-slate-500 uppercase font-bold">Final Mass</div>
                <div className="text-2xl font-mono text-white">{score}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500 uppercase font-bold">Best Mass</div>
                <div className="text-2xl font-mono text-yellow-400">{highScore}</div>
              </div>
            </div>

            <button
              onClick={() => setGameState(GamePhase.MENU)}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-lg transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;