import React, { useState, useEffect, useRef } from 'react';


const Icons = {
  Spider: () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M6 6l12 12M6 18L12 12m0 0L18 6" />
    </svg>
  ),
  Download: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Desktop: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Apple: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.73-1.18 1.87-1.03 2.98 1.12.09 2.27-.58 2.98-1.42z" />
    </svg>
  ),
  Windows: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.102zM10.8 1.95L24 0v11.55H10.8V1.95zM10.8 12.45H24v11.55l-13.2-1.95v-9.6z" />
    </svg>
  ),
  Linux: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2c-.5 0-1 .1-1.5.3-3.2 1.3-4.5 4.5-4.5 7.7v1.1c-.1.5-.2.9-.3 1.4-.4 1.7-.8 3.5-1.1 5.3-.2.9.1 1.7.7 2.3.8.8 2 1.2 3.2 1.2 1.6 0 3.1-.3 4.5-.9 1.4.6 2.9.9 4.5.9 1.2 0 2.4-.4 3.2-1.2.6-.6.9-1.4.7-2.3-.3-1.8-.7-3.6-1.1-5.3-.1-.5-.2-.9-.3-1.4v-1.1c0-3.2-1.3-6.4-4.5-7.7C13 2.1 12.5 2 12 2zm0 1.5c.3 0 .7.1 1 .2 2.3.9 3.5 3.3 3.5 6.3v.9l.4 1.7c.3 1.5.7 3.1.9 4.6.1.5-.1.8-.3 1-.4.4-1.1.6-1.8.6h-2.1c-.6-1-1.5-1.8-2.6-2.1v-.8c.4-.1.8-.4 1-.8s.2-.9-.1-1.3c-.3-.4-.8-.6-1.3-.6-.5 0-1 .2-1.3.6-.3.4-.3.9-.1 1.3s.6.7 1 .8v.8c-1.1.3-2 1.1-2.6 2.1H5.8c-.7 0-1.4-.2-1.8-.6-.2-.2-.4-.5-.3-1 .2-1.5.6-3.1.9-4.6l.4-1.7v-.9C5 13.3 6.2 10.9 8.5 10c.3-.1.7-.2 1-.2.8 0 1.6.2 2.5.5V10c0-.4.3-.8.8-.8s.8.4.8.8v.3c.9-.3 1.7-.5 2.4-.5z" />
    </svg>
  ),
  Check: ({ className = "w-4 h-4 text-emerald-500" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  ArrowRight: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  ),
  Terminal: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Calculator: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  Shield: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Lock: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  Menu: ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  X: ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Sparkles: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  Cpu: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
  BookOpen: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
};

const isMobileDevice = () => typeof window !== 'undefined' && window.innerWidth < 768;

const LivingMotherboardCanvas = () => {
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
      if (!paused) { paused = true; cancelAnimationFrame(animationFrameId); }
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => { paused = false; animationFrameId = requestAnimationFrame(renderLoop); }, 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const numRays = mobile ? 18 : 50;
    let rays = [];

    const createRay = () => {
      const edge = Math.floor(Math.random() * 4);
      let x, y, angle;
      const speed = 1.5 + Math.random() * 4;
      const len = 60 + Math.random() * 200;
      const cyan = Math.random() > 0.3;
      if (edge === 0) { x = Math.random() * width; y = -20; angle = Math.PI / 2 + (Math.random() - 0.5) * 0.6; }
      else if (edge === 1) { x = width + 20; y = Math.random() * height; angle = Math.PI + (Math.random() - 0.5) * 0.6; }
      else if (edge === 2) { x = Math.random() * width; y = height + 20; angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6; }
      else { x = -20; y = Math.random() * height; angle = (Math.random() - 0.5) * 0.6; }
      const tipX = x + Math.cos(angle) * len;
      const tipY = y + Math.sin(angle) * len;
      return { x, y, tipX, tipY, angle, speed, len, opacity: 0.3 + Math.random() * 0.5, cyan, progress: 0, trail: 0.02 + Math.random() * 0.03 };
    };

    for (let i = 0; i < numRays; i++) {
      const ray = createRay();
      ray.progress = Math.random();
      rays.push(ray);
    }

    let time = 0;

    const renderLoop = () => {
      if (paused) return;
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      for (let i = rays.length - 1; i >= 0; i--) {
        const r = rays[i];
        r.progress += r.trail;
        if (r.progress > 1.05) { rays[i] = createRay(); continue; }

        const headX = r.x + (r.tipX - r.x) * r.progress;
        const headY = r.y + (r.tipY - r.y) * r.progress;
        const tailProgress = Math.max(0, r.progress - 0.25);
        const tailX = r.x + (r.tipX - r.x) * tailProgress;
        const tailY = r.y + (r.tipY - r.y) * tailProgress;

        const fadeIn = Math.min(r.progress * 4, 1);
        const fadeOut = r.progress > 0.7 ? 1 - (r.progress - 0.7) / 0.3 : 1;
        const alpha = r.opacity * fadeIn * fadeOut;

        if (alpha <= 0.01) continue;

        const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
        if (r.cyan) {
          grad.addColorStop(0, `rgba(0, 242, 255, 0)`);
          grad.addColorStop(0.6, `rgba(0, 242, 255, ${alpha * 0.6})`);
          grad.addColorStop(1, `rgba(0, 242, 255, ${alpha})`);
        } else {
          grad.addColorStop(0, `rgba(45, 212, 191, 0)`);
          grad.addColorStop(0.6, `rgba(45, 212, 191, ${alpha * 0.6})`);
          grad.addColorStop(1, `rgba(45, 212, 191, ${alpha})`);
        }

        ctx.strokeStyle = grad;
        ctx.lineWidth = mobile ? 1 : 1.5;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();

        if (r.progress < 0.95) {
          ctx.fillStyle = r.cyan ? `rgba(0, 242, 255, ${alpha * 0.8})` : `rgba(45, 212, 191, ${alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(headX, headY, mobile ? 1 : 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      while (rays.length < numRays) rays.push(createRay());

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);
  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-0" />;
};

const CyberStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes pageFadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .page-fade-in {
      opacity: 0;
      animation: pageFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .slide-up { opacity: 0; animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .slide-up-delay-1 { animation-delay: 0.1s; }
    .slide-up-delay-2 { animation-delay: 0.2s; }
    .slide-up-delay-3 { animation-delay: 0.3s; }
    .slide-up-delay-4 { animation-delay: 0.4s; }
    .slide-up-delay-5 { animation-delay: 0.5s; }
    @keyframes fadeInScale {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .fade-in-scale { animation: fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .shimmer-border {
      position: relative;
      overflow: hidden;
    }
    .shimmer-border::before {
      content: '';
      position: absolute;
      top: -1px; left: -1px; right: -1px; bottom: -1px;
      background: linear-gradient(90deg, transparent, rgba(0,242,255,0.3), transparent);
      background-size: 200% 100%;
      animation: shimmer 3s infinite linear;
      border-radius: inherit;
      z-index: -1;
    }
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 20px rgba(0, 242, 255, 0.1); }
      50% { box-shadow: 0 0 40px rgba(0, 242, 255, 0.25); }
    }
    .glow-pulse { animation: glowPulse 4s infinite ease-in-out; }
    @keyframes neonGlowTeal {
      0%, 100% { box-shadow: 0 0 15px rgba(0, 242, 254, 0.15), inset 0 0 10px rgba(0, 242, 254, 0.05); }
      50% { box-shadow: 0 0 25px rgba(0, 242, 254, 0.35), inset 0 0 15px rgba(0, 242, 254, 0.1); }
    }
    .glass-morphism {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .premium-scrollbar::-webkit-scrollbar { width: 5px; }
    .premium-scrollbar::-webkit-scrollbar-track { background: rgba(2, 6, 12, 0.5); }
    .premium-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 242, 254, 0.3); border-radius: 4px; }
    .premium-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 242, 254, 0.6); }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    .float { animation: float 3s ease-in-out infinite; }
    .scrolled-nav {
      background: rgba(0, 0, 0, 0.6) !important;
      border-bottom: 1px solid rgba(0, 242, 254, 0.2) !important;
    }
    @keyframes borderTrace {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
    .cyber-border {
      border: 1px solid transparent;
      background-clip: padding-box;
      position: relative;
    }
    .cyber-border::after {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: inherit;
      background: linear-gradient(90deg, transparent, rgba(0,242,255,0.2), transparent, rgba(0,245,165,0.15), transparent);
      background-size: 200% 100%;
      animation: borderTrace 4s linear infinite;
      z-index: -1;
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
      -webkit-mask-composite: xor;
      padding: 1px;
    }
    @keyframes circuitPulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
    .circuit-pulse { animation: circuitPulse 2s ease-in-out infinite; }
    @media (max-width: 768px) {
      .mobile-no-spin { animation: none !important; }
      .mobile-no-ping { animation: none !important; }
    }
  `}} />
);


export default function App({ onBack }) {
  const [currentView, setCurrentView] = useState('landing');
  const [devCount, setDevCount] = useState(5);
  const [hoursSaved, setHoursSaved] = useState(10);
  const [detectedOS, setDetectedOS] = useState('Analyzing system environment...');
  const [osIcon, setOsIcon] = useState('desktop');
  const [openFAQ, setOpenFAQ] = useState(null);
  const [toast, setToast] = useState({ visible: false, title: '', desc: '' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [docsActiveSection, setDocsActiveSection] = useState('overview');
  const navRef = useRef(null);


  // Platform detection logic (strictly on-load parameters)
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('win') !== -1) {
      setDetectedOS("Windows 10 / 11 Desktop (Verified Architecture)");
      setOsIcon('windows');
    } else if (ua.indexOf('mac') !== -1) {
      setDetectedOS("macOS Apple Silicon & Intel Architectures");
      setOsIcon('apple');
    } else if (ua.indexOf('linux') !== -1) {
      setDetectedOS("Linux Standalone Distribution (Portable .AppImage)");
      setOsIcon('linux');
    } else {
      setDetectedOS("Universal Computer Environment Platform Supported");
      setOsIcon('desktop');
    }
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

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


  // Utility toast notification system
  const triggerToast = (title, desc) => {
    setToast({ visible: true, title, desc });
    setTimeout(() => {
      setToast({ visible: false, title: '', desc: '' });
    }, 4500);
  };


  // ROI Calculator Calculations
  const monthlyHoursSaved = devCount * hoursSaved * 4;
  const estimatedSavings = monthlyHoursSaved * 50; // assuming $50/hr standard software engineer rate


  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };


  return (
    <div className="font-sans text-white min-h-screen selection:bg-cyan-400 selection:text-slate-950 overflow-x-hidden antialiased">
      <LivingMotherboardCanvas />
      <CyberStyles />
      
      {}
      <nav ref={navRef} className="sticky top-0 z-50 bg-black/50 border-b border-cyan-500/15 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {onBack && (
                <button 
                  onClick={onBack}
                  className="w-9 h-9 rounded-xl border border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-300 transition-all"
                >
                  ←
                </button>
              )}
              <a href="#" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/[0.04] rounded-xl flex items-center justify-center border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
                <Icons.Spider />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight text-white">SpiderNotebook</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Local IDE</span>
                </div>
                <span className="block text-xs text-slate-400 tracking-wide font-medium">Secure AI Workspace</span>
              </div>
            </a>
            </div>


            {/* Nav Directory (Desktop) */}
            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
              <button 
                onClick={() => setCurrentView('landing')} 
                className={`transition-colors ${currentView === 'landing' ? 'text-cyan-400' : 'hover:text-cyan-400'}`}
              >
                Product
              </button>
              <button 
                onClick={() => { setCurrentView('docs'); setDocsActiveSection('overview'); }} 
                className={`flex items-center gap-1.5 transition-colors ${currentView === 'docs' ? 'text-cyan-400' : 'hover:text-cyan-400'}`}
              >
                <Icons.BookOpen className="w-4 h-4 text-cyan-500" />
                Docs & APIs
              </button>
              <button onClick={() => { scrollToSection('overview'); }} className="hover:text-cyan-400 transition-colors">Overview</button>
              <button onClick={() => { scrollToSection('features'); }} className="hover:text-cyan-400 transition-colors">Capabilities</button>
              <button onClick={() => { scrollToSection('roi'); }} className="hover:text-cyan-400 transition-colors">ROI Estimator</button>
            </div>


            {/* Action CTA */}
            <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={() => scrollToSection('download')} 
                className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 text-xs font-bold tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-500/20"
              >
                <Icons.Download className="w-4 h-4 mr-2" /> Download Free
              </button>
            </div>


            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:bg-white/[0.04]"
              >
                {mobileMenuOpen ? <Icons.X /> : <Icons.Menu />}
              </button>
            </div>
          </div>
        </div>


        {/* Mobile Directory Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-transparent/70 px-4 pt-4 pb-6 space-y-3">
            <button onClick={() => { scrollToSection('overview'); setMobileMenuOpen(false); }} className="block py-2 text-sm font-semibold text-slate-400 text-left">Overview</button>
            <button onClick={() => { setCurrentView('landing'); setMobileMenuOpen(false); }} className="block py-2 text-sm font-semibold text-slate-400 text-left">Product</button>
            <button onClick={() => { setCurrentView('docs'); setDocsActiveSection('overview'); setMobileMenuOpen(false); }} className="block py-2 text-sm font-semibold text-slate-400 text-left">Docs & APIs</button>
            <button onClick={() => { scrollToSection('features'); setMobileMenuOpen(false); }} className="block py-2 text-sm font-semibold text-slate-400 text-left">Capabilities</button>
            <button onClick={() => { scrollToSection('specs'); setMobileMenuOpen(false); }} className="block py-2 text-sm font-semibold text-slate-400 text-left">Specifications</button>
            <button onClick={() => { scrollToSection('faq'); setMobileMenuOpen(false); }} className="block py-2 text-sm font-semibold text-slate-400 text-left">FAQ</button>
            <button 
              onClick={() => { scrollToSection('download'); setMobileMenuOpen(false); }}
              className="flex items-center justify-center w-full py-3 bg-cyan-500/100 text-white font-bold text-xs uppercase tracking-wider rounded-xl"
            >
              <Icons.Download className="w-4 h-4 mr-2" /> Download Free
            </button>
          </div>
        )}
      </nav>


      {currentView === 'landing' && (
      <>
      <header className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden page-fade-in">
        {/* Soft cyan decorative glow background vector */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/100/5 rounded-full blur-3xl pointer-events-none"></div>


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-cyan-500/100/10 text-cyan-400 rounded-full text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-cyan-500/100 animate-pulse"></span>
                Secure Local Sandbox IDE & Agent
              </div>


              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
                Stop Browsing.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-500">Start Commanding.</span>
              </h1>


              <p className="text-lg text-slate-400 leading-relaxed font-normal max-w-xl mx-auto lg:mx-0">
                SpiderNotebook is a secure, local-first AI agent and workspace designed to compile, refactor, and debug your directories with absolute code privacy. It executes operations entirely on your local machine.
              </p>


              {/* Dynamic OS Signature Detection Card */}
              <div className="p-4 bg-transparent border border-slate-800 rounded-2xl max-w-lg mx-auto lg:mx-0 flex items-center justify-between shadow-premium shadow-slate-950">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-cyan-500">
                    {osIcon === 'windows' && <Icons.Windows className="w-6 h-6" />}
                    {osIcon === 'apple' && <Icons.Apple className="w-6 h-6" />}
                    {osIcon === 'linux' && <Icons.Linux className="w-6 h-6" />}
                    {osIcon === 'desktop' && <Icons.Desktop className="w-6 h-6" />}
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider">DETECTED COMPILER PLATFORM</span>
                    <span className="font-bold text-xs text-slate-300">{detectedOS}</span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-[10px] text-emerald-600 font-bold uppercase rounded-lg border border-emerald-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Secure Sandbox
                </span>
              </div>


              {/* Call-to-actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button 
                  onClick={() => scrollToSection('download')}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-bold text-sm px-8 py-4 rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                >
                  <span>Get Local Desktop Build</span>
                  <Icons.ArrowRight />
                </button>
              </div>


              <p className="text-xs text-slate-400 font-medium text-center lg:text-left">
                Supports Windows, macOS (Intel/M-series) & Linux. Optimized to execute fully on 8GB RAM setups.
              </p>
            </div>


          </div>
        </div>
      </header>


      {}
      <section id="overview" className="py-24 border-t border-slate-800 bg-transparent scroll-mt-20 page-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Context Paragraph Copy Block */}
            <div className="lg:col-span-7 space-y-6">
              <span className="font-bold text-xs text-cyan-400 tracking-widest uppercase block">// SECTION 01: PRODUCT OVERVIEW</span>
              <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Other AI chatbots talk.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-500">This one WORKS.</span>
              </h2>
              
              <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                SpiderNotebook is a local AI development agent that compiles, refactors, and tests software structures right in your local workspace. Instead of copying-and-pasting block templates continuously from browser tabs into your files, let SpiderNotebook command your sandbox securely on your machine.
              </p>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-5 rounded-2xl border border-slate-800 bg-transparent shadow-premium">
                  <span className="text-cyan-300 block font-bold text-sm mb-1.5">
                    <Icons.Terminal className="inline w-4 h-4 mr-1.5 text-cyan-500" /> Integrated Sandbox Environment
                  </span>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Combines secure local workspace mapping with compilation, terminal routing execution, and active diagnostic layers.
                  </p>
                </div>
                <div className="p-5 rounded-2xl border border-slate-800 bg-transparent shadow-premium">
                  <span className="text-cyan-300 block font-bold text-sm mb-1.5">
                    <Icons.Lock className="inline w-4 h-4 mr-1.5 text-cyan-500" /> Absolute Source Code Privacy
                  </span>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Runs entirely on your machine. Zero proprietary logic layers or API tokens are transmitted to external cloud systems.
                  </p>
                </div>
              </div>
            </div>


            {}
            <div id="roi" className="lg:col-span-5 p-8 bg-white/[0.04] border border-slate-800 rounded-3xl shadow-premium scroll-mt-24">
              <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Icons.Calculator className="text-cyan-500" /> Developer Productivity Savings Estimator
              </h3>
              <p className="text-xs text-slate-400 mb-6 font-medium">
                Calculate the operational hours and dollar-value savings from shifting automated diagnostics to SpiderNotebook's local workspace.
              </p>


              <div className="space-y-6">
                
                {/* Dev Count Input Range */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-400">Team Size (Engineers)</span>
                    <span className="text-cyan-400">{devCount} Developers</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={devCount} 
                    onChange={(e) => setDevCount(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 bg-white/10 h-1.5 rounded-lg cursor-pointer" 
                  />
                </div>


                {/* Hours Saved Input Range */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-400">Hours Saved / Week Per Developer</span>
                    <span className="text-cyan-400">{hoursSaved} Hours</span>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="25" 
                    value={hoursSaved} 
                    onChange={(e) => setHoursSaved(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 bg-white/10 h-1.5 rounded-lg cursor-pointer" 
                  />
                </div>


                {/* Dynamic Value Readout Display */}
                <div className="pt-6 border-t border-slate-700/60 grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-transparent rounded-2xl border border-slate-800 shadow-sm">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Monthly Saved Hours</span>
                    <span className="text-2xl font-black text-slate-300">{monthlyHoursSaved} hrs</span>
                  </div>
                  <div className="p-3 bg-transparent rounded-2xl border border-slate-800 shadow-sm">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Estimated Savings</span>
                    <span className="text-2xl font-black text-cyan-400">${estimatedSavings.toLocaleString()}</span>
                  </div>
                </div>


                <div className="text-[10px] text-center text-slate-400 italic">
                  *Estimates assume standard $50/hour fully burdened developer overhead cost matrix.
                </div>


              </div>
            </div>


          </div>
        </div>
      </section>


      {}
      <section id="features" className="py-24 bg-transparent/40 border-t border-b border-slate-800 scroll-mt-20 page-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-20">
            <span className="font-bold text-xs text-cyan-400 tracking-widest uppercase block">// SECTION 02: CAPABILITIES</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Engineered for Secure Development Velocity
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Designed from the ground up for high-performance offline compilation, advanced sandbox isolation, and local code assistance.
            </p>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="p-8 bg-transparent border border-slate-800 rounded-2xl shadow-premium hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,242,255,0.08)] transition-all duration-300 slide-up slide-up-delay-1">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6 shadow-inner">
                <Icons.Terminal />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">🔍 Local Code Exploration</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Prompt SpiderNotebook to search your active directory structure. It instantly maps out references, dependencies, and index patterns.
              </p>
            </div>


            {/* Feature 2 */}
            <div className="p-8 bg-transparent border border-slate-800 rounded-2xl shadow-premium hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,242,255,0.08)] transition-all duration-300 slide-up slide-up-delay-2">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6 shadow-inner">
                <Icons.Cpu />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">👁️ Visual Code Diagnostics</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                The agent parses code graphs to visually map and explain logical execution, ensuring memory allocations and references are sound.
              </p>
            </div>


            {/* Feature 3 */}
            <div className="p-8 bg-transparent border border-slate-800 rounded-2xl shadow-premium hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,242,255,0.08)] transition-all duration-300 slide-up slide-up-delay-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6 shadow-inner">
                <Icons.Sparkles />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">⌨️ Smart Boilerplate Generation</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Directly scaffolding functions, interface parameters, and modular layers. Generates robust blueprints conforming to local styles.
              </p>
            </div>


            {/* Feature 4 */}
            <div className="p-8 bg-transparent border border-slate-800 rounded-2xl shadow-premium hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,242,255,0.08)] transition-all duration-300 slide-up slide-up-delay-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6 shadow-inner">
                <Icons.Shield />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">🛡️ Local Safety Shield</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Restricts all file executions inside isolated processes. No external networks or cloud environments receive your proprietary code.
              </p>
            </div>


            {/* Feature 5 */}
            <div className="p-8 bg-transparent border border-slate-800 rounded-2xl shadow-premium hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,242,255,0.08)] transition-all duration-300 slide-up slide-up-delay-5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6 shadow-inner">
                <Icons.Download />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">⚡ Multi-Language Workspace</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Comprehensive offline workspace support for compiling and validating structures in Python, Node.js, C++, Rust, and Go.
              </p>
            </div>


            {/* Feature 6 */}
            <div className="p-8 bg-transparent border border-slate-800 rounded-2xl shadow-premium hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,242,255,0.08)] transition-all duration-300 slide-up slide-up-delay-5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6 shadow-inner">
                <Icons.Lock />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">💾 Session Persistence</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Safeguards your project history and console logs locally. Resume deep development sessions instantly upon workspace restart.
              </p>
            </div>


          </div>


        </div>
      </section>


      {}
      <section className="py-24 bg-transparent page-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-20">
            <span className="font-bold text-xs text-cyan-400 tracking-widest uppercase block">// SECTION 03: WORKFLOW AGENT</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              How SpiderNotebook Performs
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium italic">
              "You're the boss. It's the hands."
            </p>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {[
              { num: "01", title: "Write Prompt", desc: "Describe target file changes or compiler errors in standard plain English commands." },
              { num: "02", title: "Secures Sandbox", desc: "Instantiates a safe, isolated local container workspace completely partitioned from host hazards." },
              { num: "03", title: "Analyzes Repos", desc: "Constructs dependency and reference index graphs on your disk to pinpoint compilation targets." },
              { num: "04", title: "Generates Drafts", desc: "Assembles correctly structured functions, clean boilerplate sections, and optimization options." },
              { num: "05", title: "Review & Merge", desc: "Examine generated code and test outcomes, then finalize updates securely." }
            ].map((step, idx) => (
              <div key={idx} className="p-6 bg-white/[0.04] border border-slate-800 rounded-2xl flex flex-col items-center text-center shadow-premium relative">
                <div className="w-10 h-10 bg-white/[0.04] text-white text-xs font-bold rounded-full flex items-center justify-center mb-4 border-4 border-slate-700 shadow-md">
                  {step.num}
                </div>
                <span className="text-white font-extrabold text-base mb-1.5">{step.title}</span>
                <p className="text-slate-400 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>


        </div>
      </section>


      {}
      <section className="py-24 bg-transparent/40 border-t border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
            <span className="font-bold text-xs text-cyan-400 tracking-widest uppercase block">// SECTION 04: USE CASES</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Engineered for Enterprise Development Use
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Designed to optimize complex and monotonous coding tasks without exposing local assets to external clouds.
            </p>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Test Suite Automation",
                desc: "Instruct the local sandbox to assemble and run comprehensive unit tests. Scaffolds files, runs compilation checks, and generates robust diagnostics outputs.",
                badge: "Isolated Execution"
              },
              {
                title: "Legacy Code Refactoring",
                desc: "Analyzes code hierarchies and optimizes algorithms based on modern design patterns—improving security and resource overhead.",
                badge: "Clean Refactor"
              },
              {
                title: "Multi-File Structure Refinement",
                desc: "Coordinates multi-file dependencies cleanly. Resolves circular import conflicts and standardizes interface layouts accurately.",
                badge: "Context-Aware"
              }
            ].map((uc, idx) => (
              <div key={idx} className="bg-transparent border border-slate-800 rounded-2xl p-8 shadow-premium flex flex-col justify-between hover:border-cyan-500/30 transition-all">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shadow-inner">
                    <Icons.Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-white font-bold text-base">{uc.title}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{uc.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-50 flex">
                  <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider bg-cyan-500/10 px-3 py-1 rounded-full">
                    {uc.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>


        </div>
      </section>


      {}
      <section className="py-24 bg-transparent page-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 text-cyan-300 rounded-full text-xs font-bold uppercase tracking-wider">
                <Icons.Lock className="w-4 h-4" /> Local Isolation Architecture
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Privacy isn't a feature.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-500">It is the architecture.</span>
              </h3>
              
              <p className="text-slate-400 leading-relaxed text-sm">
                Most AI coding tools stream entire repository directories directly to external cloud hosts. SpiderNotebook executes all parsing and compilation passes on your device, ensuring intellectual property never leaves your local machine.
              </p>


              <blockquote className="border-l-4 border-cyan-500 pl-4 italic text-slate-400 font-medium text-xs">
                "We don't just respect your privacy. We ARCHITECT it."
              </blockquote>


              <div className="space-y-3 text-xs font-semibold text-slate-400 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-2 text-slate-300">
                    <Icons.Check className="text-emerald-500" /> Source Code Storage
                  </span>
                  <span className="text-cyan-300 font-bold uppercase">100% Local Disk</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-2 text-slate-300">
                    <Icons.Check className="text-emerald-500" /> Local Subprocess Execution
                  </span>
                  <span className="text-cyan-300 font-bold uppercase">Device Container</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-2 text-slate-300">
                    <Icons.Check className="text-emerald-500" /> Environment Keys & Configs
                  </span>
                  <span className="text-cyan-300 font-bold uppercase">Never Transmitted</span>
                </div>
              </div>
            </div>


            <div className="lg:col-span-6 bg-white/[0.04] border border-slate-800 p-8 rounded-3xl shadow-premium flex flex-col justify-center items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-2xl shadow-inner">
                <Icons.Shield className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h4 className="font-extrabold text-white text-lg">Zero-Knowledge Secure Sandboxing</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Your code runs exclusively in local sub-processes on your hardware, preventing data leaks.
                </p>
              </div>
              <div className="px-5 py-3 bg-transparent border border-slate-700 rounded-2xl text-[10px] font-mono text-slate-400 shadow-sm">
                <span className="text-emerald-600 font-bold">● HOST ISOLATION PROMPT LAYER</span> | SECURE LOGICAL SANDBOX
              </div>
            </div>


          </div>
        </div>
      </section>


      {}
      <section id="specs" className="py-24 bg-transparent/40 border-t border-b border-slate-800 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-20">
            <span className="font-bold text-xs text-cyan-400 tracking-widest uppercase block">// SECTION 05: BENCHMARKS</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Why SpiderNotebook?
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Compare core workspace capabilities and parameters with conventional cloud-dependent code generation extensions.
            </p>
          </div>


          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-transparent shadow-premium max-w-5xl mx-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.04] text-white font-bold text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="p-6">Feature Core Profile</th>
                  <th className="p-6 text-slate-400">Other AI Agents</th>
                  <th className="p-6 text-cyan-400">SpiderNotebook</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs sm:text-sm text-slate-300 font-medium">
                <tr>
                  <td className="p-6 font-bold">Execution Sandbox Engine</td>
                  <td className="p-6 text-slate-400">Static chat suggestions</td>
                  <td className="p-6 bg-cyan-500/10 text-cyan-400 font-semibold flex items-center gap-2">
                    <Icons.Check /> Dynamic IDE sandbox execution
                  </td>
                </tr>
                <tr>
                  <td className="p-6 font-bold">Security Model Boundaries</td>
                  <td className="p-6 text-slate-400">Transmits data to cloud</td>
                  <td className="p-6 bg-cyan-500/10 text-cyan-400 font-semibold">
                    <span className="flex items-center gap-2"><Icons.Check /> 100% Local sandbox execution</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-6 font-bold">Test Suite Execution Output</td>
                  <td className="p-6 text-slate-400">None (suggests syntax only)</td>
                  <td className="p-6 bg-cyan-500/10 text-cyan-400 font-semibold">
                    <span className="flex items-center gap-2"><Icons.Check /> Real-time console diagnostics</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-6 font-bold">System Memory Overhead</td>
                  <td className="p-6 text-slate-400">Requires resource-intensive clusters</td>
                  <td className="p-6 bg-cyan-500/10 text-cyan-400 font-bold">
                    <span className="flex items-center gap-2"><Icons.Check /> Fully optimized on 8GB RAM</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>


          {/* System Requirements Parameters display */}
          <div className="max-w-4xl mx-auto mt-16 bg-transparent border border-slate-800 p-8 sm:p-12 rounded-3xl shadow-premium">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div>
                <span className="block font-bold text-white uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
                  <Icons.Desktop className="text-cyan-500" /> Supported Platforms
                </span>
                <ul className="space-y-3 text-slate-400 font-semibold">
                  <li className="flex items-center gap-2"><Icons.Check /> Microsoft Windows 10 & 11 (x64)</li>
                  <li className="flex items-center gap-2"><Icons.Check /> macOS Intel & Apple Silicon (ARM64)</li>
                  <li className="flex items-center gap-2"><Icons.Check /> Linux major distributions (x64 AppImage)</li>
                </ul>
              </div>
              
              <div>
                <span className="block font-bold text-white uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
                  <Icons.Cpu className="text-cyan-500" /> Local System Pre-requisites
                </span>
                <ul className="space-y-3 text-slate-400 font-semibold">
                  <li className="flex items-center gap-2"><Icons.Check /> Minimum Memory: 4 GB System RAM</li>
                  <li className="flex items-center gap-2"><Icons.Check /> Recommended Memory: 8 GB System RAM</li>
                  <li className="flex items-center gap-2"><Icons.Check /> Local Storage: ~500MB workspace disk space</li>
                </ul>
              </div>
            </div>
          </div>


        </div>
      </section>


      {}
      <section id="faq" className="py-24 bg-transparent border-b border-slate-800 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 mb-16">
            <span className="font-bold text-xs text-cyan-400 tracking-widest uppercase block">// SECTION 07: FAQ</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Find comprehensive answers on deployment, local integrations, and data security.
            </p>
          </div>


          <div className="space-y-4 text-sm">
            {[
              {
                q: "Is SpiderNotebook really free to download and run?",
                a: "Yes. SpiderNotebook is completely free to download and run locally on Windows, macOS, and Linux. By running the language processing and container compiler loop locally on your machine, there are zero server costs for us to pass down to you."
              },
              {
                q: "Does SpiderNotebook collect code telemetry or directory logs?",
                a: "No. Your source code privacy is one of our primary structural rules. All generation and debugging execution steps run strictly inside your local system storage environment. No analytics telemetry or file payloads are transmitted to any cloud servers."
              },
              {
                q: "How does the secure sandbox run local compilations?",
                a: "SpiderNotebook uses isolated sub-processes on your local machine to safely run and compile the targeted code blocks. This guarantees code checks and diagnostic logs compile with speed and accuracy without risk to your host OS architecture."
              }
            ].map((item, idx) => (
              <div key={idx} className="border border-slate-700/60 rounded-2xl bg-transparent/40 overflow-hidden">
                <button 
                  onClick={() => toggleFAQ(idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-300 hover:bg-white/[0.04] transition-colors"
                >
                  <span>{item.q}</span>
                  <span className="text-cyan-400 font-extrabold text-lg">
                    {openFAQ === idx ? '−' : '+'}
                  </span>
                </button>
                {openFAQ === idx && (
                  <div className="p-5 bg-transparent border-t border-slate-700/60 text-slate-400 text-xs leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>


        </div>
      </section>


      {}
      <section id="download" className="py-24 text-white overflow-hidden relative scroll-mt-20">
        <div className="absolute inset-0 pointer-events-none"></div>


        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <div className="space-y-3">
            <span className="font-bold text-xs text-cyan-400 tracking-widest uppercase block">// SYSTEM DEPLOYMENT</span>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Command Your Workspace?
            </h3>
            <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
              Free forever. No credit cards needed. No servers required. Your AI coding agent runs safely and securely on YOUR machine.
            </p>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-4 text-xs text-left">
            
            {/* Windows Card */}
            <div className="p-6 bg-white/[0.04] border border-slate-800 rounded-3xl flex flex-col justify-between space-y-6 shadow-premium hover:border-cyan-500/30 transition-all">
              <div className="space-y-4">
                <span className="text-4xl text-cyan-400 block"><Icons.Windows className="w-10 h-10" /></span>
                <h4 className="font-bold text-white text-base">Microsoft Windows</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Compatible with Windows 10 & 11 environments (x64 architecture). Direct executable package.
                </p>
              </div>
              
              <div className="space-y-2">
                <a 
                  href="https://apps.microsoft.com/detail/9ngj207gmk74" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-cyan-500/100 hover:bg-cyan-400 text-slate-950 font-bold text-center rounded-xl transition-colors"
                >
                  Get from Microsoft Store
                </a>
                <button 
                  onClick={() => triggerToast("Windows Executable Setup", "Your standalone setup.exe installer compilation has begun!")}
                  className="block w-full py-2.5 bg-transparent hover:bg-white/[0.04] text-slate-300 font-semibold text-center rounded-xl transition-colors border border-slate-800"
                >
                  Download Offline Installer (.exe)
                </button>
              </div>
            </div>


            {/* macOS Card */}
            <div className="p-6 bg-white/[0.04] border border-slate-800 rounded-3xl flex flex-col justify-between space-y-6 shadow-premium hover:border-cyan-500/30 transition-all">
              <div className="space-y-4">
                <span className="text-4xl text-cyan-400 block"><Icons.Apple className="w-10 h-10" /></span>
                <h4 className="font-bold text-white text-base">Apple macOS</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Optimized for Apple Silicon (M1/M2/M3/M4) & Intel-based architectures. Safe workspace package.
                </p>
              </div>
              
              <div className="space-y-2">
                <button 
                  onClick={() => triggerToast("macOS Apple Silicon DMG", "Compiling local build for Apple Silicon (M-series)...")}
                  className="block w-full py-3 bg-cyan-500/100 hover:bg-cyan-400 text-slate-950 font-bold text-center rounded-xl transition-colors"
                >
                  Download Apple Silicon (.dmg)
                </button>
                <button 
                  onClick={() => triggerToast("macOS Intel DMG", "Compiling standalone legacy build for Intel macOS x64 architectures...")}
                  className="block w-full py-2.5 bg-transparent hover:bg-white/[0.04] text-slate-300 font-semibold text-center rounded-xl transition-colors border border-slate-800"
                >
                  Download Intel Version (.dmg)
                </button>
              </div>
            </div>


            {/* Linux Card */}
            <div className="p-6 bg-white/[0.04] border border-slate-800 rounded-3xl flex flex-col justify-between space-y-6 shadow-premium hover:border-cyan-500/30 transition-all">
              <div className="space-y-4">
                <span className="text-4xl text-cyan-400 block"><Icons.Linux className="w-10 h-10" /></span>
                <h4 className="font-bold text-white text-base">Linux Core</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Standard binary build compatible with major distributions. Portable workspace package format.
                </p>
              </div>
              
              <div className="space-y-2">
                <button 
                  onClick={() => triggerToast("Linux Standalone AppImage", "Preparing standalone AppImage mirror container payload...")}
                  className="block w-full py-3 bg-cyan-500/100 hover:bg-cyan-400 text-slate-950 font-bold text-center rounded-xl transition-colors"
                >
                  Download AppImage (.AppImage)
                </button>
                <button 
                  onClick={() => triggerToast("Linux Tarball Archive", "Generating offline tar.gz binaries mirror file...")}
                  className="block w-full py-2.5 bg-transparent hover:bg-white/[0.04] text-slate-300 font-semibold text-center rounded-xl transition-colors border border-slate-800"
                >
                  Download Archive (.tar.gz)
                </button>
              </div>
            </div>


          </div>


          <div className="pt-4 text-xs text-slate-400 max-w-md mx-auto flex items-center justify-center gap-2">
            <Icons.Shield className="text-cyan-400 w-4 h-4" />
            <span>Direct client build. Safe download from M4Spider. Built with 🕷️ in India.</span>
          </div>


        </div>
      </section>
      </>
      )}

      {currentView === 'docs' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* DOCS SIDEBAR */}
            <aside className="lg:col-span-3 space-y-6">
              <div className="p-5 bg-white/[0.04] border border-slate-800 rounded-2xl space-y-4">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Workspace Documentation
                </span>
                
                <nav className="space-y-1">
                  {[
                    { id: 'overview', label: '1. Platform Overview' },
                    { id: 'models', label: '2. Proprietary AI Models' },
                    { id: 'backend', label: '3. Backend API & Requests' },
                    { id: 'custom', label: '4. Custom Endpoint Mapping' },
                    { id: 'github', label: '5. GitHub Enterprise Sync' }
                  ].map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => setDocsActiveSection(sec.id)}
                      className={`block w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        docsActiveSection === sec.id
                          ? 'bg-cyan-500/10 text-cyan-400 border-l-4 border-cyan-500'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-5 bg-gradient-to-tr from-cyan-900 to-slate-900 text-white rounded-2xl space-y-3">
                <span className="block text-[10px] font-bold text-cyan-400 tracking-wider uppercase">Local Server Status</span>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Spider Code Engine — Online</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  SpiderNotebook local compilation daemon is active and running securely on your machine.
                </p>
              </div>
            </aside>

            {/* DOCS CONTENT WINDOW */}
            <main className="lg:col-span-9 bg-white/[0.04] border border-slate-800 rounded-3xl p-8 lg:p-12 shadow-sm min-h-[600px] space-y-8">
              
              {docsActiveSection === 'overview' && (
                <article className="space-y-6">
                  <div className="border-b border-slate-800 pb-4">
                    <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block mb-2">Documentation — Section 01</span>
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-white">Platform Overview</h2>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    SpiderNotebook operates as an architectural wrapper built around <strong>Spider Code Engine</strong>, a sandboxed local-execution workspace pipeline. Traditional coding copilots stream your live active file parameters and surrounding database tables to external servers for query completions.
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    By relying on local container boundaries and self-hosted model engines, SpiderNotebook prevents code exfiltration and secures mission-critical proprietary logic from third-party leakage vectors.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-5 bg-white/[0.04] border border-slate-800 rounded-2xl space-y-2">
                      <span className="font-extrabold text-xs text-slate-300 block">The Local Loop</span>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        LLM calls are routed over an offline system interface directly to the active compiler runtime, yielding near-zero network latency.
                      </p>
                    </div>
                    <div className="p-5 bg-white/[0.04] border border-slate-800 rounded-2xl space-y-2">
                      <span className="font-extrabold text-xs text-slate-300 block">Spider Code Engine</span>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        A portable daemon controlling standard process execution flags on Windows, macOS, and Linux to run tests safely.
                      </p>
                    </div>
                  </div>
                </article>
              )}

              {docsActiveSection === 'models' && (
                <article className="space-y-6">
                  <div className="border-b border-slate-800 pb-4">
                    <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block mb-2">Documentation — Section 02</span>
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-white">Proprietary AI Models</h2>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    SpiderNotebook comes preconfigured with two high-efficiency, specialized language models optimized to run offline.
                  </p>

                  <div className="space-y-6 mt-6">
                    {/* Model 1 */}
                    <div className="p-6 bg-white/[0.04] border border-slate-800 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="font-bold text-white text-sm">Mimo v2.5 — Primary Intelligence Model</h4>
                        <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded-full uppercase">Core Engine</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Mimo v2.5 is our primary large-scale reasoning model. Powers deep code analysis, multi-file refactoring, architecture suggestions, test generation, and complex debugging across all supported languages.
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-slate-400">
                        <div className="bg-transparent p-2 rounded-xl border border-slate-800"><strong>Context</strong> 250k tokens</div>
                        <div className="bg-transparent p-2 rounded-xl border border-slate-800"><strong>Specialization</strong> Full-stack reasoning</div>
                        <div className="bg-transparent p-2 rounded-xl border border-slate-800"><strong>Latency</strong> Optimized inference</div>
                      </div>
                    </div>

                    {/* Model 2 */}
                    <div className="p-6 bg-white/[0.04] border border-slate-800 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="font-bold text-white text-sm">DeepSeek v4 — Fast Completion Engine</h4>
                        <span className="px-2.5 py-0.5 bg-cyan-500/10 text-cyan-300 text-[10px] font-bold rounded-full uppercase">Low Latency</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Optimized for real-time autocomplete, inline suggestions, and lightning-fast code completions. Built for speed with a massive 250k context window for deep project understanding.
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-slate-400">
                        <div className="bg-transparent p-2 rounded-xl border border-slate-800"><strong>Context</strong> 250k tokens</div>
                        <div className="bg-transparent p-2 rounded-xl border border-slate-800"><strong>Specialization</strong> Fast completions</div>
                        <div className="bg-transparent p-2 rounded-xl border border-slate-800"><strong>Latency</strong> Millisecond response</div>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {docsActiveSection === 'backend' && (
                <article className="space-y-6">
                  <div className="border-b border-slate-800 pb-4">
                    <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block mb-2">Documentation — Section 03</span>
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-white">Backend API & Requests</h2>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    The <strong>Spider Code Engine</strong> local daemon exposes secure internal endpoints. Developers can interface with this backend using standard REST calls. Below are structured layouts for compiler and chat payloads.
                  </p>

                  <div className="space-y-4">
                    <span className="block font-bold text-slate-300 text-xs uppercase tracking-wider">
                      1. Trigger Local Sandbox Compilation Request
                    </span>
                    <div className="bg-white/[0.04] text-slate-100 p-5 rounded-2xl font-mono text-xs overflow-x-auto">
                      <span className="text-cyan-400">POST</span> /api/v1/sandbox/compile
                      <pre className="mt-4 text-slate-300">
{`{
  "project_path": "/workspace/my-project",
  "entry_point": "main.py",
  "environment": "python3.10",
  "timeout_seconds": 15
}`}
                      </pre>
                    </div>

                    <span className="block font-bold text-slate-300 text-xs uppercase tracking-wider pt-2">
                      2. Code Analysis Prompt Payload
                    </span>
                    <div className="bg-white/[0.04] text-slate-100 p-5 rounded-2xl font-mono text-xs overflow-x-auto">
                      <span className="text-cyan-400">POST</span> /api/v1/models/generate
                      <pre className="mt-4 text-slate-300">
{`{
  "model": "mimo-v2.5",
  "prompt": "Review standard vectors boundaries in this C++ block.",
  "temperature": 0.2,
  "options": {
    "max_context_window": 262144
  }
}`}
                      </pre>
                    </div>
                  </div>
                </article>
              )}

              {docsActiveSection === 'custom' && (
                <article className="space-y-6">
                  <div className="border-b border-slate-800 pb-4">
                    <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block mb-2">Documentation — Section 04</span>
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-white">Custom Provider Configuration</h2>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Configure any OpenAI-compatible provider directly inside SpiderNotebook. Connect your own inference servers, hosted APIs, or private model endpoints.
                  </p>

                  {/* Live Form Preview */}
                  <div className="bg-white/[0.04] rounded-2xl p-6 space-y-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase">Custom Provider</span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Configure an OpenAI-compatible provider.
                    </p>

                    {/* Provider ID */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Provider ID</label>
                      <div className="bg-white/5 border border-slate-700 rounded-xl px-4 py-3">
                        <span className="text-sm text-white font-mono">myprovider</span>
                      </div>
                      <span className="text-[9px] text-slate-400">Lowercase letters, numbers, hyphens, or underscores</span>
                    </div>

                    {/* Display Name */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Display name</label>
                      <div className="bg-white/5 border border-slate-700 rounded-xl px-4 py-3">
                        <span className="text-sm text-white font-mono">My AI Provider</span>
                      </div>
                    </div>

                    {/* Base URL */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base URL</label>
                      <div className="bg-white/5 border border-slate-700 rounded-xl px-4 py-3">
                        <span className="text-sm text-cyan-400 font-mono">https://api.myprovider.com/v1</span>
                      </div>
                    </div>

                    {/* API Key */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">API key</label>
                      <div className="bg-white/5 border border-slate-700 rounded-xl px-4 py-3">
                        <span className="text-sm text-slate-400 font-mono italic">••••••••••••••••</span>
                      </div>
                      <span className="text-[9px] text-slate-400">Optional. Leave empty if you manage auth via headers.</span>
                    </div>

                    {/* Models */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Models</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 uppercase">ID</span>
                          <div className="bg-white/5 border border-slate-700 rounded-xl px-4 py-2.5">
                            <span className="text-xs text-white font-mono">model-id</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 uppercase">Name</span>
                          <div className="bg-white/5 border border-slate-700 rounded-xl px-4 py-2.5">
                            <span className="text-xs text-white font-mono">Display Name</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Headers */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Headers <span className="text-slate-400">(optional)</span></label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 uppercase">Header</span>
                          <div className="bg-white/5 border border-slate-700 rounded-xl px-4 py-2.5">
                            <span className="text-xs text-slate-400 font-mono">Header-Name</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 uppercase">Value</span>
                          <div className="bg-white/5 border border-slate-700 rounded-xl px-4 py-2.5">
                            <span className="text-xs text-slate-400 font-mono">value</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button className="w-full py-3 bg-cyan-500/100 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors mt-4">
                      Submit Configuration
                    </button>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-slate-400 mt-4">
                    <Icons.Check className="text-emerald-500 w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Once submitted, SpiderNotebook validates the endpoint and makes your custom models available in the model selector instantly.</span>
                  </div>
                </article>
              )}

              {docsActiveSection === 'github' && (
                <article className="space-y-6">
                  <div className="border-b border-slate-800 pb-4">
                    <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase block mb-2">Documentation — Section 05</span>
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-white">GitHub Enterprise Sync</h2>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Safely commit code and synchronize workspace states directly through our agent commands without sharing private configuration keys on-cloud.
                  </p>

                  <div className="space-y-4 mt-6">
                    <div className="p-5 bg-white/[0.04] border border-slate-800 rounded-2xl space-y-3">
                      <h4 className="font-bold text-white text-xs">Authenticating Local Repositories</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        SpiderNotebook uses your system's SSH keys or local keychain credentials to connect with GitHub, GitHub Enterprise, or GitLab. We do not store, intercept, or request passwords. All authentication procedures are delegated directly to your machine's secure command-line shell.
                      </p>
                    </div>

                    <div className="p-5 bg-white/[0.04] border border-slate-800 rounded-2xl space-y-3">
                      <h4 className="font-bold text-white text-xs">Direct Git Command Payload Execution</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Instruct SpiderNotebook to commit optimizations via local shells:
                      </p>
                      <div className="bg-white/[0.04] text-slate-100 p-4 rounded-xl font-mono text-[11px]">
                        $ spideragent run "Refactor vector boundaries inside main.cpp, run validation, and commit changes"
                      </div>
                    </div>
                  </div>
                </article>
              )}

            </main>
          </div>
        </div>
      )}


      {}
      <footer className="bg-[#020509] border-t border-slate-800 text-slate-400 py-16 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/[0.04] rounded-lg flex items-center justify-center border border-cyan-500/30 text-cyan-400 font-extrabold text-sm shadow-md">
                S
              </div>
              <span className="text-white font-bold text-base">SpiderNotebook</span>
            </div>
            <p className="text-xs leading-relaxed">
              A secure, local AI coding agent and workspace designed to compile, refactor, and debug your directories with absolute code privacy.
            </p>
            <div className="flex gap-4 text-base text-cyan-400 pt-2 font-semibold">
              <a href="#" className="hover:text-white">GitHub</a>
              <a href="#" className="hover:text-white">Discord</a>
              <a href="#" className="hover:text-white">Reddit</a>
              <a href="#" className="hover:text-white">Twitter</a>
            </div>
          </div>


          <div className="space-y-3.5">
            <span className="block text-white font-bold tracking-wider uppercase text-xs">Directories</span>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><button onClick={() => scrollToSection('overview')} className="hover:text-cyan-400">Overview</button></li>
              <li><button onClick={() => scrollToSection('features')} className="hover:text-cyan-400">Core Features</button></li>
              <li><button onClick={() => scrollToSection('specs')} className="hover:text-cyan-400">Requirements</button></li>
            </ul>
          </div>


          <div className="space-y-3.5">
            <span className="block text-white font-bold tracking-wider uppercase text-xs">Publisher Details</span>
            <p className="text-xs leading-relaxed font-semibold">
              M4Spider Corp<br />
              Hyderabad, Telangana, India<br />
              Email Support: <a href="mailto:vvvr8412@gmail.com" className="text-cyan-400 hover:underline">vvvr8412@gmail.com</a>
            </p>
          </div>


          <div className="space-y-3.5">
            <span className="block text-white font-bold tracking-wider uppercase text-xs">Enterprise Deployment</span>
            <div className="p-4 bg-white/[0.04] border border-slate-800 rounded-2xl">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Microsoft Store Verified
              </span>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Conforms with default Windows application sandbox parameters to ensure optimal hardware isolated runtime security.
              </p>
            </div>
          </div>


        </div>


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-800 text-center text-[11px] text-slate-400 space-y-1.5 font-medium">
          <p>© 2026 M4Spider. Built with 🕷️ in India. Windows, macOS, Linux, and associated systems trademarks are properties of their respective owners.</p>
        </div>
      </footer>


      {/* Toast Notification Container */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short bg-transparent border border-slate-700 p-5 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center text-base shadow-inner">
            <Icons.Download className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="block text-xs font-extrabold text-white">{toast.title}</span>
            <span className="block text-[11px] text-slate-400">{toast.desc}</span>
          </div>
        </div>
      )}


    </div>
  );
}