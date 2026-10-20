
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

interface MotionFlowProps {
  onBack: () => void;
}

interface FlowNode {
  id: string;
  url: string;
  type: 'base' | 'projected';
  prompt: string;
  timestamp: number;
}

const MotionFlow: React.FC<MotionFlowProps> = ({ onBack }) => {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [hasAuth, setHasAuth] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [flowPrompt, setFlowPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (window.aistudio) {
        const auth = await window.aistudio.hasSelectedApiKey();
        setHasAuth(auth);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasAuth(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newNode: FlowNode = {
      id: crypto.randomUUID(),
      url,
      type: 'base',
      prompt: 'Raw Ingested Asset',
      timestamp: Date.now()
    };
    setNodes(prev => [newNode, ...prev]);
    setActiveNodeId(newNode.id);
  };

  const captureFrame = (): Promise<string> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video) return resolve('');
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        resolve(canvas.toDataURL('image/png').split(',')[1]);
      } else resolve('');
    });
  };

  const startFlowProjection = async () => {
    if (!flowPrompt.trim()) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      // Re-instantiate to get latest key/credits
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const imageBytes = await captureFrame();

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: flowPrompt,
        image: {
          imageBytes,
          mimeType: 'image/png'
        },
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(r => setTimeout(r, 8000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        
        const newNode: FlowNode = {
          id: crypto.randomUUID(),
          url,
          type: 'projected',
          prompt: flowPrompt,
          timestamp: Date.now()
        };
        setNodes(prev => [newNode, ...prev]);
        setActiveNodeId(newNode.id);
        setFlowPrompt('');
      } else {
        throw new Error("Projection failure: The neural buffer returned empty.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setHasAuth(false);
        setError("Account credit link severed. Re-authenticate with Google Labs.");
      } else {
        setError(err.message || "Synthesis logic error.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const activeNode = nodes.find(n => n.id === activeNodeId);

  if (!hasAuth) {
    return (
      <div className="min-h-screen theme-bg flex flex-col items-center justify-center p-10 animate-in fade-in duration-700">
        <div className="glass cinematic-border p-16 rounded-[64px] max-w-2xl w-full text-center space-y-10 shadow-[0_32px_128px_-32px_rgba(0,0,0,0.8)]">
          <div className="w-24 h-24 bg-red-600 rounded-[32px] mx-auto flex items-center justify-center shadow-2xl animate-pulse">
            <span className="text-4xl text-white">🌀</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-black italic uppercase theme-text">MotionFlow</h1>
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-red-600">Powered by Google Labs</p>
          </div>
          <p className="theme-text opacity-60 text-[13px] leading-relaxed italic max-w-md mx-auto">
            Authorize your Google account to utilize AI Studio / Labs credits for temporal upscaling and neural sequence projection.
          </p>
          <div className="space-y-6">
            <button 
              onClick={handleLogin}
              className="w-full btn-ultra py-7 rounded-full text-[12px] flex items-center justify-center gap-4 group shadow-xl"
            >
              <span>Connect Google Labs Account</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7" />
              </svg>
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              className="block text-[9px] font-black uppercase tracking-widest theme-text opacity-30 hover:opacity-100 transition-opacity"
            >
              Learn about AI Studio Credits & Billing
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg flex flex-col md:flex-row animate-in fade-in duration-700">
      {/* Sidebar - Flow Archive */}
      <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r theme-sidebar flex flex-col glass shrink-0 relative z-30">
        <div className="p-6 border-b theme-border space-y-6 sticky top-0 bg-inherit z-40">
          <button onClick={onBack} className="group flex items-center gap-3 w-fit hover:opacity-80 transition-all">
            <div className="w-8 h-8 rounded-lg theme-border flex items-center justify-center group-hover:bg-red-600 transition-colors theme-card">
              <svg className="w-4 h-4 theme-text group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] theme-text">Return</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">🌀</span>
            </div>
            <div>
              <h1 className="font-extrabold text-[12px] uppercase italic theme-text">MOTION</h1>
              <h1 className="font-extrabold text-[10px] tracking-[0.4em] uppercase text-red-600 leading-none">FLOW</h1>
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-8">
          <div className="space-y-4">
             <h3 className="text-[10px] font-black theme-text uppercase tracking-[0.2em] opacity-40">Temporal Archive</h3>
             <div className="space-y-3">
                {nodes.map(node => (
                  <button 
                    key={node.id} 
                    onClick={() => setActiveNodeId(node.id)}
                    className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${activeNodeId === node.id ? 'bg-red-600/10 border-red-600 shadow-xl' : 'theme-border theme-text hover:bg-white/5'}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-black overflow-hidden border theme-border shrink-0">
                       <video src={node.url} className="w-full h-full object-cover" muted playsInline />
                    </div>
                    <div className="truncate">
                      <p className="text-[9px] font-black uppercase theme-text truncate">{node.type} Node</p>
                      <p className="text-[8px] font-black uppercase text-red-600 mt-1">{new Date(node.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </button>
                ))}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed theme-border rounded-2xl text-[9px] font-black uppercase theme-text opacity-30 hover:opacity-100 transition-all flex flex-col items-center gap-2"
                >
                  <span>+ Ingest Base Sequence</span>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="video/*" />
                </button>
             </div>
          </div>
        </div>

        <div className="p-6 border-t theme-border flex items-center gap-3 bg-black/20">
           <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_#ff0000]"></div>
           <span className="text-[9px] font-black uppercase tracking-widest theme-text opacity-40 italic">Labs Credits Active</span>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-grow flex flex-col relative theme-bg h-screen">
        <header className="h-16 border-b theme-border flex items-center justify-between px-10 glass sticky top-0 z-20">
          <span className="text-[10px] font-black uppercase tracking-widest theme-text opacity-40">Workspace: Sequential Projection</span>
          <span className="text-[9px] font-black uppercase tracking-[0.3em] theme-text opacity-20">Pro Production Terminal v4.1</span>
        </header>

        <div className="flex-grow overflow-y-auto p-10 max-w-6xl mx-auto w-full space-y-12">
          {error && (
            <div className="p-6 bg-red-600/10 border border-red-600/40 rounded-[32px] flex items-center gap-4 animate-in shake duration-500">
              <span className="text-red-600 font-black">!</span>
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-[9px] font-black uppercase text-red-600/40 hover:text-red-600">Dismiss</button>
            </div>
          )}

          {activeNode ? (
            <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
               <div className="glass cinematic-border rounded-[48px] overflow-hidden theme-card shadow-2xl aspect-video bg-black relative">
                  {isProcessing ? (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
                       <div className="w-20 h-20 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
                       <div className="text-center space-y-2">
                         <p className="text-[11px] font-black uppercase tracking-[0.5em] theme-text animate-pulse">Computing Temporal Flow...</p>
                         <p className="text-[8px] font-black uppercase text-red-600 opacity-40 tracking-[0.3em]">Utilizing Labs Account Credits</p>
                       </div>
                    </div>
                  ) : (
                    <video ref={videoRef} src={activeNode.url} controls className="w-full h-full object-cover" playsInline />
                  )}
               </div>

               {!isProcessing && (
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-6">
                       <div className="glass theme-border rounded-[40px] p-8 shadow-inner space-y-6">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Projection Directive</label>
                          <textarea 
                            value={flowPrompt}
                            onChange={(e) => setFlowPrompt(e.target.value)}
                            placeholder="Describe the sequential upscaling or temporal progression... (e.g. The camera pushes in as the subject turns, depth of field shifts to infinity)"
                            className="w-full h-40 theme-bg theme-border rounded-[28px] p-7 text-[13px] theme-text outline-none focus:border-red-600/50 shadow-inner resize-none"
                          />
                          <button 
                            onClick={startFlowProjection}
                            disabled={!flowPrompt.trim()}
                            className="w-full btn-ultra py-6 rounded-full text-[12px] shadow-2xl disabled:opacity-20 flex items-center justify-center gap-4"
                          >
                            <span>▶ Project Sequence</span>
                          </button>
                       </div>
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                       <div className="glass theme-border rounded-[40px] p-8 theme-card space-y-6">
                          <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40">Node Metadata</h3>
                          <div className="space-y-3">
                             <div className="flex justify-between items-center text-[10px] font-black">
                                <span className="opacity-30 uppercase">Type</span>
                                <span className="text-red-600 uppercase">{activeNode.type}</span>
                             </div>
                             <div className="flex justify-between items-center text-[10px] font-black">
                                <span className="opacity-30 uppercase">Ingest</span>
                                <span className="theme-text">{new Date(activeNode.timestamp).toLocaleTimeString()}</span>
                             </div>
                          </div>
                          <div className="pt-4 border-t theme-border">
                             <p className="text-[10px] theme-text italic opacity-60 leading-relaxed">
                                {activeNode.prompt}
                             </p>
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          ) : (
            <div className="h-[600px] glass border-4 border-dashed border-white/5 rounded-[64px] flex flex-col items-center justify-center p-20 text-center space-y-10 group">
               <div className="w-32 h-32 glass theme-border rounded-[48px] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-700">
                  <span className="text-7xl opacity-30">🌀</span>
               </div>
               <div className="space-y-4">
                  <h3 className="text-4xl font-black italic uppercase theme-text opacity-40 tracking-tighter">Temporal Node Idle</h3>
                  <p className="text-[11px] font-black uppercase theme-text opacity-20 tracking-[0.4em]">Ingest a base sequence to begin sequential neural projection.</p>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MotionFlow;
