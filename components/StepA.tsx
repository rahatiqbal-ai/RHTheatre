
import React, { useState } from 'react';
import { Character } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Download, Maximize2, Sparkles, X } from 'lucide-react';

interface Props {
  characters: Character[];
  setCharacters: (chars: Character[]) => void;
}

const MAX_CHARS = 10;
const STORAGE_MAX_DIM = 800;

const StepACharacters: React.FC<Props> = ({ characters, setCharacters }) => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [genPrompt, setGenPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const resizeAndCompress = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > h) { if (w > STORAGE_MAX_DIM) { h *= STORAGE_MAX_DIM / w; w = STORAGE_MAX_DIM; } }
          else { if (h > STORAGE_MAX_DIM) { w *= STORAGE_MAX_DIM / h; h = STORAGE_MAX_DIM; } }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsProcessing(true);
    const newChars: Character[] = [];
    
    for (let i = 0; i < files.length; i++) {
      if (characters.length + newChars.length >= MAX_CHARS) break;
      const resized = await resizeAndCompress(files[i]);
      newChars.push({ 
        id: crypto.randomUUID(), 
        name: '', 
        imageData: resized, 
        isLocked: false 
      });
    }

    setCharacters([...characters, ...newChars]);
    setIsProcessing(false);
    if (e.target) e.target.value = '';
  };

  const generateCharacter = async () => {
    if (!genPrompt.trim() || characters.length >= MAX_CHARS) return;
    
    if (window.aistudio) {
      const keySelected = await window.aistudio.hasSelectedApiKey();
      if (!keySelected) {
        setError("Pro-tier synthesis requires an authorized project key.");
        await window.aistudio.openSelectKey();
        return;
      }
    }

    setIsGenerating(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: `ULTRA-HD 8K CINEMATIC CHARACTER PRODUCTION STILL, head-to-toe view, solid white background, isolated: ${genPrompt}` }]
        },
        config: {
          imageConfig: { aspectRatio: '1:1', imageSize: '1K' }
        }
      });

      const candidate = response.candidates?.[0];
      if (!candidate) {
        throw new Error("Neural oracle returned no candidates. This usually indicates a system timeout.");
      }

      if (candidate.finishReason === 'SAFETY') {
        throw new Error("Archetype synthesis blocked: Content safety filters triggered by prompt or visual content.");
      }

      const part = candidate.content?.parts?.find(p => p.inlineData);
      if (part?.inlineData) {
        const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        setGeneratedPreview(dataUrl);
      } else {
        throw new Error("Neural synthesis returned empty. Verify prompt descriptive clarity and try again.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Synthesis failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const commitGenerated = () => {
    const dataToCommit = generatedPreview;
    if (!dataToCommit) return;
    setCharacters([...characters, {
      id: crypto.randomUUID(),
      name: '',
      imageData: dataToCommit,
      isLocked: false
    }]);
    setGeneratedPreview(null);
    setGenPrompt('');
  };

  const downloadAsset = (dataUrl: string, suffix: string = "1K") => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `archetype-${suffix}-${Date.now()}.png`;
    link.click();
  };

  const updateName = (id: string, name: string) => {
    setCharacters(characters.map(c => c.id === id ? { ...c, name } : c));
  };

  const toggleLock = (id: string) => {
    setCharacters(characters.map(c => {
      if (c.id === id) {
        if (!c.name.trim()) return c;
        return { ...c, isLocked: !c.isLocked };
      }
      return c;
    }));
  };

  const removeChar = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-12 pb-20 theme-text animate-in fade-in duration-1000">
      <div className="glass cinematic-border rounded-[48px] p-12 space-y-12 relative overflow-hidden shadow-[0_32px_128px_-32px_rgba(0,0,0,0.8)] theme-card">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-red-600/60 to-transparent"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-red-600 shadow-[0_0_30px_rgba(255,0,0,0.8)]"></div>

        <div className="text-center space-y-3 relative z-10 pb-4 border-b theme-border border-white/5">
          <h2 className="text-5xl font-black italic tracking-tighter uppercase theme-text leading-tight">Cast Ingest</h2>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-red-600/30"></div>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] theme-text opacity-50">Neural Archetype Identification</p>
            <div className="h-px w-12 bg-red-600/30"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
          {/* Generation Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] px-1 flex items-center gap-3 theme-text opacity-60">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                Archetype Synthesis
              </label>
              <div className="relative group">
                <textarea
                  value={genPrompt}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  placeholder="Describe a legendary hero, a mysterious villain, or a futuristic android..."
                  className="w-full h-32 theme-bg theme-border rounded-[28px] p-7 text-[12px] font-medium focus:border-red-600/50 outline-none transition-all theme-text placeholder:opacity-20 shadow-inner resize-none"
                />
              </div>
              <button
                onClick={generateCharacter}
                disabled={isGenerating || !genPrompt.trim() || characters.length >= MAX_CHARS}
                className="w-full btn-ultra py-5 rounded-[20px] text-[11px] disabled:opacity-20 shadow-xl"
              >
                {isGenerating ? "Synthesizing..." : "Generate Archetype"}
              </button>
            </div>

            {generatedPreview && (
              <div className="glass theme-border rounded-[32px] p-6 space-y-6 animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-red-600">Generated Prototype</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => downloadAsset(generatedPreview!, "1K")}
                      className="text-red-600 hover:text-red-500 transition-colors"
                      title="Download Asset"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setIsFullScreen(true)}
                      className="text-red-600 hover:text-red-500 transition-colors"
                      title="Expand View"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="aspect-square rounded-2xl overflow-hidden border theme-border relative group cursor-pointer" onClick={() => setIsFullScreen(true)}>
                  <img src={generatedPreview} className="w-full h-full object-cover" alt="Generated" />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-4">
                    <button onClick={commitGenerated} className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-red-600 hover:text-white transition-all shadow-lg">Authorize Asset</button>
                  </div>
                  <button onClick={() => setGeneratedPreview(null)} className="w-full glass theme-border theme-text py-3 rounded-xl font-black uppercase tracking-widest text-[8px] opacity-40 hover:opacity-100 transition-all">Discard Draft</button>
                </div>
              </div>
            )}
          </div>

          {/* Upload Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] px-1 flex items-center gap-3 theme-text opacity-60">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                Manual Asset Ingest
              </label>
              <button
                onClick={() => document.getElementById('char-upload')?.click()}
                disabled={isProcessing || characters.length >= MAX_CHARS}
                className="w-full h-32 theme-bg theme-border rounded-[28px] border-dashed border-2 flex flex-col items-center justify-center gap-4 hover:border-red-600/50 transition-all opacity-40 hover:opacity-100"
              >
                <span className="text-3xl">📁</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Upload Key Assets</span>
                <input id="char-upload" type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" />
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-600/10 border border-red-600/30 rounded-2xl flex items-center gap-4">
                <span className="text-red-600 font-black">!</span>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Character Roster */}
        <div className="space-y-8 relative z-10">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] theme-text opacity-40">Identified Archetypes ({characters.length}/{MAX_CHARS})</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {characters.map((char) => (
              <div key={char.id} className={`glass rounded-[32px] p-5 theme-card border transition-all duration-500 relative group ${char.isLocked ? 'border-red-600/50 shadow-[0_0_30px_rgba(255,0,0,0.1)]' : 'theme-border'}`}>
                <div className="aspect-square rounded-2xl overflow-hidden mb-4 border theme-border relative group/img">
                  <img src={char.imageData} className="w-full h-full object-cover" alt="Char" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                    <button 
                      onClick={() => downloadAsset(char.imageData, "auth")}
                      className="p-2 bg-white text-black rounded-full hover:bg-red-600 hover:text-white transition-all shadow-xl"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  {!char.isLocked && (
                    <button onClick={() => removeChar(char.id)} className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors z-10">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  <input
                    type="text"
                    disabled={char.isLocked}
                    value={char.name}
                    onChange={(e) => updateName(char.id, e.target.value)}
                    placeholder="Identity Label"
                    className="w-full theme-bg theme-border rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest theme-text outline-none focus:border-red-600/40 disabled:opacity-40"
                  />
                  <button
                    onClick={() => toggleLock(char.id)}
                    disabled={!char.name.trim()}
                    className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${char.isLocked ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 theme-text hover:bg-red-600 hover:text-white disabled:opacity-20'}`}
                  >
                    {char.isLocked ? "Authenticated" : "Authenticate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isFullScreen && generatedPreview && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-12 animate-in fade-in duration-300">
           <div className="absolute top-10 right-10 flex gap-6">
              <button 
                onClick={() => downloadAsset(generatedPreview!, "1K")} 
                className="px-8 py-3 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Frame</span>
              </button>
              <button 
                onClick={() => setIsFullScreen(false)} 
                className="w-12 h-12 rounded-full glass border theme-border flex items-center justify-center text-white hover:text-red-600 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
           </div>
           <div className="max-w-7xl w-full h-full flex items-center justify-center">
              <img src={generatedPreview || ''} className="max-w-full max-h-full object-contain rounded-[32px] border border-white/10 shadow-[0_0_100px_rgba(255,0,0,0.3)]" alt="Full screen preview" />
           </div>
        </div>
      )}
    </div>
  );
};

export default StepACharacters;
