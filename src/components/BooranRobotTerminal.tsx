import React, { useState, useEffect, useRef } from 'react';
import { Bot, Terminal, Cpu, ShieldAlert, Zap, Send, RefreshCw, Sliders, EyeOff, Activity, HardDrive } from 'lucide-react';
import { playRobotPartClickSound, playRobotBootSound, startRobotCrySound } from '../utils/audioHelper';

export default function BooranRobotTerminal() {
  const [logs, setLogs] = useState<string[]>([
    "BOOT: Security core handshake loaded on node v4.1",
    "DECRYPT: AES-256 local enclave sync... STATUS: OK",
    "SHIELD: Real-time packet obfuscator initialized",
    "CLICK any part of the Vector Robot below to trigger system actions!"
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isBlinking, setIsBlinking] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Advanced Robot interactive state parameters
  const [antennaFreq, setAntennaFreq] = useState(2.4);
  const [eyeState, setEyeState] = useState<'scan' | 'pulse' | 'radar' | 'secure'>('scan');
  const [shieldActive, setShieldActive] = useState(true);
  const [threatMonitor, setThreatMonitor] = useState(true);
  const [blurIntensity, setBlurIntensity] = useState('HIGH');
  const [legCalibration, setLegCalibration] = useState(1.0);
  const [activeSegment, setActiveSegment] = useState<string>('Hover parts to inspect');

  // Interactive hold & drag parameters (moving navigation + distress cry sound)
  const [isHolding, setIsHolding] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const startDragOffset = useRef({ x: 0, y: 0 });
  const cryAudioRef = useRef<{ stop: () => void } | null>(null);

  // Bind window-wide mouse-move and mouse-up events when holding
  useEffect(() => {
    if (!isHolding) return;

    const handleMouseMove = (e: MouseEvent) => {
      const offsetX = e.clientX - startDragOffset.current.x;
      const offsetY = e.clientY - startDragOffset.current.y;
      setDragOffset({
        x: Math.max(-120, Math.min(120, offsetX)),
        y: Math.max(-95, Math.min(95, offsetY))
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const t = e.touches[0];
      const offsetX = t.clientX - startDragOffset.current.x;
      const offsetY = t.clientY - startDragOffset.current.y;
      setDragOffset({
        x: Math.max(-120, Math.min(120, offsetX)),
        y: Math.max(-95, Math.min(95, offsetY))
      });
    };

    const handleMouseUp = () => {
      setIsHolding(false);
      setDragOffset({ x: 0, y: 0 });
      if (cryAudioRef.current) {
        cryAudioRef.current.stop();
        cryAudioRef.current = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isHolding]);

  // Clean prior cry audio on unmount
  useEffect(() => {
    return () => {
      if (cryAudioRef.current) {
        cryAudioRef.current.stop();
      }
    };
  }, []);

  // Play robot boot chime on display mount
  useEffect(() => {
    // Slight delay so the visual frame loads fully first
    const timer = setTimeout(() => {
      playRobotBootSound();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Handle terminal submit
  const handlePingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    playRobotPartClickSound('click');
    const userMsg = inputValue.trim();
    setLogs(prev => [...prev, `USER: ${userMsg}`]);
    setInputValue('');
    setIsComputing(true);

    setTimeout(() => {
      setIsComputing(false);
      let reply = "";
      const lower = userMsg.toLowerCase();

      if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        reply = "ROBOT: Connection verified. All sentinel node links healthy.";
      } else if (lower.includes('shield') || lower.includes('security') || lower.includes('firewall')) {
        reply = `ROBOT: AI-Shield system is ${shieldActive ? 'ACTIVE (Optimal protection)' : 'STANDBY (Activate shield for full cover)'}. Obfuscator operational.`;
      } else if (lower.includes('status') || lower.includes('check')) {
        reply = `ROBOT: System metrics - Antenna Freq: ${antennaFreq} GHz. Eye Mode: ${eyeState.toUpperCase()}. Biometric Blur: ${blurIntensity}.`;
      } else if (lower.includes('stars') || lower.includes('points')) {
        reply = "ROBOT: Standings verified with local node ledger. Core standing claims: +50 Stars pending daily verification.";
      } else {
        reply = `ROBOT: Query processed successfully. Reference code: [SEC-${Math.random().toString(16).slice(2, 6).toUpperCase()}].`;
      }

      setLogs(prev => [...prev, reply]);
      playRobotPartClickSound('head');
    }, 750);
  };

  // Specific custom robot part interactions
  const handleAntennaClick = () => {
    playRobotPartClickSound('antenna');
    const nextFreq = parseFloat((1.2 + Math.random() * 8.8).toFixed(1));
    setAntennaFreq(nextFreq);
    setActiveSegment("Robot Antenna Signal System");
    setLogs(prev => [
      ...prev,
      `[ANTENNA] Calibrating frequency to high-band ${nextFreq} GHz...`,
      `[SYSTEM] Wireless sync handshake status: SECURE. 0% packet loss.`
    ].slice(-24));
  };

  const handleHeadClick = () => {
    playRobotPartClickSound('head');
    const states: ('scan' | 'pulse' | 'radar' | 'secure')[] = ['scan', 'pulse', 'radar', 'secure'];
    const currentIdx = states.indexOf(eyeState);
    const nextState = states[(currentIdx + 1) % states.length];
    setEyeState(nextState);
    setActiveSegment("Robot Sensor Core (Eyes)");
    setLogs(prev => [
      ...prev,
      `[SENSOR] Cycle eye expression to mode: [${nextState.toUpperCase()}]`,
      `[ENCRYPT] Regenerated temporal key: SHA-512 [${Math.random().toString(36).substring(2, 8).toUpperCase()}]`
    ].slice(-24));
  };

  const handleTorsoClick = () => {
    playRobotPartClickSound('torso');
    setShieldActive(prev => !prev);
    setActiveSegment("Robot Chassis & Firewall");
    setLogs(prev => [
      ...prev,
      `[SHIELD] Anti-breach containment protocol: ${!shieldActive ? 'RE-ARMED / ONLINE' : 'STANDBY MODE'}`
    ].slice(-24));
  };

  const handleArmClick = (side: 'left' | 'right') => {
    playRobotPartClickSound('arm');
    setActiveSegment(`Robot ${side === 'left' ? 'Left' : 'Right'} Sweep Deflector`);
    setLogs(prev => [
      ...prev,
      `[ARM-${side.toUpperCase()}] Spreading peripheral sweep vectors...`,
      `[SECURITY] Diagnostic perimeter radius clear of malware packets.`
    ].slice(-24));
  };

  const handleLegClick = () => {
    playRobotPartClickSound('leg');
    const scale = parseFloat((1.0 + Math.random() * 0.5).toFixed(2));
    setLegCalibration(scale);
    setActiveSegment("Robot Calibration Struts");
    setLogs(prev => [
      ...prev,
      `[CALIB strid] Leg alignments leveled. Speed scale set: ${scale}x`,
      `[SYSTEM] Zero torque variance detected in sub-joints.`
    ].slice(-24));
  };

  return (
    <div id="extended-robot-terminal-view" className="flex flex-col min-h-screen bg-black text-white p-5 pb-24 select-none justify-between overflow-x-hidden">
      
      {/* Upper header */}
      <header id="robot-view-header" className="mb-2">
        <span className="text-[10px] text-brand-pink font-bold uppercase tracking-widest block font-mono">
          Booran AI-Shield Node
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5 font-display">
          <Bot className="w-4.5 h-4.5 text-brand-pink animate-pulse" /> Sentinel interactive Terminal
        </h2>
      </header>

      {/* Decorative warning banner status */}
      <div className="flex items-center justify-between px-3 py-2 bg-neutral-900 border border-white/5 rounded-xl text-[10px] font-mono text-neutral-400 mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${shieldActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-white tracking-widest uppercase">
            SHIELD: {shieldActive ? 'ENABLED' : 'STANDBY'}
          </span>
        </div>
        <div className="text-[9px] text-[#00b0ff]">INTEGRITY: 99.98%</div>
      </div>

      {/* Robot segment identifier banner */}
      <div className="text-center py-1 bg-white/5 rounded-lg border border-white/5 text-[9px] uppercase font-mono tracking-wider text-neutral-400 mb-3">
        Active Focus: <span className="text-white font-bold">{activeSegment}</span>
      </div>

      {/* Interactive Main Symmetrical Robot Workspace */}
      <div className="relative py-4 bg-neutral-900/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center min-h-[220px] shadow-inner mb-3 overflow-hidden">
        
        {/* Glow behind character */}
        <div className={`absolute w-36 h-36 rounded-full blur-[45px] opacity-20 duration-500 pointer-events-none transition-colors ${
          shieldActive ? 'bg-emerald-500' : 'bg-brand-pink'
        }`} />

        {/* Laser sweep scanner diagnostic sweep */}
        <div className="absolute inset-x-0 w-full h-[1.5px] bg-brand-pink/70 shadow-[0_0_8px_#F52C68] pointer-events-none animate-scanline-sweep z-20" />

        {/* Dynamic Distress Warning HUD for whimper cry sound while holding */}
        {isHolding && (
          <div className="absolute top-1 max-w-[90%] px-2.5 py-0.5 bg-brand-pink/20 border border-brand-pink/40 text-[8px] uppercase font-mono tracking-widest text-brand-pink rounded-full animate-bounce z-30">
            ⚠️ UNIT DISTRESS: HIGH-FREQUENCY CRYING
          </div>
        )}

        {/* 
          EXACT WHITE LINE OUTLINE VECTOR ROBOT 
          Every clickable component represents a different system module to interact with!
        */}
        <div 
          id="interactive-central-robot" 
          onMouseDown={(e) => {
            e.preventDefault();
            setIsHolding(true);
            if (cryAudioRef.current) cryAudioRef.current.stop();
            cryAudioRef.current = startRobotCrySound();
            startDragOffset.current = {
              x: e.clientX - dragOffset.x,
              y: e.clientY - dragOffset.y
            };
          }}
          onTouchStart={(e) => {
            if (e.touches.length === 0) return;
            setIsHolding(true);
            if (cryAudioRef.current) cryAudioRef.current.stop();
            cryAudioRef.current = startRobotCrySound();
            startDragOffset.current = {
              x: e.touches[0].clientX - dragOffset.x,
              y: e.touches[0].clientY - dragOffset.y
            };
          }}
          className={`flex flex-col items-center relative z-10 select-none ${
            isHolding ? 'cursor-grabbing drop-shadow-[0_0_15px_rgba(245,44,104,0.75)]' : 'cursor-grab'
          }`}
          style={{
            transform: `scale(${isHolding ? 1.35 : 1.25}) translate(${dragOffset.x}px, ${dragOffset.y}px)`,
            transition: isHolding ? 'none' : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.320, 1.275)'
          }}
        >
          
          {/* 1. Interactive Antenna */}
          <button 
            id="antenna-node-btn"
            onClick={handleAntennaClick}
            className="flex flex-col items-center group focus:outline-none relative cursor-pointer"
            title="Antenna Controller"
          >
            {/* Pulsing signal waves indicator */}
            <div className={`absolute -top-3 w-5 h-5 rounded-full border border-white/20 animate-ping pointer-events-none ${
              isComputing ? 'bg-brand-pink/10 border-brand-pink/40' : ''
            }`} />
            
            {/* The structural Antenna stalk and dome tip */}
            <div className={`w-[4px] h-[14px] transition-colors rounded-t-sm duration-300 ${
              isComputing ? 'bg-brand-pink' : 'bg-white group-hover:bg-[#00b0ff]'
            }`} />
            <div className={`w-2.5 h-2.5 rounded-full absolute -top-2 transition-all duration-300 ${
              isComputing ? 'bg-brand-pink shadow-[0_0_8px_#F52C68]' : 'bg-white group-hover:bg-amber-400 shadow-[0_0_6px_rgba(255,255,255,0.8)]'
            }`} />
          </button>
          
          {/* 2. Interactive Head Box */}
          <button
            id="head-node-btn"
            onClick={handleHeadClick}
            className="w-[72px] h-[44px] border-[3.2px] border-white rounded-[15px] flex items-center justify-center gap-3.5 bg-black transition-all group duration-300 hover:border-brand-pink/80 hover:shadow-[0_0_12px_rgba(245,44,104,0.3)] relative -mt-[1px] cursor-pointer"
            title="Sensor Core & AI Processor"
          >
            {/* Eye Left */}
            <div className={`w-2 h-2 rounded-full duration-300 transition-all ${
              eyeState === 'scan' ? 'bg-white scale-110' :
              eyeState === 'pulse' ? 'bg-[#00b0ff] animate-pulse scale-125' :
              eyeState === 'radar' ? 'bg-brand-pink border border-white' : 'bg-emerald-400 scale-90'
            }`} />

            {/* Eye Right */}
            <div className={`w-2 h-2 rounded-full duration-300 transition-all ${
              eyeState === 'scan' ? 'bg-white scale-110' :
              eyeState === 'pulse' ? 'bg-[#00b0ff] animate-pulse scale-125' :
              eyeState === 'radar' ? 'bg-brand-pink border border-white' : 'bg-emerald-400 scale-90'
            }`} />

            {/* Speaking mic sensor lines inside head */}
            <span className="absolute bottom-1 w-6 h-[2px] bg-white/20 rounded-full flex justify-around">
              <span className={`w-1 h-full bg-white/30 ${isComputing ? 'animate-bounce' : ''}`} />
              <span className={`w-1 h-full bg-[#00b0ff]/50 ${isComputing ? 'animate-bounce' : ''}`} />
            </span>
          </button>
          
          {/* Neck connector link */}
          <div className="w-[4px] h-[8px] bg-white" />
          
          {/* 3. Interactive Torso & Firewall block */}
          <div
            id="torso-node-btn"
            className={`relative w-[44px] h-[30px] border-[3.2px] rounded-[5px] transition-all duration-300 cursor-pointer ${
              shieldActive 
                ? 'border-white bg-[#00b0ff]/5 shadow-[0_0_10px_rgba(0,176,255,0.2)]' 
                : 'border-white/50 bg-black/80'
            }`}
            title="Shield & Firewall Core"
          >
            {/* Click-jacking target for Torso itself */}
            <div 
              className="absolute inset-0 w-full h-full cursor-pointer z-10"
              onClick={handleTorsoClick}
            />

            {/* Glowing Shield LED in center */}
            <div className="absolute inset-0 m-auto w-2.5 h-2.5 rounded-full flex items-center justify-center pointer-events-none z-10">
              <span className={`w-1.5 h-1.5 rounded-full ${shieldActive ? 'bg-[#00b0ff] animate-pulse' : 'bg-neutral-600'}`} />
            </div>

            {/* Left Arm connection logic */}
            <button
              id="sub-arm-l"
              onClick={(e) => {
                e.stopPropagation();
                handleArmClick('left');
              }}
              className="absolute right-full top-2 mr-1 group cursor-pointer z-20"
              title="Left Sweep Arm"
            >
              <div className="w-[14px] h-[3px] bg-white transform rotate-[32deg] origin-right hover:bg-brand-pink duration-200" />
            </button>

            {/* Right Arm connection logic */}
            <button
              id="sub-arm-r"
              onClick={(e) => {
                e.stopPropagation();
                handleArmClick('right');
              }}
              className="absolute left-full top-2 ml-1 group cursor-pointer z-20"
              title="Right Sweep Arm"
            >
              <div className="w-[14px] h-[3px] bg-white transform -rotate-[32deg] origin-left hover:bg-brand-pink duration-200" />
            </button>
          </div>
          
          {/* 4. Interactive Legs Strut block */}
          <button 
            id="legs-node-btn"
            onClick={handleLegClick}
            className="w-[24px] flex justify-between cursor-pointer group"
            title="Joint Calibration legs"
          >
            <div className="w-[4px] h-[18px] bg-white group-hover:bg-[#00b0ff] duration-200 origin-top" />
            <div className="w-[4px] h-[18px] bg-white group-hover:bg-[#00b0ff] duration-200 origin-top" />
          </button>

        </div>
      </div>

      {/* Grid of Interactive Hardware Toggles & Dashboard Controls */}
      <h3 className="text-[9px] uppercase font-mono text-neutral-500 tracking-wider mb-1.5 font-bold">
        Hardware Control Registers
      </h3>
      <div className="grid grid-cols-2 gap-2 mb-3">
        
        {/* Toggle 1: Firewall Shield */}
        <button
          onClick={() => {
            setShieldActive(p => !p);
            setLogs(prev => [...prev, `[USER TOGG] Manually clicked Firewall: ${!shieldActive ? 'ON' : 'OFF'}`]);
          }}
          className={`flex items-center gap-2 px-3 py-2 border rounded-xl duration-200 cursor-pointer active:scale-95 ${
            shieldActive 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
              : 'bg-neutral-900 border-white/5 text-neutral-400'
          }`}
        >
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <div className="flex flex-col items-start leading-[1.1]">
            <span className="text-[9px] font-mono uppercase font-bold">Firewall</span>
            <span className="text-[8px] font-mono text-neutral-500">{shieldActive ? 'SECURE' : 'STANDBY'}</span>
          </div>
        </button>

        {/* Toggle 2: Threat Monitor */}
        <button
          onClick={() => {
            setThreatMonitor(p => !p);
            setLogs(prev => [...prev, `[USER TOGG] Threat monitoring: ${!threatMonitor ? 'ACTIVATED' : 'DISABLED'}`]);
          }}
          className={`flex items-center gap-2 px-3 py-2 border rounded-xl duration-200 cursor-pointer active:scale-95 ${
            threatMonitor 
              ? 'bg-blue-950/40 border-[#00b0ff]/30 text-[#00b0ff]' 
              : 'bg-neutral-900 border-white/5 text-neutral-400'
          }`}
        >
          <Activity className="w-3.5 h-3.5 shrink-0" />
          <div className="flex flex-col items-start leading-[1.1]">
            <span className="text-[9px] font-mono uppercase font-bold">Watchdog</span>
            <span className="text-[8px] font-mono text-neutral-500">{threatMonitor ? 'ACTIVE' : 'MUTED'}</span>
          </div>
        </button>

        {/* Toggle 3: Obfuscation Blur Level */}
        <button
          onClick={() => {
            const nextLvl = blurIntensity === 'HIGH' ? 'MED' : blurIntensity === 'MED' ? 'LOW' : 'HIGH';
            setBlurIntensity(nextLvl);
            setLogs(prev => [...prev, `[USER TOGG] Obfuscation blur factor configured: ${nextLvl}`]);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-white/5 rounded-xl duration-200 cursor-pointer hover:border-white/20 active:scale-95"
        >
          <EyeOff className="w-3.5 h-3.5 text-brand-pink shrink-0" />
          <div className="flex flex-col items-start leading-[1.1]">
            <span className="text-[9px] font-mono uppercase text-neutral-300 font-bold">Blur Level</span>
            <span className="text-[8px] font-mono text-neutral-500">{blurIntensity}</span>
          </div>
        </button>

        {/* Toggle 4: Quick Memory Sanitation */}
        <button
          onClick={() => {
            setLogs(prev => [
              ...prev,
              "[CLEANUP] Purged secondary heap garbage collectors...",
              "[SYSTEM] Freed 384 KB allocation registers cleanly."
            ]);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-white/5 rounded-xl duration-200 cursor-pointer hover:border-white/20 active:scale-95"
        >
          <HardDrive className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <div className="flex flex-col items-start leading-[1.1]">
            <span className="text-[9px] font-mono uppercase text-neutral-300 font-bold">Sanitize</span>
            <span className="text-[8px] font-mono text-neutral-500">RUN GC CASE</span>
          </div>
        </button>

      </div>

      {/* Simulated Live Terminal Log output */}
      <div className="flex-1 min-h-[140px] bg-black border border-white/5 rounded-2xl p-3 flex flex-col justify-between font-mono relative">
        <div className="absolute top-2 right-2 text-[8px] text-neutral-500 flex items-center gap-1 uppercase">
          <Terminal className="w-2.5 h-2.5" /> SECURE_STDOUT
        </div>
        
        {/* Logs viewport */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-1 text-[9px] text-neutral-300 pr-1 select-text custom-scrollbar scroll-smooth"
        >
          {logs.map((log, idx) => {
            let color = "text-neutral-400";
            if (log.startsWith("USER:")) color = "text-[#00b0ff] font-bold";
            else if (log.startsWith("ROBOT:")) color = "text-brand-pink font-semibold";
            else if (log.includes("[ANTENNA]") || log.includes("[SENSOR]") || log.includes("[SHIELD]") || log.includes("[ARM-") || log.includes("[CALIB")) color = "text-yellow-400";
            else if (log.includes("OK") || log.includes("SECURE") || log.includes("RE-ARMED") || log.includes("cleared")) color = "text-emerald-400";
            else if (log.includes("BOOT") || log.includes("STATUS") || log.includes("CLICK")) color = "text-[#00b0ff]";
 
            return (
              <div id={`log-item-${idx}`} key={idx} className={`leading-relaxed border-l-2 pl-2 ${
                log.startsWith("USER:") ? 'border-[#00b0ff]/30' : log.startsWith("ROBOT:") ? 'border-brand-pink/30' : 'border-neutral-800'
              }`}>
                <span className={color}>{log}</span>
              </div>
            );
          })}
          {isComputing && (
            <div className="text-brand-pink text-[9px] italic animate-pulse pl-2 border-l-2 border-brand-pink/30">
              Agent core decrypting handshake credentials...
            </div>
          )}
        </div>

        {/* Quick status tokens */}
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-white/5 overflow-x-auto whitespace-nowrap text-[8px] text-neutral-500">
          <button id="quick-btn-ping" className="bg-neutral-900 border border-white/5 py-0.5 px-2 rounded hover:text-white cursor-pointer" onClick={() => setLogs(p => [...p, "DIAG: Ping latency metrics 7ms"])}>Ping Diagnostics</button>
          <button id="quick-btn-enclave" className="bg-neutral-900 border border-white/5 py-0.5 px-2 rounded hover:text-white cursor-pointer" onClick={() => setLogs(p => [...p, "SHIELD: Integrity check verified OK"])}>Check Enclave</button>
          <button id="quick-btn-clear" className="bg-neutral-900 border border-white/5 py-0.5 px-2 rounded hover:text-white cursor-pointer" onClick={() => setLogs([])}>Clear Console</button>
        </div>
      </div>

      {/* Input query field directly mimicking Screen suggestions */}
      <form onSubmit={handlePingSubmit} className="mt-3.5 flex items-center space-x-2">
        <div className="flex-1 h-10 bg-neutral-900 rounded-xl flex items-center px-3 border border-white/5 focus-within:border-brand-pink/50 transition-colors">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Query Shield-Bot (e.g., status, security, hi)"
            className="w-full bg-transparent outline-none text-white text-xs placeholder-neutral-600"
          />
        </div>
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
