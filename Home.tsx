
import React, { useState, useEffect, useRef } from 'react';

interface HomeProps {
  onStartStoryMorph: () => void;
  onStartCinetrack: () => void;
  onStartToonCluster: () => void;
  onStartAudioBeast: () => void;
  onStartMotionFlow: () => void;
}

interface AppCardProps {
  title: string;
  description: string;
  icon: string;
  status: string;
  onClick: () => void;
  accent?: string;
  disabled?: boolean;
}

const SilicaClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { clientX, clientY } = e;
    const x = (window.innerWidth / 2 - clientX) / 80;
    const y = (window.innerHeight / 2 - clientY) / 80;
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg) translateY(-2px)`;
  };

  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');

  return (
    <div className="relative w-full max-w-4xl mx-auto px-4">
      {/* GLOWING AMBIENT OUTER RING */}
      <div className="absolute inset-0 bg-red-600/10 blur-[80px] rounded-[64px] pointer-events-none"></div>

      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative group transition-all duration-700 ease-out select-none cursor-default py-12 px-16 rounded-[64px] border-[6px] border-red-600 overflow-hidden bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-[80px] shadow-[0_0_60px_rgba(255,0,0,0.4)] theme-card flex items-center justify-center"
        style={{ perspective: '1500px', transformStyle: 'preserve-3d' }}
      >
        {/* Subtle Scan Pulse */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[95%] h-px bg-red-600/20 animate-pulse z-10"></div>
        
        {/* Vaporous Conic Background Effect */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_180deg_at_50%_50%,transparent_0deg,rgba(255,0,0,0.05)_80deg,transparent_150deg)] vapor-conic pointer-events-none z-0"></div>
        
        {/* Stratified Accents */}
        <div className="absolute top-[-40px] left-[-40px] w-64 h-64 bg-red-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 bg-red-800/15 rounded-full blur-[120px] pointer-events-none"></div>
        
        {/* Main Time Display */}
        <div className="relative z-10 flex items-baseline justify-center gap-8 py-2">
          <div className="flex items-center text-8xl md:text-9xl lg:text-[10rem] font-black italic tracking-[calc(-0.06em)] uppercase leading-none theme-text">
            <span>{hh}</span>
            <span className="text-red-600/30 mx-6 animate-pulse">:</span>
            <span>{mm}</span>
          </div>
          <div className="flex flex-col gap-1 items-start">
            <span className="text-3xl md:text-4xl font-black font-mono text-red-600/60 tracking-[0.2em]">{ss}</span>
          </div>
        </div>

        {/* Inner Glass Polish */}
        <div className="absolute inset-1 rounded-[56px] border border-white/5 pointer-events-none"></div>
      </div>
    </div>
  );
};

const AppCard: React.FC<AppCardProps> = ({ title, description, icon, status, onClick, accent = "red-600", disabled = false }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`group relative w-full max-w-[340px] text-left transition-all duration-500 ${disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:-translate-y-2'}`}
  >
    {!disabled && <div className={`absolute inset-0 bg-red-600/10 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[40px]`}></div>}
    
    <div className="relative glass cinematic-border hover-highlight rounded-[40px] p-9 border overflow-hidden shadow-2xl h-full flex flex-col justify-between theme-card">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-red-600/20 transition-all duration-700`}></div>
      
      <div className="flex flex-col space-y-7">
        <div className="flex justify-between items-start">
          <div className={`w-14 h-14 ${disabled ? 'bg-zinc-800' : `btn-ultra`} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
            <span className="text-2xl font-black text-white">{icon}</span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[8px] font-black uppercase tracking-[0.3em] theme-text opacity-40">Status</span>
             <span className={`text-[9px] font-black ${disabled ? 'theme-text opacity-30' : `text-red-600`} uppercase tracking-widest`}>{status}</span>
          </div>
        </div>

        <div>
          <h3 className={`text-2xl font-black italic tracking-tighter uppercase transition-colors theme-text ${!disabled && `group-hover:text-red-600`}`}>
            {title}
          </h3>
          <p className="text-[11px] leading-relaxed mt-2 font-medium theme-text opacity-70 group-hover:opacity-100 transition-opacity">
            {description}
          </p>
        </div>

        <div className="pt-4 flex items-center justify-between">
           <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-black/10 bg-white/20 flex items-center justify-center">
                   <div className="w-1 h-1 rounded-full bg-red-600"></div>
                </div>
              ))}
           </div>
           {!disabled && (
             <div className="flex items-center gap-3">
               <span className="text-[9px] font-black uppercase tracking-widest theme-text group-hover:text-red-600 transition-colors">Launch Module</span>
               <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/5 border theme-border group-hover:bg-red-600 group-hover:border-red-600 group-hover:shadow-[0_0_20px_rgba(255,0,0,0.4)]`}>
                  <svg className="w-4 h-4 theme-text group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  </button>
);

const Home: React.FC<HomeProps> = ({ onStartStoryMorph, onStartCinetrack, onStartToonCluster, onStartAudioBeast, onStartMotionFlow }) => {
  return (
    <div className="min-h-screen flex flex-col items-center relative theme-text bg-transparent custom-scrollbar overflow-y-auto">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/5 blur-[150px] rounded-full"></div>
      
      <header className="w-full h-24 flex items-center justify-between px-16 z-20 shrink-0">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-2xl shadow-red-600/30 cinematic-border">
              <span className="text-white text-xl font-black">▶</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-black uppercase tracking-[0.4em] italic leading-none theme-text">Recoded Heart</span>
              <span className="text-[9px] font-black text-red-600 uppercase tracking-[0.6em] leading-none mt-1.5">Theatre Studio</span>
            </div>
         </div>
         <div className="flex items-center gap-10">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] theme-text opacity-50">Production Link: 0x01A</span>
            <div className="w-10 h-10 rounded-xl glass theme-border flex items-center justify-center cursor-pointer hover:border-red-600 transition-colors group">
               <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse group-hover:shadow-[0_0_15px_#ff0000]"></div>
            </div>
         </div>
      </header>

      <div className="flex-grow w-full max-w-[90rem] px-16 flex flex-col relative z-10 py-12">
        
        {/* Silica Chronograph Section - Clean focal point with only tile edge branded */}
        <div className="w-full flex flex-col items-center mt-20 mb-24 animate-in fade-in zoom-in duration-1000">
           <SilicaClock />
        </div>

        <div className="relative text-center mb-24 space-y-10 animate-in fade-in zoom-in duration-1000">
          <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
          
          <div className="flex items-center justify-center gap-6">
            <div className="w-12 h-px bg-red-600 opacity-30"></div>
            <span className="text-[11px] font-black text-red-600 uppercase tracking-[0.8em]">Interface Online</span>
            <div className="w-12 h-px bg-red-600 opacity-30"></div>
          </div>
          
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-black italic tracking-tighter uppercase leading-[0.8] theme-text transition-all">
            RHT Studio<br />
            <span className="stroke-text">Terminal</span>
          </h1>
          
          <p className="text-lg md:text-xl max-w-3xl mx-auto font-medium tracking-wide theme-text opacity-60 leading-relaxed italic">
            Orchestrate cinematic narrative beats through high-fidelity neural synthesis. Bridge storyboards and temporal motion seamlessly in the Recoded Heart production suite.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 justify-items-center animate-in fade-in slide-in-from-bottom-12 duration-1000 mb-32">
          <AppCard 
            title="StoryMorph"
            description="Cinematic storyboarding engine. Convert narrative segments into synchronized visual prompts for production."
            icon="▶"
            status="Module: Active"
            onClick={onStartStoryMorph}
          />

          <AppCard 
            title="ToonCluster"
            description="Professional cartoon scripting engine. Automated scene breakdowns and visual choreography for viral animation."
            icon="🎬"
            status="Module: Online"
            onClick={onStartToonCluster}
          />

          <AppCard 
            title="Cinetrack"
            description="Temporal extension tool for adding neural motion segments and upscaling production assets."
            icon="▤"
            status="Module: Connected"
            onClick={onStartCinetrack}
          />

          <AppCard 
            title="MotionFlow"
            description="Sequential neural upscaling and temporal consistency engine for high-res sequence exports."
            icon="🌀"
            status="Module: Beta"
            onClick={onStartMotionFlow}
          />

          <AppCard 
            title="AudioBeast"
            description="Legendary AI Sound Engine. Voice synthesis, audio intelligence, and neural audio reshaping."
            icon="🔊"
            status="Module: Online"
            onClick={onStartAudioBeast}
          />
        </div>
      </div>

      <div className="w-full flex justify-center items-center gap-10 py-12 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_15px_#ff0000] animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.5em] theme-text">System Core 2.5</span>
        </div>
        <div className="h-5 w-px theme-border"></div>
        <span className="text-[10px] font-black uppercase tracking-[0.5em] theme-text opacity-40">Uplink Stable</span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .stroke-text {
          -webkit-text-stroke: 1.5px currentColor;
          color: transparent;
        }
        .group:hover .stroke-text {
          -webkit-text-stroke: 1.5px #ff0000;
        }
      `}} />
    </div>
  );
};

export default Home;
