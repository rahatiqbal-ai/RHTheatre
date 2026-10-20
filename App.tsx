import React, { useState, useEffect } from 'react';
import Home from './Home';
import StoryMorph from './StoryMorph';
import Cinetrack from './Cinetrack';
import ToonCluster from './ToonCluster';
import AudioBeast from './AudioBeast';
import MotionFlow from './MotionFlow';

declare global {
  // Define AIStudio interface to match the environment's requirements
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // FIX: Changed to optional to resolve "identical modifiers" error when merging with existing global declarations
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'storymorph' | 'cinetrack' | 'tooncluster' | 'audiobeast' | 'motionflow'>('home');
  const [hasKey, setHasKey] = useState<boolean>(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success as per guidelines to avoid race condition
      setHasKey(true);
    }
  };

  return (
    <>
      {currentView === 'home' && (
        <Home 
          onStartStoryMorph={() => setCurrentView('storymorph')} 
          onStartCinetrack={() => setCurrentView('cinetrack')} 
          onStartToonCluster={() => setCurrentView('tooncluster')}
          onStartAudioBeast={() => setCurrentView('audiobeast')}
          onStartMotionFlow={() => setCurrentView('motionflow')}
        />
      )}
      
      {currentView === 'storymorph' && (
        <StoryMorph onBack={() => setCurrentView('home')} />
      )}

      {currentView === 'cinetrack' && (
        <Cinetrack onBack={() => setCurrentView('home')} />
      )}

      {currentView === 'motionflow' && (
        <MotionFlow onBack={() => setCurrentView('home')} />
      )}

      {currentView === 'tooncluster' && (
        <ToonCluster onBack={() => setCurrentView('home')} />
      )}

      {currentView === 'audiobeast' && (
        <AudioBeast onBack={() => setCurrentView('home')} />
      )}

      {/* Floating Pro Authorization Trigger */}
      {!hasKey && (
        <button 
          onClick={handleOpenKey}
          className="fixed bottom-8 right-8 z-[100] group flex items-center gap-3 bg-black border border-red-600/50 hover:border-red-600 px-6 py-4 rounded-full transition-all duration-500 shadow-[0_0_30px_rgba(255,0,0,0.2)] hover:shadow-[0_0_50px_rgba(255,0,0,0.4)]"
        >
          <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_#ff0000]"></div>
          <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Authorize Pro Studio</span>
          <svg className="w-4 h-4 text-red-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </>
  );
};

export default App;