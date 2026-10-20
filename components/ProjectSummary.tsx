
import React, { useState } from 'react';
import { AppState, Character, GalleryItem } from '../types';
import { ChevronDown, ChevronRight, Download, Trash2, X } from 'lucide-react';

interface Props {
  state: AppState;
  setCharacters: (chars: Character[]) => void;
  setStartGallery?: (items: GalleryItem[]) => void;
  setEndGallery?: (items: GalleryItem[]) => void;
  onReset: () => void;
}

const ProjectSummary: React.FC<Props> = ({ state, setCharacters, setStartGallery, setEndGallery, onReset }) => {
  const [showStartGallery, setShowStartGallery] = useState(false);
  const [showEndGallery, setShowEndGallery] = useState(false);
  const lockedChars = state.characters.filter(c => c.isLocked);

  const unlockCharacter = (id: string) => {
    const updatedCharacters = state.characters.map(c => 
      c.id === id ? { ...c, isLocked: false } : c
    );
    setCharacters(updatedCharacters);
  };

  const downloadAsset = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    link.click();
  };

  const bulkDownload = (items: GalleryItem[], type: 'START' | 'END') => {
    if (!items || items.length === 0) return;
    items.forEach((item) => {
      downloadAsset(item.data, item.name);
    });
  };

  const clearGallery = (type: 'start' | 'end') => {
    if (confirm(`Flush all cached ${type} frames?`)) {
      if (type === 'start' && setStartGallery) setStartGallery([]);
      if (type === 'end' && setEndGallery) setEndGallery([]);
    }
  };
  
  return (
    <div className="space-y-10 theme-text">
      {/* Cast Roster */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] theme-text">Active Archetypes</h3>
          <span className="text-[9px] font-black font-mono theme-text">{lockedChars.length} Authenticated</span>
        </div>
        {lockedChars.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-white/20 text-center opacity-30">
             <span className="text-[9px] font-black uppercase tracking-widest theme-text">Roster Empty</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {lockedChars.map(char => (
              <div key={char.id} className="group relative">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 ring-1 ring-white/10 group-hover:ring-red-600 transition-all duration-300">
                  <img src={char.imageData} alt={char.name} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" title={char.name} />
                </div>
                
                <button 
                  onClick={() => unlockCharacter(char.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full border-2 border-[var(--bg-color)] flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all z-20 hover:scale-110 active:scale-90"
                  title="Unlock Archetype"
                >
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-[var(--bg-color)] flex items-center justify-center shadow-lg shadow-red-600/40 group-hover:opacity-0 transition-opacity">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Temporary Galleries */}
      <div className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] px-1 theme-text">Production Galleries</h3>
        
        {/* Start Gallery Collapsible */}
        <div className="space-y-2">
          <button 
            onClick={() => setShowStartGallery(!showStartGallery)}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${showStartGallery ? 'bg-red-600/10 border-red-600' : 'border-white/10 theme-card'}`}
          >
            <div className="flex items-center gap-3">
              {showStartGallery ? <ChevronDown className="w-3 h-3 text-red-600" /> : <ChevronRight className="w-3 h-3 theme-text opacity-40" />}
              <span className={`text-[9px] font-black uppercase tracking-widest ${showStartGallery ? 'text-red-600' : 'theme-text'}`}>Start Frames</span>
            </div>
            <span className="text-[9px] font-mono theme-text opacity-40">[{state.startGallery?.length || 0}]</span>
          </button>
          
          {showStartGallery && (
            <div className="p-4 theme-bg theme-border border-dashed rounded-2xl space-y-4 animate-in slide-in-from-top-2 duration-300">
              {state.startGallery && state.startGallery.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {state.startGallery.map((item) => (
                      <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden border theme-border">
                        <img src={item.data} className="w-full h-full object-cover" alt={item.name} />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                           <span className="text-[7px] font-black text-white uppercase mb-2 truncate w-full text-center">{item.name}</span>
                           <button onClick={() => downloadAsset(item.data, item.name)} className="p-1.5 bg-red-600 rounded-lg text-white">
                             <Download className="w-3 h-3" />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => bulkDownload(state.startGallery, 'START')}
                      className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-red-500 transition-all"
                    >
                      Bulk Export
                    </button>
                    <button 
                      onClick={() => clearGallery('start')}
                      className="p-2.5 glass theme-border text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-[8px] font-black text-center theme-text opacity-20 uppercase tracking-widest py-4">No frames rendered</p>
              )}
            </div>
          )}
        </div>

        {/* End Gallery Collapsible */}
        <div className="space-y-2">
          <button 
            onClick={() => setShowEndGallery(!showEndGallery)}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${showEndGallery ? 'bg-red-600/10 border-red-600' : 'border-white/10 theme-card'}`}
          >
            <div className="flex items-center gap-3">
              {showEndGallery ? <ChevronDown className="w-3 h-3 text-red-600" /> : <ChevronRight className="w-3 h-3 theme-text opacity-40" />}
              <span className={`text-[9px] font-black uppercase tracking-widest ${showEndGallery ? 'text-red-600' : 'theme-text'}`}>End Frames</span>
            </div>
            <span className="text-[9px] font-mono theme-text opacity-40">[{state.endGallery?.length || 0}]</span>
          </button>
          
          {showEndGallery && (
            <div className="p-4 theme-bg theme-border border-dashed rounded-2xl space-y-4 animate-in slide-in-from-top-2 duration-300">
              {state.endGallery && state.endGallery.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {state.endGallery.map((item) => (
                      <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden border theme-border">
                        <img src={item.data} className="w-full h-full object-cover" alt={item.name} />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                           <span className="text-[7px] font-black text-white uppercase mb-2 truncate w-full text-center">{item.name}</span>
                           <button onClick={() => downloadAsset(item.data, item.name)} className="p-1.5 bg-red-600 rounded-lg text-white">
                             <Download className="w-3 h-3" />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => bulkDownload(state.endGallery, 'END')}
                      className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-red-500 transition-all"
                    >
                      Bulk Export
                    </button>
                    <button 
                      onClick={() => clearGallery('end')}
                      className="p-2.5 glass theme-border text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-[8px] font-black text-center theme-text opacity-20 uppercase tracking-widest py-4">No frames rendered</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Production Health */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] px-1 theme-text">Integrity Matrix</h3>
        <div className="space-y-2">
          {[
            { label: 'Narrative Logic', status: state.scriptParts.length > 0 },
            { label: 'Visual Blueprint', status: state.visualCue.isLocked },
            { label: 'Start Keyframes', status: (state.startKeyframes?.length || 0) > 0 },
            { label: 'End Keyframes', status: (state.endKeyframes?.length || 0) > 0 },
            { label: 'Shot Sequences', status: (state.scenes?.length || 0) > 0 }
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 theme-card">
               <span className="text-[9px] font-black uppercase tracking-widest theme-text">{item.label}</span>
               <div className={`w-1.5 h-1.5 rounded-full ${item.status ? 'bg-red-600 shadow-[0_0_8px_#ff0000]' : 'bg-red-600/10'}`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Production Deck Stats */}
      <div className="pt-10 border-t border-white/10">
        <div className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1.5 theme-text">Sequences</p>
              <p className="text-4xl font-black italic tracking-tighter leading-none theme-text">{state.scenes?.length || 0}</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black text-red-600 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(255,0,0,0.4)]">Active</span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1.5 theme-text">Start Deck</p>
              <p className="text-4xl font-black italic tracking-tighter leading-none theme-text">{state.startKeyframes?.length || 0}</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black uppercase tracking-widest theme-text">Cached</span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1.5 theme-text">End Deck</p>
              <p className="text-4xl font-black italic tracking-tighter leading-none theme-text">{state.endKeyframes?.length || 0}</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black uppercase tracking-widest theme-text">Cached</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSummary;
