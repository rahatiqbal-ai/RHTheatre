import React, { useState, useRef } from 'react';
import { CartoonScript, ScriptRequest, ToonSeedCharacter, AppState, Character, VisualCue, Scene, ScriptPart, VideoResult, GalleryItem } from './types';
import { generateCartoonScript } from './services/toonGemini';
import StepACharacters from './components/StepA';
import StepBVisualCue from './components/StepB';
import StepCStoryParts from './components/StepC';
import ProjectSummary from './components/ProjectSummary';
import VideoEngine from './components/VideoEngine';

interface Props {
  onBack: () => void;
}

const INITIAL_STORYBOARD_STATE: AppState = {
  characters: [],
  visualCue: { text: '', isLocked: false },
  fullStory: '',
  scriptParts: [],
  scenes: [],
  startKeyframes: [],
  endKeyframes: [],
  startGallery: [],
  endGallery: [],
  aspectRatio: '16:9',
  generatedVideos: [],
};

type ToolID = 'scripter' | 'visualizer' | 'veo' | 'vocalizer';

const ToonCluster: React.FC<Props> = ({ onBack }) => {
  const [activeTool, setActiveTool] = useState<ToolID>('scripter');
  const [script, setScript] = useState<CartoonScript | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Storyboard State for PROMPTPULSER & VEOMOTION
  const [storyboardState, setStoryboardState] = useState<AppState>(INITIAL_STORYBOARD_STATE);
  const [activeVisualStep, setActiveVisualStep] = useState(1);

  const [activeGenres, setActiveGenres] = useState<string[]>([]);
  const GENRE_OPTIONS = ["Emotional", "Sad", "Happy", "Educational", "Academic", "Animal Rescue"];

  const [newChar, setNewChar] = useState<ToonSeedCharacter>({ name: '', description: '', isConfirmed: false });
  const [isAddingChar, setIsAddingChar] = useState(false);

  const [formData, setFormData] = useState<ScriptRequest>({
    topic: '',
    targetAudience: 'Kids (6-11)',
    genres: [],
    durationMinutes: 2,
    instructions: '',
    seedCharacters: []
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim()) return;

    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      const request: ScriptRequest = {
        ...formData,
        genres: activeGenres
      };
      const generated = await generateCartoonScript(request);
      setScript(generated);
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setError(err.message || "Something went wrong while conjuring your script.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyScriptToClipboard = async () => {
    if (!script) return;
    const text = getRawScriptText(script);
    try {
      // FIX: Changed navigator.clipboard.readText(text) to writeText(text) to correctly copy content.
      await navigator.clipboard.writeText(text);
      alert("Script copied to clipboard! You can now load it in PROMPTPULSER.");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const isStepAValid = storyboardState.characters.length > 0 && storyboardState.characters.every(c => c.isLocked);
  const isStepBValid = storyboardState.visualCue.isLocked && storyboardState.fullStory.trim().length > 0 && storyboardState.scriptParts.length > 0;

  const navigateVisualTo = (step: number) => {
    if (step === 2 && !isStepAValid) return;
    if (step === 3 && (!isStepAValid || !isStepBValid)) return;
    setActiveVisualStep(step);
  };

  const toggleGenre = (genre: string) => {
    setActiveGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const confirmCharacter = () => {
    if (!newChar.name.trim() || !newChar.description.trim()) return;
    setFormData({
      ...formData,
      seedCharacters: [...(formData.seedCharacters || []), { ...newChar, isConfirmed: true }]
    });
    setNewChar({ name: '', description: '', isConfirmed: false });
    setIsAddingChar(false);
  };

  const removeSeedCharacter = (index: number) => {
    const updated = [...(formData.seedCharacters || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, seedCharacters: updated });
  };

  const updateGeneratedVideos = (videos: VideoResult[]) => {
    setStoryboardState(prev => ({ ...prev, generatedVideos: videos }));
  };

  const getRawScriptText = (s: CartoonScript): string => {
    if (s.fullNarrative) {
      return s.fullNarrative.join('\n\n');
    }
    return '';
  };

  const downloadTxt = () => {
    if (!script) return;
    const element = document.createElement("a");
    const file = new Blob([getRawScriptText(script)], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `ToonScript_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen theme-bg animate-in fade-in duration-700">
      
      {/* Production Sidebar */}
      <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r theme-sidebar flex flex-col glass shrink-0 relative z-30">
        <div className="p-6 border-b theme-border space-y-6 sticky top-0 bg-inherit z-40">
          <button 
            onClick={onBack}
            className="group flex items-center gap-3 w-fit hover:opacity-80 transition-all"
          >
            <div className="w-8 h-8 rounded-lg theme-border flex items-center justify-center group-hover:bg-red-600 transition-colors theme-card">
              <svg className="w-4 h-4 theme-text group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] group-hover:text-red-600 theme-text">Exit Cluster</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20 cinematic-border">
              <span className="text-white text-xl font-black">🎬</span>
            </div>
            <div>
              <h1 className="font-extrabold text-[12px] tracking-tighter uppercase italic leading-none theme-text">TOON</h1>
              <h1 className="font-extrabold text-[10px] tracking-[0.4em] uppercase text-red-600 mt-1 leading-none">CLUSTER</h1>
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black theme-text uppercase tracking-[0.2em] opacity-40 px-2 animate-in fade-in duration-500">Creative Modules</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'scripter' as ToolID, name: 'TOONSCRIPTER', icon: '✍️', desc: 'Viral Narrative Base' },
                { id: 'visualizer' as ToolID, name: 'PROMPTPULSER', icon: '🎨', desc: 'Storyboard Architecture' },
                { id: 'veo' as ToolID, name: 'VEOMOTION', icon: '🎬', desc: 'Temporal Synthesis' },
                { id: 'vocalizer' as ToolID, name: 'TOONVOICE', icon: '🎙️', desc: 'Audio Synthesis', disabled: true }
              ].map(tool => (
                <button
                  key={tool.id}
                  onClick={() => !tool.disabled && setActiveTool(tool.id)}
                  disabled={tool.disabled}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                    activeTool === tool.id 
                      ? 'bg-red-600/10 border-red-600 text-red-600 shadow-xl shadow-red-600/10' 
                      : tool.disabled ? 'opacity-20 grayscale cursor-not-allowed theme-border' : 'theme-border theme-text hover:border-white/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${activeTool === tool.id ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(255,0,0,0.3)]' : 'theme-card theme-border'}`}>
                    {tool.icon}
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-widest block theme-text">{tool.name}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest mt-1 block theme-text opacity-50">{tool.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {(activeTool === 'visualizer' || activeTool === 'veo' || activeTool === 'vocalizer') && (
            <ProjectSummary 
              state={storyboardState}
              setCharacters={(chars) => setStoryboardState(prev => ({ ...prev, characters: chars }))}
              setStartGallery={(items) => setStoryboardState(prev => ({ ...prev, startGallery: items }))}
              setEndGallery={(items) => setStoryboardState(prev => ({ ...prev, endGallery: items }))}
              onReset={() => {
                setStoryboardState(INITIAL_STORYBOARD_STATE);
                setActiveVisualStep(1);
              }}
            />
          )}

          {activeTool === 'scripter' && script && (
            <div className="pt-6 border-t theme-border space-y-4">
               <h3 className="text-[10px] font-black theme-text uppercase tracking-[0.2em] opacity-40">Production Stats</h3>
               <div className="space-y-2">
                  <div className="flex justify-between p-3 rounded-xl theme-bg border theme-border">
                    <span className="text-[9px] font-black uppercase tracking-widest theme-text opacity-40">Word Count</span>
                    <span className="text-[10px] font-black theme-text italic">{getRawScriptText(script).split(/\s+/).length}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl theme-bg border theme-border">
                    <span className="text-[9px] font-black uppercase tracking-widest theme-text opacity-40">Target</span>
                    <span className="text-[10px] font-black theme-text italic">{formData.targetAudience}</span>
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t theme-border glass">
          <div className="flex items-center gap-3">
             {/* Fixed broken template literal in className attribute on line 227 */}
             <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_#ff0000] bg-red-600`}></div>
             <span className="text-[9px] font-black uppercase tracking-widest theme-text opacity-40">Neural Stream Active</span>
          </div>
        </div>
      </aside>

      {/* Main Production Workspace */}
      <main className="flex-grow flex-col flex relative theme-bg overflow-y-auto custom-scrollbar h-screen">
        
        {/* Sub-Header */}
        <div className="h-16 border-b theme-border flex items-center justify-between px-10 shrink-0 glass z-10 sticky top-0">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest theme-text opacity-40">Interface:</span>
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest px-2">
              {activeTool === 'scripter' ? 'ToonScripter v3.5' : activeTool === 'visualizer' ? 'PromptPulser v1.0' : activeTool === 'veo' ? 'VeoMotion v2.0' : activeTool}
            </span>
          </div>
          {activeTool === 'visualizer' && (
            <div className="flex items-center gap-8">
               {[
                 { id: 1, label: 'Cast', valid: true },
                 { id: 2, label: 'Direction', valid: isStepAValid },
                 { id: 3, label: 'Storyboard', valid: isStepAValid && isStepBValid }
               ].map(step => (
                 <button 
                   key={step.id} 
                   onClick={() => navigateVisualTo(step.id)}
                   disabled={!step.valid}
                   className={`group flex items-center gap-2 transition-all ${!step.valid ? 'opacity-20 cursor-not-allowed' : 'hover:opacity-100'}`}
                 >
                   <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border transition-all ${
                     activeVisualStep === step.id 
                       ? 'bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(255,0,0,0.4)]' 
                       : step.valid 
                         ? 'theme-card theme-border theme-text group-hover:border-red-600 group-hover:text-red-600' 
                         : 'bg-transparent theme-border theme-text'
                   }`}>
                     {step.id}
                   </div>
                   <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors theme-text`}>
                     {step.label}
                   </span>
                 </button>
               ))}
            </div>
          )}
          <div className="flex items-center gap-4">
             <span className="text-[9px] font-black uppercase tracking-[0.3em] theme-text opacity-30">Production Terminal</span>
          </div>
        </div>

        <div className="flex-grow p-6 md:p-10">
          <div ref={scrollContainerRef} className="max-w-7xl mx-auto pb-32">
            
            {/* Scripter Tool */}
            {activeTool === 'scripter' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-20">
                {(!script || isLoading) && (
                  <div className="lg:col-span-5 space-y-8 h-fit lg:sticky lg:top-24">
                    <div className="glass cinematic-border rounded-[40px] p-8 md:p-10 theme-card shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-red-600/60 to-transparent"></div>
                       
                       <div className="space-y-6 relative z-10">
                          <div className="space-y-2">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter theme-text">Blueprint Ingest</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 theme-text">Configure Story Parameters</p>
                          </div>

                          <form onSubmit={handleGenerate} className="space-y-8">
                            {/* Actor Roster */}
                            <div className="space-y-6 pt-2 border-b theme-border border-white/5 pb-8">
                              <div className="flex items-center justify-between px-2">
                                <label className="text-[10px] font-black uppercase tracking-widest theme-text opacity-40">Archetype Roster</label>
                                {!isAddingChar && (
                                  <button 
                                    type="button" 
                                    onClick={() => setIsAddingChar(true)}
                                    className="btn-ultra px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest"
                                  >
                                    + Add Actor
                                  </button>
                                )}
                              </div>
                              
                              {isAddingChar && (
                                <div className="glass cinematic-border rounded-[32px] p-6 space-y-5 animate-in zoom-in-95 duration-300 shadow-xl border-red-600/20">
                                  <input 
                                    placeholder="Identity Label"
                                    value={newChar.name}
                                    onChange={(e) => setNewChar({...newChar, name: e.target.value})}
                                    className="w-full theme-bg theme-border rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest outline-none theme-text focus:border-red-600 shadow-inner"
                                  />
                                  <textarea 
                                    placeholder="Core Traits & Backstory"
                                    value={newChar.description}
                                    onChange={(e) => setNewChar({...newChar, description: e.target.value})}
                                    className="w-full theme-bg theme-border rounded-2xl px-5 py-4 text-[11px] theme-text h-24 outline-none focus:border-red-600 shadow-inner resize-none"
                                  />
                                  <div className="flex gap-3">
                                     <button type="button" onClick={confirmCharacter} className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Commit</button>
                                     <button type="button" onClick={() => setIsAddingChar(false)} className="flex-1 py-4 glass theme-border theme-text rounded-2xl text-[10px] font-black uppercase tracking-widest">Discard</button>
                                  </div>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-3 px-2">
                                {formData.seedCharacters?.map((char, index) => (
                                  <div key={index} className="relative group flex items-center gap-4 bg-red-600/5 border border-red-600/20 rounded-full px-5 py-2.5">
                                     <span className="text-[10px] font-black theme-text uppercase tracking-widest">{char.name}</span>
                                     <button type="button" onClick={() => removeSeedCharacter(index)} className="text-red-600 opacity-40 hover:opacity-100">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2 theme-text">Narrative Spark</label>
                              <input 
                                required
                                value={formData.topic}
                                onChange={(e) => setFormData({...formData, topic: e.target.value})}
                                className="w-full theme-bg theme-border rounded-[32px] px-8 py-6 text-[13px] font-medium focus:border-red-600/50 outline-none theme-text shadow-inner"
                                placeholder="e.g. A space-faring rabbit finds a lost star..."
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2 theme-text">Audience Node</label>
                                <select 
                                  value={formData.targetAudience}
                                  onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                                  className="w-full theme-bg theme-border rounded-3xl px-6 py-5 text-[11px] font-black uppercase tracking-widest theme-text cursor-pointer"
                                >
                                  <option>Preschool (3-5)</option>
                                  <option>Kids (6-11)</option>
                                  <option>Teens (12-16)</option>
                                </select>
                              </div>
                              <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2 theme-text">Chronology</label>
                                <select 
                                  value={formData.durationMinutes}
                                  onChange={(e) => setFormData({...formData, durationMinutes: parseInt(e.target.value)})}
                                  className="w-full theme-bg theme-border rounded-3xl px-6 py-5 text-[11px] font-black uppercase tracking-widest theme-text cursor-pointer"
                                >
                                  {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(m => (
                                    <option key={m} value={m}>{m} {m === 1 ? 'Minute' : 'Minutes'} ({m*1000} chars)</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2 theme-text">Genre Matrix</label>
                              <div className="grid grid-cols-2 gap-3">
                                {GENRE_OPTIONS.map(g => (
                                  <button
                                    key={g}
                                    type="button"
                                    onClick={() => toggleGenre(g)}
                                    className={`py-4 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeGenres.includes(g) ? 'bg-red-600 border-red-500 text-white shadow-lg' : 'theme-bg theme-border theme-text opacity-50 hover:opacity-100'}`}
                                  >
                                    {g}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2 theme-text">Directional Tuning</label>
                              <textarea 
                                value={formData.instructions}
                                onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                                className="w-full h-28 theme-bg theme-border rounded-[32px] p-7 text-[12px] font-medium theme-text custom-scrollbar shadow-inner resize-none"
                                placeholder="e.g. Heavily emphasize the visual comedy..."
                              />
                            </div>

                            <button 
                              type="submit" 
                              disabled={isLoading || !formData.topic || activeGenres.length === 0}
                              className="w-full btn-ultra py-7 rounded-full text-[13px] disabled:opacity-20 shadow-[0_15px_40px_rgba(255,0,0,0.2)]"
                            >
                              {isLoading ? "CALCULATING TEMPORAL FLOW..." : "IGNITE PRODUCTION"}
                            </button>
                          </form>
                       </div>
                    </div>
                  </div>
                )}

                {/* Scripter Results */}
                <div className={`${script && !isLoading ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-12`}>
                  {isLoading ? (
                    <div className="min-h-[700px] glass cinematic-border rounded-[48px] theme-card flex flex-col items-center justify-center p-12 md:p-20 text-center space-y-10">
                      <div className="relative">
                        <div className="w-40 h-40 border-[6px] border-red-600/10 border-t-red-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-5xl animate-bounce">✍️</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-4xl font-black italic uppercase tracking-tighter theme-text">Synthesizing Narrative</h3>
                        <div className="space-y-2">
                           <p className="text-[11px] font-black uppercase tracking-[0.4em] animate-pulse theme-text opacity-50 italic">Primary Logic Gate: Active</p>
                        </div>
                      </div>
                    </div>
                  ) : script ? (
                    <div className="space-y-8 animate-in slide-in-from-bottom-12 duration-1000">
                      <div className="glass cinematic-border rounded-[48px] p-10 md:p-14 lg:p-20 theme-card relative overflow-hidden shadow-2xl">
                         <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 rounded-full blur-[100px]"></div>
                         
                         <div className="relative z-10 space-y-12">
                            <div className="border-b theme-border pb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                              <div className="space-y-4 max-w-4xl">
                                <div className="flex items-center gap-3">
                                  <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">MASTER SCRIPT</span>
                                  <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.5em]">Synchronized Architecture</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter theme-text leading-tight">{script.youtubeTitle}</h1>
                                <div className="flex flex-wrap gap-3 mt-4">
                                  {activeGenres.map(g => (
                                    <span key={g} className="px-5 py-2 bg-red-600/10 border border-red-600/30 rounded-full text-[10px] font-black uppercase tracking-widest text-red-600">
                                      {g}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-5 w-full md:w-auto shrink-0">
                                <button onClick={copyScriptToClipboard} className="flex-1 md:flex-none px-12 py-5 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-xl flex items-center gap-3">
                                  <span>COPY SCRIPT</span>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                </button>
                                <button onClick={downloadTxt} className="flex-1 md:flex-none px-12 py-5 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl">SAVE .DAT</button>
                                <button onClick={() => { setScript(null); setActiveGenres([]); }} className="flex-1 md:flex-none px-12 py-5 glass theme-border rounded-2xl text-[11px] font-black uppercase tracking-widest text-red-600 hover:bg-red-600 hover:text-white transition-all">Reset Console</button>
                              </div>
                            </div>

                            <div className="space-y-8">
                              <div className="flex items-center justify-between px-2">
                                <h3 className="text-[12px] font-black uppercase tracking-[0.4em] opacity-40 theme-text">Narrative Master Stream</h3>
                              </div>
                              <div className="theme-bg theme-border rounded-[40px] p-8 md:p-16 lg:p-24 shadow-inner relative overflow-hidden">
                                 <div className="text-[18px] md:text-[20px] theme-text opacity-90 leading-[2.2] font-medium whitespace-pre-wrap italic relative z-10">
                                    {getRawScriptText(script)}
                                 </div>
                              </div>
                            </div>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className="min-h-[700px] glass border-4 border-dashed border-white/5 rounded-[48px] flex flex-col items-center justify-center p-12 md:p-20 text-center space-y-10 group">
                      <div className="w-32 h-32 glass theme-border rounded-[40px] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-700">
                        <span className="text-6xl opacity-30 group-hover:opacity-60 transition-opacity">🎥</span>
                      </div>
                      <h3 className="text-4xl font-black italic uppercase tracking-tighter theme-text opacity-40 group-hover:opacity-100 transition-opacity">Awaiting Blueprint</h3>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PromptPulser Tool */}
            {activeTool === 'visualizer' && (
              <div className="animate-in fade-in duration-700 space-y-12">
                 {activeVisualStep === 1 && (
                  <StepACharacters 
                    characters={storyboardState.characters} 
                    setCharacters={(chars) => setStoryboardState(prev => ({ ...prev, characters: chars }))}
                  />
                )}
                {activeVisualStep === 2 && (
                  <StepBVisualCue 
                    visualCue={storyboardState.visualCue}
                    setVisualCue={(cue) => setStoryboardState(prev => ({ ...prev, visualCue: cue }))}
                    fullStory={storyboardState.fullStory}
                    setFullStory={(story) => setStoryboardState(prev => ({ ...prev, fullStory: story }))}
                    scriptParts={storyboardState.scriptParts}
                    setScriptParts={(parts) => setStoryboardState(prev => ({ ...prev, scriptParts: parts }))}
                    disabled={!isStepAValid}
                    onProceed={() => navigateVisualTo(3)}
                    showLoadButton={true}
                  />
                )}
                {activeVisualStep === 3 && (
                  <StepCStoryParts 
                    state={storyboardState}
                    setScenes={(videoScenes) => setStoryboardState(prev => ({ ...prev, scenes: videoScenes }))}
                    setStartKeyframes={(startKeyframes) => setStoryboardState(prev => ({ ...prev, startKeyframes }))}
                    setEndKeyframes={(endKeyframes) => setStoryboardState(prev => ({ ...prev, endKeyframes }))}
                    setStartGallery={(items) => setStoryboardState(prev => ({ ...prev, startGallery: items }))}
                    setEndGallery={(items) => setStoryboardState(prev => ({ ...prev, endGallery: items }))}
                    disabled={!isStepBValid}
                  />
                )}

                {/* Fixed Global Bottom Button for Step 1 -> 2 */}
                {activeVisualStep === 1 && isStepAValid && (
                  <div className="fixed bottom-0 left-0 md:left-80 right-0 p-8 glass border-t theme-border z-[50] animate-in slide-in-from-bottom-full duration-500">
                    <button 
                      onClick={() => navigateVisualTo(2)}
                      className="w-full bg-red-600 text-white py-6 rounded-full font-black uppercase tracking-[0.5em] text-[13px] hover:bg-red-500 transition-all shadow-[0_0_50px_rgba(255,0,0,0.4)] hover:scale-[1.02] active:scale-95"
                    >
                      Finalize Actors & Sync Direction
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VEOMOTION Tool */}
            {activeTool === 'veo' && (
              <VideoEngine 
                state={storyboardState} 
                onUpdateVideos={updateGeneratedVideos} 
                onUpdateStartKeyframes={(startKeyframes) => setStoryboardState(prev => ({ ...prev, startKeyframes }))}
                onUpdateEndKeyframes={(endKeyframes) => setStoryboardState(prev => ({ ...prev, endKeyframes }))}
              />
            )}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 right-0 h-16 w-full md:w-[calc(100%-20rem)] border-t theme-border flex items-center justify-between px-10 glass shrink-0 z-30 hidden md:flex">
        <p className="text-[10px] font-black uppercase tracking-widest theme-text opacity-20">&copy; 2024 Recoded Heart Theatre - Neural Node Active</p>
      </footer>
    </div>
  );
};

export default ToonCluster;