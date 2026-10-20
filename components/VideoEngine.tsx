
import React, { useState, useEffect, useRef } from 'react';
import { AppState, VideoResult, AspectRatio, Scene } from '../types';
import { GoogleGenAI } from '@google/genai';
import { Layers, X, ChevronDown, CheckCircle2, Play, Camera, Check, Tag } from 'lucide-react';
import { matchCharacterNames } from '../utils/nameMatcher';

interface Props {
  state: AppState;
  onUpdateVideos: (videos: VideoResult[]) => void;
  onUpdateStartKeyframes: (scenes: Scene[]) => void;
  onUpdateEndKeyframes: (scenes: Scene[]) => void;
}

type Mode = 'text' | 'image' | 'ingredients';
type SubMode = 'prompt' | 'bulk';
type Resolution = '720p' | '1080p' | '4K';

const VideoEngine: React.FC<Props> = ({ state, onUpdateVideos, onUpdateStartKeyframes, onUpdateEndKeyframes }) => {
  const [mode, setMode] = useState<Mode>('text');
  const [subMode, setSubMode] = useState<SubMode>('prompt');
  const [importedSceneId, setImportedSceneId] = useState<string | null>(null);
  const [manualAction, setManualAction] = useState('');
  const [manualEnv, setManualEnv] = useState('');
  const [manualStyle, setManualStyle] = useState('');
  const [manualRatio, setManualRatio] = useState<AspectRatio>('16:9');
  const [manualRes, setManualRes] = useState<Resolution>('1080p');
  const [selectedScenes, setSelectedScenes] = useState<Set<string>>(new Set());
  const [startImageId, setStartImageId] = useState<string | null>(null);
  const [endImageId, setEndImageId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeResults, setActiveResults] = useState<VideoResult[]>(state.generatedVideos || []);
  const [fullscreenVideo, setFullscreenVideo] = useState<string | null>(null);
  const [labelingState, setLabelingState] = useState<{ id: string; data: string; label: string; } | null>(null);

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  useEffect(() => {
    onUpdateVideos(activeResults);
  }, [activeResults, onUpdateVideos]);

  useEffect(() => {
    if ((mode === 'ingredients' || mode === 'image') && importedSceneId) {
      const scene = state.scenes.find(s => s.id === importedSceneId);
      if (scene) {
        if (scene.firstFrameData) setStartImageId('auto-start');
        if (scene.lastFrameData && mode === 'ingredients') setEndImageId('auto-end');
      }
    }
  }, [importedSceneId, mode, state.scenes]);

  const getMasterPrompt = () => {
    const importedScene = state.scenes.find(s => s.id === importedSceneId);
    const basePrompt = importedScene ? importedScene.generatedPrompt : "";
    const action = manualAction.trim();
    const env = manualEnv.trim();
    const style = manualStyle.trim();
    const manualPart = (action || env || style) 
      ? `[Refinement - Action: ${action}. Env: ${env}. Style: ${style}]` 
      : "";
    return `${basePrompt} ${manualPart}`.trim();
  };

  const toggleScene = (id: string) => {
    const next = new Set(selectedScenes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedScenes(next);
  };

  const generateManual = async () => {
    const masterPrompt = getMasterPrompt();
    if (!masterPrompt) return;
    const manualScene: any = { id: crypto.randomUUID(), generatedPrompt: masterPrompt, title: "Manual Node", aspectRatio: manualRatio };
    await processGeneration([manualScene], manualRatio, manualRes);
  };

  const generateSingle = async (sceneId: string) => {
    const scene = state.scenes.find(s => s.id === sceneId);
    if (!scene) return;
    await processGeneration([scene], state.aspectRatio, '1080p');
  };

  const generateBulk = async () => {
    const scenesToGen = state.scenes.filter(s => selectedScenes.has(s.id));
    if (scenesToGen.length === 0) return;
    await processGeneration(scenesToGen, state.aspectRatio, '1080p');
  };

  const processGeneration = async (scenes: any[], ratio: AspectRatio, res: Resolution) => {
    setIsGenerating(true);
    const newResults: VideoResult[] = scenes.map(s => ({
      id: crypto.randomUUID(), url: '', prompt: s.generatedPrompt, timestamp: Date.now(), status: 'pending', sourceSceneId: s.id
    }));
    setActiveResults(prev => [...newResults, ...prev]);

    const lockedChars = state.characters.filter(c => c.isLocked);
    const lockedNames = lockedChars.map(c => c.name);

    for (const result of newResults) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const targetRes = res === '4K' ? '1080p' : res;

        const payload: any = {
          model: 'veo-3.1-fast-generate-preview',
          prompt: result.prompt,
          config: { numberOfVideos: 1, resolution: targetRes, aspectRatio: ratio }
        };

        // VERTEX: Character Consistency Engine
        if (mode === 'text') {
          const matchedNames = matchCharacterNames(result.prompt, lockedNames);
          if (matchedNames.length > 0) {
            const matchedChars = lockedChars.filter(c => matchedNames.includes(c.name)).slice(0, 3);
            if (matchedChars.length > 0) {
              payload.model = 'veo-3.1-generate-preview';
              payload.prompt = `[CONSISTENT PERFORMANCE: ${matchedNames.join(', ')}] Ensure reference fidelity. Prompt: ${result.prompt}`;
              payload.config.resolution = '720p';
              payload.config.aspectRatio = '16:9';
              payload.config.referenceImages = matchedChars.map(char => ({
                image: { imageBytes: char.imageData.split(',')[1], mimeType: 'image/png' },
                referenceType: 'ASSET'
              }));
            }
          }
        } else if (mode === 'image' || mode === 'ingredients') {
          const importedScene = state.scenes.find(s => s.id === importedSceneId);
          let startBytes = '';
          let endBytes = '';
          if (startImageId === 'auto-start' && importedScene?.firstFrameData) startBytes = importedScene.firstFrameData.split(',')[1];
          else if (startImageId && startImageId !== 'auto-start') {
            const img = state.startKeyframes.find(i => i.id === startImageId) || state.endKeyframes.find(i => i.id === startImageId);
            if (img?.imageData) startBytes = img.imageData.split(',')[1];
          }
          if (mode === 'ingredients') {
            if (endImageId === 'auto-end' && importedScene?.lastFrameData) endBytes = importedScene.lastFrameData.split(',')[1];
            else if (endImageId && endImageId !== 'auto-end') {
              const img = state.endKeyframes.find(i => i.id === endImageId) || state.startKeyframes.find(i => i.id === endImageId);
              if (img?.imageData) endBytes = img.imageData.split(',')[1];
            }
          }
          if (startBytes) payload.image = { imageBytes: startBytes, mimeType: 'image/png' };
          if (endBytes) payload.config.lastFrame = { imageBytes: endBytes, mimeType: 'image/png' };
        }

        let operation = await ai.models.generateVideos(payload);
        while (!operation.done) {
          await new Promise(r => setTimeout(r, 10000));
          operation = await ai.operations.getVideosOperation({ operation });
        }
        if (operation.error) throw new Error(String(operation.error.message || 'Operation failed'));

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
          const videoRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
          const buffer = await videoRes.arrayBuffer();
          const localUrl = URL.createObjectURL(new Blob([buffer], { type: 'video/mp4' }));
          setActiveResults(prev => prev.map(r => r.id === result.id ? { ...r, status: 'completed', url: localUrl } : r));
        }
      } catch (err: any) {
        setActiveResults(prev => prev.map(r => r.id === result.id ? { ...r, status: 'failed', error: err.message } : r));
      }
    }
    setIsGenerating(false);
  };

  const removeResult = (id: string) => {
    setActiveResults(prev => prev.filter(r => r.id !== id));
  };

  const initiateFrameCapture = (id: string) => {
    const video = videoRefs.current[id];
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      setLabelingState({ id, data: canvas.toDataURL('image/png'), label: `Capture Node (${id.split('-')[0]})` });
    }
  };

  const commitCapturedFrame = (type: 'start' | 'end') => {
    if (!labelingState) return;
    const newScene: Scene = {
      id: crypto.randomUUID(), 
      title: labelingState.label, 
      characters: [], 
      environment: 'Capture', 
      script: '', 
      action: 'Capture', 
      generatedPrompt: labelingState.label, 
      imageData: labelingState.data, 
      timestamp: Date.now()
    };
    if (type === 'start') {
      onUpdateStartKeyframes([...state.startKeyframes, newScene]);
    } else {
      onUpdateEndKeyframes([...state.endKeyframes, newScene]);
    }
    setLabelingState(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-10 animate-in fade-in duration-700 theme-text space-y-12 pb-32">
      <div className="glass cinematic-border rounded-[48px] p-12 space-y-12 relative overflow-visible shadow-2xl theme-card">
        <div className="text-center space-y-3 relative z-10 pb-4 border-b theme-border border-white/5">
          <h2 className="text-5xl font-black italic uppercase theme-text leading-tight">VeoMotion Engine</h2>
          <p className="text-[11px] font-black uppercase tracking-[0.4em] theme-text opacity-50">Vertex Node Active</p>
        </div>
        <div className="relative z-10 space-y-10">
          <div className="flex justify-center gap-4">
            {['text', 'image', 'ingredients'].map(m => (
              <button key={m} onClick={() => setMode(m as Mode)} className={`px-8 py-5 rounded-[24px] border transition-all text-[11px] font-black uppercase tracking-[0.2em] ${mode === m ? 'bg-red-600 border-red-500 text-white shadow-xl scale-105' : 'theme-border theme-text hover:bg-white/5 opacity-60'}`}>
                {m === 'text' ? '✍️ Text' : m === 'image' ? '🖼️ Image' : '🧬 Start-End'}
              </button>
            ))}
          </div>
          {mode === 'text' && (
            <div className="space-y-12">
              <div className="flex justify-center gap-2 bg-black/20 p-2 rounded-full w-fit mx-auto border theme-border">
                {['prompt', 'bulk'].map(sm => (
                  <button key={sm} onClick={() => setSubMode(sm as SubMode)} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${subMode === sm ? 'bg-white text-black' : 'theme-text opacity-40'}`}>{sm === 'prompt' ? 'Prompt-to-Go' : 'Bulk-to-Go'}</button>
                ))}
              </div>
              {subMode === 'prompt' && (
                <div className="space-y-10">
                  <select value={importedSceneId || ''} onChange={(e) => setImportedSceneId(e.target.value || null)} className="w-full theme-bg theme-border rounded-[24px] p-6 text-[11px] font-black uppercase theme-text outline-none">
                    <option value="">-- NO SEQUENCE IMPORTED --</option>
                    {state.scenes.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <textarea value={manualAction} onChange={(e) => setManualAction(e.target.value)} placeholder="Action..." className="h-48 theme-bg theme-border rounded-[28px] p-6 text-[12px] theme-text resize-none" />
                    <textarea value={manualEnv} onChange={(e) => setManualEnv(e.target.value)} placeholder="Env..." className="h-48 theme-bg theme-border rounded-[28px] p-6 text-[12px] theme-text resize-none" />
                    <textarea value={manualStyle} onChange={(e) => setManualStyle(e.target.value)} placeholder="Style..." className="h-48 theme-bg theme-border rounded-[28px] p-6 text-[12px] theme-text resize-none" />
                  </div>
                  <button onClick={generateManual} disabled={isGenerating || !getMasterPrompt()} className="w-full btn-ultra py-7 rounded-full text-[14px] flex items-center justify-center gap-4">
                    {isGenerating ? <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                    <span>{isGenerating ? 'Synthesizing...' : 'GENERATE'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {labelingState && (
        <div className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="glass cinematic-border rounded-[48px] p-12 max-w-2xl w-full space-y-8 theme-card text-center">
            <h3 className="text-3xl font-black italic uppercase theme-text">Commit Frame Capture</h3>
            <div className="aspect-video rounded-[32px] overflow-hidden border theme-border shadow-2xl">
              <img src={labelingState.data} className="w-full h-full object-cover" alt="Captured" />
            </div>
            <div className="flex gap-6">
               <button onClick={() => commitCapturedFrame('start')} className="flex-1 btn-ultra py-5 rounded-full text-[11px]">Save as Start</button>
               <button onClick={() => commitCapturedFrame('end')} className="flex-1 bg-white text-black py-5 rounded-full text-[11px] font-black uppercase">Save as End</button>
               <button onClick={() => setLabelingState(null)} className="flex-1 glass theme-border theme-text py-5 rounded-full text-[11px] font-black uppercase opacity-40">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {activeResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
          {activeResults.map(res => (
            <div key={res.id} className="glass theme-border rounded-[40px] overflow-hidden theme-card relative shadow-2xl">
              <div className="aspect-video bg-black flex flex-col items-center justify-center">
                {res.status === 'completed' ? (
                  <video ref={el => { videoRefs.current[res.id] = el; }} src={res.url} controls className="w-full h-full object-cover" />
                ) : res.status === 'pending' ? (
                  <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-red-600">Synthesizing...</span>
                  </div>
                ) : <span className="text-red-600 font-black">FAILED</span>}
              </div>
              <div className="p-6 flex justify-between items-center border-t theme-border">
                <p className="text-[9px] font-black uppercase theme-text truncate max-w-[200px] opacity-40 italic">"{res.prompt}"</p>
                <div className="flex gap-2">
                   {res.status === 'completed' && <button onClick={() => initiateFrameCapture(res.id)} className="p-2 bg-red-600 text-white rounded-lg"><Camera className="w-4 h-4" /></button>}
                   <button onClick={() => removeResult(res.id)} className="p-2 text-red-600"><X className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoEngine;
