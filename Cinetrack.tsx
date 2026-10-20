import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

interface CinetrackProps {
  onBack: () => void;
}

interface TemporalNode {
  id: string;
  sourceUrl: string;
  extendedUrl?: string;
  prompt: string;
  status: 'idle' | 'extending' | 'completed' | 'failed';
  timestamp: number;
}

interface VisualAsset {
  id: string;
  url: string;
  type: 'captured' | 'uploaded';
  timestamp: number;
  label: string;
}

const Cinetrack: React.FC<CinetrackProps> = ({ onBack }) => {
  const [nodes, setNodes] = useState<TemporalNode[]>([]);
  const [assets, setAssets] = useState<VisualAsset[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [extensionPrompt, setExtensionPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);

  const activeNode = nodes.find(n => n.id === activeNodeId);
  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  useEffect(() => {
    return () => {
      nodes.forEach(node => {
        if (node.sourceUrl.startsWith('blob:')) URL.revokeObjectURL(node.sourceUrl);
        if (node.extendedUrl && node.extendedUrl.startsWith('blob:')) URL.revokeObjectURL(node.extendedUrl);
      });
      assets.forEach(asset => {
        if (asset.url.startsWith('blob:')) URL.revokeObjectURL(asset.url);
      });
    };
  }, []);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newNode: TemporalNode = {
      id: crypto.randomUUID(),
      sourceUrl: url,
      prompt: '',
      status: 'idle',
      timestamp: Date.now()
    };
    setNodes(prev => [newNode, ...prev]);
    setActiveNodeId(newNode.id);
    setSelectedAssetId(null); 
    setErrorText(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newAsset: VisualAsset = {
      id: crypto.randomUUID(),
      url,
      type: 'uploaded',
      timestamp: Date.now(),
      label: `Upload ${file.name}`
    };
    setAssets(prev => [newAsset, ...prev]);
    setSelectedAssetId(newAsset.id);
    setActiveNodeId(null);
  };

  const captureFrame = (isEnd: boolean = false) => {
    const video = videoRef.current;
    if (!video) return;

    const performCapture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const url = canvas.toDataURL('image/png');
        const newAsset: VisualAsset = {
          id: crypto.randomUUID(),
          url,
          type: 'captured',
          timestamp: Date.now(),
          label: isEnd ? `Last Frame (End)` : `Frame @ ${video.currentTime.toFixed(1)}s`
        };
        setAssets(prev => [newAsset, ...prev]);
        
        if (isEnd) {
          // Auto-transition to extension flow for the end frame
          setSelectedAssetId(newAsset.id);
          setActiveNodeId(null);
        }
      }
    };

    if (isEnd) {
      // Seek to the very last frame
      video.currentTime = Math.max(0, video.duration - 0.05);
      const onSeeked = () => {
        performCapture();
        video.removeEventListener('seeked', onSeeked);
      };
      video.addEventListener('seeked', onSeeked);
    } else {
      performCapture();
    }
  };

  const handleExtend = async () => {
    if (!selectedAsset || !extensionPrompt.trim()) return;

    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }

    setIsProcessing(true);
    setErrorText(null);
    
    const targetNodeId = crypto.randomUUID();
    const newNode: TemporalNode = {
      id: targetNodeId,
      sourceUrl: '',
      prompt: extensionPrompt,
      status: 'extending',
      timestamp: Date.now()
    };
    setNodes(prev => [newNode, ...prev]);
    setActiveNodeId(targetNodeId);
    setSelectedAssetId(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await fetch(selectedAsset.url);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64Data = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt: extensionPrompt,
        image: {
          imageBytes: base64Data,
          mimeType: 'image/png'
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(r => setTimeout(r, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const fetchUrl = `${downloadLink}&key=${process.env.API_KEY}`;
        const videoRes = await fetch(fetchUrl);
        const buffer = await videoRes.arrayBuffer();
        const videoBlob = new Blob([buffer], { type: 'video/mp4' });
        const localUrl = URL.createObjectURL(videoBlob);

        setNodes(prev => prev.map(n => 
          n.id === targetNodeId ? { ...n, status: 'completed', sourceUrl: localUrl } : n
        ));
      } else {
        throw new Error("Neural temporal link was disconnected by the host.");
      }
    } catch (err: any) {
      console.error("Extension Error:", err);
      const isProjectMissing = err.message?.includes("Requested entity was not found");
      
      if (isProjectMissing && window.aistudio) {
        setErrorText("Pro authentication lost. Re-authorizing neural project...");
        await window.aistudio.openSelectKey();
      } else {
        setErrorText(err.message || "Temporal synthesis encounterd a logic fault.");
      }

      setNodes(prev => prev.map(n => 
        n.id === targetNodeId ? { ...n, status: 'failed' } : n
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const removeAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    if (selectedAssetId === id) setSelectedAssetId(null);
  };

  return (
    <div className="min-h-screen theme-bg flex flex-col md:flex-row animate-in fade-in duration-700">
      {/* Sidebar */}
      <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r theme-sidebar flex flex-col glass shrink-0 relative z-30">
        <div className="p-6 border-b theme-border space-y-6 sticky top-0 bg-inherit z-40">
          <button onClick={onBack} className="group flex items-center gap-3 w-fit hover:opacity-80 transition-all">
            <div className="w-8 h-8 rounded-lg theme-border flex items-center justify-center group-hover:bg-red-600 transition-colors theme-card">
              <svg className="w-4 h-4 theme-text group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] theme-text">Exit Engine</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg cinematic-border">
              <span className="text-white text-xl font-black">▤</span>
            </div>
            <div>
              <h1 className="font-extrabold text-[12px] uppercase italic theme-text">CINE</h1>
              <h1 className="font-extrabold text-[10px] tracking-[0.4em] uppercase text-red-600 leading-none">TRACK</h1>
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-10">
          {/* Visual Asset Deck */}
          <section className="space-y-4">
             <div className="flex items-center justify-between">
               <h3 className="text-[10px] font-black theme-text uppercase tracking-[0.2em] opacity-40">Asset Deck</h3>
               <button onClick={() => imageUploadRef.current?.click()} className="text-[9px] font-black text-red-600 uppercase">Upload</button>
               <input type="file" ref={imageUploadRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
             </div>
             <div className="grid grid-cols-2 gap-3">
                {assets.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => { setSelectedAssetId(asset.id); setActiveNodeId(null); }}
                    className={`relative aspect-video rounded-xl border-2 transition-all overflow-hidden group ${selectedAssetId === asset.id ? 'border-red-600 ring-2 ring-red-600/20' : 'theme-border hover:border-red-600/40'}`}
                  >
                    <img src={asset.url} className="w-full h-full object-cover" alt="asset" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-2">
                       <span className="text-[8px] font-black text-white uppercase text-center truncate w-full">{asset.label}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeAsset(asset.id); }}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </button>
                ))}
                {assets.length === 0 && (
                  <div className="col-span-2 py-8 border-2 border-dashed theme-border rounded-xl flex flex-col items-center justify-center opacity-20">
                    <span className="text-[9px] font-black uppercase tracking-widest">Deck Unpopulated</span>
                  </div>
                )}
             </div>
          </section>

          {/* Video Node Archive */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black theme-text uppercase tracking-[0.2em] opacity-40">Temporal Node Archive</h3>
            <div className="space-y-3">
              {nodes.map(node => (
                <button
                  key={node.id}
                  onClick={() => { setActiveNodeId(node.id); setSelectedAssetId(null); }}
                  className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${activeNodeId === node.id ? 'bg-red-600/10 border-red-600 shadow-xl' : 'theme-border theme-text hover:bg-white/5'}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-black overflow-hidden border theme-border shrink-0 flex items-center justify-center text-xs">
                    {node.sourceUrl ? <video src={node.sourceUrl} className="w-full h-full object-cover" muted playsInline /> : <span className="animate-pulse">🌀</span>}
                  </div>
                  <div className="truncate">
                    <p className="text-[10px] font-black uppercase theme-text truncate">Node ID: {node.id.split('-')[0]}</p>
                    <p className={`text-[8px] font-black uppercase mt-1 ${node.status === 'completed' ? 'text-green-500' : 'text-red-600'}`}>{node.status}</p>
                  </div>
                </button>
              ))}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed theme-border rounded-2xl text-[9px] font-black uppercase theme-text opacity-30 hover:opacity-100 transition-all"
              >
                + Ingest Production Asset
                <input type="file" ref={fileInputRef} onChange={handleVideoUpload} className="hidden" accept="video/*" />
              </button>
            </div>
          </section>
        </div>
      </aside>

      {/* Main Production Workspace */}
      <main className="flex-grow flex flex-col relative theme-bg overflow-y-auto h-screen">
        <header className="h-16 border-b theme-border flex items-center justify-between px-10 glass sticky top-0 z-20">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black uppercase theme-text opacity-40">Terminal Stage:</span>
            <span className="text-[10px] font-black text-red-600 uppercase px-2">
              {selectedAssetId ? 'Temporal Config' : activeNodeId ? 'Node Active' : 'Idle'}
            </span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.3em] theme-text opacity-30">Production Terminal v4.1</span>
        </header>

        <div className="flex-grow p-10 max-w-7xl mx-auto w-full space-y-12">
          {errorText && (
            <div className="p-6 bg-red-600/10 border border-red-600/40 rounded-[24px] flex items-center gap-4 animate-in shake duration-500">
              <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[10px] text-white font-black">!</div>
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{errorText}</p>
              <button onClick={() => setErrorText(null)} className="ml-auto text-[10px] font-black text-red-600 opacity-40 hover:opacity-100">Dismiss</button>
            </div>
          )}

          {selectedAssetId ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in slide-in-from-bottom-8 duration-700">
              <div className="lg:col-span-7 space-y-8">
                <div className="glass cinematic-border rounded-[48px] overflow-hidden theme-card shadow-2xl relative aspect-video">
                  <img src={selectedAsset?.url} className="w-full h-full object-contain" alt="Selected seed" />
                  <div className="absolute top-6 left-6 px-4 py-2 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg">Temporal Seed Frame</div>
                </div>
              </div>
              <div className="lg:col-span-5 space-y-8">
                <div className="glass cinematic-border rounded-[40px] p-10 theme-card shadow-2xl space-y-8">
                  <h2 className="text-3xl font-black italic uppercase theme-text leading-tight">Neural Continuation</h2>
                  <textarea 
                    value={extensionPrompt}
                    onChange={(e) => setExtensionPrompt(e.target.value)}
                    placeholder="Describe the sequence motion... (e.g. A slow dolly zoom on the subject, the eyes shift and blink, morning light floods the lens)"
                    className="w-full h-48 theme-bg theme-border rounded-[32px] p-8 text-[12px] font-medium theme-text outline-none focus:border-red-600/50 shadow-inner resize-none"
                  />
                  <button 
                    onClick={handleExtend}
                    disabled={isProcessing || !extensionPrompt.trim()}
                    className="w-full btn-ultra py-7 rounded-full text-[12px] disabled:opacity-20 flex items-center justify-center gap-4 shadow-xl"
                  >
                    {isProcessing ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : '▶ AUTHORIZE SYNTHESIS'}
                  </button>
                  <button 
                    onClick={() => setSelectedAssetId(null)}
                    className="w-full py-4 text-[10px] font-black uppercase theme-text opacity-40 hover:opacity-100 tracking-[0.2em]"
                  >
                    Cancel Configuration
                  </button>
                </div>
              </div>
            </div>
          ) : activeNodeId && activeNode ? (
            <div className="space-y-8 animate-in fade-in duration-700">
               <div className="glass cinematic-border rounded-[48px] overflow-hidden theme-card shadow-2xl relative aspect-video group bg-black">
                  {activeNode.status === 'completed' || activeNode.status === 'idle' ? (
                    <>
                      <video ref={videoRef} src={activeNode.sourceUrl} controls preload="auto" playsInline className="w-full h-full object-cover" />
                      
                      {/* Interactive Capture HUD Overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-10 flex justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                         <button 
                           onClick={() => captureFrame(false)} 
                           className="pointer-events-auto px-10 py-4 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-2xl flex items-center gap-3"
                         >
                           <span>📷 Capture Current Frame</span>
                         </button>
                         <button 
                           onClick={() => captureFrame(true)} 
                           className="pointer-events-auto px-10 py-4 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-2xl flex items-center gap-3"
                         >
                           <span>⏩ Start from End</span>
                         </button>
                      </div>
                    </>
                  ) : activeNode.status === 'extending' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center theme-text space-y-6">
                      <div className="w-20 h-20 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
                      <div className="text-center space-y-2">
                        <p className="text-[12px] font-black uppercase tracking-[0.6em] animate-pulse">Temporal Node Reshaping...</p>
                        <p className="text-[9px] font-black uppercase opacity-30 tracking-[0.4em]">Bridging Neural Latents</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-red-600 font-black p-10 text-center space-y-4">
                       <span className="text-4xl">⚠️</span>
                       <p className="text-[11px] uppercase tracking-widest">Temporal Link Terminated unexpectedly</p>
                       <button onClick={() => setActiveNodeId(null)} className="text-[9px] underline">Back to Stage</button>
                    </div>
                  )}
               </div>
               <div className="p-10 theme-bg theme-border rounded-[40px] shadow-inner space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-red-600/20"></div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase theme-text opacity-40">Active Sequence Blueprint</h3>
                    <span className="text-[9px] font-mono theme-text opacity-20 italic">Auth Time: {new Date(activeNode.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="theme-text text-[15px] leading-relaxed italic opacity-80 font-medium">{activeNode.prompt || "Raw Master Ingested - No Prompt Directive Provided"}</p>
               </div>
            </div>
          ) : (
            <div className="h-[700px] glass border-4 border-dashed border-white/5 rounded-[48px] flex flex-col items-center justify-center p-20 text-center space-y-10 group">
              <div className="w-32 h-32 glass theme-border rounded-[40px] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500 relative">
                <div className="absolute inset-0 bg-red-600/5 blur-2xl rounded-full"></div>
                <span className="text-6xl opacity-30 relative z-10">▤</span>
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-black italic uppercase theme-text opacity-40 tracking-tighter">Temporal Node Idle</h3>
                <p className="text-[11px] font-black uppercase theme-text opacity-20 tracking-[0.4em]">Load a production asset or select a seed frame to begin synthesis.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Cinetrack;