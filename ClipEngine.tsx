
import React from 'react';

interface ClipEngineProps {
  onBack: () => void;
}

const ClipEngine: React.FC<ClipEngineProps> = ({ onBack }) => {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-transparent animate-in fade-in duration-700 p-10">
      {/* Centered Ultra-8K Glass Container */}
      <div className="glass cinematic-border p-16 rounded-[48px] theme-border text-center space-y-12 max-w-4xl relative overflow-hidden shadow-[0_32px_128px_-32px_rgba(0,0,0,0.8)] theme-card">
        {/* Cinematic Backdrop Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-red-600/60 to-transparent"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-red-600 shadow-[0_0_30px_rgba(255,0,0,0.8)]"></div>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[120px]"></div>

        {/* Centered Header Section */}
        <div className="relative z-10 space-y-6">
          <div className="w-20 h-20 bg-red-600 rounded-[28px] mx-auto flex items-center justify-center shadow-2xl transition-transform duration-700 hover:scale-110">
             <span className="text-4xl text-white font-black">▤</span>
          </div>
          <div className="space-y-3 pb-4 border-b theme-border border-white/5">
            <h1 className="text-5xl font-black italic uppercase tracking-tighter theme-text leading-tight">ClipEngine</h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-10 bg-red-600/30"></div>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] theme-text opacity-50">Temporal Refinement & Upscaling Node</p>
              <div className="h-px w-10 bg-red-600/30"></div>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-10 theme-bg theme-border rounded-[32px] shadow-inner">
          <p className="text-[13px] theme-text leading-relaxed font-medium italic opacity-60">
            "This module is currently in neural development. Future updates will enable high-fidelity frame interpolation and temporal upscaling for production assets generated in StoryMorph."
          </p>
        </div>

        <div className="relative z-10 pt-4">
          <button 
            onClick={onBack}
            className="px-16 py-6 btn-ultra rounded-full text-[11px] hover:scale-105 transition-all shadow-xl"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClipEngine;
