
import React from 'react';
import { Scene } from '../types';

interface Props {
  videoScenes: Scene[];
  setVideoScenes: (scenes: Scene[]) => void;
  startKeyframes: Scene[];
  setStartKeyframes: (scenes: Scene[]) => void;
  endKeyframes: Scene[];
  setEndKeyframes: (scenes: Scene[]) => void;
}

const SceneList: React.FC<Props> = ({ 
  videoScenes, setVideoScenes, 
  startKeyframes, setStartKeyframes, 
  endKeyframes, setEndKeyframes 
}) => {
  const deleteScene = (id: string, type: 'video' | 'start' | 'end') => {
    if (type === 'video') setVideoScenes(videoScenes.filter(s => s.id !== id));
    else if (type === 'start') setStartKeyframes(startKeyframes.filter(s => s.id !== id));
    else if (type === 'end') setEndKeyframes(endKeyframes.filter(s => s.id !== id));
  };

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
  };

  const exportTxt = (scenes: Scene[], filename: string) => {
    const content = scenes.map((s, i) => `--- SHOT ${i + 1} ---\n${s.generatedPrompt}\n\n`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const renderDeck = (scenes: Scene[], type: 'video' | 'start' | 'end', label: string) => {
    const isVideo = type === 'video';
    const isStart = type === 'start';
    const accentColor = isVideo ? 'text-red-600' : isStart ? 'text-white' : 'text-red-400';
    const borderColor = isVideo ? 'border-red-600' : 'border-white/20';

    return (
      <div className="space-y-6 text-white h-full">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{label}</h3>
            <span className="text-[10px] font-mono text-white">[{scenes.length}]</span>
          </div>
          <button 
            onClick={() => exportTxt(scenes, `${type}_deck.txt`)} 
            className={`text-[9px] font-black ${accentColor} uppercase tracking-[0.2em] hover:text-red-600 transition-colors`}
          >
            Export .DAT
          </button>
        </div>

        {scenes.length === 0 ? (
          <div className="py-12 text-center glass rounded-[32px] border-dashed border-white/10 border bg-black/40">
            <span className="text-[9px] font-black text-white uppercase tracking-widest">Deck Unpopulated</span>
          </div>
        ) : (
          <div className="space-y-4">
            {scenes.map((scene, index) => (
              <div key={scene.id} className={`glass rounded-[24px] overflow-hidden group border ${borderColor} shadow-xl bg-black`}>
                <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">NODE #{(index + 1).toString().padStart(2, '0')}</span>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[120px]">{scene.title}</span>
                  </div>
                  <button onClick={() => deleteScene(scene.id, type)} className="p-1 hover:text-red-600 text-white transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-4">
                  {scene.imageData && (
                    <div className="aspect-video w-full rounded-xl overflow-hidden mb-3 border border-white/10">
                      <img src={scene.imageData} className="w-full h-full object-cover" alt="Thumb" />
                    </div>
                  )}
                  <div className="bg-black p-4 rounded-xl relative border border-white/10">
                    <pre className="text-[10px] text-white font-mono whitespace-pre-wrap leading-relaxed">{scene.generatedPrompt}</pre>
                    <button 
                      onClick={() => copyPrompt(scene.generatedPrompt)}
                      className="absolute top-3 right-3 text-[9px] font-black text-white hover:text-red-600 uppercase tracking-widest transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pt-10 border-t border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {renderDeck(startKeyframes, 'start', 'Start Keyframe Deck')}
        {renderDeck(endKeyframes, 'end', 'End Keyframe Deck')}
        {renderDeck(videoScenes, 'video', 'Shot Sequence Deck')}
      </div>
    </div>
  );
};

export default SceneList;
