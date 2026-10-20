
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { VisualCue, ScriptPart } from '../types';

interface Props {
  visualCue: VisualCue;
  setVisualCue: (cue: VisualCue) => void;
  fullStory: string;
  setFullStory: (story: string) => void;
  scriptParts: ScriptPart[];
  setScriptParts: (parts: ScriptPart[]) => void;
  disabled: boolean;
  onProceed?: () => void;
  showLoadButton?: boolean;
}

const StepBVisualCue: React.FC<Props> = ({ 
  visualCue, 
  setVisualCue, 
  fullStory, 
  setFullStory, 
  scriptParts, 
  setScriptParts, 
  disabled, 
  onProceed,
  showLoadButton = false
}) => {
  const [confirmSelectAll, setConfirmSelectAll] = useState(false);
  const cueInputRef = useRef<HTMLTextAreaElement>(null);

  const paragraphs = useMemo(() => {
    return fullStory
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }, [fullStory]);

  useEffect(() => {
    const validParts = scriptParts.filter(part => 
      paragraphs.includes(part.text)
    );
    if (validParts.length !== scriptParts.length) {
      const reindexed = validParts.map((p, i) => ({ ...p, number: i + 1 }));
      setScriptParts(reindexed);
    }
  }, [paragraphs, scriptParts, setScriptParts]);

  const handleLock = () => {
    if (visualCue.text.trim() && fullStory.trim() && scriptParts.length > 0) {
      setVisualCue({ ...visualCue, isLocked: true });
    }
  };

  const handleLoadFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setFullStory(text);
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  const handleSelectAll = () => {
    if (!confirmSelectAll) {
      setConfirmSelectAll(true);
      return;
    }

    const allParts: ScriptPart[] = paragraphs.map((p, i) => ({
      number: i + 1,
      text: p
    }));
    setScriptParts(allParts);
    setConfirmSelectAll(false);

    // Scroll to and focus the cue input
    setTimeout(() => {
      cueInputRef.current?.focus();
      cueInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const toggleParagraphSelection = (text: string) => {
    if (visualCue.isLocked) return;
    const normalizedText = text.trim();
    const existingPart = scriptParts.find(p => p.text === normalizedText);
    if (existingPart) {
      const updated = scriptParts
        .filter(p => p.text !== normalizedText)
        .map((p, i) => ({ ...p, number: i + 1 }));
      setScriptParts(updated);
    } else {
      const nextNumber = scriptParts.length + 1;
      setScriptParts([...scriptParts, { number: nextNumber, text: normalizedText }]);
    }
  };

  const getPartNumber = (text: string) => {
    const part = scriptParts.find(p => p.text === text.trim());
    return part?.number;
  };

  return (
    <div className="space-y-12 pb-20 theme-text animate-in fade-in duration-1000">
      <div className="glass cinematic-border rounded-[48px] p-12 space-y-12 relative overflow-hidden shadow-[0_32px_128px_-32px_rgba(0,0,0,0.8)] theme-card">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-red-600/60 to-transparent"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-red-600 shadow-[0_0_30px_rgba(255,0,0,0.8)]"></div>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[120px]"></div>

        <div className="text-center space-y-3 relative z-10 pb-4 border-b theme-border border-white/5">
          <h2 className="text-5xl font-black italic tracking-tighter uppercase theme-text leading-tight">Creative Control</h2>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-red-600/30"></div>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] theme-text opacity-50">High-Fidelity Production Logic</p>
            <div className="h-px w-12 bg-red-600/30"></div>
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 theme-text opacity-60">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_10px_#ff0000]"></div>
              Production Narrative Architecture
            </label>
            {showLoadButton && !visualCue.isLocked && (
              <button 
                onClick={handleLoadFromClipboard}
                className="px-4 py-1.5 bg-red-600/10 border border-red-600/30 rounded-lg text-[9px] font-black text-red-600 uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
              >
                Load From Scripter
              </button>
            )}
          </div>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600/20 to-transparent rounded-[32px] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <textarea
              value={fullStory}
              onChange={(e) => setFullStory(e.target.value)}
              disabled={visualCue.isLocked}
              placeholder="Paste or write the central storyline here. Our engine will dynamically parse this into valid production segments..."
              className="relative w-full h-56 theme-bg theme-border rounded-[32px] p-8 text-[12px] font-medium focus:border-red-600/50 outline-none transition-all disabled:opacity-40 theme-text placeholder:opacity-20 custom-scrollbar shadow-inner"
            ></textarea>
          </div>
        </div>

        {paragraphs.length > 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-6 duration-700 relative z-10">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 theme-text">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                Temporal Sequence Nodes
              </label>
              <div className="flex items-center gap-4">
                {!visualCue.isLocked && (
                  <button 
                    onClick={handleSelectAll}
                    className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 border ${confirmSelectAll ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(255,0,0,0.4)]' : 'theme-border theme-text opacity-40 hover:opacity-100 hover:border-red-600'}`}
                  >
                    {confirmSelectAll ? 'Confirm All?' : 'Select All Chronologically'}
                  </button>
                )}
                <span className="text-[9px] font-black uppercase tracking-widest theme-text opacity-30">Select Active Paragraphs</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {paragraphs.map((p, idx) => {
                const partNum = getPartNumber(p);
                const isSelected = partNum !== undefined;
                return (
                  <div 
                    key={`${idx}-${p.substring(0, 10)}`}
                    onClick={() => toggleParagraphSelection(p)}
                    className={`group relative p-8 rounded-[32px] border transition-all duration-500 cursor-pointer overflow-hidden ${
                      isSelected 
                        ? 'bg-red-600/[0.07] border-red-600 ring-1 ring-red-600/20 shadow-2xl' 
                        : 'theme-border hover:bg-white/[0.02] hover:border-white/20'
                    } ${visualCue.isLocked ? 'cursor-default opacity-60' : ''}`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-red-600 shadow-[0_0_15px_rgba(255,0,0,0.5)]"></div>
                    )}
                    <div className="flex items-start gap-8">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-700 ${
                        isSelected 
                          ? 'bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(255,0,0,0.4)]' 
                          : 'theme-bg theme-border group-hover:border-white/40'
                      }`}>
                        <span className="text-[12px] font-black tracking-tighter">
                          {isSelected ? partNum : '—'}
                        </span>
                      </div>
                      <p className={`text-[13px] leading-relaxed transition-all duration-500 ${isSelected ? 'theme-text font-semibold' : 'theme-text opacity-40 italic'}`}>
                        {p}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-6 pt-8 border-t theme-border relative z-10">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] px-1 flex items-center justify-center gap-3 theme-text opacity-60">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_10px_#ff0000]"></div>
            Atmospheric Visual Grading & Cinematic Cues
          </label>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600/20 to-transparent rounded-[24px] blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
            <textarea
              ref={cueInputRef}
              value={visualCue.text}
              onChange={(e) => setVisualCue({ ...visualCue, text: e.target.value })}
              disabled={visualCue.isLocked}
              placeholder="Define lighting, color science, lens type, grain density, and artistic style metadata..."
              className="relative w-full h-28 theme-bg theme-border rounded-[24px] p-7 text-[12px] font-medium focus:border-red-600/50 outline-none transition-all disabled:opacity-40 theme-text placeholder:opacity-20 shadow-inner"
            ></textarea>
          </div>
        </div>

        <div className="relative z-10">
          {!visualCue.isLocked ? (
            <button
              onClick={handleLock}
              disabled={!visualCue.text.trim() || !fullStory.trim() || scriptParts.length === 0}
              className="w-full btn-ultra py-6 rounded-[28px] text-[12px] disabled:opacity-20 shadow-[0_20px_50px_rgba(255,0,0,0.2)] hover:shadow-[0_25px_60px_rgba(255,0,0,0.4)]"
            >
              Commit Logic Blueprint
            </button>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-top-6 duration-700">
              <div className="flex items-center justify-center gap-4 py-8 bg-red-600/5 border border-red-600/30 rounded-[32px] glass shadow-xl">
                <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_15px_#ff0000] animate-pulse"></div>
                <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.5em]">Neural State Validated</span>
              </div>
              <div className="flex justify-center">
                <button 
                  onClick={onProceed}
                  className="bg-white text-black px-20 py-6 rounded-full font-black uppercase tracking-[0.5em] text-[11px] hover:bg-red-600 hover:text-white transition-all duration-700 shadow-2xl hover:scale-105 active:scale-95"
                >
                  Enter Sequence Orchestration
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepBVisualCue;
