import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Cpu, 
  Layers, 
  Activity, 
  Database, 
  Shield, 
  Zap, 
  ChevronRight, 
  Download, 
  ExternalLink, 
  Sparkles, 
  Sliders, 
  RefreshCw, 
  Radio, 
  FileText, 
  CheckCircle, 
  Terminal, 
  Users,
  Send,
  Minimize2,
  Maximize2,
  Compass,
  Code,
  Globe,
  Mail,
  MapPin,
  Menu,
  X,
  Settings,
  Brain,
  Flame,
  Monitor,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  Play
} from 'lucide-react';

const CyberStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes pulseSoft {
      0%, 100% { opacity: 0.3; filter: drop-shadow(0 0 2px rgba(34, 197, 94, 0.2)); }
      50% { opacity: 0.7; filter: drop-shadow(0 0 12px rgba(34, 197, 94, 0.8)); }
    }
    @keyframes neonGlowGreen {
      0%, 100% { box-shadow: 0 0 15px rgba(34, 197, 94, 0.15), inset 0 0 10px rgba(34, 197, 94, 0.05); }
      50% { box-shadow: 0 0 25px rgba(34, 197, 94, 0.35), inset 0 0 15px rgba(34, 197, 94, 0.1); }
    }
    .neon-border-green {
      border: 1px solid rgba(34, 197, 94, 0.3);
      animation: neonGlowGreen 6s infinite ease-in-out;
    }
    .text-glow-green {
      text-shadow: 0 0 10px rgba(34, 197, 94, 0.6);
    }
    .glass-morphism {
      background: rgba(4, 9, 7, 0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(34, 197, 94, 0.15);
    }
    .glass-premium {
      background: linear-gradient(135deg, rgba(3, 12, 6, 0.95) 0%, rgba(1, 4, 2, 0.98) 100%);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(34, 197, 94, 0.25);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85);
    }
    .premium-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .premium-scrollbar::-webkit-scrollbar-track {
      background: rgba(1, 4, 2, 0.8);
    }
    .premium-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(34, 197, 94, 0.35);
      border-radius: 4px;
    }
    .premium-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(34, 197, 94, 0.75);
    }
    .page-fade-in {
      animation: pageFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes pageFadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .scrolled-nav {
      background: rgba(3, 8, 4, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(34, 197, 94, 0.3);
      padding-top: 0.75rem;
      padding-bottom: 0.75rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
    }
    /* Fixed overly transparent texts for supreme visual readability */
    .high-contrast-text {
      color: #e2e8f0; /* Crisp slate-200 */
    }
    .subtle-highlight-text {
      color: #22c55e; /* Crisp Spider Green */
    }
    @media (max-width: 768px) {
      .scrolled-nav {
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      .glass-morphism {
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      .glass-premium {
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
    }
  `}} />
);

const isMobileDevice = () => typeof window !== 'undefined' && window.innerWidth < 768;

const LivingMotherboardBackground = ({ interactiveSpeed = 1.0, signalColor = 'green', manualBuses, setManualBuses }) => {
  const canvasRef = useRef(null);
  const localManualBusesRef = useRef([]);

  useEffect(() => {
    localManualBusesRef.current = manualBuses;
  }, [manualBuses]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    const mobile = isMobileDevice();
    let paused = false;
    let scrollTimeout;
    
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    const handleScroll = () => {
      if (!paused) {
        paused = true;
        cancelAnimationFrame(animationFrameId);
      }
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        paused = false;
        animationFrameId = requestAnimationFrame(renderLoop);
      }, 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const generateBuses = () => {
      const buses = [];
      const numBuses = mobile ? Math.max(4, Math.floor(width / 280)) : Math.max(16, Math.floor(width / 95));

      for (let b = 0; b < numBuses; b++) {
        const startX = Math.random() * width;
        const startY = Math.random() * height;
        const trackCount = mobile ? Math.floor(Math.random() * 2) + 2 : Math.floor(Math.random() * 3) + 3;
        const spacing = 12; 
        const length = Math.random() * 380 + 260;
        
        const angle = Math.PI / 4; // strictly 45 degree trace patterns matching image_56ba87.jpg
        const directionX = Math.cos(angle);
        const directionY = Math.sin(angle);

        const tracks = [];
        for (let t = 0; t < trackCount; t++) {
          const offsetStartX = startX + t * spacing * -directionY;
          const offsetStartY = startY + t * spacing * directionX;
          
          const segments = [];
          segments.push({ x: offsetStartX, y: offsetStartY });
          
          const seg1Length = length * 0.45;
          const x1 = offsetStartX + directionX * seg1Length;
          const y1 = offsetStartY + directionY * seg1Length;
          segments.push({ x: x1, y: y1 });
          
          const isHorizontalTurn = Math.random() > 0.5;
          const seg2Length = length * 0.55;
          let x2 = x1;
          let y2 = y1;
          
          if (isHorizontalTurn) {
            x2 += seg2Length;
          } else {
            y2 += seg2Length;
          }
          segments.push({ x: x2, y: y2 });
          
          tracks.push({
            points: segments,
            width: Math.random() * 0.8 + 0.6,
            pulses: []
          });
        }

        buses.push({
          tracks,
          color: Math.random() > 0.4 
            ? (signalColor === 'green' ? '#22c55e' : '#00EFFF') 
            : (signalColor === 'green' ? '#15803d' : '#22c55e')
        });
      }
      return buses;
    };

    let buses = generateBuses();

    const resetBusesOnLimit = () => {
      buses = generateBuses();
    };
    window.addEventListener('resize', resetBusesOnLimit, { passive: true });

    let mouse = { x: width / 2, y: height / 2, tx: width / 2, ty: height / 2 };
    const handleMouseMove = (e) => {
      mouse.tx = e.clientX;
      mouse.ty = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const spawnPulses = () => {
      buses.forEach(bus => {
        if (Math.random() < (mobile ? 0.05 : 0.11)) {
          const trackIndex = Math.floor(Math.random() * bus.tracks.length);
          const track = bus.tracks[trackIndex];
          if (track.pulses.length < 2) {
            track.pulses.push({
              segmentIndex: 0,
              progress: 0,
              speed: (Math.random() * 0.014 + 0.009) * interactiveSpeed,
              size: Math.random() * 2 + 1.2
            });
          }
        }
      });

      const currentManualBuses = localManualBusesRef.current || [];
      currentManualBuses.forEach(bus => {
        if (bus && bus.tracks) {
          bus.tracks.forEach(track => {
            if (track && Math.random() < 0.25 && (track.pulses || []).length < 3) {
              track.pulses.push({
                segmentIndex: 0,
                progress: 0,
                speed: (Math.random() * 0.018 + 0.012) * interactiveSpeed,
                size: Math.random() * 2.5 + 1.5
              });
            }
          });
        }
      });
    };

    let lastFrameTime = 0;
    const frameInterval = mobile ? 30 : 0;

    const renderLoop = (timestamp) => {
      if (paused) return;
      animationFrameId = requestAnimationFrame(renderLoop);

      if (mobile && timestamp - lastFrameTime < frameInterval) return;
      lastFrameTime = timestamp;

      ctx.fillStyle = '#020402';
      ctx.fillRect(0, 0, width, height);

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      const radialGradient = ctx.createRadialGradient(mouse.x, mouse.y, 5, mouse.x, mouse.y, 550);
      radialGradient.addColorStop(0, signalColor === 'green' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(0, 239, 255, 0.15)');
      radialGradient.addColorStop(0.3, signalColor === 'green' ? 'rgba(34, 197, 94, 0.04)' : 'rgba(0, 239, 255, 0.04)');
      radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, width, height);

      buses.forEach(bus => {
        bus.tracks.forEach(track => {
          if (track.points.length < 2) return;
          
          const midX = track.points[0].x;
          const midY = track.points[0].y;
          const distToMouse = Math.hypot(midX - mouse.x, midY - mouse.y);
          
          const opacityFactor = Math.max(0.12, 1 - distToMouse / 700);
          ctx.strokeStyle = bus.color;
          ctx.globalAlpha = opacityFactor;
          ctx.lineWidth = track.width;
          
          ctx.beginPath();
          ctx.moveTo(track.points[0].x, track.points[0].y);
          for (let p = 1; p < track.points.length; p++) {
            ctx.lineTo(track.points[p].x, track.points[p].y);
          }
          ctx.stroke();
          
          const endPoint = track.points[track.points.length - 1];
          ctx.fillStyle = bus.color;
          if (!mobile) {
            ctx.shadowBlur = distToMouse < 450 ? 8 : 0;
            ctx.shadowColor = bus.color;
          }
          
          ctx.beginPath();
          ctx.arc(endPoint.x, endPoint.y, track.width * 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1.0;
        });
      });

      const currentManualBusesRender = localManualBusesRef.current || [];
      currentManualBusesRender.forEach(bus => {
        if (bus && bus.tracks) {
          bus.tracks.forEach(track => {
            if (track && track.points && track.points.length >= 2) {
              ctx.strokeStyle = bus.color || '#22c55e';
              ctx.lineWidth = track.width * 1.5;
              ctx.shadowBlur = 10;
              ctx.shadowColor = bus.color || '#22c55e';

              ctx.beginPath();
              ctx.moveTo(track.points[0].x, track.points[0].y);
              for (let p = 1; p < track.points.length; p++) {
                ctx.lineTo(track.points[p].x, track.points[p].y);
              }
              ctx.stroke();
              ctx.shadowBlur = 0;
            }
          });
        }
      });

      spawnPulses();

      buses.forEach(bus => {
        bus.tracks.forEach(track => {
          for (let pIdx = track.pulses.length - 1; pIdx >= 0; pIdx--) {
            const p = track.pulses[pIdx];
            const startNode = track.points[p.segmentIndex];
            const endNode = track.points[p.segmentIndex + 1];

            if (!startNode || !endNode) {
              track.pulses.splice(pIdx, 1);
              continue;
            }

            p.progress += p.speed;
            const currentX = startNode.x + (endNode.x - startNode.x) * p.progress;
            const currentY = startNode.y + (endNode.y - startNode.y) * p.progress;

            if (!mobile) {
              ctx.shadowBlur = 12;
              ctx.shadowColor = bus.color;
            }
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(currentX, currentY, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            if (p.progress >= 1) {
              p.progress = 0;
              p.segmentIndex += 1;
              if (p.segmentIndex >= track.points.length - 1) {
                track.pulses.splice(pIdx, 1);
              }
            }
          }
        });
      });

      const currentManualBusesPulses = localManualBusesRef.current || [];
      currentManualBusesPulses.forEach(bus => {
        if (bus && bus.tracks) {
          bus.tracks.forEach(track => {
            if (track && track.pulses) {
              for (let pIdx = track.pulses.length - 1; pIdx >= 0; pIdx--) {
                const p = track.pulses[pIdx];
                const startNode = track.points[p.segmentIndex];
                const endNode = track.points[p.segmentIndex + 1];

                if (!startNode || !endNode) {
                  track.pulses.splice(pIdx, 1);
                  continue;
                }

                p.progress += p.speed;
                const currentX = startNode.x + (endNode.x - startNode.x) * p.progress;
                const currentY = startNode.y + (endNode.y - startNode.y) * p.progress;

                ctx.shadowBlur = 15;
                ctx.shadowColor = bus.color || '#22c55e';
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(currentX, currentY, p.size * 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                if (p.progress >= 1) {
                  p.progress = 0;
                  p.segmentIndex += 1;
                  if (p.segmentIndex >= track.points.length - 1) {
                    track.pulses.splice(pIdx, 1);
                  }
                }
              }
            }
          });
        }
      });

      if (!mobile) {
        ctx.strokeStyle = signalColor === 'green' ? 'rgba(34, 197, 94, 0.04)' : 'rgba(0, 239, 255, 0.04)';
        ctx.lineWidth = 1;
        const step = 80;
        for (let x = 0; x < width; x += step) {
          for (let y = 0; y < height; y += step) {
            if ((x / step + y / step) % 3 === 0) {
              ctx.beginPath();
              ctx.moveTo(x - 3, y);
              ctx.lineTo(x + 3, y);
              ctx.moveTo(x, y - 3);
              ctx.lineTo(x, y + 3);
              ctx.stroke();
            }
          }
        }
      }
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(scrollTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', resetBusesOnLimit);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [interactiveSpeed, signalColor]);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-0" />;
};

const VirtualVerilogSimulator = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [simLog, setSimLog] = useState([]);
  const [testStatus, setTestStatus] = useState("STANDBY");
  const intervalRef = useRef(null);

  const testbenchSteps = [
    "[INFO] Initializing Verilator cycle-accurate simulator core...",
    "[INFO] Loading proprietary Verilog RTL netlist: spider_core_top.v",
    "[RTL VALIDATION] Verifying RV64GCX pipeline structures...",
    "[SIMULATION] Asserting reset line RST_N = 0...",
    "[SIMULATION] De-asserting reset line RST_N = 1 (System Clock = 3.8GHz)...",
    "[CHECK] Verifying DDR5 interface signals (16GB configuration verified)...",
    "[CHECK] Testing PCIe Gen4 x4 lane lane alignment handshake...",
    "[RTL] Decoding dynamic matrix multiplication operation (GEMM 128x128)...",
    "[SIMULATION] Vector activation registers: Sigmoid / Softmax validation loaded...",
    "[PROPRIETARY] Applying key security encryption constraints to physical registers...",
    "[SUCCESS] RTL Verification Completed. Timing margin checks passed (100% stable)."
  ];

  const startSimulator = () => {
    if (isRunning) return;
    setIsRunning(true);
    setTestStatus("RUNNING");
    setSimLog(["[INFO] Booting Simulator..."]);
    
    let currentStep = 0;
    
    intervalRef.current = setInterval(() => {
      if (currentStep < testbenchSteps.length) {
        // Safe check to avoid undefined steps
        const stepText = testbenchSteps[currentStep];
        if (stepText) {
          setSimLog(prev => [...prev, stepText]);
        }
        currentStep++;
      } else {
        clearInterval(intervalRef.current);
        setIsRunning(false);
        setTestStatus("SUCCESS");
      }
    }, 900);
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 font-mono text-xs shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-red-500 block"></span>
          <span className="w-3 h-3 rounded-full bg-yellow-500 block"></span>
          <span className="w-3 h-3 rounded-full bg-green-500 block"></span>
          <span className="text-[10px] text-zinc-400 font-bold ml-2">PROPRIETARY VERILOG SIMULATOR CORE (REV 1.0)</span>
        </div>
        <div className="flex items-center space-x-2 text-[10px] text-emerald-500 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
          <span>{testStatus}</span>
        </div>
      </div>

      <div className="mt-6 space-y-2 h-48 overflow-y-auto premium-scrollbar pr-2 pt-2">
        {simLog.map((log, idx) => {
          // Robust checking before performing string operations
          if (!log || typeof log !== 'string') return null;
          const isSuccess = log.includes("[SUCCESS]");
          const isProprietary = log.includes("[PROPRIETARY]");
          const isError = log.includes("[ERROR]") || log.includes("[FAIL]");
          
          let logColor = "text-zinc-300";
          if (isSuccess) logColor = "text-emerald-400 font-bold";
          else if (isProprietary) logColor = "text-amber-400";
          else if (isError) logColor = "text-red-400 font-bold";

          return (
            <div key={idx} className={`${logColor} leading-relaxed`}>
              {log}
            </div>
          );
        })}
        {simLog.length === 0 && (
          <div className="text-zinc-600 italic">Simulator ready. Click 'Run Testbench' to execute our proprietary cycle-accurate Verilog validation loop.</div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-900 flex items-center justify-between">
        <div className="text-[10px] text-zinc-500">
          Min Target host: RTX 3060 | Max target host: RTX 5090
        </div>
        <button
          onClick={startSimulator}
          disabled={isRunning}
          className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center space-x-2 ${
            isRunning 
              ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed' 
              : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-md shadow-emerald-500/10'
          }`}
        >
          <Play className="w-3 h-3" />
          <span>{isRunning ? 'Validating designs...' : 'Run Testbench'}</span>
        </button>
      </div>
    </div>
  );
};

const PhysicalPCBStackup = () => {
  const [activeLayer, setActiveLayer] = useState("L1");

  const layers = {
    L1: { title: "Top Layer (Signal)", desc: "Contains dynamic high-speed signals directly routing parameters into the Spider Chip NPU cores. Optimized for impedance controls (50Ω / 100Ω)." },
    L2: { title: "GND Plane", desc: "Solid ground return path to shield signal lines from external electromagnetic crosstalk interference." },
    L3: { title: "Inner Signal", desc: "Optimized 45-degree trace lanes resolving instruction register loops and microkernel interrupt lines." },
    L4: { title: "Power Plane (3.3V)", desc: "Delivers robust 3.3V power rails to DDR5 Memory chips and peripheral system clocks." },
    L5: { title: "Inner Signal", desc: "Optimized 45-degree instruction traces resolving high-speed PCIe Gen4 co-processing signals." },
    L6: { title: "Power Plane (1.8V)", desc: "Power supply rail handling NPU core voltages and digital secure execution vaults." },
    L7: { title: "GND Plane", desc: "Internal layer shielding signal structures on Layer 8." },
    L8: { title: "Inner Signal", desc: "Ancillary command routes linking Display DP 1.4 / HDMI 2.1 elements." },
    L9: { title: "Inner Signal", desc: "Auxiliary expansion pathways, including Ethernet 2.5GbE and serial UART interfaces." },
    L10: { title: "Bottom Layer (Signal)", desc: "Physical component connection layer handling power management chips and physical co-processing interfaces." }
  };

  return (
    <div className="bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden">
      {/* Background visual mapping to image_56ba87.jpg */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-[0.03] pointer-events-none mix-blend-color-dodge"
        style={{ backgroundImage: `url('image_56ba87.jpg')` }}
      />
      <div className="absolute top-4 right-4 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
        FR-4 High Tg 10-Layer System Stackup
      </div>

      <h4 className="text-xl font-bold font-mono text-white mb-6">Interactive 10-Layer Stackup Schematic</h4>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 space-y-1.5 font-mono">
          {Object.entries(layers).map(([id, layer]) => (
            <button
              key={id}
              onClick={() => setActiveLayer(id)}
              className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${
                activeLayer === id 
                  ? 'bg-emerald-500/10 border-emerald-400 text-emerald-300 shadow-md' 
                  : 'bg-zinc-950/60 border-zinc-900/60 text-zinc-500 hover:border-zinc-800'
              }`}
            >
              <span>{id}: {layer.title}</span>
              <span className={`w-2 h-2 rounded-full ${id.includes("Power") ? "bg-amber-400" : id.includes("GND") ? "bg-zinc-600" : "bg-emerald-500"}`}></span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-7 bg-zinc-900/40 p-6 rounded-2xl border border-zinc-900 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            <span>ACTIVE SPECIFICATION</span>
          </div>
          <h5 className="text-lg font-bold font-mono text-white">{layers[activeLayer].title} ({activeLayer})</h5>
          <p className="text-zinc-300 text-xs leading-relaxed font-sans">{layers[activeLayer].desc}</p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800 text-[10px] font-mono text-zinc-400">
            <div>
              <span className="block text-zinc-500 uppercase">Board Thickness</span>
              <span className="text-white font-bold text-sm">1.6 mm</span>
            </div>
            <div>
              <span className="block text-zinc-500 uppercase">Copper Weight</span>
              <span className="text-white font-bold text-sm">1 oz</span>
            </div>
            <div>
              <span className="block text-zinc-500 uppercase">Base Material</span>
              <span className="text-white font-bold text-xs">FR-4 / High Tg</span>
            </div>
            <div>
              <span className="block text-zinc-500 uppercase">Impedance Control</span>
              <span className="text-emerald-400 font-bold text-xs">Yes (50Ω/100Ω)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SpyDocs = ({ onBack }) => {
  const [selectedReg, setSelectedReg] = useState("VEC_GEMM");

  const registerMap = {
    VEC_GEMM: {
      address: "0x40021000",
      mnemonic: "SPDR.VEC.GEMM",
      permissions: "PROPRIETARY RW (NDA ONLY)",
      desc: "Triggers cycle-accurate matrix multiplication across core NPU arrays. Directly feeds floating point parameters from unified DDR5 memories into on-die accumulator gates.",
      bitFields: [
        { bits: "[31:24]", name: "Matrix A Columns / Row Dimension scale" },
        { bits: "[23:16]", name: "Matrix B Row scale parameters" },
        { bits: "[15:8]", name: "Target Accumulator Buffer Registry Index" },
        { bits: "[7:0]", name: "Activation function selection: 0x01 = GELU, 0x02 = Swish" }
      ]
    },
    VEC_ACTV: {
      address: "0x40021004",
      mnemonic: "SPDR.VEC.ACTV",
      permissions: "PROPRIETARY RW (NDA ONLY)",
      desc: "Accelerates GELU and Softmax functions right next to on-die registers, avoiding traditional PCIe bandwidth penalty bottlenecks.",
      bitFields: [
        { bits: "[31:16]", name: "Scale scalar value inside vector channels" },
        { bits: "[15:8]", name: "Vector scale configuration parameters" },
        { bits: "[7:0]", name: "Operation mask: 0x11 = Softmax, 0x12 = GELU Math Block" }
      ]
    },
    SEC_CRPT: {
      address: "0x4002F000",
      mnemonic: "SPDR.SEC.CRPT",
      permissions: "PROPRIETARY RO (NDA ONLY)",
      desc: "Communicates directly with the embedded hardware secure element (ATECC608A block) to encrypt proprietary neural parameters on the physical substrate lines.",
      bitFields: [
        { bits: "[31:24]", name: "Security handshake sequence progress status" },
        { bits: "[23:8]", name: "Encrypted memory-page translation segment signature" },
        { bits: "[7:0]", name: "Security lockout status code" }
      ]
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 page-fade-in font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-6 mb-8 gap-4">
        <div>
          <span className="text-xs font-mono text-emerald-400 tracking-widest uppercase block">&gt;_ HARDWARE REGISTRY DOCS</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Proprietary Register Specification</h2>
        </div>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 rounded-lg transition-colors uppercase"
        >
          [ Return to workspace ]
        </button>
      </div>

      <div className="text-xs font-mono border border-amber-500/20 bg-amber-950/20 text-amber-400 p-4 rounded-xl mb-8 flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <div>
          <span className="font-bold">PROPRIETARY R&D DISCLOSURE:</span>
          <p className="mt-1">All architecture, Register maps, Verilog HDL structures, and diagnostic memory addresses shown below are protected under non-disclosure configurations. Unauthorized sharing of silicon targets from RTX 3060 models up to RTX 5090 clusters is strictly prohibited.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-2">
          <span className="text-[10px] font-mono text-zinc-500 tracking-wider block uppercase">REGISTER INDEX</span>
          {Object.entries(registerMap).map(([id, reg]) => (
            <button
              key={id}
              onClick={() => setSelectedReg(id)}
              className={`w-full text-left p-4 rounded-xl border font-mono transition-all block ${
                selectedReg === id 
                  ? 'bg-emerald-500/10 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/5' 
                  : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800'
              }`}
            >
              <span className="text-[10px] text-zinc-500 block">{reg.address}</span>
              <span className="font-bold text-sm block mt-1">{reg.mnemonic}</span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-8 bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-4 gap-2">
            <div>
              <span className="text-[9px] font-mono text-zinc-500 uppercase">Address Line</span>
              <span className="text-emerald-400 font-mono text-base block font-bold">{registerMap[selectedReg].address}</span>
            </div>
            <div className="text-right sm:text-right">
              <span className="text-[9px] font-mono text-zinc-500 uppercase">Security Clearance Required</span>
              <span className="text-amber-400 font-mono text-xs block font-bold">{registerMap[selectedReg].permissions}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-lg font-bold font-mono text-white">{registerMap[selectedReg].mnemonic}</h4>
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-sans">{registerMap[selectedReg].desc}</p>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-mono text-zinc-500 tracking-wider block uppercase">Register Bitfield Allocations</span>
            <div className="border border-zinc-900 rounded-xl overflow-hidden font-mono text-xs">
              {registerMap[selectedReg].bitFields.map((field, fIdx) => (
                <div key={fIdx} className="grid grid-cols-12 gap-2 p-3 border-b border-zinc-900/60 last:border-b-0 items-center hover:bg-zinc-900/20">
                  <div className="col-span-3 text-emerald-400 font-bold">{field.bits}</div>
                  <div className="col-span-9 text-zinc-300">{field.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SpiderCloud = ({ onBack }) => {
  const [instruction, setInstruction] = useState("VEC_GEMM");
  const [registerValues, setRegisterValues] = useState({
    x0: "0x00000000",
    x1: "0x00000000",
    x2: "0x00000000",
    x3: "0x00000000",
    x4: "0x00000000",
    x5: "0x00000000"
  });
  const [pipelineLogs, setPipelineLogs] = useState([]);
  const [isCompiling, setIsCompiling] = useState(false);

  const presets = {
    VEC_GEMM: {
      inst: "SPDR.VEC.GEMM r1, r2, r3, 0x01",
      desc: "Perform 128x128 matrix vector multiply, output to accumulator index 0x01",
      regs: { x1: "0x00000080", x2: "0x00000080", x3: "0x40021000", x4: "0x00000001", x5: "0x00000000" }
    },
    VEC_ACTV: {
      inst: "SPDR.VEC.ACTV r1, r4, 0x12",
      desc: "Trigger hardware-accelerated GELU operation mapping on target vectors",
      regs: { x1: "0x00000080", x2: "0x00000000", x3: "0x00000000", x4: "0x3FC00000", x5: "0x00000012" }
    },
    SEC_ZERO: {
      inst: "SPDR.SEC.ZERO r1, r2",
      desc: "Force register secure zeroing command executing key encryption clears",
      regs: { x1: "0x00000000", x2: "0x00000000", x3: "0x00000000", x4: "0x00000000", x5: "0x00000000" }
    }
  };

  const handleCompileAndRun = () => {
    setIsCompiling(true);
    setPipelineLogs(["[COMPILER] Synthesizing instructions into target hardware opcodes..."]);

    setTimeout(() => {
      setPipelineLogs(prev => [...prev, "[RTL PARSER] Opcode validated securely against local instruction configurations."]);
    }, 400);

    setTimeout(() => {
      setPipelineLogs(prev => [...prev, "[SIMULATOR] Asserting pipeline cycle clock. Frequency: 3.8GHz."]);
    }, 800);

    setTimeout(() => {
      setPipelineLogs(prev => [...prev, "[SUCCESS] Operation executed successfully. Register files updated."]);
      const activePreset = presets[instruction];
      if (activePreset && activePreset.regs) {
        setRegisterValues(prev => ({
          ...prev,
          ...activePreset.regs
        }));
      }
      setIsCompiling(false);
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 page-fade-in font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-6 mb-8 gap-4">
        <div>
          <span className="text-xs font-mono text-emerald-400 tracking-widest uppercase block">&gt;_ CORE CLOUD EMULATION</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">RTL Simulation Sandbox</h2>
        </div>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 rounded-lg transition-colors uppercase"
        >
          [ Exit Sandbox ]
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 p-6 rounded-2xl space-y-6">
          <span className="text-[10px] font-mono text-zinc-500 tracking-wider block uppercase">STEP 1: CHOOSE TARGET INSTRUCTION</span>
          
          <div className="space-y-2">
            {Object.entries(presets).map(([key, item]) => (
              <button
                key={key}
                onClick={() => setInstruction(key)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  instruction === key 
                    ? 'bg-emerald-500/10 border-emerald-400 text-emerald-300' 
                    : 'bg-zinc-900 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                <code className="text-xs font-bold block">{item.inst}</code>
                <span className="text-[11px] text-zinc-500 block mt-1 font-sans">{item.desc}</span>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-900 flex justify-end">
            <button
              onClick={handleCompileAndRun}
              disabled={isCompiling}
              className="px-6 py-3 bg-emerald-500 text-black hover:bg-emerald-400 transition-colors rounded-xl font-bold font-mono text-xs uppercase flex items-center space-x-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
              <span>Compile & Exec Opcode</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.entries(registerValues).map(([reg, val]) => (
              <div key={reg} className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-900 font-mono text-xs text-center">
                <span className="text-zinc-500 text-[10px] block uppercase">{reg} Register</span>
                <span className="text-emerald-400 font-bold text-sm block mt-1">{val}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 font-mono text-xs pt-4 border-t border-zinc-900">
            <span className="text-[10px] text-zinc-500 tracking-wider block uppercase">Compiler Assembly Outputs</span>
            <div className="h-40 bg-zinc-900/30 p-4 border border-zinc-900 rounded-xl overflow-y-auto premium-scrollbar space-y-1.5">
              {pipelineLogs.map((log, lIdx) => {
                if (!log || typeof log !== 'string') return null;
                const isSuccess = log.includes("[SUCCESS]");
                return (
                  <div key={lIdx} className={isSuccess ? "text-emerald-400 font-bold" : "text-zinc-400"}>
                    {log}
                  </div>
                );
              })}
              {pipelineLogs.length === 0 && (
                <div className="text-zinc-650 italic">Compile an instruction opcode to view simulation status logs.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); 
  const navRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [selectedArch, setSelectedArch] = useState(null);
  
  const [sandboxSpeed, setSandboxSpeed] = useState(1.0);
  const [sandboxTheme, setSandboxTheme] = useState('green'); 
  const [manualBuses, setManualBuses] = useState([]);
  const [activeResearchTab, setActiveResearchTab] = useState('ALL');

  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        if (window.scrollY > 30) {
          navRef.current.classList.add('scrolled-nav');
        } else {
          navRef.current.classList.remove('scrolled-nav');
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateTo = (page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleContainerClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const angle = Math.PI / 4;
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);
    const spacing = 12;

    const tracks = [];
    for (let t = 0; t < 2; t++) {
      const offsetStartX = x + t * spacing * -directionY;
      const offsetStartY = y + t * spacing * directionX;
      
      const segments = [
        { x: offsetStartX, y: offsetStartY },
        { x: offsetStartX + directionX * 120, y: offsetStartY + directionY * 120 },
        { x: offsetStartX + directionX * 120 + 80, y: offsetStartY + directionY * 120 }
      ];

      tracks.push({
        points: segments,
        width: 1.2,
        pulses: []
      });
    }

    const newBus = {
      tracks,
      color: '#22c55e'
    };

    setManualBuses(prev => [...prev.slice(-6), newBus]); 
  };

  const archModules = [
    {
      id: "cpu",
      title: "RISC-V Control Core",
      subtitle: "Asynchronous Thread Distribution Node",
      tag: "10 Layers Signal Optimized",
      icon: Cpu,
      desc: "Strictly proprietary RTL instruction set optimized for memory footprint controls. Orchestrates host co-processing operations across standard PCIe Gen4 x4 lane systems.",
      specs: [
        { label: "Instruction Set", value: "RV64GCX Core Architecture" },
        { label: "Design IP Status", value: "Proprietary (Protected NDA)" },
        { label: "Min Host Target", value: "NVIDIA RTX 3060 Base Driver" },
        { label: "Max Host Target", value: "NVIDIA RTX 5090 Execution System" }
      ]
    },
    {
      id: "npu",
      title: "Tensor Matrix AI NPU Core",
      subtitle: "Hardware-Accelerated Deep Neural Math Array",
      tag: "Proprietary Matrix Cores",
      icon: Layers,
      desc: "Custom matrix-vector multiplier units designed and verified via cycle-accurate simulators. Enables Swish and GELU activation layers directly inside local chip registers.",
      specs: [
        { label: "Verilog Top Module", value: "spider_npu_matrix_calc.v" },
        { label: "Simulation Platform", value: "Verilator / Synopsys VCS Checked" },
        { label: "Verification Status", value: "Proprietary Testbench Passed" },
        { label: "Co-Processor Scale", value: "Dual HBM3e unified channels" }
      ]
    },
    {
      id: "gpu",
      title: "GPU Perception Engine",
      subtitle: "Parallel Vision Shader Network Node",
      tag: "128 Shader Units",
      icon: Activity,
      desc: "Resolves point-cloud translations and spatial environment mappings natively. Designed for zero cumulative lag during flight telemetry tasks.",
      specs: [
        { label: "Hardware Target", value: "PCIe co-processing framework" },
        { label: "Validation Engine", value: "ModelSim Logic Checked" },
        { label: "Unified Cache", value: "128MB low-latency on-die L3 SRAM" },
        { label: "RTL Optimization", value: "Sparsity-assisted hardware multipliers" }
      ]
    },
    {
      id: "memory",
      title: "Active-Route DDR5 Memory Controller",
      subtitle: "Ultra High-Bandwidth Interface",
      tag: "FR-4 High Tg 1.6mm Routing",
      icon: Database,
      desc: "Facilitates seamless transfers into the local 16GB DDR5 modules. Designed and tested through 10-layer physical impedence validations.",
      specs: [
        { label: "Physical Layer Count", value: "10 Layer signal balanced (ENIG finish)" },
        { label: "Trace Geometry", value: "Impedance controlled routing paths" },
        { label: "Simulator Timing Core", value: "Proprietary Verilog netlist check" },
        { label: "Copper Density", value: "1 oz high reliability plating" }
      ]
    },
    {
      id: "security",
      title: "Secure Cryptographic Engine Element",
      subtitle: "ATECC608A Native Shield Block",
      tag: "Proprietary Secure Vault",
      icon: Shield,
      desc: "Physical cryptographic guard encrypting confidential model weights on-the-fly. Protects proprietary parameter files from dynamic hardware bus sniffers.",
      specs: [
        { label: "Secure Element Chip", value: "ATECC608A Integration Module" },
        { label: "Key Storage Format", value: "Proprietary Hardware Shield Core" },
        { label: "Intrusion Safeguard", value: "Clock-cycle randomness injection" },
        { label: "Model Protection", value: "Zero memory footprint leakage design" }
      ]
    },
    {
      id: "neural_accel",
      title: "Neural Activation Co-Processor Engine",
      subtitle: "Transcendental Operation Math Block",
      tag: "RTL Vector Multipliers",
      icon: Zap,
      desc: "Accelerates GELU and Softmax functions right next to on-die registers, avoiding traditional PCIe bandwidth penalty bottlenecks.",
      specs: [
        { label: "Math Pipeline", value: "Hardware non-linear function arrays" },
        { label: "Validation Metric", value: "Verified cycle-by-cycle under simulator" },
        { label: "Energy Efficiency", value: "Low static thermal leakage" },
        { label: "Hardware Routing", value: "Proprietary layer stack paths" }
      ]
    }
  ];

  const researchPapers = [
    {
      id: "paper-1",
      category: "NEURAL ARCHITECTURES",
      title: "Hardware-Aware Core Scheduling: Proprietary Verilog RTL Vector Architectures",
      authors: "Dr. Richard S. Voeller, Dr. Kenji Takahashi",
      date: "May 2026",
      abstract: "Traditional co-processing units suffer severe interconnect lag when sharing host memory pools. This paper presents our proprietary Verilog HDL architecture designed for direct co-processing, verified inside custom cycle-accurate testbenches.",
      findings: "Minimizes clock penalty states using strictly proprietary register scheduling pipelines.",
      doi: "10.1109/SPDR.2026.04"
    },
    {
      id: "paper-2",
      category: "POWER EFFICIENCY",
      title: "RTL Optimization Cycles: Simulators Driven Dynamic Hardware Clocking Validation",
      authors: "Elena Rostova, Liam Vance",
      date: "March 2026",
      abstract: "We model structural clock-gating registers natively inside the simulator core to prevent dynamic energy spikes. Physical tape-outs on 1.6mm 10-layer FR-4 substrates demonstrate excellent heat stability.",
      findings: "Eliminates static power leakage across complex logic elements.",
      doi: "10.1109/SPDR.2026.11"
    },
    {
      id: "paper-3",
      category: "EDGE INTELLIGENCE",
      title: "Co-Processing Telemetry: Validating Targets from NVIDIA RTX 3060 up to RTX 5090 Hosts",
      authors: "Dr. Kenji Takahashi, Elena Rostova",
      date: "January 2026",
      abstract: "Integrating localized AI processors into commercial workstation environments requires robust host driver layers. We outline hardware communication paradigms enabling direct scaling between minimum host platforms (RTX 3060) and high-performance setups (RTX 5090).",
      findings: "Achieves seamless throughput rates using proprietary PCIe x4 driver registers.",
      doi: "10.1109/SPDR.2026.15"
    }
  ];

  const filteredPapers = useMemo(() => {
    if (activeResearchTab === 'ALL') return researchPapers;
    return researchPapers.filter(p => p.category === activeResearchTab);
  }, [activeResearchTab]);

  return (
    <div className="relative min-h-screen text-white bg-[#020402] selection:bg-emerald-500 selection:text-slate-950 flex flex-col font-sans overflow-x-hidden">
      <CyberStyles />
      
      <LivingMotherboardBackground 
        interactiveSpeed={sandboxSpeed} 
        signalColor={sandboxTheme} 
        manualBuses={manualBuses}
        setManualBuses={setManualBuses}
      />

      {/* Sticky Header Navigation */}
      <nav ref={navRef} className="fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-transparent py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          <div 
            onClick={() => navigateTo('home')} 
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-emerald-500/30 bg-[#020904] transition-all group-hover:border-emerald-400 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              <span className="text-emerald-400 font-mono text-base font-bold">S</span>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wider text-white group-hover:text-emerald-400 transition-colors">
                SPIDER CHIP
              </span>
              <span className="text-[9px] font-mono tracking-widest text-emerald-400 uppercase">
                PROPRIETARY R&D SILICON
              </span>
            </div>
          </div>

          <div className="hidden xl:flex items-center space-x-1 font-mono">
            {[
              { id: 'home', label: 'Home' },
              { id: 'about', label: 'About Us' },
              { id: 'architecture', label: 'Architecture' },
              { id: 'research', label: 'Research' },
              { id: 'features', label: 'Features' },
              { id: 'applications', label: 'Applications' },
              { id: 'roadmap', label: 'Roadmap' },
              { id: 'team', label: 'Team' },
              { id: 'contact', label: 'Contact' }
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => navigateTo(link.id)}
                className={`px-3 py-1.5 rounded text-[10px] font-bold tracking-widest transition-all hover:text-emerald-400 uppercase ${
                  currentPage === link.id ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-200'
                }`}
              >
                {link.label}
              </button>
            ))}
            <button 
              onClick={() => navigateTo('contact')}
              className="ml-4 px-4 py-2 rounded-lg border border-emerald-500/30 hover:border-emerald-400 text-[10px] font-bold text-emerald-400 bg-emerald-950/20 transition-all duration-300"
            >
              REQUEST NDA ACCESS
            </button>
          </div>

          <div className="flex xl:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-2 rounded text-slate-300 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full glass-morphism border-b border-emerald-500/20 py-5 px-6 flex flex-col space-y-4 animate-fadeIn z-50">
            {['home', 'about', 'architecture', 'research', 'features', 'applications', 'roadmap', 'team', 'contact'].map((page) => (
              <button key={page} onClick={() => navigateTo(page)} className="text-left py-2 font-semibold text-sm text-slate-200 hover:text-emerald-400 capitalize">&gt; {page}</button>
            ))}
          </div>
        )}
      </nav>

      {}
      <main className="flex-1 relative z-10 pt-20">

        {/* ======================================= */}
        {/* VIEW: HOME PAGE VIEW                    */}
        {/* ======================================= */}
        {currentPage === 'home' && (
          <div className="page-fade-in animate-fadeIn" onClick={handleContainerClick}>
            <section className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(2,4,2,0)_0%,rgba(2,4,2,0.92)_100%)] z-0 pointer-events-none"></div>
              
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-[0.05] mix-blend-color-dodge pointer-events-none z-10"
                style={{ backgroundImage: `url('image_56ba87.jpg')` }}
              />

              <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-20 mt-8">
                
                <div className="lg:col-span-6 space-y-6 text-left">
                  <div className="inline-flex items-center space-x-2 bg-slate-950 border border-emerald-500/30 px-4 py-1.5 rounded-full text-[10px] tracking-widest text-emerald-400 uppercase font-mono shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>SPIDER CHIP PROCESSOR • PROPRIETARY IP</span>
                  </div>

                  <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-white">
                    Spider Chip
                  </h1>
                  <h2 className="text-xl md:text-2xl font-light text-emerald-400 font-mono tracking-wide">
                    AI Accelerators Built for the Future
                  </h2>

                  {/* Fix overly transparent text for extreme contrast and high premium visual density */}
                  <p className="text-slate-200 text-sm md:text-base leading-relaxed font-sans max-w-xl bg-zinc-950/60 p-4 rounded-xl border border-zinc-900">
                    Spider Chip is a next-generation AI co-processor designed for intelligent computing, machine learning, robotics, edge AI, and high-performance applications. Engineered with proprietary Verilog microarchitecture and validated using dynamic RTL simulators.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                    <button 
                      onClick={() => navigateTo('research')}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-black font-bold text-xs tracking-widest transition-all hover:opacity-95 shadow-lg shadow-emerald-500/20 font-mono"
                    >
                      EXPLORE RESEARCH
                    </button>
                    <button 
                      onClick={() => navigateTo('architecture')}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-lg border border-slate-700 bg-slate-950/80 hover:border-emerald-400 text-slate-200 hover:text-emerald-400 text-xs tracking-widest transition-all duration-300 font-mono"
                    >
                      ARCHITECTURE
                    </button>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-900/80 space-y-4">
                    <div className="flex items-center space-x-2 text-zinc-400">
                      <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] font-mono uppercase tracking-wider">Dynamic Trace Simulators</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                          <span>SIM SPEED FACTOR:</span>
                          <span className="text-emerald-400">{sandboxSpeed.toFixed(1)}x</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.4" 
                          max="2.5" 
                          step="0.1" 
                          value={sandboxSpeed} 
                          onChange={(e) => setSandboxSpeed(parseFloat(e.target.value))}
                          className="w-full accent-emerald-400 bg-zinc-900 h-1 rounded"
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono text-zinc-400 block font-bold">PROPRIETARY NOTICE:</span>
                        <div className="text-[9px] text-amber-400 font-mono border border-amber-500/20 bg-amber-950/20 px-2 py-1 rounded">
                          ALL CODES UNDER NDA
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 w-full">
                  <VirtualVerilogSimulator />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ======================================= */}
        {/* VIEW: ABOUT PAGE                        */}
        {/* ======================================= */}
        {currentPage === 'about' && (
          <div className="page-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-5 relative">
                <div className="w-full aspect-square glass-morphism rounded-2xl border border-emerald-500/30 relative overflow-hidden flex items-center justify-center p-8 shadow-2xl">
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-[0.05] pointer-events-none mix-blend-color-dodge"
                    style={{ backgroundImage: `url('image_56ba87.jpg')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent"></div>
                  
                  <div className="relative w-48 h-48 rounded-full border border-dashed border-emerald-500/30 flex items-center justify-center animate-spin mobile-no-spin" style={{ animationDuration: '40s' }}>
                    <div className="w-36 h-36 rounded-full border border-emerald-400/40 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-[#020502] border border-slate-800 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <Cpu className="w-10 h-10 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                  <span className="absolute top-4 left-4 font-mono text-[9px] text-emerald-400">CHIP_FOUNDRY_7NM</span>
                  <span className="absolute bottom-4 right-4 font-mono text-[9px] text-teal-400">BOARD_REV_1.0</span>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase block">&gt;_ HARDWARE_MISSION</span>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Cycle-accurate designs verified in Verilog simulators</h1>
                
                <p className="text-slate-200 leading-relaxed font-sans bg-zinc-950/60 p-4 rounded-xl border border-zinc-900">
                  Spider Technologies focuses on compiling elegant, highly optimized AI architectures. By designing proprietary instruction pipelines and custom registers, we minimize memory bottlenecks while maximizing local operations.
                </p>
                
                <p className="text-slate-300 leading-relaxed font-sans">
                  Our architecture targets co-processing workflows from standard desktop workstations containing an **RTX 3060 co-processor baseline** all the way up to specialized server cabinets populated with flagship **RTX 5090 acceleration modules**, communicating over PCIe Gen4 lanes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-900 flex items-start space-x-3">
                    <div className="p-2 rounded bg-emerald-950/50 text-emerald-400">
                      <Code className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-mono">Proprietary RTL IP</h4>
                      <p className="text-xs text-slate-300 mt-1">Verilog files protected under strict corporate NDA policies.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-900 flex items-start space-x-3">
                    <div className="p-2 rounded bg-teal-950/50 text-teal-400">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-mono">Simulator Verification</h4>
                      <p className="text-xs text-slate-300 mt-1">Cycle-by-cycle testing prior to foundry stack tape-out.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PCB Schematic stackup reference */}
            <div className="mt-20">
              <PhysicalPCBStackup />
            </div>

            {/* Core Pillars Grid */}
            <div className="mt-24 border-t border-slate-900 pt-16">
              <div className="text-center space-y-3 mb-16">
                <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase block">&gt;_ PROPRIETARY_STANDARDS</span>
                <h2 className="text-2xl sm:text-4xl font-extrabold">Our Core Architectural Pillars</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { t: "Silicon Integrity", d: "Proprietary register files designed to avoid hardware timing glitches completely." },
                  { t: "Verified RTL", d: "Our entire HDL logic undergoes intensive cycle-by-cycle simulator validation loops." },
                  { t: "PCIe Co-Processing", d: "Engineered to cooperate smoothly with host GPUs, targeting RTX 3060 up to RTX 5090 scale." },
                  { t: "Closed Source Protection", d: "Strictly proprietary RTL. Intellectual property is locked inside cryptographic secure arrays." }
                ].map((item, idx) => (
                  <div key={idx} className="p-5 rounded-xl bg-slate-950 border border-slate-900/60 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                      <h4 className="text-sm font-bold font-mono text-white tracking-wide">{item.t}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* VIEW: ARCHITECTURE                       */}
        {/* ======================================= */}
        {currentPage === 'architecture' && (
          <div className="page-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-16 space-y-4">
              <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase block">&gt;_ HARDWARE_DIAGRAMS</span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">On-Die Blocks Mimicking PCB Specifications</h1>
              <p className="text-zinc-300 text-sm max-w-2xl leading-relaxed bg-zinc-950/60 p-4 rounded-xl border border-zinc-900">
                Spider Chip is laid out on an 80.00 mm x 60.00 mm 10-layer FR-4 substrate. Each core module handles critical mathematical tasks using proprietary register pathways, as illustrated in the block schematics of **image_56ba87.jpg**.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archModules.map((mod) => {
                const IconComp = mod.icon;
                return (
                  <div 
                    key={mod.id}
                    onClick={() => setSelectedArch(mod)}
                    className="group cursor-pointer bg-zinc-900/30 border border-zinc-900 p-8 rounded-2xl hover:border-emerald-400/40 hover:shadow-[0_0_20px_rgba(34,197,94,0.05)] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-11 h-11 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full text-emerald-400">
                          {mod.tag}
                        </span>
                      </div>

                      <h4 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors tracking-tight font-mono">
                        {mod.title}
                      </h4>
                      <p className="font-mono text-[10px] text-zinc-400 mb-3">{mod.subtitle}</p>
                      <p className="text-zinc-300 text-xs leading-relaxed line-clamp-3">
                        {mod.desc}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Inspect Specifications</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* VIEW: RESEARCH SCIENTIFIC HUB           */}
        {/* ======================================= */}
        {currentPage === 'research' && (
          <div className="page-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-6">
              <div className="space-y-4">
                <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase block">&gt;_ JOURNAL_ARCHIVES</span>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Scientific verification & simulator testing</h1>
                <p className="text-zinc-300 text-sm max-w-xl">
                  We validate chip latency and heat parameters inside cycle-accurate computer architecture emulators.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 font-mono text-[10px]">
                {['ALL', 'NEURAL ARCHITECTURES', 'POWER EFFICIENCY', 'EDGE INTELLIGENCE'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveResearchTab(cat)}
                    className={`px-4 py-2 rounded-full border transition-all uppercase tracking-wider ${
                      activeResearchTab === cat 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {filteredPapers.map((paper) => (
                <div 
                  key={paper.id}
                  className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 md:p-8 flex flex-col justify-between group hover:border-emerald-400/40 hover:shadow-[0_0_20px_rgba(34,197,94,0.05)] transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-emerald-400 uppercase tracking-widest">{paper.category}</span>
                      <span className="text-zinc-500">{paper.date}</span>
                    </div>
                    <h4 className="text-lg font-bold text-white tracking-tight leading-snug group-hover:text-emerald-400 transition-colors font-mono">
                      {paper.title}
                    </h4>
                    <p className="text-[10px] font-mono text-zinc-500">By: {paper.authors}</p>
                    <p className="text-zinc-300 text-xs leading-relaxed line-clamp-3 font-sans">{paper.abstract}</p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-zinc-900 flex items-center justify-between text-xs font-mono">
                    <span className="text-[9px] text-zinc-500">DOI: {paper.doi}</span>
                    <button 
                      onClick={() => setSelectedPaper(paper)}
                      className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center space-x-1"
                    >
                      <span>Read Manuscript</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* VIEW: CAPABILITY FEATURES               */}
        {/* ======================================= */}
        {currentPage === 'features' && (
          <div className="page-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase block">&gt;_ HARDWARE_PERFORMANCE</span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Proprietary logic targeting RTX 3060 to RTX 5090</h1>
              <p className="text-zinc-300 text-sm leading-relaxed">
                By co-processing over PCIe Gen4 x4 lanes, the Spider Chip architecture can dynamically assist graphics cards starting from target laptops equipped with an RTX 3060 up to specialized datacenters powered by an RTX 5090.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Ultra Low Standby Power",
                  desc: "Consumes minimal energy during tracking phases, optimized specifically for dynamic power distribution networks.",
                  icon: Zap
                },
                {
                  title: "Proprietary Verilog HDL",
                  desc: "Our closed-source register structures safeguard physical transistor layout loops from corporate reverse-engineering.",
                  icon: Sparkles
                },
                {
                  title: "Deterministic Timing Cycles",
                  desc: "Rigid real-time execution timing verified completely via cycle-accurate simulator environments before tape-out.",
                  icon: Cpu
                },
                {
                  title: "Impedance-Controlled Traces",
                  desc: "Balanced 50Ω / 100Ω high-speed signal routing laid cleanly across a 1.6mm thickness 10-layer substrate.",
                  icon: Layers
                },
                {
                  title: "Scalable Host Configurations",
                  desc: "Direct host driver alignment targeting any co-processing platform from RTX 3060 up to RTX 5090 configs.",
                  icon: Activity
                },
                {
                  title: "Secure Element Chip",
                  desc: "Integrates the ATECC608A secure module to prevent side-channel parameter voltage eavesdropping.",
                  icon: Shield
                }
              ].map((feat, index) => {
                const IconComp = feat.icon;
                return (
                  <div 
                    key={index} 
                    className="bg-zinc-900/30 border border-zinc-900 p-8 rounded-2xl hover:border-emerald-400/30 hover:shadow-[0_0_15px_rgba(34,197,94,0.05)] transition-all space-y-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-white tracking-tight font-mono">{feat.title}</h4>
                    <p className="text-zinc-300 text-xs md:text-sm leading-relaxed font-sans">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* VIEW: SECTOR APPLICATIONS                */}
        {/* ======================================= */}
        {currentPage === 'applications' && (
          <div className="page-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-16 space-y-4">
              <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase block">&gt;_ DEPLOYMENT_SECTORS</span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Co-processing for highly intense workloads</h1>
              <p className="text-zinc-300 text-sm max-w-xl leading-relaxed">
                Our custom accelerator leverages PCIe Gen4 x4 lanes to process neural networking parameters directly adjacent to local memory matrices.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Generative AI Platforms",
                  subtitle: "Large Language Model Inference",
                  desc: "Runs complex token evaluation routines directly, reducing dynamic latency inside the PCIe register loops.",
                  metric: "Assists models on hosts from RTX 3060 to RTX 5090"
                },
                {
                  title: "Autonomous Robotics",
                  subtitle: "Trajectory Math Stabilization",
                  desc: "Resolves coordinate equations inside custom Verilog multipliers, maintaining real-time joint-actuator balance.",
                  metric: "Tested extensively via RTL simulations"
                },
                {
                  title: "Healthcare Systems",
                  subtitle: "Genomic Sequencing & Cryo-EM",
                  desc: "Accelerates visual recognition frameworks directly inside localized devices without relying on network channels.",
                  metric: "High Tg 10-layer FR-4 board durability"
                },
                {
                  title: "Autonomous Vehicles",
                  subtitle: "Multi-View Camera Fusion",
                  desc: "Gathers spatial frame streams directly, communicating quickly with the host co-processors.",
                  metric: "PCIe Gen4 x4 lane high reliability"
                },
                {
                  title: "Industrial Automation",
                  subtitle: "Real-time Machine Diagnostics",
                  desc: "Detects alignment and physical anomalies on the fly inside decentralized plant installations.",
                  metric: "Continuous simulator-checked timing margins"
                },
                {
                  title: "Research Labs",
                  subtitle: "Physics Molecular Modeling",
                  desc: "Allows research teams to deploy proprietary Verilog models quickly inside emulation modules.",
                  metric: "Strictly proprietary NDA register shield"
                }
              ].map((app, idx) => (
                <div 
                  key={idx}
                  className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-8 flex flex-col justify-between hover:border-emerald-400/30 hover:-translate-y-1 transition-all"
                >
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{app.subtitle}</span>
                    <h4 className="text-xl font-bold text-white mt-2 mb-4 tracking-tight font-mono">{app.title}</h4>
                    <p className="text-zinc-300 text-xs md:text-sm leading-relaxed font-sans">{app.desc}</p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-zinc-900 flex justify-between items-center text-xs font-mono">
                    <span className="text-zinc-500 text-[10px] uppercase">Host Parameters</span>
                    <span className="text-emerald-400 font-bold">{app.metric}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* VIEW: ROADMAP                           */}
        {/* ======================================= */}
        {currentPage === 'roadmap' && (
          <div className="page-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-16 space-y-4">
              <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase block">&gt;_ TAPE_OUT_MILESTONES</span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Our Verification & Tape-out Roadmap</h1>
              <p className="text-zinc-300 text-sm max-w-xl leading-relaxed">
                Follow our milestones as we move from cycle-accurate Verilog simulation to physical multi-layer foundry production.
              </p>
            </div>

            <div className="relative border-l border-zinc-900 ml-4 md:ml-12 pl-8 md:pl-12 space-y-12">
              {[
                {
                  year: "2026",
                  title: "Verilog RTL Modeling & Simulator Framework",
                  desc: "Modeling our proprietary register structures, validating signal connections under strict cycle-accurate emulators (Verilator/ModelSim).",
                  status: "COMPLETED"
                },
                {
                  year: "2027",
                  title: "A0 Physical Prototype Stackup Validation",
                  desc: "Validating initial PCB designs (80.00 mm x 60.00 mm, 10 layers, ENIG finish, FR-4 substrate) with standard PCIe co-processing interfaces.",
                  status: "IN PROGRESS"
                },
                {
                  year: "2028",
                  title: "Developer Evaluation Board Release",
                  desc: "Shipping first developer co-processing units with target host support profiles configured for RTX 3060 machines.",
                  status: "PLANNED"
                },
                {
                  year: "2029",
                  title: "Mass Foundry Production & Enterprise Scaling",
                  desc: "Mass volume distribution of proprietary silicon modules, scaling directly up to professional high-end RTX 5090 host rack environments.",
                  status: "PLANNED"
                }
              ].map((step, idx) => (
                <div key={idx} className="relative group">
                  <div className={`absolute -left-[41px] md:-left-[57px] top-1 w-6 h-6 rounded-full border-4 border-zinc-950 flex items-center justify-center transition-colors ${
                    step.status === 'COMPLETED' 
                      ? 'bg-emerald-400' 
                      : step.status === 'IN PROGRESS' 
                        ? 'bg-zinc-900 border-emerald-400 animate-pulse' 
                        : 'bg-zinc-900 border-zinc-800'
                  }`} />

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-3">
                      <span className="font-mono text-4xl font-extrabold text-white block leading-none">{step.year}</span>
                      <span className={`inline-block mt-3 px-2.5 py-1 rounded text-[9px] font-mono border ${
                        step.status === 'COMPLETED' 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : step.status === 'IN PROGRESS' 
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-300 animate-pulse' 
                            : 'bg-zinc-950 border-zinc-900 text-zinc-600'
                      }`}>
                        {step.status}
                      </span>
                    </div>

                    <div className="lg:col-span-9 bg-zinc-900/30 border border-zinc-900 hover:border-emerald-400/20 rounded-2xl p-6 md:p-8 transition-colors">
                      <h4 className="text-lg font-bold text-white mb-2 font-mono">{step.title}</h4>
                      <p className="text-zinc-300 text-xs md:text-sm leading-relaxed font-sans">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* VIEW: SCIENTIFIC TEAM                   */}
        {/* ======================================= */}
        {currentPage === 'team' && (
          <div className="page-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="space-y-4 text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase block">&gt;_ SILICON_INTEGRITY</span>
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">System Designers</h1>
              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                Our proprietary logic is engineered and validated under NDA protocols by a dedicated hardware design team.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { 
                  role: "Lead RTL Validation Engineer", 
                  dept: "Spider Language Compiler", 
                  nodes: "NODE_01_HYD", 
                  desc: "Validating complex registers cycle-by-cycle inside proprietary Verilog simulators to secure correct calculation margins.",
                  signals: ["Verilog HDL Checks", "Cycle-Accurate Modeling", "RTL Regression Trials"]
                },
                { 
                  role: "Head of Neural Microarchitecture", 
                  dept: "Spider AI Platform Core", 
                  nodes: "NODE_02_REMOTE", 
                  desc: "Formulating custom vector multipliers optimized to handle transformer parameters directly beside cash banks.",
                  signals: ["Register Mapping", "PCIe Driver Tuning", "Logic Integrity Checks"]
                },
                { 
                  role: "Principal 10-Layer Layout Architect", 
                  dept: "Spider OS Microkernel", 
                  nodes: "NODE_03_BLR", 
                  desc: "Laid out the 80mm x 60mm substrate stackup, controlling trace impedance for PCIe Gen4 x4 lines.",
                  signals: ["Impedance Matching", "Substrate Signal Shields", "FR-4 Thermal Checks"]
                }
              ].map((member, idx) => (
                <div 
                  key={idx} 
                  className="glass-morphism rounded-2xl p-6 border border-slate-800 hover:border-emerald-400/40 hover:shadow-[0_0_20px_rgba(34,197,94,0.05)] transition-all duration-300 relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/5 to-transparent"></div>
                  <div className="w-14 h-14 rounded-xl bg-[#020502] border border-slate-800 flex items-center justify-center text-emerald-400 mb-6 relative overflow-hidden">
                    <div className="absolute inset-1 rounded-lg border border-dashed border-emerald-500/30 animate-spin mobile-no-spin"></div>
                    <Cpu className="w-5 h-5 z-10" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider">{member.dept} • {member.nodes}</span>
                      <h3 className="text-base font-bold font-mono text-white mt-1 group-hover:text-emerald-400 transition-colors">{member.role}</h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{member.desc}</p>
                    <div className="pt-4 border-t border-slate-900/80 space-y-2">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">CORE SKILL MATRIX</span>
                      <div className="flex flex-wrap gap-1.5">
                        {member.signals.map((sig, sIdx) => (
                          <span key={sIdx} className="text-[8px] font-mono bg-slate-950 border border-slate-800 text-emerald-400 px-2.5 py-0.5 rounded-md">
                            {sig}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* VIEW: CONTACT                           */}
        {/* ======================================= */}
        {currentPage === 'contact' && (
          <div className="page-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              <div className="lg:col-span-5 space-y-8">
                <div className="space-y-2">
                  <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase block">&gt;_ STABLE_INTERFACE</span>
                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Establish Contact</h1>
                  <p className="text-sm text-slate-300 leading-relaxed font-sans">
                    Submit an inquiry to initiate NDA clearance and access proprietary Verilog registers.
                  </p>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="flex items-center space-x-3 p-3 bg-slate-950/80 border border-slate-900 rounded-lg">
                    <Mail className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-200 font-sans">contact@m4spider.com</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-950/80 border border-slate-900 rounded-lg">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-200 font-sans font-semibold">www.m4spider.com</span>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-slate-950/80 border border-slate-900 rounded-lg">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-slate-200 leading-relaxed font-sans">
                      M4 Spider Technologies Pvt. Ltd.<br />
                      India (Central Ecosystem Hub)
                    </span>
                  </div>
                </div>

                {/* Radar Grid Graphic */}
                <div className="h-44 glass-morphism rounded-xl border border-slate-800 overflow-hidden relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(2,4,2,0)_0%,rgba(2,4,2,0.92)_100%)] z-10"></div>
                  <div className="absolute w-32 h-32 rounded-full border border-emerald-500/20 animate-ping mobile-no-ping"></div>
                  <div className="absolute w-24 h-24 rounded-full border border-dashed border-emerald-500/20 animate-spin mobile-no-spin"></div>
                  <span className="relative z-20 font-mono text-[9px] text-emerald-400 tracking-wider uppercase bg-slate-950 px-3 py-1.5 border border-emerald-500/30 rounded-lg">
                    📡 SECURE STANDBY FOR NDA REQUESTS
                  </span>
                </div>
              </div>

              {/* Inquiry Form */}
              <div className="lg:col-span-7">
                <form onSubmit={(e) => { e.preventDefault(); }} className="glass-morphism rounded-2xl border border-slate-800 p-6 space-y-4">
                  <h3 className="text-sm font-bold font-mono text-emerald-400 tracking-wider border-b border-slate-900 pb-3">&gt;_ SECURE INQUIRY REGISTRY</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                    <div className="space-y-1">
                      <label htmlFor="user-name" className="text-[10px] font-mono text-slate-400 uppercase">Your Name</label>
                      <input id="user-name" type="text" required placeholder="Dr. Elena Rostova" className="w-full bg-slate-950 border border-slate-900 focus:border-emerald-400 focus:outline-none rounded-lg p-2.5 text-xs text-slate-200" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="user-email" className="text-[10px] font-mono text-slate-400 uppercase">Your Email</label>
                      <input id="user-email" type="email" required placeholder="representative@domain.com" className="w-full bg-slate-950 border border-slate-900 focus:border-emerald-400 focus:outline-none rounded-lg p-2.5 text-xs text-slate-200" />
                    </div>
                  </div>

                  <div className="space-y-1 font-sans">
                    <label htmlFor="subject-select" className="text-[10px] font-mono text-slate-400 uppercase">Target System Subject</label>
                    <select id="subject-select" className="w-full bg-slate-950 border border-slate-900 focus:border-emerald-400 focus:outline-none rounded-lg p-2.5 text-xs text-slate-300">
                      <option>NDA Clearance for Verilog Registers</option>
                      <option>RTX 3060 / 5090 Host Driver Access</option>
                      <option>Simulator Testbench Logs Integration</option>
                      <option>General Hardware Partnerships</option>
                    </select>
                  </div>

                  <div className="space-y-1 font-sans">
                    <label htmlFor="detail-message" className="text-[10px] font-mono text-slate-400 uppercase">Inquiry Details</label>
                    <textarea id="detail-message" required rows="4" placeholder="Request specific Verilog HDL registers, clock frequency emulations, or board thickness parameters..." className="w-full bg-slate-950 border border-slate-900 focus:border-emerald-400 focus:outline-none rounded-lg p-2.5 text-xs text-slate-200 resize-none"></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-3.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 hover:opacity-95 text-black font-bold text-xs tracking-widest transition-all font-mono"
                  >
                    DISPATCH REQUEST CODES
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* Inline documentation subview module */}
        {currentPage === 'docs' && (
          <SpyDocs onBack={() => navigateTo('home')} />
        )}

        {/* Inline sandbox subview module */}
        {currentPage === 'sandbox' && (
          <SpiderCloud onBack={() => navigateTo('home')} />
        )}

      </main>

      {/* Selected Architectural Module Spec Modal */}
      {selectedArch && (
        <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-8 relative overflow-hidden shadow-2xl">
            <button 
              onClick={() => setSelectedArch(null)}
              className="absolute top-6 right-6 font-mono text-xs text-zinc-500 hover:text-white uppercase"
            >
              [ Close ]
            </button>

            <div className="space-y-6 relative z-10">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">{selectedArch.tag} Parameters</span>
                <h4 className="text-2xl font-bold text-white mt-1 font-mono">{selectedArch.title}</h4>
                <p className="text-zinc-400 text-xs font-mono">{selectedArch.subtitle}</p>
              </div>

              <p className="text-zinc-200 text-xs md:text-sm leading-relaxed font-sans">
                {selectedArch.desc}
              </p>

              <div className="border-t border-zinc-800 pt-5">
                <h5 className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider mb-3">RTL Register Specifications (NDA Restricted)</h5>
                <div className="space-y-2 text-xs font-mono">
                  {selectedArch.specs.map((s, idx) => (
                    <div key={idx} className="flex justify-between py-1.5 border-b border-zinc-800">
                      <span className="text-zinc-400">{s.label}</span>
                      <span className="text-zinc-100 text-right font-bold">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={() => setSelectedArch(null)}
                  className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-white font-mono text-xs uppercase px-5 py-2.5 rounded-lg transition-colors"
                >
                  Close Parameters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Research Manuscript Abstract Modal */}
      {selectedPaper && (
        <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full p-8 relative shadow-2xl">
            <button 
              onClick={() => setSelectedPaper(null)}
              className="absolute top-6 right-6 font-mono text-xs text-zinc-500 hover:text-white uppercase"
            >
              [ Close ]
            </button>

            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">{selectedPaper.category}</span>
                <h4 className="text-2xl font-bold text-white mt-1 leading-snug font-mono">{selectedPaper.title}</h4>
                <p className="text-zinc-400 text-[10px] font-mono mt-1">By: {selectedPaper.authors} • Published: {selectedPaper.date}</p>
              </div>

              <div className="space-y-2">
                <h5 className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1">Manuscript Abstract (Proprietary Document Summary)</h5>
                <p className="text-zinc-200 text-xs md:text-sm leading-relaxed font-sans">{selectedPaper.abstract}</p>
              </div>

              <div className="space-y-2">
                <h5 className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1">Primary Finding</h5>
                <p className="text-zinc-200 text-xs md:text-sm leading-relaxed font-sans">{selectedPaper.findings}</p>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-6 border-t border-zinc-800 font-mono text-xs">
                <span className="text-[10px] text-zinc-500">Document DOI: {selectedPaper.doi}</span>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => {
                      const notify = document.createElement('div');
                      notify.className = "fixed bottom-5 right-5 bg-zinc-900 border border-emerald-500 text-emerald-400 font-mono text-xs p-4 rounded-xl shadow-2xl z-50 animate-bounce";
                      notify.innerText = "🔒 SECURE VAULT Handshake requested. Direct NDA credentials required to pull PDF.";
                      document.body.appendChild(notify);
                      setTimeout(() => notify.remove(), 4000);
                    }}
                    className="bg-emerald-400 text-black font-bold px-4 py-2 rounded-lg hover:bg-emerald-300 transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                  <button 
                    onClick={() => setSelectedPaper(null)}
                    className="bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-lg text-zinc-300 hover:text-white transition-colors"
                  >
                    Close Abstract
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      <footer className="bg-[#010301] border-t border-slate-900 py-12 relative z-10 text-xs text-slate-300 font-mono mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded border border-emerald-500/30 flex items-center justify-center text-emerald-400 bg-slate-950">
                <span className="text-emerald-400 font-mono text-sm font-bold">S</span>
              </div>
              <span className="text-sm font-semibold tracking-wider text-white">SPIDER TECHNOLOGIES</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-sm">
              Developing next-generation AI processors and dynamic co-processing registers. Strictly proprietary Verilog RTL designs checked dynamically through emulators.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3 font-mono">
            <span className="text-[10px] text-slate-500 tracking-widest block uppercase">SYSTEM REGISTRY</span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li><button onClick={() => navigateTo('home')} className="hover:text-emerald-400 transition-colors text-left">Home</button></li>
              <li><button onClick={() => navigateTo('about')} className="hover:text-emerald-400 transition-colors text-left">About Blueprint</button></li>
              <li><button onClick={() => navigateTo('architecture')} className="hover:text-emerald-400 transition-colors text-left">On-Die Architecture</button></li>
              <li><button onClick={() => navigateTo('research')} className="hover:text-emerald-400 transition-colors text-left">Scientific Research</button></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3 font-mono">
            <span className="text-[10px] text-slate-500 tracking-widest block uppercase">SECTORS & TIERS</span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li><button onClick={() => navigateTo('features')} className="hover:text-emerald-400 transition-colors text-left">System Capabilities</button></li>
              <li><button onClick={() => navigateTo('applications')} className="hover:text-emerald-400 transition-colors text-left">Sector Applications</button></li>
              <li><button onClick={() => navigateTo('roadmap')} className="hover:text-emerald-400 transition-colors text-left">Physical Roadmap</button></li>
              <li><button onClick={() => navigateTo('team')} className="hover:text-emerald-400 transition-colors text-left">Silicon Architects</button></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <span className="text-[10px] text-slate-500 tracking-widest block uppercase">CORE INTEGRITY</span>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-300 space-y-1 font-mono">
              <span className="block text-[9px] text-emerald-400 uppercase">● PROPRIETARY STATUS</span>
              <span className="block text-[8px] text-slate-400">VERILOG RTL SECURED</span>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-sans">
          <span>Copyright © 2026 Spider Technologies. All rights reserved. Registered Indian Ecosystem Hub.</span>
          <div className="flex space-x-4 font-mono">
            <span className="hover:text-white cursor-pointer transition-colors">PRIVACY CODE</span>
            <span className="hover:text-white cursor-pointer transition-colors">SYSTEM UTILITIES</span>
          </div>
        </div>
      </footer>

    </div>
  );
}