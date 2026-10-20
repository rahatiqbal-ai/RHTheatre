
import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Settings, 
  Trash2, 
  Download, 
  Volume2, 
  Sparkles, 
  AlertCircle,
  Menu,
  CheckCircle2,
  Mic,
  Music,
  Waves,
  Clapperboard,
  Search,
  Wind,
  Activity,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

// --- FULL RHT STUDIO EMOTION CUES LIST ---
const EMOTION_CUES = [
  { id: 'cheerful', label: 'Cheerful', icon: '😊', prefix: 'Say cheerfully: ', color: 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5', feeling: 'Bright, energetic, and uplifted tone.' },
  { id: 'whisper', label: 'Whisper', icon: '🤫', prefix: 'Say in a whisper: ', color: 'border-purple-500/30 text-purple-500 bg-purple-500/5', feeling: 'Quiet, intimate, and breathy synthesis.' },
  { id: 'sad', label: 'Sad', icon: '😢', prefix: 'Say sadly: ', color: 'border-blue-500/30 text-blue-500 bg-blue-500/5', feeling: 'Slowed pace and melancholic weight.' },
  { id: 'angry', label: 'Angry', icon: '😠', prefix: 'Say angrily: ', color: 'border-red-500/30 text-red-500 bg-red-500/5', feeling: 'Sharp, loud, and tense delivery.' },
  { id: 'excited', label: 'Excited', icon: '🤩', prefix: 'Say excitedly: ', color: 'border-orange-500/30 text-orange-500 bg-orange-500/5', feeling: 'High-pitched enthusiasm.' },
  { id: 'commanding', label: 'Commanding', icon: '⚖️', prefix: 'Say commandingly: ', color: 'border-zinc-300/30 text-zinc-300 bg-zinc-300/5', feeling: 'Firm, authoritative, and powerful.' },
  { id: 'mysterious', label: 'Mysterious', icon: '🕵️', prefix: 'Say mysteriously: ', color: 'border-indigo-500/30 text-indigo-500 bg-indigo-500/5', feeling: 'Low volume and enigmatic quality.' },
  { id: 'fearful', label: 'Fearful', icon: '😨', prefix: 'Say fearfully: ', color: 'border-red-400/30 text-red-400 bg-red-400/5', feeling: 'Trembling and unstable pitch.' },
  { id: 'sarcastic', label: 'Sarcastic', icon: '🙄', prefix: 'Say sarcastically: ', color: 'border-pink-500/30 text-pink-500 bg-pink-500/5', feeling: 'Dry, biting edge of insincerity.' },
  { id: 'apathetic', label: 'Apathetic', icon: '😑', prefix: 'Say apathetically: ', color: 'border-slate-500/30 text-slate-500 bg-slate-500/5', feeling: 'Flat, monotone, and devoid of investment.' },
  { id: 'comforting', label: 'Comforting', icon: '🫂', prefix: 'Say comfortingly: ', color: 'border-emerald-400/30 text-emerald-400 bg-emerald-400/5', feeling: 'Warm, resonant, and soothing.' },
  { id: 'pompous', label: 'Pompous', icon: '🧐', prefix: 'Say pompously: ', color: 'border-amber-500/30 text-amber-500 bg-amber-500/5', feeling: 'Arrogant and over-enunciated.' },
  { id: 'dramatic', label: 'Dramatic', icon: '🎭', prefix: 'Say dramatically: ', color: 'border-red-600/30 text-red-600 bg-red-600/5', feeling: 'Theatrical with intense peaks and valleys.' },
  { id: 'storytelling', label: 'Storytelling', icon: '📖', prefix: 'Say in a storytelling narrative style: ', color: 'border-orange-300/30 text-orange-300 bg-orange-300/5', feeling: 'Captivating, melodic, and perfectly paced.' },
  { id: 'villainous', label: 'Villainous', icon: '😈', prefix: 'Say like a villain: ', color: 'border-purple-600/30 text-purple-600 bg-purple-600/5', feeling: 'Sinister and calculated threat.' },
  { id: 'heroic', label: 'Heroic', icon: '🦸', prefix: 'Say heroically: ', color: 'border-blue-600/30 text-blue-600 bg-blue-600/5', feeling: 'Steady, booming, and inspiring.' },
  { id: 'hesitant', label: 'Hesitant', icon: '🤔', prefix: 'Say hesitantly: ', color: 'border-yellow-600/30 text-yellow-600 bg-yellow-600/5', feeling: 'Stuttering pauses and uncertain pitch.' },
  { id: 'disgusted', label: 'Disgusted', icon: '🤢', prefix: 'Say with disgust: ', color: 'border-green-600/30 text-green-600 bg-green-600/5', feeling: 'Guttural and repulsed tone.' },
  { id: 'suspenseful', label: 'Suspenseful', icon: '⏳', prefix: 'Say suspensefully: ', color: 'border-zinc-400/30 text-zinc-400 bg-zinc-400/5', feeling: 'Slow, rhythmic, and tense.' },
  { id: 'slurred', label: 'Slurred', icon: '🍷', prefix: 'Say with slurred speech: ', color: 'border-red-900/30 text-red-900 bg-red-900/5', feeling: 'Loose, uncoordinated articulation.' },
  { id: 'newscaster', label: 'Newscaster', icon: '🎙️', prefix: 'Say in a newscaster voice: ', color: 'border-sky-500/30 text-sky-500 bg-sky-500/5', feeling: 'Balanced, neutral, and professional.' },
  { id: 'elderly', label: 'Elderly', icon: '👵', prefix: 'Say in an elderly voice: ', color: 'border-stone-500/30 text-stone-500 bg-stone-500/5', feeling: 'Fragile, raspy, and wisdom-laden.' },
  { id: 'innocent', label: 'Innocent', icon: '👶', prefix: 'Say innocently: ', color: 'border-white/30 text-white bg-white/5', feeling: 'High, clear, and naïve synthesis.' },
  { id: 'exhausted', label: 'Exhausted', icon: '😫', prefix: 'Say in an exhausted voice: ', color: 'border-orange-900/30 text-orange-900 bg-orange-900/5', feeling: 'Weak, breathy, and dragging.' },
  { id: 'robotic', label: 'Robotic', icon: '🤖', prefix: 'Say in a robotic voice: ', color: 'border-cyan-500/30 text-cyan-500 bg-cyan-500/5', feeling: 'Staccato and devoid of emotion.' },
  { id: 'flirty', label: 'Flirty', icon: '😘', prefix: 'Say flirtatiously: ', color: 'border-rose-500/30 text-rose-500 bg-rose-500/5', feeling: 'Smooth, playful, and suggestive.' },
  { id: 'confused', label: 'Confused', icon: '😵‍💫', prefix: 'Say confusedly: ', color: 'border-indigo-400/30 text-indigo-400 bg-indigo-400/5', feeling: 'Disjointed rhythm and rising intonation.' },
  { id: 'determined', label: 'Determined', icon: '😤', prefix: 'Say with determination: ', color: 'border-orange-600/30 text-orange-600 bg-orange-600/5', feeling: 'Locked-in and intense focus.' },
  { id: 'surprised', label: 'Surprised', icon: '😲', prefix: 'Say with surprise: ', color: 'border-yellow-400/30 text-yellow-400 bg-yellow-400/5', feeling: 'Sudden, explosive pitch changes.' },
  { id: 'thoughtful', label: 'Thoughtful', icon: '🧐', prefix: 'Say thoughtfully: ', color: 'border-teal-500/30 text-teal-500 bg-teal-500/5', feeling: 'Slower and contemplating resonance.' },
  { id: 'grateful', label: 'Grateful', icon: '🙏', prefix: 'Say gratefully: ', color: 'border-amber-400/30 text-amber-400 bg-amber-400/5', feeling: 'Soft, sincere, and heart-centered.' },
  { id: 'envious', label: 'Envious', icon: '😒', prefix: 'Say enviously: ', color: 'border-lime-500/30 text-lime-500 bg-lime-500/5', feeling: 'Thin, sharp, and bitter synthesis.' },
  { id: 'guilty', label: 'Guilty', icon: '😔', prefix: 'Say guiltily: ', color: 'border-slate-600/30 text-slate-600 bg-slate-600/5', feeling: 'Muffled and low-volume avoidance.' },
  { id: 'proud', label: 'Proud', icon: '🦁', prefix: 'Say proudly: ', color: 'border-amber-600/30 text-amber-600 bg-amber-600/5', feeling: 'Full-chested and confident swagger.' },
  { id: 'relaxed', label: 'Relaxed', icon: '🧘', prefix: 'Say in a relaxed way: ', color: 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5', feeling: 'Smooth, loose, and effortless.' },
  { id: 'anxious', label: 'Anxious', icon: '😰', prefix: 'Say anxiously: ', color: 'border-orange-400/30 text-orange-400 bg-orange-400/5', feeling: 'High-speed and shaky delivery.' },
  { id: 'sickly', label: 'Sickly', icon: '🤒', prefix: 'Say in a sickly voice: ', color: 'border-green-400/30 text-green-400 bg-green-400/5', feeling: 'Weak, nasally, and congested.' },
  { id: 'sleepy', label: 'Sleepy', icon: '😴', prefix: 'Say sleepily: ', color: 'border-indigo-300/30 text-indigo-300 bg-indigo-300/5', feeling: 'Heavy, slurred, and drifting.' },
  { id: 'hyper', label: 'Hyper', icon: '⚡', prefix: 'Say in a hyper way: ', color: 'border-yellow-300/30 text-yellow-300 bg-yellow-300/5', feeling: 'Intensely fast and bouncy energy.' },
  { id: 'bossy', label: 'Bossy', icon: '💅', prefix: 'Say in a bossy voice: ', color: 'border-fuchsia-500/30 text-fuchsia-500 bg-fuchsia-500/5', feeling: 'Condescending and demanding.' },
  { id: 'shy', label: 'Shy', icon: '🥺', prefix: 'Say shyly: ', color: 'border-pink-300/30 text-pink-300 bg-pink-300/5', feeling: 'Soft, reserved, and hesitant.' },
  { id: 'cynical', label: 'Cynical', icon: '🤨', prefix: 'Say cynically: ', color: 'border-zinc-500/30 text-zinc-500 bg-zinc-500/5', feeling: 'Bored and skeptical edge.' },
  { id: 'nostalgic', label: 'Nostalgic', icon: '📻', prefix: 'Say nostalgically: ', color: 'border-amber-700/30 text-amber-700 bg-amber-700/5', feeling: 'Warm, airy weight of memories.' },
  { id: 'corporate', label: 'Corporate', icon: '💼', prefix: 'Say in a corporate tone: ', color: 'border-blue-400/30 text-blue-400 bg-blue-400/5', feeling: 'Polished and emotionally neutral.' },
  { id: 'seductive', label: 'Seductive', icon: '👄', prefix: 'Say seductively: ', color: 'border-red-800/30 text-red-800 bg-red-800/5', feeling: 'Deep, slow, and velvety proximity.' },
  { id: 'pleading', label: 'Pleading', icon: '🤲', prefix: 'Say pleadingly: ', color: 'border-sky-300/30 text-sky-300 bg-sky-300/5', feeling: 'Soft and earnest sense of need.' },
  { id: 'mocking', label: 'Mocking', icon: '😜', prefix: 'Say mockingly: ', color: 'border-yellow-600/30 text-yellow-600 bg-yellow-600/5', feeling: 'Playfully cruel taunting inflections.' },
  { id: 'disappointed', label: 'Disappointed', icon: '😞', prefix: 'Say with disappointment: ', color: 'border-slate-500/30 text-slate-500 bg-slate-500/5', feeling: 'Heavy, downward tonal loss.' },
  { id: 'relieved', label: 'Relieved', icon: '😮‍💨', prefix: 'Say with relief: ', color: 'border-emerald-300/30 text-emerald-300 bg-emerald-300/5', feeling: 'Sudden drop in vocal tension.' },
  { id: 'curious', label: 'Curious', icon: '🔍', prefix: 'Say curiously: ', color: 'border-cyan-400/30 text-cyan-400 bg-cyan-400/5', feeling: 'Alert and bright inquiry.' },
  { id: 'defiant', label: 'Defiant', icon: '🤜', prefix: 'Say defiantly: ', color: 'border-orange-500/30 text-orange-500 bg-orange-500/5', feeling: 'Hard, resolute, and challenging.' },
  { id: 'grumpy', label: 'Grumpy', icon: '👺', prefix: 'Say grumpily: ', color: 'border-red-900/30 text-red-900 bg-red-900/5', feeling: 'Low, gravelly, and annoyed.' },
  { id: 'whiny', label: 'Whiny', icon: '😩', prefix: 'Say in a whiny voice: ', color: 'border-pink-400/30 text-pink-400 bg-pink-400/5', feeling: 'Nasally and high-pitched dragging.' },
  { id: 'overwhelmed', label: 'Overwhelmed', icon: '😵', prefix: 'Say as if overwhelmed: ', color: 'border-zinc-400/30 text-zinc-400 bg-zinc-400/5', feeling: 'Stressed and slightly chaotic.' },
  { id: 'calm', label: 'Calm', icon: '🌊', prefix: 'Say calmly: ', color: 'border-sky-400/30 text-sky-400 bg-sky-400/5', feeling: 'Steady and peaceful delivery.' },
  { id: 'cruel', label: 'Cruel', icon: '🔪', prefix: 'Say cruelly: ', color: 'border-red-700/30 text-red-700 bg-red-700/5', feeling: 'Cold, sharp, and calculated zero empathy.' },
  { id: 'hopeful', label: 'Hopeful', icon: '🤞', prefix: 'Say hopefully: ', color: 'border-emerald-400/30 text-emerald-400 bg-emerald-400/5', feeling: 'Bright and optimistic light.' },
  { id: 'desperate', label: 'Desperate', icon: '🏚️', prefix: 'Say desperately: ', color: 'border-amber-900/30 text-amber-900 bg-amber-900/5', feeling: 'Strained and erratic limit.' },
  { id: 'ecstatic', label: 'Ecstatic', icon: '🌈', prefix: 'Say ecstatically: ', color: 'border-yellow-400/30 text-yellow-400 bg-yellow-400/5', feeling: 'Pure joy near shouting energy.' },
  { id: 'stern', label: 'Stern', icon: '💂', prefix: 'Say sternly: ', color: 'border-zinc-300/30 text-zinc-300 bg-zinc-300/5', feeling: 'Rigid and no-nonsense delivery.' },
  { id: 'playful', label: 'Playful', icon: '🎈', prefix: 'Say playfully: ', color: 'border-sky-400/30 text-sky-400 bg-sky-400/5', feeling: 'Bouncing and full of surprises.' },
  { id: 'silly', label: 'Silly', icon: '🤡', prefix: 'Say sillily: ', color: 'border-orange-400/30 text-orange-400 bg-orange-400/5', feeling: 'Goofy and completely unserious.' },
  { id: 'formal', label: 'Formal', icon: '🎩', prefix: 'Say formally: ', color: 'border-zinc-400/30 text-zinc-400 bg-zinc-400/5', feeling: 'Stiff and perfectly enunciated.' },
  { id: 'ghostly', label: 'Ghostly', icon: '👻', prefix: 'Say in a ghostly voice: ', color: 'border-blue-200/30 text-blue-200 bg-blue-200/5', feeling: 'Ethereal, hollow, and cold synthesis.' },
  { id: 'lovestruck', label: 'Lovestruck', icon: '💘', prefix: 'Say like you are lovestruck: ', color: 'border-rose-400/30 text-rose-400 bg-rose-400/5', feeling: 'Aery and soft dazed glow.' },
  { id: 'bitter', label: 'Bitter', icon: '🍋', prefix: 'Say bitterly: ', color: 'border-yellow-700/30 text-yellow-700 bg-yellow-700/5', feeling: 'Sharp, resentful, and sour quality.' },
  { id: 'noble', label: 'Noble', icon: '⚔️', prefix: 'Say nobly: ', color: 'border-amber-300/30 text-amber-300 bg-amber-300/5', feeling: 'Resonant and clear dignity.' },
  { id: 'zen', label: 'Zen', icon: '🕉️', prefix: 'Say in a zen-like way: ', color: 'border-indigo-500/30 text-indigo-500 bg-indigo-500/5', feeling: 'Vibrationally centered and detached.' },
  { id: 'annoyed', label: 'Annoyed', icon: '😑', prefix: 'Say in an annoyed way: ', color: 'border-zinc-400/30 text-zinc-400 bg-zinc-400/5', feeling: 'Clipped articulation and vocal sighs.' },
];

const VOICE_OPTIONS = [
  { id: 'Puck', name: 'Puck', gender: 'Male' },
  { id: 'Charon', name: 'Charon', gender: 'Male' },
  { id: 'Kore', name: 'Kore', gender: 'Female' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'Male' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'Female' },
];

// --- PCM TO WAV ENCODER UTILITY ---
const createWavBlob = (pcmData: Uint8Array, sampleRate: number = 24000) => {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + pcmData.length, true); // Chunk size
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, pcmData.length, true);
  return new Blob([header, pcmData as unknown as BlobPart], { type: 'audio/wav' });
};

interface AudioBeastProps {
  onBack?: () => void;
  hideSidebar?: boolean;
  initialText?: string;
}

type AudioMenu = 'audimate' | 'vocalizer' | 'beatsynth';

const AudioBeast: React.FC<AudioBeastProps> = ({ onBack, hideSidebar = false, initialText }) => {
  const [activeMenu, setActiveMenu] = useState<AudioMenu>('audimate');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hasAuth, setHasAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (window.aistudio) {
        const auth = await window.aistudio.hasSelectedApiKey();
        setHasAuth(auth);
      }
    };
    checkAuth();
  }, []);

  const handleAuthorize = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasAuth(true);
    }
  };

  return (
    <div className={`min-h-screen theme-bg flex flex-col md:flex-row animate-in fade-in duration-700 overflow-hidden ${hideSidebar ? 'h-full' : ''}`}>
      {!hideSidebar && (
        <aside className={`transition-all duration-500 ease-in-out border-r theme-sidebar flex flex-col glass shrink-0 relative z-40 ${isSidebarOpen ? 'w-full md:w-80' : 'w-0 overflow-hidden'}`}>
          <div className="p-6 border-b theme-border space-y-6 sticky top-0 bg-inherit z-50">
            <button onClick={onBack} className="group flex items-center gap-3 hover:opacity-80 transition-all">
              <div className="w-8 h-8 rounded-lg theme-border flex items-center justify-center group-hover:bg-red-600 transition-colors theme-card">
                <svg className="w-4 h-4 theme-text group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              {isSidebarOpen && <span className="text-[9px] font-black uppercase tracking-[0.3em] theme-text whitespace-nowrap">Exit Terminal</span>}
            </button>

            {isSidebarOpen && (
              <div className="flex items-center gap-3 animate-in fade-in duration-500">
                <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg cinematic-border shadow-red-600/20">
                  <Volume2 className="text-white w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-extrabold text-[12px] uppercase italic theme-text">AUDIO</h1>
                  <h1 className="font-extrabold text-[10px] tracking-[0.4em] uppercase text-red-600 leading-none">BEAST</h1>
                </div>
              </div>
            )}
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-8">
            <div className="space-y-4">
              {isSidebarOpen && <h3 className="text-[10px] font-black theme-text uppercase tracking-[0.2em] opacity-40 px-2 animate-in fade-in duration-500">Sonic Modules</h3>}
              <div className="space-y-2">
                {[
                  { id: 'audimate' as AudioMenu, name: 'AUDIMATE', icon: <Waves className="w-5 h-5" />, desc: 'Neural TTS Synthesis' },
                  { id: 'vocalizer' as AudioMenu, name: 'VOCALIZER', icon: <Mic className="w-5 h-5" />, desc: 'Vocal Latent Cloning', disabled: true },
                  { id: 'beatsynth' as AudioMenu, name: 'BEATSYNTH', icon: <Music className="w-5 h-5" />, desc: 'Temporal Rhythms', disabled: true },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => !item.disabled && setActiveMenu(item.id)}
                    disabled={item.disabled}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                      activeMenu === item.id 
                        ? 'bg-red-600/10 border-red-600 text-red-600 shadow-xl' 
                        : item.disabled ? 'opacity-20 grayscale cursor-not-allowed theme-border' : 'theme-border theme-text hover:bg-white/5'
                    }`}
                  >
                    {isSidebarOpen && (
                      <>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeMenu === item.id ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(255,0,0,0.3)]' : 'theme-card theme-border'}`}>
                          {item.icon}
                        </div>
                        <div className="truncate animate-in fade-in slide-in-from-left-2 duration-500">
                          <span className="text-[11px] font-black uppercase tracking-widest block theme-text">{item.name}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest mt-0.5 block opacity-50">{item.desc}</span>
                        </div>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {isSidebarOpen && (
              <div className="pt-6 border-t theme-border space-y-4 animate-in fade-in duration-700">
                <h3 className="text-[10px] font-black theme-text uppercase tracking-[0.2em] opacity-40 px-2">Engine Authorization</h3>
                <button 
                  onClick={handleAuthorize}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${hasAuth ? 'bg-emerald-600/10 border-emerald-600 text-emerald-500 shadow-xl' : 'bg-red-600/10 border-red-600 text-red-600 shadow-xl'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${hasAuth ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white animate-pulse'}`}>
                    {hasAuth ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-widest block theme-text">{hasAuth ? 'VERTEX AUTHORIZED' : 'PRO REQUIRED'}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest mt-1 block theme-text opacity-50">{hasAuth ? 'Project Quotas Linked' : 'Select Paid Project'}</span>
                  </div>
                </button>
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <div className="p-6 border-t theme-border glass animate-in fade-in duration-500">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_#ff0000] ${hasAuth ? 'bg-emerald-600 shadow-[0_0_8px_#059669]' : 'bg-red-600'}`}></div>
                <span className="text-[9px] font-black uppercase tracking-widest theme-text opacity-40">Uplink: {hasAuth ? 'VERTEX-STABLE' : 'RHT-STABLE'}</span>
              </div>
            </div>
          )}
        </aside>
      )}

      <main className={`flex-grow flex flex-col relative theme-bg overflow-hidden ${hideSidebar ? 'h-full' : 'h-screen'}`}>
        {!hideSidebar && (
          <header className="h-16 border-b theme-border flex items-center justify-between px-8 glass shrink-0 z-20">
            <div className="flex items-center gap-5">
               <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 hover:bg-white/5 border border-white/5 rounded-xl theme-text group transition-all">
                 <Menu className={`w-5 h-5 transition-all duration-500 ${isSidebarOpen ? 'rotate-90 text-red-600' : 'text-white'}`} />
               </button>
               <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black uppercase tracking-widest theme-text opacity-40">Process:</span>
                 <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">VERTEX NEURAL ENGINE v3.0</span>
               </div>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] theme-text opacity-30">Production Terminal / Recoded Heart</span>
            </div>
          </header>
        )}

        <div className={`flex-grow overflow-y-auto custom-scrollbar relative ${hideSidebar ? '' : 'p-6 md:p-10'}`}>
          {activeMenu === 'audimate' && <AudimateTool initialText={initialText} onAuthorize={handleAuthorize} hasAuth={hasAuth} />}
        </div>
      </main>
    </div>
  );
};

// --- AUDIMATE SUB-TOOL WITH FULL CUE LIST & VERTEX ENGINE ---
const AudimateTool: React.FC<{ initialText?: string, onAuthorize: () => void, hasAuth: boolean }> = ({ initialText, onAuthorize, hasAuth }) => {
  const [text, setText] = useState(initialText || 'Welcome to Audimate! [Say storytelling: Highlight segments of your story and click the expressions in the library to apply them.] The engine will handle the synthesis perfectly.');
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].id);
  const [showLibrary, setShowLibrary] = useState(true);
  const [showToolbar, setShowToolbar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedCue, setInspectedCue] = useState<typeof EMOTION_CUES[0] | null>(EMOTION_CUES[0]);
  
  const [ttsState, setTtsState] = useState<{
    isGenerating: boolean;
    audioUrl: string | null;
    error: string | null;
    progress: string;
  }>({
    isGenerating: false,
    audioUrl: null,
    error: null,
    progress: ''
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredCues = EMOTION_CUES.filter(cue => 
    cue.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const applyEmotionToSelection = (cue: typeof EMOTION_CUES[0]) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = text.substring(start, end);
    const wrappedText = start === end ? `[${cue.prefix}...]` : `[${cue.prefix}${selectedText}]`;
    const newText = text.substring(0, start) + wrappedText + text.substring(end);
    setText(newText);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start, start + wrappedText.length);
    }, 0);
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setTtsState(prev => ({ ...prev, error: "Synthesis input is null." }));
      return;
    }

    if (!hasAuth && window.aistudio) {
      const auth = await window.aistudio.hasSelectedApiKey();
      if (!auth) {
        setTtsState(prev => ({ ...prev, error: "Authorization required for Vertex Engine." }));
        await window.aistudio.openSelectKey();
        return;
      }
    }

    setTtsState({
      isGenerating: true,
      audioUrl: null,
      error: null,
      progress: 'Analyzing segments...'
    });

    try {
      // --- SEGMENTED PARSER LOGIC ---
      const segments: { instruction: string; content: string }[] = [];
      const regex = /\[(.*?)\]/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          segments.push({ instruction: 'Say neutrally: ', content: text.substring(lastIndex, match.index).trim() });
        }
        const fullBracketContent = match[1];
        const instructionMatch = fullBracketContent.match(/^(.*?:)\s*(.*)$/);
        if (instructionMatch) {
          segments.push({ instruction: instructionMatch[1].trim() + " ", content: instructionMatch[2].trim() });
        } else {
          segments.push({ instruction: 'Say neutrally: ', content: fullBracketContent.trim() });
        }
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < text.length) {
        segments.push({ instruction: 'Say neutrally: ', content: text.substring(lastIndex).trim() });
      }

      const validSegments = segments.filter(s => s.content.length > 0);
      if (validSegments.length === 0) throw new Error("No audible content detected in script.");

      const pcmChunks: Uint8Array[] = [];

      // --- SEQUENTIAL VERTEX-GRADE SYNTHESIS ENGINE ---
      for (let i = 0; i < validSegments.length; i++) {
        const seg = validSegments[i];
        setTtsState(prev => ({ ...prev, progress: `Synthesizing Node ${i + 1}/${validSegments.length}...` }));

        const cleanPrompt = `Vocal Performance Directive: ${seg.instruction}. 
        STRICT REQUIREMENT: Maintain a clean, studio-quality dry professional voice. Zero background noise, ambiance, or static. Focus solely on the emotional tone.
        Text to speak: ${seg.content}`;

        // Create new instance for each call as per paid key selection guidelines to ensure latest key is used
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-tts',
          contents: [{ parts: [{ text: cleanPrompt }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          const binaryString = window.atob(base64Audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let b = 0; b < binaryString.length; b++) bytes[b] = binaryString.charCodeAt(b);
          pcmChunks.push(bytes);
        }
      }

      const totalLen = pcmChunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combinedPcm = new Uint8Array(totalLen);
      let offset = 0;
      for (const chunk of pcmChunks) {
        combinedPcm.set(chunk, offset);
        offset += chunk.length;
      }

      const wavBlob = createWavBlob(combinedPcm, 24000);
      const url = URL.createObjectURL(wavBlob);

      setTtsState({
        isGenerating: false,
        audioUrl: url,
        error: null,
        progress: 'Vocal synthesis successful.'
      });
    } catch (err: any) {
      console.error("Vertex Synthesis Error:", err);
      if (err.message?.includes("Requested entity was not found")) {
        onAuthorize();
      }
      setTtsState({
        isGenerating: false,
        audioUrl: null,
        error: err.message || "Synthesis failure.",
        progress: ''
      });
    }
  };

  const downloadAudio = () => {
    if (!ttsState.audioUrl) return;
    const link = document.createElement('a');
    link.href = ttsState.audioUrl;
    link.download = `VERTEX-SYNTH-${Date.now()}.wav`;
    link.click();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {/* SIDEBAR LIBRARY - RESTORED FULL LIST SCROLLING */}
      <aside className={`transition-all duration-300 flex-shrink-0 flex flex-col gap-6 ${showLibrary ? 'w-full lg:w-96 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
        <div className="glass cinematic-border rounded-[32px] p-6 h-[450px] flex flex-col space-y-6 theme-card shadow-xl overflow-hidden shrink-0">
          <div className="flex items-center justify-between border-b theme-border pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <Clapperboard className="w-5 h-5 text-red-600" />
              <h2 className="text-[10px] font-black uppercase tracking-widest theme-text">Vocal Index</h2>
            </div>
            <span className="text-[9px] font-mono theme-text opacity-40">[{filteredCues.length}]</span>
          </div>

          <div className="relative shrink-0">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
             <input type="text" placeholder="Filter expressions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full theme-bg theme-border rounded-xl pl-11 pr-4 py-3 text-[11px] font-black uppercase tracking-widest outline-none theme-text" />
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 pb-4">
            <div className="grid grid-cols-2 gap-3">
              {filteredCues.map((cue) => (
                <button key={cue.id} onClick={() => setInspectedCue(cue)} className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${inspectedCue?.id === cue.id ? 'border-red-600 ring-2 ring-red-600/10' : cue.color}`}>
                  <span className="text-xl drop-shadow-md shrink-0">{cue.icon}</span>
                  <div className="font-black text-[10px] uppercase truncate">{cue.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DETAILED INFO CARD */}
        {inspectedCue && (
          <div className="glass rounded-[32px] p-8 theme-card shadow-2xl flex flex-col gap-5 grow overflow-y-auto custom-scrollbar border theme-border animate-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-5 border-b theme-border pb-6">
               <div className="text-5xl drop-shadow-2xl animate-pulse">{inspectedCue.icon}</div>
               <div>
                  <h3 className="text-[14px] font-black uppercase tracking-[0.2em] theme-text">{inspectedCue.label}</h3>
                  <p className="text-[9px] font-black uppercase text-red-600 mt-1">Synthesis Metadata</p>
               </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                 <div className="flex items-center gap-2 opacity-40"><Wind className="w-3 h-3 text-red-600" /><span className="text-[9px] font-black uppercase theme-text">Vocal Characteristics</span></div>
                 <p className="text-[12px] font-medium leading-relaxed italic theme-text opacity-90">"{inspectedCue.feeling}"</p>
              </div>
              <div className="space-y-2">
                 <div className="flex items-center gap-2 opacity-40"><Activity className="w-3 h-3 text-red-600" /><span className="text-[9px] font-black uppercase theme-text">Tonal Influence</span></div>
                 <div className="p-4 bg-black/40 border theme-border rounded-2xl">
                    <p className="text-[10px] theme-text font-mono opacity-60">Prompting with <span className="text-red-600 font-bold italic">"{inspectedCue.prefix.trim()}"</span> will reshape the synthesis flow.</p>
                 </div>
              </div>
            </div>
            <button onClick={() => applyEmotionToSelection(inspectedCue)} className="mt-auto w-full py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg">Apply to Selection</button>
          </div>
        )}
      </aside>

      {/* EDITOR & CONTROLS */}
      <section className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border theme-border">
            <button onClick={() => setShowLibrary(!showLibrary)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${showLibrary ? 'bg-red-600 text-white shadow-lg' : 'theme-text opacity-40 hover:opacity-100'}`}>Library</button>
            <button onClick={() => setShowToolbar(!showToolbar)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${showToolbar ? 'bg-red-600 text-white shadow-lg' : 'theme-text opacity-40 hover:opacity-100'}`}>Toolbar</button>
          </div>
          <div className="flex items-center gap-3 glass theme-border rounded-full px-6 py-2.5 shadow-xl">
            <Settings className="w-4 h-4 text-red-600" />
            <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="bg-transparent text-[11px] font-black uppercase theme-text outline-none cursor-pointer">
              {VOICE_OPTIONS.map(v => <option key={v.id} value={v.id} className="bg-zinc-900 text-white">{v.name} ({v.gender})</option>)}
            </select>
          </div>
        </div>

        {showToolbar && (
          <div className="flex-shrink-0 animate-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col bg-black/60 border theme-border rounded-[28px] p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 px-4 border-b theme-border border-white/5 pb-3 mb-3 text-red-600 shrink-0">
                <Clapperboard className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-widest">Global Style Matrix</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2 pb-2">
                {EMOTION_CUES.map((cue) => (
                  <button key={`tool-${cue.id}`} onClick={() => applyEmotionToSelection(cue)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[9px] font-black uppercase transition-all whitespace-nowrap ${cue.color}`}><span>{cue.icon}</span>{cue.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-[400px] flex flex-col bg-black/40 border theme-border rounded-[48px] overflow-hidden relative group shadow-2xl cinematic-border">
          <textarea ref={textareaRef} value={text} onChange={(e) => setText(e.target.value)} className="flex-1 w-full bg-transparent p-12 resize-none text-xl theme-text placeholder:opacity-20 outline-none font-medium leading-relaxed custom-scrollbar selection:bg-red-600/30" placeholder="Ingest script... [Instruction: text to speak]" />
          <div className="absolute bottom-8 right-8">
            <button onClick={() => setText('')} className="p-5 glass hover:bg-red-600/20 border-red-600/30 rounded-[28px] transition-all text-red-600 shadow-xl"><Trash2 className="w-6 h-6" /></button>
          </div>
        </div>

        {/* STATUS FOOTER */}
        <div className="bg-black/90 border theme-border rounded-[3.5rem] p-5 flex flex-col md:flex-row items-center gap-8 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-8 duration-500 mb-6 shrink-0">
          <div className="flex-1 px-6 w-full">
            {ttsState.isGenerating ? (
              <div className="flex items-center gap-5 text-red-600 animate-pulse">
                <div className="flex space-x-2">
                  <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }} />
                  <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }} />
                  <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-bounce" />
                </div>
                <span className="text-[12px] font-black uppercase tracking-[0.2em]">{ttsState.progress}</span>
              </div>
            ) : ttsState.error ? (
              <div className="flex items-center gap-4 text-red-500">
                <AlertCircle className="w-6 h-6" />
                <span className="text-[11px] font-black uppercase">{ttsState.error}</span>
              </div>
            ) : ttsState.audioUrl ? (
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3 text-emerald-500 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="text-[11px] font-black uppercase">Master Synchronized</span>
                </div>
                <audio controls src={ttsState.audioUrl} className="h-11 filter invert grayscale brightness-200 contrast-150" />
              </div>
            ) : (
              <div className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-4 italic opacity-40">
                <Sparkles className="w-5 h-5" />
                Awaiting Vertex Engine Directive...
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {ttsState.audioUrl && (
              <button onClick={downloadAudio} className="p-5 glass border theme-border rounded-full transition-all shadow-xl"><Download className="w-5 h-5 theme-text" /></button>
            )}
            <button onClick={handleGenerate} disabled={ttsState.isGenerating} className="flex-1 md:flex-none btn-ultra px-16 py-5 rounded-full text-[12px] min-w-[240px] flex items-center justify-center gap-4">
              {ttsState.isGenerating ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{ttsState.isGenerating ? 'Synthesizing...' : 'EXECUTE VERTEX SYNTH'}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AudioBeast;
