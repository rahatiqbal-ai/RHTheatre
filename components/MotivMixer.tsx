
import React, { useState } from 'react';
import { AppStep } from '../types';
import { generateStory, LEGENDARY_NAMES } from '../services/motivGemini';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Share, 
  Terminal, 
  Activity, 
  Wind, 
  Layers,
  Zap,
  ShieldCheck,
  Cpu,
  FileText
} from 'lucide-react';

interface MotivMixerProps {
  onExportToAudimate?: (story: string) => void;
}

const MotivMixer: React.FC<MotivMixerProps> = ({ onExportToAudimate }) => {
  // Logic bit-by-bit from user provided App.tsx
  const [step, setStep] = useState<AppStep>(AppStep.IDEA_INPUT);
  const [idea, setIdea] = useState('');
  const [genre, setGenre] = useState(''); // Serves as Tonal Architecture
  const [characterName, setCharacterName] = useState('');
  const [story, setStory] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    // Pick a random name from the legendary list
    const randomName = LEGENDARY_NAMES[Math.floor(Math.random() * LEGENDARY_NAMES.length)];
    setCharacterName(randomName);
    
    setStep(AppStep.GENERATING);
    setError(null);
    try {
      // Logic from user snippet: generateStory(idea, genre, randomName)
      const generatedStory = await generateStory(idea, genre, randomName);
      setStory(generatedStory);
      setStep(AppStep.RESULT);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setStep(AppStep.ERROR);
    }
  };

  const resetApp = () => {
    setIdea('');
    setGenre('');
    setStory('');
    setCharacterName('');
    setError(null);
    setStep(AppStep.IDEA_INPUT);
  };

  // --- RHT THEME COMPONENTS ---

  const RHT_PRESETS = [
    { label: 'Cyber Noir', icon: '🕶️' },
    { label: 'High Fantasy', icon: '⚔️' },
    { label: 'Cosmic Horror', icon: '🐙' },
    { label: 'Hard Sci-Fi', icon: '🚀' },
    { label: 'Neo-Western', icon: '🌵' }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto py-4 animate-in fade-in duration-1000 theme-text">
      
      {/* HEADER LOGO SECTION - RHT BRANDED */}
      <div className="flex flex-col items-center mb-12 space-y-6">
        <div className="relative group">
           <div className="absolute inset-0 bg-red-600/20 blur-2xl group-hover:bg-red-600/40 transition-all rounded-full" />
           <div className="relative w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(255,0,0,0.4)] cinematic-border rotate-45 group-hover:rotate-90 transition-transform duration-700 cursor-pointer" onClick={() => step !== AppStep.GENERATING && resetApp()}>
             <span className="text-white text-3xl font-black -rotate-45 group-hover:-rotate-90 transition-transform duration-700">▶</span>
           </div>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none theme-text">
            SEED<span className="text-red-600">IDEA</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-red-600/60">RHT Studio Engine v2.5 L-TYPE</p>
        </div>
      </div>

      {/* STEP 1: IDEA INPUT (IdeaForm) */}
      {step === AppStep.IDEA_INPUT && (
        <div className="glass cinematic-border rounded-[48px] p-10 md:p-16 relative overflow-hidden shadow-2xl theme-card group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent"></div>
          
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-red-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black italic uppercase tracking-tight theme-text">Idea Ingest</h3>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Narrative Core Specification</p>
            </div>
          </div>

          <div className="relative space-y-6">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Inject narrative core concept... (e.g., A derelict station orbiting a black hole sends a broadcast that contains the DNA of a dead god...)"
              className="w-full h-64 theme-bg border-2 theme-border rounded-[32px] p-8 text-[15px] font-medium focus:border-red-600/50 outline-none transition-all placeholder:opacity-20 theme-text shadow-inner custom-scrollbar resize-none"
            />
          </div>

          <div className="mt-10">
            <button 
              disabled={!idea.trim()}
              onClick={() => setStep(AppStep.GENRE_SELECTION)}
              className="w-full btn-ultra py-7 rounded-[28px] text-[12px] flex items-center justify-center gap-4 shadow-xl hover:scale-[1.01] active:scale-95 disabled:opacity-20"
            >
              <span>Define Tonal Architecture</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: GENRE SELECTION / TONAL ARCHITECTURE (GenreSelector) */}
      {step === AppStep.GENRE_SELECTION && (
        <div className="glass cinematic-border rounded-[48px] p-10 md:p-16 relative overflow-hidden shadow-2xl theme-card">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent"></div>
          
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                <Wind className="w-5 h-5 text-red-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black italic uppercase tracking-tight theme-text">Tonal Architecture</h3>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Atmospheric Specification</p>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] theme-text opacity-50 px-2">Manual Tonal Override</label>
              <textarea 
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Specify mood, lighting, color science... (e.g., Cold, sterile hallways with flickering cyan neon; a sense of deep-space claustrophobia...)"
                className="w-full h-40 theme-bg border-2 theme-border rounded-[32px] p-8 text-[14px] font-medium theme-text outline-none focus:border-red-600/50 shadow-inner resize-none custom-scrollbar"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] theme-text opacity-30 px-2">Neural Presets</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {RHT_PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => setGenre(p.label)}
                    className={`p-6 rounded-[24px] border-2 transition-all flex flex-col items-center gap-3 group/btn ${
                      genre === p.label ? 'bg-red-600/15 border-red-600 text-red-600 shadow-lg scale-105' : 'theme-bg theme-border theme-text hover:border-white/30'
                    }`}
                  >
                    <span className="text-2xl">{p.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-6 mt-16">
            <button onClick={() => setStep(AppStep.IDEA_INPUT)} className="flex-1 py-6 glass theme-border rounded-[28px] text-[11px] font-black uppercase tracking-widest theme-text flex items-center justify-center gap-3 hover:bg-white/5 transition-all">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button 
              disabled={!genre.trim()}
              onClick={handleGenerate}
              className="flex-[2] btn-ultra py-6 rounded-[28px] text-[12px] shadow-xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95"
            >
              <Sparkles className="w-5 h-5" />
              <span>Ignite Production</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: GENERATING (LoadingScreen) */}
      {step === AppStep.GENERATING && (
        <div className="h-[600px] flex flex-col items-center justify-center space-y-12 glass cinematic-border rounded-[64px] theme-card shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent animate-pulse"></div>
          
          <div className="relative">
            <div className="w-48 h-48 border-[6px] border-red-600/10 border-t-red-600 rounded-full animate-spin shadow-[0_0_40px_rgba(255,0,0,0.2)]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-12 h-12 text-red-600 animate-pulse" />
            </div>
          </div>
          
          <div className="text-center space-y-6">
             <div className="space-y-1">
               <h3 className="text-5xl font-black italic uppercase tracking-tighter theme-text">Synthesizing Epic</h3>
               <p className="text-[12px] font-black text-red-600 uppercase tracking-[0.8em] animate-pulse">Large Scale Narrative Matrix Active</p>
             </div>
             <p className="text-[9px] font-black theme-text uppercase tracking-[0.6em] opacity-30 italic">Target Length: 15,000 - 40,000 Characters</p>
          </div>
        </div>
      )}

      {/* STEP 4: RESULT (StoryDisplay) */}
      {step === AppStep.RESULT && (
        <div className="space-y-8 animate-in slide-in-from-bottom-12 duration-1000">
          <div className="glass cinematic-border rounded-[48px] p-10 md:p-20 relative overflow-hidden shadow-2xl theme-card">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600/60 shadow-[0_0_30px_rgba(255,0,0,0.6)]"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b theme-border border-white/5 pb-12 mb-12">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="px-5 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">PRODUCTION MASTER DATA</div>
                   <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] opacity-80">RHT-AUTHORIZED</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-6xl md:text-7xl lg:text-8xl font-black italic tracking-tighter uppercase theme-text leading-none">{characterName}</h2>
                  <div className="flex items-center gap-3 opacity-40">
                    <Layers className="w-4 h-4" />
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] theme-text">{genre} Chronicle</p>
                  </div>
                </div>
              </div>
              
              <button onClick={resetApp} className="px-10 py-4 glass theme-border rounded-2xl text-[10px] font-black uppercase tracking-widest theme-text hover:bg-red-600 hover:text-white transition-all flex items-center gap-3">
                <RotateCcw className="w-4 h-4" />
                <span>New Story</span>
              </button>
            </div>

            <div className="theme-bg border-2 theme-border rounded-[48px] p-10 md:p-20 shadow-inner relative group min-h-[600px]">
              <div className="absolute top-8 right-12 opacity-10 group-hover:opacity-100 transition-opacity">
                 <FileText className="w-10 h-10 text-red-600" />
              </div>
              <div className="text-[17px] md:text-[20px] leading-[2.1] font-medium theme-text italic whitespace-pre-wrap selection:bg-red-600 selection:text-white relative z-10 custom-scrollbar max-h-[1200px] overflow-y-auto pr-6">
                {story}
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-center items-center gap-8 mt-16">
              <button 
                onClick={() => window.print()} 
                className="w-full md:w-auto px-12 py-6 border-2 theme-border rounded-full text-[11px] font-black uppercase tracking-[0.3em] theme-text hover:bg-white/5 transition-all flex items-center justify-center gap-4"
              >
                <Share className="w-5 h-5" />
                <span>Archive .DAT</span>
              </button>
              
              {onExportToAudimate && (
                <button 
                  onClick={() => onExportToAudimate(story)}
                  className="w-full md:w-auto px-20 py-7 bg-red-600 text-white text-[13px] font-black uppercase tracking-[0.4em] rounded-full hover:bg-red-500 transition-all shadow-[0_20px_50px_rgba(255,0,0,0.3)] flex items-center justify-center gap-5 hover:scale-105"
                >
                  <span>Export to Audimate</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ERROR STAGE */}
      {step === AppStep.ERROR && (
        <div className="glass cinematic-border p-20 rounded-[64px] theme-border text-center space-y-12 theme-card shadow-2xl max-w-2xl mx-auto">
          <div className="w-28 h-28 bg-red-600/10 rounded-full mx-auto flex items-center justify-center border-2 border-red-600/40">
             <Activity className="w-12 h-12 text-red-600" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black theme-text uppercase italic tracking-tighter">Neural Fault</h2>
            <p className="text-[12px] theme-text font-black uppercase tracking-[0.2em] opacity-50 max-w-sm mx-auto leading-relaxed">{error}</p>
          </div>
          <button onClick={() => setStep(AppStep.GENRE_SELECTION)} className="w-full btn-ultra py-7 rounded-full text-[12px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4">
            <RotateCcw className="w-5 h-5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* FOOTER METADATA */}
      <div className="mt-20 pt-12 border-t theme-border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40 px-10">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] theme-text">
          System Locked • Instruction Set v1.1 • Max Char: 40,000 • Random Hero Mode Active
        </p>
        <div className="flex items-center gap-4">
           <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
           <span className="text-[10px] font-black uppercase tracking-widest theme-text">RHT_V7_STABLE</span>
        </div>
      </div>

    </div>
  );
};

export default MotivMixer;
