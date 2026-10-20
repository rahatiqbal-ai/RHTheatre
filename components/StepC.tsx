
import React, { useState, useEffect } from 'react';
import { AppState, Scene, Character, GalleryItem } from '../types';
import { matchCharacterNames } from '../utils/nameMatcher';
import { generateScenePrompts, generateSceneImage, CharacterRef } from '../services/gemini';
import { constructFinalPrompt } from '../utils/promptBuilder';
import SceneList from './SceneList';
import { Download, Maximize2, Share2 } from 'lucide-react';

interface Props {
  state: AppState;
  setScenes: (scenes: Scene[]) => void;
  setStartKeyframes: (scenes: Scene[]) => void;
  setEndKeyframes: (scenes: Scene[]) => void;
  setStartGallery: (items: GalleryItem[]) => void;
  setEndGallery: (items: GalleryItem[]) => void;
  disabled: boolean;
}

const StepCStoryParts: React.FC<Props> = ({ 
  state, 
  setScenes, 
  setStartKeyframes, 
  setEndKeyframes, 
  setStartGallery,
  setEndGallery,
  disabled 
}) => {
  const [env, setEnv] = useState('');
  const [inputPartNum, setInputPartNum] = useState<string>('');
  const [action, setAction] = useState('');
  const [detected, setDetected] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewPrompts, setPreviewPrompts] = useState<{ 
    image: string, 
    video: string, 
    lastFrame: string,
    imageData?: string,
    lastFrameData?: string,
    sources?: { title: string, uri: string }[] 
  } | null>(null);
  
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenUrl, setFullScreenUrl] = useState<string | null>(null);

  const selectedPartNum = parseInt(inputPartNum, 10);
  const selectedPart = state.scriptParts.find(p => p.number === selectedPartNum);
  const scriptText = selectedPart?.text || '';

  useEffect(() => {
    const lockedNames = state.characters.filter(c => c.isLocked).map(c => c.name);
    if (scriptText) {
      setDetected(matchCharacterNames(scriptText, lockedNames));
    } else {
      setDetected([]);
    }
  }, [scriptText, state.characters]);

  const getCharacterRefs = (): CharacterRef[] => {
    return state.characters
      .filter(c => c.isLocked && detected.includes(c.name))
      .map(c => ({ name: c.name, imageData: c.imageData }));
  };

  const handleGenerate = async () => {
    if (!env.trim() || !scriptText.trim() || !action.trim()) return;
    
    if (window.aistudio) {
      const keySelected = await window.aistudio.hasSelectedApiKey();
      if (!keySelected) {
        await window.aistudio.openSelectKey();
        return; 
      }
    }

    setIsGenerating(true);
    try {
      const { firstFrame, videoPrompt, lastFrame, sources } = await generateScenePrompts(env, scriptText, action, detected, state.fullStory);
      
      const finalImagePrompt = constructFinalPrompt({
        sceneIndex: state.startKeyframes.length + 1,
        detectedCharacters: detected,
        environment: env,
        script: scriptText,
        action: action,
        illustration: firstFrame,
        visualCue: state.visualCue.text
      });
      
      const finalVideoPrompt = constructFinalPrompt({
        sceneIndex: state.scenes.length + 1,
        detectedCharacters: detected,
        environment: env,
        script: scriptText,
        action: action,
        illustration: videoPrompt,
        visualCue: state.visualCue.text
      });

      const finalLastFramePrompt = constructFinalPrompt({
        sceneIndex: state.endKeyframes.length + 1,
        detectedCharacters: detected,
        environment: env,
        script: scriptText,
        action: action,
        illustration: lastFrame,
        visualCue: state.visualCue.text
      });

      const characterRefs = getCharacterRefs();
      
      // Generate Start Image
      const imageData = await generateSceneImage(
        finalImagePrompt, 
        state.aspectRatio, 
        '1K', 
        characterRefs
      );

      // Generate End Image
      const lastFrameData = await generateSceneImage(
        finalLastFramePrompt, 
        state.aspectRatio, 
        '1K', 
        characterRefs
      );

      setPreviewPrompts({ 
        image: finalImagePrompt, 
        video: finalVideoPrompt, 
        lastFrame: finalLastFramePrompt,
        imageData, 
        lastFrameData,
        sources 
      });
    } catch (error) {
      console.error("Shot Synthesis Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = (isStart: boolean = true) => {
    const data = isStart ? previewPrompts?.imageData : previewPrompts?.lastFrameData;
    if (!data) return;

    // TRANSFER TO TEMPORARY GALLERY (No enhancement, only transfer)
    const newItem: GalleryItem = {
      id: crypto.randomUUID(),
      data: data,
      name: isStart 
        ? `START${(state.startGallery?.length || 0) + 1}` 
        : `END${(state.endGallery?.length || 0) + 1}`,
      timestamp: Date.now()
    };

    if (isStart) {
      setStartGallery([...(state.startGallery || []), newItem]);
    } else {
      setEndGallery([...(state.endGallery || []), newItem]);
    }
    
    alert(`Asset successfully transferred to ${isStart ? 'Start' : 'End'} Gallery as ${newItem.name}`);
  };

  const addImageScene = (isStart: boolean = true) => {
    if (!previewPrompts) return;
    const prompt = isStart ? previewPrompts.image : previewPrompts.lastFrame;
    const data = isStart ? previewPrompts.imageData : previewPrompts.lastFrameData;

    const newScene: Scene = {
      id: crypto.randomUUID(),
      title: `${isStart ? 'Start' : 'End'} Keyframe (#${selectedPartNum})`,
      characters: detected,
      environment: env,
      script: scriptText,
      action: action,
      generatedPrompt: prompt,
      imageData: data,
      timestamp: Date.now()
    };

    if (isStart) {
      setStartKeyframes([...state.startKeyframes, newScene]);
    } else {
      setEndKeyframes([...state.endKeyframes, newScene]);
    }
  };

  const addVideoScene = () => {
    if (!previewPrompts) return;
    const newScene: Scene = {
      id: crypto.randomUUID(),
      title: `Shot Sequence (#${selectedPartNum})`,
      characters: detected,
      environment: env,
      script: scriptText,
      action: action,
      generatedPrompt: previewPrompts.video,
      firstFramePrompt: previewPrompts.image,
      lastFramePrompt: previewPrompts.lastFrame,
      firstFrameData: previewPrompts.imageData,
      lastFrameData: previewPrompts.lastFrameData,
      imageData: previewPrompts.imageData,
      timestamp: Date.now()
    };
    setScenes([...state.scenes, newScene]);
    alert("Sequence committed with automatic Start/End keyframe tracking.");
  };

  const downloadAsset = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    link.click();
  };

  const openFullScreen = (url: string) => {
    setFullScreenUrl(url);
    setIsFullScreen(true);
  };

  return (
    <div className="space-y-12 pb-20 theme-text animate-in fade-in duration-1000">
      <div className="glass cinematic-border rounded-[48px] p-12 space-y-12 relative overflow-hidden shadow-[0_32px_128px_-32px_rgba(0,0,0,0.8)] theme-card">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-red-600/60 to-transparent"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-red-600 shadow-[0_0_30px_rgba(255,0,0,0.8)]"></div>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[120px]"></div>

        <div className="text-center space-y-3 relative z-10 pb-4 border-b theme-border border-white/5">
          <h2 className="text-5xl font-black italic tracking-tighter uppercase theme-text leading-tight">Shot Storyboard</h2>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-red-600/30"></div>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] theme-text opacity-50">High-Precision Shot Architecture</p>
            <div className="h-px w-12 bg-red-600/30"></div>
          </div>
        </div>
        
        <div className="space-y-10 relative z-10">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 theme-text opacity-60">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_10px_#ff0000]"></div>
                Beat Mapping
              </label>
              <div className="flex gap-2">
                {detected.map(name => (
                  <span key={name} className="bg-red-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-in zoom-in duration-300">
                    {name}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
               <div className="flex gap-4">
                 <input
                  type="number"
                  min="1"
                  max={state.scriptParts.length}
                  value={inputPartNum}
                  onChange={(e) => setInputPartNum(e.target.value)}
                  placeholder="0"
                  className="w-24 theme-bg theme-border rounded-[24px] px-6 py-4 text-2xl font-black theme-text text-center focus:border-red-600/50 outline-none transition-all placeholder:opacity-20 shadow-inner"
                 />
                 <div className={`flex-grow border rounded-[24px] p-8 transition-all duration-500 theme-bg shadow-inner ${
                   scriptText ? 'border-red-600/40' : 'theme-border border-dashed'
                 }`}>
                   <span className="text-[9px] font-black uppercase tracking-widest mb-2 block theme-text opacity-40">
                     {scriptText ? `MATCHED PRODUCTION NODE #${selectedPartNum}` : "Awaiting Selection..."}
                   </span>
                   <p className={`text-[12px] leading-relaxed transition-opacity duration-500 theme-text ${scriptText ? 'opacity-100 italic font-medium' : 'opacity-20'}`}>
                     {scriptText ? `"${scriptText}"` : "Specify production node to synchronize context."}
                   </p>
                 </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] px-1 flex items-center gap-3 theme-text opacity-60">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                Setting Specs
              </label>
              <textarea
                value={env}
                onChange={(e) => setEnv(e.target.value)}
                placeholder="Environment detail..."
                className="w-full h-32 theme-bg theme-border rounded-[28px] p-7 text-[12px] font-medium focus:border-red-600/50 outline-none transition-all theme-text placeholder:opacity-20 shadow-inner"
              ></textarea>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] px-1 flex items-center gap-3 theme-text opacity-60">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                Performance Logic
              </label>
              <textarea
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Choreography..."
                className="w-full h-32 theme-bg theme-border rounded-[28px] p-7 text-[12px] font-medium focus:border-red-600/50 outline-none transition-all theme-text placeholder:opacity-20 shadow-inner"
              ></textarea>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!env.trim() || !scriptText.trim() || !action.trim() || isGenerating}
            className="w-full btn-ultra py-6 rounded-[28px] text-[12px] disabled:opacity-20 shadow-xl"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-4 h-4 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>Compiling Production Data...</span>
              </div>
            ) : "Engineer Shot Architecture"}
          </button>
        </div>

        {previewPrompts && (
          <div className="mt-12 pt-12 border-t theme-border animate-in fade-in slide-in-from-top-12 duration-700 relative z-10 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Start Keyframe */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-red-600">Start Keyframe Metadata</h4>
                  {previewPrompts.imageData && (
                    <button 
                      onClick={() => downloadAsset(previewPrompts.imageData!, "1K_START")}
                      className="text-red-600 opacity-40 hover:opacity-100 transition-opacity"
                      title="Download 1K Start Frame"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="theme-bg rounded-[32px] p-8 theme-border min-h-[160px] flex flex-col justify-between shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-600/20"></div>
                  {previewPrompts.imageData && (
                    <div 
                      className="group/frame relative aspect-video w-full rounded-xl overflow-hidden mb-4 border border-white/10 shadow-lg cursor-pointer" 
                      onClick={() => openFullScreen(previewPrompts.imageData!)}
                    >
                      <img src={previewPrompts.imageData} alt="Start keyframe" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/frame:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                  <p className="theme-text text-[11px] leading-relaxed font-mono tracking-tight mb-6">{previewPrompts.image}</p>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => addImageScene(true)} 
                      className="flex-1 bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-red-600 hover:text-white transition-all theme-border"
                    >
                      Store Start
                    </button>
                    <button 
                      onClick={() => handleExport(true)} 
                      className="flex-1 bg-red-600/10 border border-red-600/50 text-red-600 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-3 h-3" />
                      EXPORT
                    </button>
                  </div>
                </div>
              </div>

              {/* End Keyframe */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-red-600">End Keyframe Metadata</h4>
                  {previewPrompts.lastFrameData && (
                    <button 
                      onClick={() => downloadAsset(previewPrompts.lastFrameData!, "1K_END")}
                      className="text-red-600 opacity-40 hover:opacity-100 transition-opacity"
                      title="Download 1K End Frame"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="theme-bg rounded-[32px] p-8 theme-border min-h-[160px] flex flex-col justify-between shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-600/20"></div>
                  {previewPrompts.lastFrameData && (
                    <div 
                      className="group/frame relative aspect-video w-full rounded-xl overflow-hidden mb-4 border border-white/10 shadow-lg cursor-pointer" 
                      onClick={() => openFullScreen(previewPrompts.lastFrameData!)}
                    >
                      <img src={previewPrompts.lastFrameData} alt="Last keyframe" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/frame:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                  <p className="theme-text text-[11px] leading-relaxed font-mono tracking-tight mb-6">{previewPrompts.lastFrame}</p>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => addImageScene(false)} 
                      className="flex-1 bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-red-600 hover:text-white transition-all theme-border"
                    >
                      Store End
                    </button>
                    <button 
                      onClick={() => handleExport(false)} 
                      className="flex-1 bg-red-600/10 border border-red-600/50 text-red-600 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-3 h-3" />
                      EXPORT
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Sequence */}
            <div className="space-y-6 max-w-4xl mx-auto">
              <h4 className="text-[9px] font-black uppercase tracking-widest theme-text opacity-40 text-center">Temporal Sequence Orchestration</h4>
              <div className="theme-bg rounded-[40px] p-10 theme-border min-h-[160px] flex flex-col justify-between shadow-2xl relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-red-600"></div>
                <p className="theme-text text-[13px] leading-relaxed font-mono tracking-tight mb-8 text-center italic">"{previewPrompts.video}"</p>
                <button 
                  onClick={addVideoScene} 
                  className="w-full bg-red-600 text-white py-6 rounded-2xl font-black uppercase tracking-[0.4em] text-[11px] hover:bg-red-500 shadow-xl shadow-red-600/20 transition-all"
                >
                  Commit Sequence + Automatic Frame Tracking
                </button>
              </div>
            </div>

            {previewPrompts.sources && previewPrompts.sources.length > 0 && (
              <div className="mt-8 p-6 theme-bg theme-border rounded-[24px]">
                <h5 className="text-[9px] font-black uppercase tracking-widest theme-text opacity-40 mb-3">Cinematic Grounding Sources</h5>
                <div className="flex flex-wrap gap-4">
                  {previewPrompts.sources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] font-medium text-red-600 hover:underline flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      {source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 flex justify-center">
              <button onClick={() => setPreviewPrompts(null)} className="text-[10px] font-black uppercase tracking-[0.4em] hover:text-red-600 transition-colors theme-text opacity-30 hover:opacity-100">Flush Compilation</button>
            </div>
          </div>
        )}
      </div>

      {(state.scenes.length > 0 || state.startKeyframes.length > 0 || state.endKeyframes.length > 0) && (
        <SceneList 
          videoScenes={state.scenes} 
          setVideoScenes={setScenes} 
          startKeyframes={state.startKeyframes}
          setStartKeyframes={setStartKeyframes}
          endKeyframes={state.endKeyframes}
          setEndKeyframes={setEndKeyframes}
        />
      )}

      {/* Full-Screen Preview Overlay */}
      {isFullScreen && fullScreenUrl && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-12 animate-in fade-in duration-300">
           <div className="absolute top-10 right-10 flex gap-6">
              <button 
                onClick={() => downloadAsset(fullScreenUrl, "FS_EXPORT")} 
                className="px-8 py-3 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl"
              >
                Download Frame
              </button>
              <button 
                onClick={() => setIsFullScreen(false)} 
                className="w-12 h-12 rounded-full glass border theme-border flex items-center justify-center text-white hover:text-red-600 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
           <div className="max-w-7xl w-full h-full flex items-center justify-center">
              <img src={fullScreenUrl} className="max-w-full max-h-full object-contain rounded-[32px] border border-white/10 shadow-[0_0_100px_rgba(255,0,0,0.3)]" alt="Full screen preview" />
           </div>
        </div>
      )}
    </div>
  );
};

export default StepCStoryParts;
