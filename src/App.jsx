import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Cpu, 
  Map, 
  Terminal, 
  Layers, 
  Compass, 
  ExternalLink, 
  ArrowRight, 
  Globe, 
  Mail, 
  MapPin, 
  Menu, 
  X, 
  Settings, 
  Activity, 
  Code, 
  Shield, 
  ChevronRight, 
  Brain, 
  Flame, 
  Database,
  Monitor,
  ArrowUpRight,
  Minimize2,
  Maximize2
} from 'lucide-react';
import SpyDocs from './SpyDocs';
import SpiderCloud from './cloud';
import SpiderChip from './chip';
import SpiderNotebookAgent from './spidernotebook';

const CyberStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes pulseSoft {
      0%, 100% { opacity: 0.25; filter: drop-shadow(0 0 2px rgba(0, 242, 254, 0.2)); }
      50% { opacity: 0.6; filter: drop-shadow(0 0 12px rgba(0, 242, 254, 0.8)); }
    }
    @keyframes neonGlowTeal {
      0%, 100% { box-shadow: 0 0 15px rgba(0, 242, 254, 0.15), inset 0 0 10px rgba(0, 242, 254, 0.05); }
      50% { box-shadow: 0 0 25px rgba(0, 242, 254, 0.35), inset 0 0 15px rgba(0, 242, 254, 0.1); }
    }
    .neon-border-teal {
      border: 1px solid rgba(0, 242, 254, 0.3);
      animation: neonGlowTeal 6s infinite ease-in-out;
    }
    .text-glow-turquoise {
      text-shadow: 0 0 10px rgba(0, 242, 254, 0.5);
    }
    .glass-morphism {
      background: rgba(3, 10, 18, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .glass-premium {
      background: linear-gradient(135deg, rgba(4, 18, 31, 0.95) 0%, rgba(2, 6, 12, 0.98) 100%);
      border: 1px solid rgba(0, 242, 254, 0.15);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
    }
    .premium-scrollbar::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    .premium-scrollbar::-webkit-scrollbar-track {
      background: rgba(2, 6, 12, 0.5);
    }
    .premium-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(0, 242, 254, 0.3);
      border-radius: 4px;
    }
    .premium-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 242, 254, 0.6);
    }
    .page-fade-in {
      animation: pageFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes pageFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .scrolled-nav {
      background: rgba(3, 10, 18, 0.92);
      border-bottom: 1px solid rgba(0, 242, 254, 0.2);
      padding-top: 0.75rem;
      padding-bottom: 0.75rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
    @media (max-width: 768px) {
      .mobile-no-spin {
        animation: none !important;
      }
      .mobile-no-ping {
        animation: none !important;
      }
    }
  `}} />
);

const isMobileDevice = () => typeof window !== 'undefined' && window.innerWidth < 768;

const LivingMotherboardBackground = () => {
  const canvasRef = useRef(null);

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
      const numBuses = mobile ? Math.max(4, Math.floor(width / 300)) : Math.max(14, Math.floor(width / 110));

      for (let b = 0; b < numBuses; b++) {
        const startX = Math.random() * width;
        const startY = Math.random() * height;
        const trackCount = mobile ? Math.floor(Math.random() * 2) + 2 : Math.floor(Math.random() * 3) + 3;
        const spacing = 12; 
        const length = Math.random() * 350 + 250;
        
        const angle = Math.PI / 4;
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
          color: Math.random() > 0.4 ? '#00EFFF' : '#62FF5B'
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
        if (Math.random() < (mobile ? 0.06 : 0.12)) {
          const trackIndex = Math.floor(Math.random() * bus.tracks.length);
          const track = bus.tracks[trackIndex];
          if (track.pulses.length < 2) {
            track.pulses.push({
              segmentIndex: 0,
              progress: 0,
              speed: Math.random() * 0.012 + 0.008,
              size: Math.random() * 2 + 1.2
            });
          }
        }
      });
    };

    let lastFrameTime = 0;
    const frameInterval = mobile ? 33 : 0;

    const renderLoop = (timestamp) => {
      if (paused) return;
      animationFrameId = requestAnimationFrame(renderLoop);

      if (mobile && timestamp - lastFrameTime < frameInterval) return;
      lastFrameTime = timestamp;

      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, width, height);

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      const radialGradient = ctx.createRadialGradient(mouse.x, mouse.y, 5, mouse.x, mouse.y, 500);
      radialGradient.addColorStop(0, 'rgba(0, 239, 255, 0.14)');
      radialGradient.addColorStop(0.3, 'rgba(98, 255, 91, 0.04)');
      radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, width, height);

      buses.forEach(bus => {
        bus.tracks.forEach(track => {
          if (track.points.length < 2) return;
          
          const midX = track.points[0].x;
          const midY = track.points[0].y;
          const distToMouse = Math.hypot(midX - mouse.x, midY - mouse.y);
          
          const opacityFactor = Math.max(0.06, 1 - distToMouse / 650);
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
            ctx.shadowBlur = distToMouse < 450 ? 6 : 0;
            ctx.shadowColor = bus.color;
          }
          
          ctx.beginPath();
          ctx.arc(endPoint.x, endPoint.y, track.width * 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1.0;
        });
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
              ctx.shadowBlur = 10;
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
                ctx.fillStyle = '#ffffff';
                if (!mobile) {
                  ctx.shadowBlur = 12;
                  ctx.shadowColor = bus.color;
                }
                ctx.beginPath();
                ctx.arc(currentX, currentY, p.size * 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                
                track.pulses.splice(pIdx, 1);
              }
            }
          }
        });
      });

      if (!mobile) {
        ctx.strokeStyle = 'rgba(0, 239, 255, 0.02)';
        ctx.lineWidth = 1;
        const step = 90;
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
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-0" />;
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); 
  const navRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetails, setShowProductDetails] = useState(true);
  const [showSpyDocs, setShowSpyDocs] = useState(false);
  const [showCloud, setShowCloud] = useState(false);
  const [showChip, setShowChip] = useState(false);
  const [showNotebook, setShowNotebook] = useState(false);
  const [previousPage, setPreviousPage] = useState('home');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const handlePopState = () => {
      const state = window.history.state;
      if (state) {
        if (state.overlay === 'spydocs') {
          setShowSpyDocs(true); setShowCloud(false); setShowChip(false); setShowNotebook(false);
          setCurrentPage(state.page || 'about');
        } else if (state.overlay === 'cloud') {
          setShowSpyDocs(false); setShowCloud(true); setShowChip(false); setShowNotebook(false);
          setCurrentPage(state.page || 'about');
        } else if (state.overlay === 'chip') {
          setShowSpyDocs(false); setShowCloud(false); setShowChip(true); setShowNotebook(false);
          setCurrentPage(state.page || 'about');
        } else if (state.overlay === 'notebook') {
          setShowSpyDocs(false); setShowCloud(false); setShowChip(false); setShowNotebook(true);
          setCurrentPage(state.page || 'products');
        } else {
          setShowSpyDocs(false); setShowCloud(false); setShowChip(false); setShowNotebook(false);
          setCurrentPage(state.page || 'home');
        }
        setPreviousPage(state.previousPage || 'home');
      }
    };
    window.addEventListener('popstate', handlePopState);

    window.history.replaceState({ page: 'home', previousPage: 'home' }, '', '');

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigateTo = (page) => {
    setShowSpyDocs(false);
    setShowCloud(false);
    setShowChip(false);
    setShowNotebook(false);
    setCurrentPage(page);
    setPreviousPage(currentPage);
    setMobileMenuOpen(false);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'instant' });
    window.history.pushState({ page, previousPage: currentPage }, '', `#${page}`);
  };

  const openOverlay = (setter, overlayName) => {
    setPreviousPage(currentPage);
    setter(true);
    window.history.pushState({ page: currentPage, previousPage: currentPage, overlay: overlayName }, '', `#${overlayName}`);
  };

  const closeOverlay = (setter) => {
    setter(false);
    setCurrentPage(previousPage);
    window.history.pushState({ page: previousPage, previousPage }, '', `#${previousPage}`);
  };

  const productData = useMemo(() => [
    {
      id: "notebook",
      title: "M4 Spider Notebook",
      desc: "AI-powered code editor with an integrated browser designed for modern software development. Experience predictive coding loops, layout structures, and auto-compiles right inside the context window.",
      status: "Active Development",
      color: "cyan",
      icon: Terminal,
      highlights: ["Deep contextual awareness", "Built-in dynamic sandbox preview", "Instant module installs"]
    },
    {
      id: "notebookagent",
      title: "M4 Spider Notebook AI Agent",
      desc: "Intelligent AI coding agent with real-time code analysis, multi-language sandbox execution, and autonomous debugging capabilities. Your always-on development partner.",
      status: "LIVE",
      color: "teal",
      icon: Brain,
      highlights: ["Autonomous code analysis", "Multi-language sandbox execution", "Real-time debugging & suggestions"]
    },
    {
      id: "maps",
      title: "Spider Maps",
      desc: "Modern navigation and mapping platform. Optimized vector rendering engines designed to compile geospatial data streams smoothly, providing incredible precision maps.",
      status: "LIVE",
      color: "teal",
      icon: Map,
      highlights: ["High-precision spatial analysis", "Zero-latency coordinates rendering", "Interactive mapping controls"]
    },
    {
      id: "ai",
      title: "Spider AI",
      desc: "Unified generative intelligence core with integrated LLM structures, high fidelity image synthesis nodes, fluid video generation modules, and deep systems engineering assistants.",
      status: "LIVE",
      color: "teal",
      icon: Brain,
      highlights: ["Generative neural models", "Cross-functional pipelines", "Ultra low-latency speech options"]
    },
    {
      id: "engine",
      title: "Spy Engine",
      desc: "Custom next-generation graphics and game engine. Multi-threaded architectural pipelines engineered directly inside system layers to compile beautiful shaders flawlessly.",
      status: "Development",
      color: "cyan",
      icon: Flame,
      highlights: ["Raymarching lighting arrays", "Custom scene graph structures", "Optimized memory safety blocks"]
    },
    {
      id: "language",
      title: "Spy Language",
      desc: "An innovative, type-safe, developer-friendly system level programming language built from scratch. Uniquely structured to build ultra-fast machine pipelines.",
      status: "Research",
      color: "purple",
      icon: Code,
      highlights: ["Zero-cost runtime abstractions", "Strict safe pointer structures", "Native hardware target compilation"]
    },
    {
      id: "os",
      title: "Spider OS",
      desc: "Secure microkernel-based operating system designed for edge-computing and high-concurrency neural node operations. Re-imagining computing primitives completely.",
      status: "Research",
      color: "purple",
      icon: Cpu,
      highlights: ["Robust memory space isolations", "Native system level AI integrations", "Dynamic scheduling cores"]
    },
    {
      id: "store",
      title: "Spider Store",
      desc: "Application marketplace engineered directly for smart plugins, secure compiled micro-services, custom tools, and advanced developer assets ecosystems.",
      status: "Planning",
      color: "slate",
      icon: Layers,
      highlights: ["Secure developer micro-distribution", "One-click component packaging", "Fully decentralized models"]
    },
    {
      id: "cloud",
      title: "Spider Cloud",
      desc: "Decentralized serverless cloud infrastructure built with instant cluster provisioning and automated globally distributed edge logic routing systems.",
      status: "Planning",
      color: "slate",
      icon: Database,
      highlights: ["Ultra-low latency serverless routes", "Auto-scaling micro architectures", "Encrypted dynamic node stores"]
    },
    {
      id: "vfx",
      title: "Spider VFX",
      desc: "Visual effects and cinematic content generation modules optimized with hardware-accelerated synthesis pathways for cinematic digital art.",
      status: "Research",
      color: "purple",
      icon: Monitor,
      highlights: ["Procedural geometry workflows", "Realtime dynamic physical renders", "AI-assisted canvas mapping"]
    },
    {
      id: "chip",
      title: "Spider Chip",
      desc: "Next-generation AI co-processor designed for intelligent computing, machine learning, robotics, and edge AI applications. Engineered with proprietary Verilog microarchitecture.",
      status: "R&D",
      color: "emerald",
      icon: Cpu,
      highlights: ["Proprietary Verilog microarchitecture", "NPU cores for matrix-vector operations", "PCIe Gen4 x4 co-processing"]
    }
  ], []);

  const serviceData = useMemo(() => [
    { title: "Custom Software Development", desc: "Crafting bulletproof original software from ground-up architecture directly targeted to maximize core operational efficiencies.", icon: Code },
    { title: "AI Solutions", desc: "Deploying high intelligence neural networks, model fine-tuning, automated processing pipelines, and beautiful LLM integrations.", icon: Brain },
    { title: "Enterprise Applications", desc: "Scalable, secure internal tech stacks, dynamic dashboard centers, and system controls built to handle billions of data points.", icon: Shield },
    { title: "Web Development", desc: "High performance, fully accessible, custom engineered single-page and server-side web products compiled beautifully for any speed.", icon: Globe },
    { title: "Mobile Development", desc: "Cross-platform and premium native mobile architectures featuring seamless transitions and immersive custom interactions.", icon: Cpu },
    { title: "Cloud Solutions", desc: "Robust cloud architecture configurations, secure container setups, serverless workflows, and zero-downtime microservices.", icon: Database },
    { title: "UI / UX Design", desc: "Exceptional cybernetic design frameworks, structural prototyping, clean design tokens, and highly interactive premium interfaces.", icon: Layers },
    { title: "Technical Consulting", desc: "Advanced technical consulting, system architecture auditing, code diagnostics, and long-term scaling planning maps.", icon: Compass },
    { title: "Product Development", desc: "Full-lifecycle engineering support from structural idea prototyping, product validation, to launching scaled production environments.", icon: Activity },
    { title: "Software Modernization", desc: "Updating monolithic legacies into high-speed micro-architectures with zero loss of operational integrity or data streams.", icon: Settings }
  ], []);

  return (
    <div className="relative min-h-screen text-white bg-[#05070a] selection:bg-cyan-400 selection:text-slate-950 flex flex-col font-sans overflow-x-hidden">
      <CyberStyles />
      <LivingMotherboardBackground />

      {}
      <nav ref={navRef} className="fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-transparent py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          <div 
            onClick={() => navigateTo('home')} 
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-cyan-500/30 bg-[#020d18] transition-all group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(0,242,254,0.3)]">
              <svg className="w-5 h-5 text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19M12 6a6 6 0 100 12 6 6 0 000-12z" />
              </svg>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wider text-white group-hover:text-cyan-400 transition-colors">
                M4 SPIDER
              </span>
              <span className="text-[9px] font-mono tracking-widest text-cyan-400 uppercase">
                TECHNOLOGIES
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            <button 
              onClick={() => navigateTo('home')} 
              className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wider transition-all hover:text-cyan-400 ${currentPage === 'home' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-300'}`}
            >
              HOME
            </button>
            <button 
              onClick={() => navigateTo('about')} 
              className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wider transition-all hover:text-cyan-400 ${currentPage === 'about' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-300'}`}
            >
              ABOUT
            </button>
            <button 
              onClick={() => navigateTo('products')} 
              className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wider transition-all hover:text-cyan-400 ${currentPage === 'products' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-300'}`}
            >
              PRODUCTS
            </button>
            <button 
              onClick={() => navigateTo('services')} 
              className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wider transition-all hover:text-cyan-400 ${currentPage === 'services' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-300'}`}
            >
              SERVICES
            </button>
            <button 
              onClick={() => navigateTo('projects')} 
              className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wider transition-all hover:text-cyan-400 ${currentPage === 'projects' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-300'}`}
            >
              PROJECTS
            </button>
            <button 
              onClick={() => navigateTo('people')} 
              className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wider transition-all hover:text-cyan-400 ${currentPage === 'people' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-300'}`}
            >
              PEOPLE
            </button>
            <button 
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-slate-800/50 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-[10px] font-mono text-slate-600 hidden lg:inline">⌘K</span>
            </button>
            <button 
              onClick={() => navigateTo('contact')} 
              className="ml-2 px-4 py-2 rounded-lg border border-cyan-500/30 hover:border-cyan-400 text-xs font-bold text-cyan-400 bg-cyan-950/20 transition-all duration-300"
            >
              GET IN TOUCH
            </button>
          </div>

          <div className="flex md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-2 rounded text-slate-300 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full glass-morphism border-b border-cyan-500/20 py-5 px-6 flex flex-col space-y-4 animate-fadeIn z-50">
            <button 
              onClick={() => { setMobileMenuOpen(false); setSearchOpen(true); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-700/50 bg-slate-900/40 text-sm text-slate-500 hover:text-slate-300 hover:border-cyan-500/30 transition-colors text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search pages, products...
              <span className="ml-auto text-[9px] font-mono border border-slate-700/50 px-1.5 py-0.5 rounded">⌘K</span>
            </button>
            <button onClick={() => navigateTo('home')} className="text-left py-2 font-semibold text-sm text-slate-200 hover:text-cyan-400">&gt; HOME</button>
            <button onClick={() => navigateTo('about')} className="text-left py-2 font-semibold text-sm text-slate-200 hover:text-cyan-400">&gt; ABOUT US</button>
            <button onClick={() => navigateTo('products')} className="text-left py-2 font-semibold text-sm text-slate-200 hover:text-cyan-400">&gt; PRODUCTS</button>
            <button onClick={() => navigateTo('services')} className="text-left py-2 font-semibold text-sm text-slate-200 hover:text-cyan-400">&gt; SERVICES</button>
            <button onClick={() => navigateTo('projects')} className="text-left py-2 font-semibold text-sm text-slate-200 hover:text-cyan-400">&gt; PROJECTS</button>
            <button onClick={() => navigateTo('people')} className="text-left py-2 font-semibold text-sm text-slate-200 hover:text-cyan-400">&gt; PEOPLE [TEAM]</button>
            <button onClick={() => navigateTo('contact')} className="text-left py-2 font-semibold text-sm text-slate-200 hover:text-cyan-400">&gt; CONTACT</button>
          </div>
        )}
      </nav>

      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-start justify-center pt-[12vh] px-4" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
          <div className="w-full max-w-lg glass-morphism border border-cyan-500/20 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center px-5 py-4 border-b border-slate-800/50">
              <svg className="w-5 h-5 text-slate-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search pages, products, services..." 
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const pages = ['home', 'about', 'products', 'services', 'projects', 'people', 'contact'];
                    const products = ['Spider Maps', 'Spy Language', 'Spider Cloud', 'Spider AI', 'Spider Chip', 'Spider VFX'];
                    const services = ['Custom Software Development', 'AI Solutions', 'Enterprise Applications', 'Web Development', 'Mobile Development', 'Cloud Solutions', 'UI / UX Design', 'Technical Consulting'];
                    const match = pages.find(p => p.includes(q)) || 
                      (products.find(p => p.toLowerCase().includes(q)) && 'products') ||
                      (services.find(s => s.toLowerCase().includes(q)) && 'services') ||
                      'home';
                    navigateTo(match);
                    setSearchQuery('');
                    setSearchOpen(false);
                  } else if (e.key === 'Escape') {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }
                }}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-500 font-sans"
              />
              <span className="text-[9px] font-mono text-slate-600 border border-slate-700/50 px-1.5 py-0.5 rounded ml-2">ESC</span>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {searchQuery ? (
                <div className="space-y-0.5">
                  {[
                    { label: 'Home', page: 'home' },
                    { label: 'About', page: 'about' },
                    { label: 'Products', page: 'products' },
                    { label: 'Services', page: 'services' },
                    { label: 'Projects', page: 'projects' },
                    { label: 'People', page: 'people' },
                    { label: 'Contact', page: 'contact' },
                    { label: 'Spider Maps', page: 'products' },
                    { label: 'Spy Language', page: 'products' },
                    { label: 'Spider Cloud', page: 'products' },
                    { label: 'Spider AI', page: 'products' },
                    { label: 'Spider Chip', page: 'products' },
                    { label: 'Spider VFX', page: 'products' },
                  ].filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
                    <button 
                      key={item.label}
                      onClick={() => { navigateTo(item.page); setSearchOpen(false); setSearchQuery(''); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-sans text-slate-300 hover:bg-cyan-500/10 hover:text-white transition-colors text-left"
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                  {(() => {
                    const q = searchQuery.toLowerCase();
                    const pages = ['home', 'about', 'products', 'services', 'projects', 'people', 'contact'];
                    const products = ['Spider Maps', 'Spy Language', 'Spider Cloud', 'Spider AI', 'Spider Chip', 'Spider VFX'];
                    const services = ['Custom Software Development', 'AI Solutions', 'Enterprise Applications', 'Web Development', 'Mobile Development', 'Cloud Solutions', 'UI / UX Design', 'Technical Consulting'];
                    const hasMatch = pages.some(p => p.includes(q)) || products.some(p => p.toLowerCase().includes(q)) || services.some(s => s.toLowerCase().includes(q));
                    if (!hasMatch) {
                      return <div className="px-4 py-6 text-center text-xs text-slate-600 font-sans">No results found</div>;
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-mono text-slate-600 tracking-widest uppercase">Quick Links</div>
                  {[
                    { label: 'Home', page: 'home' },
                    { label: 'About', page: 'about' },
                    { label: 'Products', page: 'products' },
                    { label: 'Services', page: 'services' },
                    { label: 'Projects', page: 'projects' },
                    { label: 'People', page: 'people' },
                    { label: 'Contact', page: 'contact' },
                  ].map((item) => (
                    <button 
                      key={item.label}
                      onClick={() => { navigateTo(item.page); setSearchOpen(false); setSearchQuery(''); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-sans text-slate-300 hover:bg-cyan-500/10 hover:text-white transition-colors text-left"
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                  <div className="px-3 py-1.5 mt-2 text-[10px] font-mono text-slate-600 tracking-widest uppercase">Products</div>
                  {[
                    { label: 'Spider Maps', page: 'products' },
                    { label: 'Spy Language', page: 'products' },
                    { label: 'Spider Cloud', page: 'products' },
                    { label: 'Spider AI', page: 'products' },
                    { label: 'Spider Chip', page: 'products' },
                    { label: 'Spider VFX', page: 'products' },
                  ].map((item) => (
                    <button 
                      key={item.label}
                      onClick={() => { navigateTo(item.page); setSearchOpen(false); setSearchQuery(''); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-sans text-slate-300 hover:bg-cyan-500/10 hover:text-white transition-colors text-left"
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {}
      <main className="flex-1 relative z-10 pt-20">

        {/* ======================================= */}
        {/* VIEW: HOME PAGE VIEW                    */}
        {/* ======================================= */}
        {currentPage === 'home' && (
          <div className="page-fade-in">
            <section className="relative min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(5,7,10,0)_0%,rgba(5,7,10,0.8)_100%)] z-0"></div>
              
              <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8 mt-12">
                
                <div className="inline-flex items-center space-x-2 bg-slate-950 border border-cyan-500/30 px-4 py-1.5 rounded-full text-[10px] tracking-widest text-cyan-400 uppercase font-mono shadow-[0_0_15px_rgba(0,239,255,0.1)]">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span>M4 SPIDER TECH PLATFORMS • STABLE ECOSYSTEM</span>
                </div>

                <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-tight">
                  Building <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-white text-glow-turquoise">Intelligent Software</span> for Tomorrow
                </h1>

                <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed font-sans">
                  Developing AI-powered software, developer tools, cloud technologies, mapping platforms, and custom digital solutions for businesses.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <button 
                    onClick={() => navigateTo('products')}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold text-xs tracking-widest transition-all hover:opacity-95 shadow-lg shadow-cyan-500/20"
                  >
                    EXPLORE PRODUCTS
                  </button>
                  <button 
                    onClick={() => navigateTo('contact')}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-lg border border-slate-700 bg-slate-950/80 hover:border-cyan-400 text-slate-200 hover:text-cyan-400 text-xs tracking-widest transition-all duration-300"
                  >
                    CONTACT US
                  </button>
                </div>

                {/* Dashboard Hub Portals */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto pt-16 border-t border-slate-900 text-left font-mono">
                  <div 
                    onClick={() => navigateTo('about')}
                    className="p-4 bg-slate-950/80 rounded-xl border border-slate-850 hover:border-cyan-500/40 cursor-pointer transition-all flex justify-between items-center group"
                  >
                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase tracking-widest">ABOUT</span>
                      <span className="text-white text-xs font-bold group-hover:text-cyan-400">OUR BLUEPRINT</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </div>

                  <div 
                    onClick={() => navigateTo('products')}
                    className="p-4 bg-slate-950/80 rounded-xl border border-slate-850 hover:border-cyan-500/40 cursor-pointer transition-all flex justify-between items-center group"
                  >
                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase tracking-widest">PRODUCTS</span>
                      <span className="text-white text-xs font-bold group-hover:text-cyan-400">ACTIVE REGISTRIES</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </div>

                  <div 
                    onClick={() => navigateTo('services')}
                    className="p-4 bg-slate-950/80 rounded-xl border border-slate-850 hover:border-cyan-500/40 cursor-pointer transition-all flex justify-between items-center group"
                  >
                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase tracking-widest">SERVICES</span>
                      <span className="text-white text-xs font-bold group-hover:text-cyan-400">CUSTOM ENTERPRISE</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </div>
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
                <div className="w-full aspect-square glass-morphism rounded-2xl border border-cyan-500/30 relative overflow-hidden flex items-center justify-center p-8 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent"></div>
                  
                  {/* Glowing 45-deg geometric motherboard chip structure */}
                  <div className="relative w-48 h-48 rounded-full border border-dashed border-cyan-500/30 flex items-center justify-center animate-spin mobile-no-spin" style={{ animationDuration: '40s' }}>
                    <div className="w-36 h-36 rounded-full border border-cyan-400/40 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-[#030d17] border border-slate-800 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                        <Cpu className="w-10 h-10 text-cyan-400" />
                      </div>
                    </div>
                  </div>
                  <span className="absolute top-4 left-4 font-mono text-[9px] text-cyan-400">SYSTEMS_R&D_V3</span>
                  <span className="absolute bottom-4 right-4 font-mono text-[9px] text-teal-400">MADE_IN_INDIA</span>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block">&gt;_ ARCHITECT_BLUEPRINT</span>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">About M4 Spider Technologies</h1>
                
                <p className="text-slate-300 leading-relaxed font-sans">
                  M4 Spider Technologies is an Indian technology startup focused on building innovative software products while helping businesses accelerate their growth through custom software development.
                </p>
                
                <p className="text-slate-300 leading-relaxed font-sans">
                  We are building an ecosystem of intelligent technologies including AI platforms, developer tools, mapping systems, cloud services, operating systems, and future hardware innovations. Our unique engineering culture prioritizes robust system safety, extreme code optimization, and real world utility.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-900 flex items-start space-x-3">
                    <div className="p-2 rounded bg-cyan-950/50 text-cyan-400">
                      <Code className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-mono">Original Products</h4>
                      <p className="text-xs text-slate-400 mt-1">Creating native environments like M4 Spider Notebook & Spider OS.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-900 flex items-start space-x-3">
                    <div className="p-2 rounded bg-teal-950/50 text-teal-400">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-mono">Custom Engineering</h4>
                      <p className="text-xs text-slate-400 mt-1">Accelerating corporate infrastructures with elegant, lightweight products.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Pillars */}
            <div className="mt-24 border-t border-slate-900 pt-16">
              <div className="text-center space-y-3 mb-16">
                <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block">&gt;_ GUIDING_PRINCIPLES</span>
                <h2 className="text-2xl sm:text-4xl font-extrabold">Our Core Pillars</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { t: "Product-First Mindset", d: "Developing elegant, scalable product components, avoiding short-term shortcuts." },
                  { t: "Innovative Engineering", d: "Designing unique solutions from kernel layers up to graphic UI arrays." },
                  { t: "Modern Technologies", d: "Built with high-efficiency programming modules to compile beautifully." },
                  { t: "AI Focused", d: "Directly linking advanced artificial intelligence models securely into standard platforms." },
                  { t: "Scalable Architecture", d: "Engineered to comfortably scale to billions of daily system coordinate tasks." },
                  { t: "Custom Solutions", d: "Building bespoke systems customized for specific enterprise workflows." },
                  { t: "Long-term Partnerships", d: "Maintaining consistent, reliable communication models to safeguard integrations." },
                  { t: "Continuous Innovation", d: "Pioneering systems research across both software compilation and chips." }
                ].map((item, idx) => (
                  <div key={idx} className="p-5 rounded-xl bg-slate-950 border border-slate-900 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                      <h4 className="text-sm font-bold font-mono text-white tracking-wide">{item.t}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Future Vision Timeline */}
            <div className="mt-24 border-t border-slate-900 pt-16">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-5 space-y-6">
                  <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block">&gt;_ SCALING_CHANNELS</span>
                  <h2 className="text-3xl font-extrabold">Future Tech Vision</h2>
                  <p className="text-slate-300 text-sm leading-relaxed font-sans">
                    Our long-term vision is to build a complete technology ecosystem—from intelligent software and cloud platforms to custom hardware and AI chips.
                  </p>
                </div>
                <div className="lg:col-span-7 space-y-8 pl-4 border-l border-slate-900 relative">
                  {[
                    { phase: "Today", desc: "Active software products & custom client architecture deployments." },
                    { phase: "AI Platforms", desc: "Intelligent core networks supporting custom language interfaces.", href: "https://ai.m4spider.com", actionLabel: "LAUNCH PLATFORM", badge: "LIVE" },
                    { phase: "Developer Tools", desc: "Robust compilers, IDE systems (M4 Spider Notebook), & debug modules.", onClick: () => openOverlay(setShowCloud, 'cloud'), actionLabel: "LAUNCH CLOUD", badge: "ACTIVE" },
                    { phase: "Cloud Infrastructure", desc: "High efficiency serverless networks & edge deployment points.", onClick: () => openOverlay(setShowCloud, 'cloud'), actionLabel: "LAUNCH CLOUD", badge: "LIVE" },
                    { phase: "Operating Systems", desc: "Microkernel architectures running secure system primitives." },
                    { phase: "Game Technologies", desc: "Custom structural graphics rendering pipelines (Spy Engine)." },
                    { phase: "Programming Language", desc: "Type-safe, high speed low-level development compilation language.", onClick: () => openOverlay(setShowSpyDocs, 'spydocs'), actionLabel: "VIEW DOCS", badge: "LIVE" },
                    { phase: "Developer Marketplace", desc: "Decentralized plugins & tools marketplace ecosystem." },
                    { phase: "Future Hardware", desc: "High capacity hardware targets engineered to process complex workloads." },
                    { phase: "Custom AI Chips", desc: "Proprietary physical silicon chip structures built specifically for AI.", onClick: () => openOverlay(setShowChip, 'chip'), actionLabel: "VIEW CHIP", badge: "R&D" }
                  ].map((step, idx) => (
                    step.onClick ? (
                      <button key={idx} onClick={step.onClick} className="relative pl-6 group block text-left w-full cursor-pointer">
                        <span className="absolute -left-[22px] top-1.5 w-2.5 h-2.5 rounded-full border transition-all bg-slate-900 border-slate-600 group-hover:border-cyan-400 group-hover:bg-cyan-400 group-hover:shadow-[0_0_10px_rgba(0,239,255,0.5)]"></span>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-colors font-sans">{step.phase}</span>
                            {step.badge && <span className="text-[8px] font-mono tracking-widest uppercase text-teal-400">● {step.badge}</span>}
                          </div>
                          <p className="text-xs text-slate-400 font-sans">{step.desc}</p>
                          <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-mono text-cyan-400 tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                            {step.actionLabel}
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      </button>
                    ) : step.href ? (
                      <a key={idx} href={step.href} target="_blank" rel="noreferrer" className="relative pl-6 group block">
                        <span className="absolute -left-[22px] top-1.5 w-2.5 h-2.5 rounded-full border transition-all bg-slate-900 border-slate-600 group-hover:border-cyan-400 group-hover:bg-cyan-400 group-hover:shadow-[0_0_10px_rgba(0,239,255,0.5)]"></span>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-colors font-sans">{step.phase}</span>
                            {step.badge && <span className="text-[8px] font-mono tracking-widest uppercase text-teal-400">● {step.badge}</span>}
                          </div>
                          <p className="text-xs text-slate-400 font-sans">{step.desc}</p>
                          <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-mono text-cyan-400 tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                            {step.actionLabel}
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      </a>
                    ) : (
                      <div key={idx} className="relative pl-6">
                        <span className="absolute -left-[22px] top-1.5 w-2.5 h-2.5 rounded-full border transition-all bg-slate-950 border-slate-800"></span>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold font-sans text-slate-500">{step.phase}</span>
                          </div>
                          <p className="text-xs font-sans text-slate-600">{step.desc}</p>
                          <span className="text-[8px] font-mono tracking-widest uppercase text-slate-700">COMING SOON</span>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* VIEW: PRODUCTS VIEW                     */}
        {/* ======================================= */}
        {currentPage === 'products' && (
          <div className="page-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center space-y-3 mb-16">
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block">&gt;_ ORIGINAL_TECHNOLOGIES</span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Our Product Ecosystem</h1>
              <p className="max-w-2xl mx-auto text-sm text-slate-450">
                Explore original systems built internally across language engines, operating kernels, and geospatial vectors.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productData.map((prod) => {
                const IconComp = prod.icon;
                return (
                  <div 
                    key={prod.id}
                    onClick={() => { setSelectedProduct(prod); setShowProductDetails(prod.id !== 'maps'); }}
                    className="glass-morphism rounded-2xl p-6 border border-slate-850 hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(0,239,255,0.1)] transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 group-hover:text-white transition-colors">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono tracking-widest border uppercase ${
                          prod.status === 'LIVE' 
                            ? 'bg-teal-950/60 text-teal-400 border-teal-500/30' 
                            : prod.status === 'Active Development' || prod.status === 'Development'
                            ? 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                            : 'bg-purple-950/60 text-purple-400 border-purple-500/30'
                        }`}>
                          ● {prod.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold font-mono tracking-wide text-white group-hover:text-cyan-400 transition-colors">
                        {prod.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2.5 leading-relaxed font-sans">
                        {prod.desc}
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-900/80 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Specifications</span>
                      <span className="text-xs font-mono text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* VIEW: SERVICES VIEW                     */}
        {/* ======================================= */}
        {currentPage === 'services' && (
          <div className="page-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center space-y-3 mb-16">
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block">&gt;_ ARCHITECTURAL_ABILITIES</span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Ecosystem Services</h1>
              <p className="max-w-2xl mx-auto text-sm text-slate-400">
                Deploying high-performance engineering patterns from core kernel scheduling up to custom software platforms.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviceData.map((srv, idx) => {
                const IconComp = srv.icon;
                return (
                  <div key={idx} className="glass-morphism rounded-xl p-6 border border-slate-900 hover:border-cyan-400/30 hover:shadow-[0_0_15px_rgba(0,239,255,0.05)] transition-all duration-300 group">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-xl bg-[#040d17] border border-slate-800 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all duration-300">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-bold font-mono text-white tracking-wide group-hover:text-cyan-400 transition-colors">
                          {srv.title}
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans">
                          {srv.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* VIEW: PROJECTS VIEW                     */}
        {/* ======================================= */}
        {currentPage === 'projects' && (
          <div className="page-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-6">
                <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block">&gt;_ STABLE_DELIVERIES</span>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">Delivered Operations</h1>
                <p className="text-slate-400 text-sm leading-relaxed font-sans">
                  We verify our targets with honest corporate logs. There are no inflated values or fictitious performance indicators.
                </p>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-900">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">CLIENT CONFIGURATIONS</span>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-3xl font-extrabold text-cyan-400 font-mono">2</span>
                      <span className="text-xs text-slate-300 font-sans">Successfully Delivered Projects</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-900">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">PERSONAL TECHNOLOGY STACKS</span>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-3xl font-extrabold text-teal-400 font-mono">8</span>
                      <span className="text-xs text-slate-300 font-sans">Products Under Active Development</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="glass-morphism rounded-2xl border border-slate-800 p-6 space-y-4">
                  <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest border-b border-slate-900 pb-3">Active Registry Updates [2026]</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950/60 border border-slate-900/60 text-xs font-mono">
                      <span className="text-slate-300">1. Spatial Navigation Map Pipeline</span>
                      <span className="text-teal-400">LIVE & ACTIVE</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950/60 border border-slate-900/60 text-xs font-mono">
                      <span className="text-slate-300">2. Custom Neural AI Synthesis Core</span>
                      <span className="text-teal-400">LIVE & ACTIVE</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950/60 border border-slate-900/60 text-xs font-mono">
                      <span className="text-slate-300">3. Unified IDE Kernel & Editor System</span>
                      <span className="text-amber-400">COMPILING DEPLOYMENT</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950/60 border border-slate-900/60 text-xs font-mono">
                      <span className="text-slate-300">4. Microkernel-Based OS Architecture</span>
                      <span className="text-purple-400">CORE RESEARCH</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* VIEW: PEOPLE [SYSTEM ARCHITECTS]        */}
        {/* ======================================= */}
        {currentPage === 'people' && (
          <div className="page-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="space-y-4 text-center max-w-3xl mx-auto mb-20">
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block">&gt;_ LEADERSHIP_TEAM</span>
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">The Minds Behind <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300">M4 Spider</span></h1>
              <p className="text-sm text-slate-400 leading-relaxed font-sans max-w-xl mx-auto">
                A focused leadership team driving innovation across AI, engineering, and operations — building technology that scales.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { 
                  name: "Valuvajjala Vivek Vardhan Rao", 
                  role: "CEO & Founder",
                  initials: "VV",
                  desc: "Visionary leader driving M4 Spider's mission to build intelligent software ecosystems. Spearheading product strategy, AI research, and platform development.",
                  tags: ["Vision & Strategy", "Product Architecture", "AI Research"]
                },
                { 
                  name: "Apikonda Varun Raj", 
                  role: "Chief Product Evangelist",
                  initials: "AV",
                  desc: "Product engineering leader driving technical excellence across all platforms. Architecting scalable systems and ensuring product quality from concept to deployment.",
                  tags: ["Product Architecture", "Technical Leadership", "System Design"]
                },
                { 
                  name: "Shaik Fareed", 
                  role: "Chief Operations Officer",
                  initials: "SF",
                  desc: "Operations strategist ensuring seamless execution across all verticals. Optimizing workflows, infrastructure reliability, and business process efficiency.",
                  tags: ["Operations Strategy", "Process Optimization", "Business Growth"]
                }
              ].map((member, idx) => (
                <div 
                  key={idx} 
                  className="group relative rounded-2xl overflow-hidden transition-all duration-500"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/60 rounded-2xl group-hover:border-cyan-500/30 transition-colors duration-500"></div>
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative p-8 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:from-cyan-500/30 group-hover:to-teal-500/20 transition-all duration-500">
                        <span className="text-lg font-bold text-cyan-400 font-mono">{member.initials}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-[9px] font-mono text-emerald-400/70 uppercase tracking-wider">Active</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors duration-300">{member.name}</h3>
                      <span className="text-[11px] font-mono text-cyan-400/80 uppercase tracking-wider">{member.role}</span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed font-sans">{member.desc}</p>

                    <div className="pt-4 border-t border-slate-800/50">
                      <div className="flex flex-wrap gap-1.5">
                        {member.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="text-[9px] font-mono bg-slate-900/80 border border-slate-700/40 text-slate-300 px-2.5 py-1 rounded-md group-hover:border-cyan-500/20 group-hover:text-cyan-300 transition-all duration-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-20 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-900/50 border border-slate-800/50">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-xs font-mono text-slate-400 tracking-wider">M4 SPIDER TECHNOLOGIES • EST. 2024</span>
              </div>
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
                  <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block">&gt;_ STABLE_INTERFACE</span>
                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Establish Contact</h1>
                  <p className="text-sm text-slate-400 leading-relaxed font-sans">
                    Submit a secure inquiry to initiate corporate communication channels.
                  </p>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="flex items-center space-x-3 p-3 bg-slate-950/80 border border-slate-900 rounded-lg">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    <span className="text-slate-300">contact@m4spider.com</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-950/80 border border-slate-900 rounded-lg">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span className="text-slate-300">www.m4spider.com</span>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-slate-950/80 border border-slate-900 rounded-lg">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300 leading-relaxed font-sans">
                      M4 Spider Technologies<br />
                      India (Central Ecosystem Hub)
                    </span>
                  </div>
                </div>

                {/* Cybernetic active radar map */}
                <div className="h-44 glass-morphism rounded-xl border border-slate-800 overflow-hidden relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(5,7,10,0)_0%,rgba(5,7,10,0.9)_100%)] z-10"></div>
                  <div className="absolute w-32 h-32 rounded-full border border-cyan-500/20 animate-ping mobile-no-ping"></div>
                  <div className="absolute w-24 h-24 rounded-full border border-dashed border-cyan-500/20 animate-spin mobile-no-spin"></div>
                  <span className="relative z-20 font-mono text-[9px] text-cyan-400 tracking-wider uppercase bg-slate-950 px-3 py-1.5 border border-cyan-500/30 rounded-lg">
                    📡 SECURE HUB ACTIVE
                  </span>
                </div>
              </div>

              {/* Secure inquiry contact form */}
              <div className="lg:col-span-7">
                <form onSubmit={(e) => { e.preventDefault(); }} className="glass-morphism rounded-2xl border border-slate-800 p-6 space-y-4">
                  <h3 className="text-sm font-bold font-mono text-cyan-400 tracking-wider border-b border-slate-900 pb-3">&gt;_ INQUIRY DISPATCH REGISTRY</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Your Name</label>
                      <input type="text" placeholder="Full Name" className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-400 focus:outline-none rounded-lg p-2.5 text-xs text-slate-200" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Your Email</label>
                      <input type="email" placeholder="representative@domain.com" className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-400 focus:outline-none rounded-lg p-2.5 text-xs text-slate-200" />
                    </div>
                  </div>

                  <div className="space-y-1 font-sans">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">Target System Subject</label>
                    <select className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-400 focus:outline-none rounded-lg p-2.5 text-xs text-slate-400">
                      <option>Custom Software Development Integration</option>
                      <option>AI Platform License Request</option>
                      <option>Geospatial Maps Pipeline Setup</option>
                      <option>General Corporate Inquiry</option>
                    </select>
                  </div>

                  <div className="space-y-1 font-sans">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">Detail Message</label>
                    <textarea rows="4" placeholder="Brief details concerning your architecture needs..." className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-400 focus:outline-none rounded-lg p-2.5 text-xs text-slate-200"></textarea>
                  </div>

                  <button 
                    type="button" 
                    className="w-full py-3.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:opacity-95 text-slate-950 font-bold text-xs tracking-widest transition-all font-mono"
                  >
                    SUBMIT INQUIRY
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

      </main>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 animate-fadeIn">
          <div className={`w-full ${selectedProduct.id === 'maps' && !showProductDetails ? 'max-w-4xl h-[85vh]' : selectedProduct.id === 'maps' ? 'max-w-2xl' : 'max-w-lg'} glass-premium rounded-2xl overflow-hidden relative border border-cyan-500/30 transition-all duration-300`}>
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {selectedProduct.id === 'maps' && (
              <div className={`w-full ${showProductDetails ? 'h-[280px]' : 'flex-1 h-full'} bg-[#02060c] relative overflow-hidden border-b border-cyan-500/20 transition-all duration-300`}>
                <iframe 
                  src="https://maps.m4spider.com" 
                  title="Spider Maps Preview" 
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin"
                />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#02060c] via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <span className="text-[9px] font-mono text-cyan-400 bg-slate-950/90 px-2 py-1 rounded border border-cyan-500/20">LIVE PREVIEW</span>
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <button 
                      onClick={() => setShowProductDetails(!showProductDetails)}
                      className="text-[9px] font-mono text-cyan-400 bg-slate-950/90 px-2 py-1 rounded border border-cyan-500/20 hover:bg-slate-900 transition-colors flex items-center gap-1"
                    >
                      {showProductDetails ? (
                        <><Minimize2 className="w-2.5 h-2.5" /> EXPAND MAP</>
                      ) : (
                        <><Maximize2 className="w-2.5 h-2.5" /> SHOW DETAILS</>
                      )}
                    </button>
                    <a href="https://maps.m4spider.com" target="_blank" rel="noreferrer" className="text-[9px] font-mono text-cyan-400 bg-slate-950/90 px-2 py-1 rounded border border-cyan-500/20 hover:bg-slate-900 transition-colors flex items-center gap-1">
                      OPEN FULL <ArrowUpRight className="w-2.5 h-2.5" />
                    </a>
                  </div>
          </div>
        </div>
      )}

            {(!selectedProduct.id || selectedProduct.id !== 'maps' || showProductDetails) && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-[#030e18] text-cyan-400 border border-cyan-500/20">
                  {React.createElement(selectedProduct.icon, { className: "w-6 h-6" })}
                </div>
                <div>
                  <h3 className="text-lg font-bold font-mono text-white">{selectedProduct.title}</h3>
                  <span className="text-[10px] font-mono text-teal-400">● REGISTRY: {selectedProduct.status}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
                <p>{selectedProduct.desc}</p>
                <p className="text-slate-400">
                  Built to compile smoothly across standard system modules with high-efficiency scaling frameworks.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-mono text-slate-500 tracking-widest block uppercase">SYSTEM HIGHLIGHTS</span>
                <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                  {selectedProduct.highlights.map((hl, hIdx) => (
                    <li key={hIdx} className="flex items-center space-x-2">
                      <span className="text-cyan-400">✔</span>
                      <span className="font-sans">{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                {selectedProduct.id === 'language' ? (
                  <button 
                    onClick={() => { setSelectedProduct(null); openOverlay(setShowSpyDocs, 'spydocs'); }}
                    className="flex-1 bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold font-mono text-xs py-2.5 rounded-lg tracking-wider text-center"
                  >
                    VIEW DOCS
                  </button>
                ) : selectedProduct.id === 'cloud' ? (
                  <button 
                    onClick={() => { setSelectedProduct(null); openOverlay(setShowCloud, 'cloud'); }}
                    className="flex-1 bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold font-mono text-xs py-2.5 rounded-lg tracking-wider text-center"
                  >
                    VISIT CLOUD
                  </button>
                ) : selectedProduct.id === 'chip' ? (
                  <button 
                    onClick={() => { setSelectedProduct(null); openOverlay(setShowChip, 'chip'); }}
                    className="flex-1 bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold font-mono text-xs py-2.5 rounded-lg tracking-wider text-center"
                  >
                    VIEW CHIP
                  </button>
                ) : selectedProduct.id === 'notebookagent' ? (
                  <button 
                    onClick={() => { setSelectedProduct(null); openOverlay(setShowNotebook, 'notebook'); }}
                    className="flex-1 bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold font-mono text-xs py-2.5 rounded-lg tracking-wider text-center"
                  >
                    LAUNCH AGENT
                  </button>
                ) : (
                  <button 
                    onClick={() => { setSelectedProduct(null); navigateTo('contact'); }}
                    className="flex-1 bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold font-mono text-xs py-2.5 rounded-lg tracking-wider text-center"
                  >
                    REQUEST SYSTEM ACCESS
                  </button>
                )}
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2.5 rounded-lg border border-slate-850 text-slate-400 hover:text-white font-mono text-xs transition-colors animate-pulse"
                >
                  CLOSE
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {showSpyDocs && (
        <div className="fixed inset-0 z-50 bg-black overflow-y-auto">
          <SpyDocs onBack={() => closeOverlay(setShowSpyDocs)} />
        </div>
      )}

      {showCloud && (
        <div className="fixed inset-0 z-50 bg-black overflow-y-auto">
          <SpiderCloud onBack={() => closeOverlay(setShowCloud)} />
        </div>
      )}

      {showChip && (
        <div className="fixed inset-0 z-50 bg-black overflow-y-auto">
          <SpiderChip onBack={() => closeOverlay(setShowChip)} />
        </div>
      )}

      {showNotebook && (
        <div className="fixed inset-0 z-50 bg-black overflow-y-auto">
          <SpiderNotebookAgent onBack={() => closeOverlay(setShowNotebook)} />
        </div>
      )}

      {}
      <footer className="bg-[#020509] border-t border-slate-900 py-12 relative z-10 text-xs text-slate-400 font-mono mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded border border-cyan-500/30 flex items-center justify-center text-cyan-400 bg-slate-950">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19M12 6a6 6 0 100 12 6 6 0 000-12z" />
                </svg>
              </div>
              <span className="text-sm font-semibold tracking-wider text-white">M4 SPIDER TECH</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-sans max-w-sm">
              Building Intelligent Software for Tomorrow. Developing original software products and custom engineering configurations globally.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <span className="text-[10px] text-slate-500 tracking-widest block uppercase">SYSTEM REGISTRY</span>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><button onClick={() => navigateTo('home')} className="hover:text-cyan-400 transition-colors text-left">Home</button></li>
              <li><button onClick={() => navigateTo('about')} className="hover:text-cyan-400 transition-colors text-left">About Blueprint</button></li>
              <li><button onClick={() => navigateTo('products')} className="hover:text-cyan-400 transition-colors text-left">Product Ecosystem</button></li>
              <li><button onClick={() => navigateTo('services')} className="hover:text-cyan-400 transition-colors text-left">Ecosystem Services</button></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <span className="text-[10px] text-slate-500 tracking-widest block uppercase">PRODUCT PLATFORMS</span>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><a href="https://maps.m4spider.com" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">Spider Maps</a></li>
              <li><a href="https://ai.m4spider.com" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">Spider AI</a></li>
              <li><button onClick={() => { openOverlay(setShowNotebook, 'notebook'); }} className="hover:text-cyan-400 transition-colors text-left">M4 Spider Notebook AI Agent</button></li>
              <li><button onClick={() => navigateTo('projects')} className="hover:text-cyan-400 transition-colors text-left">Delivered Operations</button></li>
              <li><button onClick={() => navigateTo('people')} className="hover:text-cyan-400 transition-colors text-left">System Architects</button></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <span className="text-[10px] text-slate-500 tracking-widest block uppercase">CORE INTEGRITY</span>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-455 space-y-1">
              <span className="block text-[9px] text-cyan-400 uppercase">● STABLE OPERATIVE</span>
              <span className="block text-[8px] text-slate-600">ZERO COMPILING FAULTS</span>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-600">
          <span>Copyright © 2026 M4 Spider Technologies All rights reserved.</span>
          <div className="flex space-x-4">
            <span className="hover:text-white cursor-pointer transition-colors">PRIVACY CODE</span>
            <span className="hover:text-white cursor-pointer transition-colors">SYSTEM UTILITIES</span>
          </div>
        </div>
      </footer>

    </div>
  );
}