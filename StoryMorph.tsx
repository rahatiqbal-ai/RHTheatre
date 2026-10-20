
import React, { useState, useEffect } from 'react';
import { Character, VisualCue, Scene, AppState, AspectRatio, ScriptPart, VideoResult, GalleryItem } from './types';
import StepACharacters from './components/StepA';
import StepBVisualCue from './components/StepB';
import StepCStoryParts from './components/StepC';
import ProjectSummary from './components/ProjectSummary';
import MotivMixer from './components/MotivMixer';
import VideoEngine from './components/VideoEngine';
import AudioBeast from './AudioBeast';

interface StoryMorphProps {
  onBack?: () => void;
}

const INITIAL_STATE: AppState = {
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

type ToolID = 'pulser' | 'mixer' | 'veo' | 'audimate';

const StoryMorph: React.FC<StoryMorphProps> = ({ onBack }) => {
  const [activeTool, setActiveTool] = useState<ToolID>('mixer');
  const [activeStep, setActiveStep] = useState(1);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (!isDarkMode) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [isDarkMode]);

  const resetProject = () => {
    if (confirm("Reset current tool workspace? This will purge all active production data.")) {
      silentReset();
    }
  };

  const silentReset = () => {
    setState(INITIAL_STATE);
    setActiveStep(1);
  };

  const isStepAValid = state.characters.length > 0 && state.characters.every(c => c.isLocked);
  const isStepBValid = state.visualCue.isLocked && state.fullStory.trim().length > 0 && state.scriptParts.length > 0;

  const navigateTo = (step: number) => {
    if (step === 2 && !isStepAValid) return;
    if (step === 3 && (!isStepAValid || !isStepBValid)) return;
    setActiveStep(step);
  };

  const updateGeneratedVideos = (videos: VideoResult[]) => {
    setState(prev => ({ ...prev, generatedVideos: videos }));
  };

  const handleExportToAudimate = (story: string) => {
    setState(prev => ({ ...prev, fullStory: story }));
    setActiveTool('audimate');
  };

  return (
    <div className={`flex flex-col md:flex-row min-h-screen transition-colors duration-500 bg-transparent animate-in fade-in duration-1000 theme-text overflow-y-auto`}>
      {/* Production Sidebar */}
      <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r theme-sidebar flex flex-col glass shrink-0 relative z-20">
        <div className="p-6 border-b theme-border space-y-5 sticky top-0 bg-inherit z-30">
          <button 
            onClick={onBack}
            className="group flex items-center gap-3 w-fit mb-2 hover:opacity-80 transition-all"
          >
            <div className={`w-8 h-8 rounded-lg theme-border flex items-center justify-center group-hover:bg-red-600 transition-colors theme-card`}>
              <svg className="w-4 h-4 theme-text group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] group-hover:text-red-600 theme-text">Exit Dashboard</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
                <span className="text-white text-xl font-black">▶</span>
              </div>
              <div>
                <h1 className="font-extrabold text-[12px] tracking-tighter uppercase italic leading-none theme-text">STORY</h1>
                <h1 className="font-extrabold text-[10px] tracking-[0.4em] uppercase text-red-600 mt-1 leading-none">MORPH</h1>
              </div>
            </div>
            
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`relative w-14 h-7 rounded-full p-1.5 transition-all duration-500 flex items-center border ${isDarkMode ? 'bg-black border-white/20' : 'bg-white border-black/10'}`}
              aria-label="Toggle Theme"
            >
              <div className={`absolute top-1 left-1 w-5 h-5 rounded-full shadow-lg transform transition-all duration-500 flex items-center justify-center ${isDarkMode ? 'translate-x-7 bg-red-600' : 'translate-x-0 bg-black'}`}>
                {isDarkMode ? (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
                ) : (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                )}
              </div>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-black uppercase tracking-widest theme-text`}>
              {isDarkMode ? 'Night Mode' : 'Day Mode'}
            </span>
            <button 
              onClick={resetProject}
              className="text-[10px] font-black text-red-600 hover:text-red-500 transition-colors uppercase tracking-[0.2em]"
            >
              Purge
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-10">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black theme-text uppercase tracking-[0.2em]">Logic Modules</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'mixer' as ToolID, name: 'Seed Idea', icon: '✦', desc: 'Narrative Synthesis' },
                { id: 'pulser' as ToolID, name: 'PromptPulser', icon: '▶', desc: 'Shot Storyboarding' },
                { id: 'veo' as ToolID, name: 'VeoMotion', icon: '🎬', desc: 'Temporal Synthesis' },
                { id: 'audimate' as ToolID, name: 'Audimate', icon: '🔊', desc: 'Vocal Synthesis' }
              ].map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                    activeTool === tool.id 
                      ? 'bg-red-600/10 border-red-600 text-red-600 shadow-xl shadow-red-600/10' 
                      : 'theme-border theme-text hover:border-white/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${activeTool === tool.id ? 'bg-red-600 text-white' : 'theme-card theme-border'}`}>
                    {tool.icon}
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-widest block theme-text">{tool.name}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest mt-1 block theme-text">{tool.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {(activeTool === 'pulser' || activeTool === 'veo' || activeTool === 'audimate') && (
            <ProjectSummary 
              state={state} 
              setCharacters={(chars) => setState(prev => ({ ...prev, characters: chars }))}
              setStartGallery={(items) => setState(prev => ({ ...prev, startGallery: items }))}
              setEndGallery={(items) => setState(prev => ({ ...prev, endGallery: items }))}
              onReset={silentReset}
            />
          )}
        </div>

        <div className="p-6 border-t theme-border theme-sidebar">
          <div className="flex items-center gap-3">
             <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_#ff0000] bg-red-600`}></div>
             <span className="text-[9px] font-black uppercase tracking-widest theme-text">Workspace Online</span>
          </div>
        </div>
      </aside>

      <main className="flex-grow flex flex-col relative theme-bg overflow-y-auto min-h-screen">
        {activeTool === 'pulser' && (
          <div className="h-16 border-b theme-border flex items-center justify-between px-10 shrink-0 glass z-10 theme-sidebar sticky top-0">
             <div className="flex items-center gap-1">
               <span className="text-[10px] font-black uppercase tracking-widest theme-text">Phase:</span>
               <span className="text-[10px] font-black text-red-600 uppercase tracking-widest px-2">
                 {activeStep === 1 ? 'Cast' : activeStep === 2 ? 'Direction' : 'Storyboard'}
               </span>
             </div>
             
             <div className="flex items-center gap-8">
               {[
                 { id: 1, label: 'Cast', valid: true },
                 { id: 2, label: 'Direction', valid: isStepAValid },
                 { id: 3, label: 'Storyboard', valid: isStepAValid && isStepBValid }
               ].map(step => (
                 <button 
                   key={step.id} 
                   onClick={() => navigateTo(step.id)}
                   disabled={!step.valid}
                   className={`group flex items-center gap-2 transition-all ${!step.valid ? 'opacity-20 cursor-not-allowed' : 'hover:opacity-100'}`}
                 >
                   <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border transition-all ${
                     activeStep === step.id 
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
          </div>
        )}

        <div className="flex-grow p-4 md:p-10 relative">
          <div className="max-w-6xl mx-auto relative pb-32">
            {activeTool === 'mixer' && <MotivMixer onExportToAudimate={handleExportToAudimate} />}
            
            {activeTool === 'pulser' && (
              <>
                {activeStep === 1 && (
                  <StepACharacters 
                    characters={state.characters} 
                    setCharacters={(chars) => setState(prev => ({ ...prev, characters: chars }))}
                  />
                )}
                {activeStep === 2 && (
                  <StepBVisualCue 
                    visualCue={state.visualCue}
                    setVisualCue={(cue) => setState(prev => ({ ...prev, visualCue: cue }))}
                    fullStory={state.fullStory}
                    setFullStory={(story) => setState(prev => ({ ...prev, fullStory: story }))}
                    scriptParts={state.scriptParts}
                    setScriptParts={(parts) => setState(prev => ({ ...prev, scriptParts: parts }))}
                    disabled={!isStepAValid}
                    onProceed={() => navigateTo(3)}
                  />
                )}
                {activeStep === 3 && (
                  <StepCStoryParts 
                    state={state}
                    setScenes={(videoScenes) => setState(prev => ({ ...prev, scenes: videoScenes }))}
                    setStartKeyframes={(startKeyframes) => setState(prev => ({ ...prev, startKeyframes }))}
                    setEndKeyframes={(endKeyframes) => setState(prev => ({ ...prev, endKeyframes }))}
                    setStartGallery={(items) => setState(prev => ({ ...prev, startGallery: items }))}
                    setEndGallery={(items) => setState(prev => ({ ...prev, endGallery: items }))}
                    disabled={!isStepBValid}
                  />
                )}

                {/* Global Proceed Button for Step 1 */}
                {activeStep === 1 && isStepAValid && (
                  <div className="fixed bottom-0 left-0 md:left-80 right-0 p-8 glass border-t theme-border z-[50] animate-in slide-in-from-bottom-full duration-500">
                    <button 
                      onClick={() => navigateTo(2)}
                      className="w-full bg-red-600 text-white py-6 rounded-full font-black uppercase tracking-[0.5em] text-[13px] hover:bg-red-500 transition-all shadow-[0_0_50px_rgba(255,0,0,0.4)] hover:scale-[1.02] active:scale-95"
                    >
                      Finalize Logic & Enter Direction
                    </button>
                  </div>
                )}
              </>
            )}

            {activeTool === 'veo' && (
              <VideoEngine 
                state={state} 
                onUpdateVideos={updateGeneratedVideos} 
                onUpdateStartKeyframes={(startKeyframes) => setState(prev => ({ ...prev, startKeyframes }))}
                onUpdateEndKeyframes={(endKeyframes) => setState(prev => ({ ...prev, endKeyframes }))}
              />
            )}

            {activeTool === 'audimate' && (
              <div className="animate-in fade-in duration-1000">
                <AudioBeast hideSidebar={true} initialText={state.fullStory} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StoryMorph;
