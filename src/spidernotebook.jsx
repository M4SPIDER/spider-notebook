import React, { useState, useEffect } from 'react';


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
    <div className="font-sans text-slate-900 bg-white min-h-screen selection:bg-cyan-500/20 selection:text-slate-900 overflow-x-hidden antialiased">
      
      {}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {onBack && (
                <button 
                  onClick={onBack}
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-cyan-600 hover:border-cyan-300 transition-all"
                >
                  ←
                </button>
              )}
              <a href="#" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Icons.Spider />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight text-slate-900">SpiderNotebook</span>
                  <span className="text-[10px] bg-cyan-100 text-cyan-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Local IDE</span>
                </div>
                <span className="block text-xs text-slate-500 tracking-wide font-medium">Secure AI Workspace</span>
              </div>
            </a>
            </div>


            {/* Nav Directory (Desktop) */}
            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
              <button 
                onClick={() => setCurrentView('landing')} 
                className={`transition-colors ${currentView === 'landing' ? 'text-cyan-600' : 'hover:text-cyan-600'}`}
              >
                Product
              </button>
              <button 
                onClick={() => { setCurrentView('docs'); setDocsActiveSection('overview'); }} 
                className={`flex items-center gap-1.5 transition-colors ${currentView === 'docs' ? 'text-cyan-600' : 'hover:text-cyan-600'}`}
              >
                <Icons.BookOpen className="w-4 h-4 text-cyan-500" />
                Docs & APIs
              </button>
              <a href="#overview" onClick={() => setCurrentView('landing')} className="hover:text-cyan-600 transition-colors">Overview</a>
              <a href="#features" onClick={() => setCurrentView('landing')} className="hover:text-cyan-600 transition-colors">Capabilities</a>
              <a href="#roi" onClick={() => setCurrentView('landing')} className="hover:text-cyan-600 transition-colors">ROI Estimator</a>
            </div>


            {/* Action CTA */}
            <div className="hidden md:flex items-center gap-4">
              <a 
                href="#download" 
                className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white text-xs font-bold tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-500/20"
              >
                <Icons.Download className="w-4 h-4 mr-2" /> Download Free
              </a>
            </div>


            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                {mobileMenuOpen ? <Icons.X /> : <Icons.Menu />}
              </button>
            </div>
          </div>
        </div>


        {/* Mobile Directory Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-4 pb-6 space-y-3">
            <a href="#overview" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-slate-600">Overview</a>
            <button onClick={() => { setCurrentView('landing'); setMobileMenuOpen(false); }} className="block py-2 text-sm font-semibold text-slate-600 text-left">Product</button>
            <button onClick={() => { setCurrentView('docs'); setDocsActiveSection('overview'); setMobileMenuOpen(false); }} className="block py-2 text-sm font-semibold text-slate-600 text-left">Docs & APIs</button>
            <a href="#features" onClick={() => setCurrentView('landing')} className="block py-2 text-sm font-semibold text-slate-600">Capabilities</a>
            <a href="#specs" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-slate-600">Specifications</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-slate-600">FAQ</a>
            <a 
              href="#download" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center w-full py-3 bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl"
            >
              <Icons.Download className="w-4 h-4 mr-2" /> Download Free
            </a>
          </div>
        )}
      </nav>


      {currentView === 'landing' && (
      <>
      <header className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 bg-gradient-to-b from-slate-50 via-white to-white overflow-hidden">
        {/* Soft cyan decorative glow background vector */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-cyan-500/10 text-cyan-800 rounded-full text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                Secure Local Sandbox IDE & Agent
              </div>


              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-slate-900">
                Stop Browsing.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-500">Start Commanding.</span>
              </h1>


              <p className="text-lg text-slate-500 leading-relaxed font-normal max-w-xl mx-auto lg:mx-0">
                SpiderNotebook is a secure, local-first AI agent and workspace designed to compile, refactor, and debug your directories with absolute code privacy. It executes operations entirely on your local machine.
              </p>


              {/* Dynamic OS Signature Detection Card */}
              <div className="p-4 bg-white border border-slate-100 rounded-2xl max-w-lg mx-auto lg:mx-0 flex items-center justify-between shadow-premium shadow-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-cyan-500">
                    {osIcon === 'windows' && <Icons.Windows className="w-6 h-6" />}
                    {osIcon === 'apple' && <Icons.Apple className="w-6 h-6" />}
                    {osIcon === 'linux' && <Icons.Linux className="w-6 h-6" />}
                    {osIcon === 'desktop' && <Icons.Desktop className="w-6 h-6" />}
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider">DETECTED COMPILER PLATFORM</span>
                    <span className="font-bold text-xs text-slate-800">{detectedOS}</span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-[10px] text-emerald-600 font-bold uppercase rounded-lg border border-emerald-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Secure Sandbox
                </span>
              </div>


              {/* Call-to-actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a 
                  href="#download" 
                  className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-8 py-4 rounded-xl transition-all shadow-xl shadow-slate-900/10"
                >
                  <span>Get Local Desktop Build</span>
                  <Icons.ArrowRight />
                </a>
              </div>


              <p className="text-xs text-slate-400 font-medium text-center lg:text-left">
                Supports Windows, macOS (Intel/M-series) & Linux. Optimized to execute fully on 8GB RAM setups.
              </p>
            </div>


          </div>
        </div>
      </header>


      {}
      <section id="overview" className="py-24 border-t border-slate-100 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Context Paragraph Copy Block */}
            <div className="lg:col-span-7 space-y-6">
              <span className="font-bold text-xs text-cyan-600 tracking-widest uppercase block">// SECTION 01: PRODUCT OVERVIEW</span>
              <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Other AI chatbots talk.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-500">This one WORKS.</span>
              </h2>
              
              <p className="text-slate-500 text-base sm:text-lg leading-relaxed">
                SpiderNotebook is a local AI development agent that compiles, refactors, and tests software structures right in your local workspace. Instead of copying-and-pasting block templates continuously from browser tabs into your files, let SpiderNotebook command your sandbox securely on your machine.
              </p>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-premium">
                  <span className="text-cyan-700 block font-bold text-sm mb-1.5">
                    <Icons.Terminal className="inline w-4 h-4 mr-1.5 text-cyan-500" /> Integrated Sandbox Environment
                  </span>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Combines secure local workspace mapping with compilation, terminal routing execution, and active diagnostic layers.
                  </p>
                </div>
                <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-premium">
                  <span className="text-cyan-700 block font-bold text-sm mb-1.5">
                    <Icons.Lock className="inline w-4 h-4 mr-1.5 text-cyan-500" /> Absolute Source Code Privacy
                  </span>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Runs entirely on your machine. Zero proprietary logic layers or API tokens are transmitted to external cloud systems.
                  </p>
                </div>
              </div>
            </div>


            {}
            <div id="roi" className="lg:col-span-5 p-8 bg-slate-50 border border-slate-100 rounded-3xl shadow-premium scroll-mt-24">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Icons.Calculator className="text-cyan-500" /> Developer Productivity Savings Estimator
              </h3>
              <p className="text-xs text-slate-500 mb-6 font-medium">
                Calculate the operational hours and dollar-value savings from shifting automated diagnostics to SpiderNotebook's local workspace.
              </p>


              <div className="space-y-6">
                
                {/* Dev Count Input Range */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700">Team Size (Engineers)</span>
                    <span className="text-cyan-600">{devCount} Developers</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={devCount} 
                    onChange={(e) => setDevCount(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-200 h-1.5 rounded-lg cursor-pointer" 
                  />
                </div>


                {/* Hours Saved Input Range */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700">Hours Saved / Week Per Developer</span>
                    <span className="text-cyan-600">{hoursSaved} Hours</span>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="25" 
                    value={hoursSaved} 
                    onChange={(e) => setHoursSaved(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-200 h-1.5 rounded-lg cursor-pointer" 
                  />
                </div>


                {/* Dynamic Value Readout Display */}
                <div className="pt-6 border-t border-slate-200/60 grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Monthly Saved Hours</span>
                    <span className="text-2xl font-black text-slate-800">{monthlyHoursSaved} hrs</span>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Estimated Savings</span>
                    <span className="text-2xl font-black text-cyan-600">${estimatedSavings.toLocaleString()}</span>
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
      <section id="features" className="py-24 bg-slate-50/50 border-t border-b border-slate-100 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-20">
            <span className="font-bold text-xs text-cyan-600 tracking-widest uppercase block">// SECTION 02: CAPABILITIES</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Engineered for Secure Development Velocity
            </h2>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              Designed from the ground up for high-performance offline compilation, advanced sandbox isolation, and local code assistance.
            </p>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-premium hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-6 shadow-inner">
                <Icons.Terminal />
              </div>
              <h3 className="text-slate-900 font-bold text-lg mb-2">🔍 Local Code Exploration</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Prompt SpiderNotebook to search your active directory structure. It instantly maps out references, dependencies, and index patterns.
              </p>
            </div>


            {/* Feature 2 */}
            <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-premium hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-6 shadow-inner">
                <Icons.Cpu />
              </div>
              <h3 className="text-slate-900 font-bold text-lg mb-2">👁️ Visual Code Diagnostics</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                The agent parses code graphs to visually map and explain logical execution, ensuring memory allocations and references are sound.
              </p>
            </div>


            {/* Feature 3 */}
            <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-premium hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-6 shadow-inner">
                <Icons.Sparkles />
              </div>
              <h3 className="text-slate-900 font-bold text-lg mb-2">⌨️ Smart Boilerplate Generation</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Directly scaffolding functions, interface parameters, and modular layers. Generates robust blueprints conforming to local styles.
              </p>
            </div>


            {/* Feature 4 */}
            <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-premium hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-6 shadow-inner">
                <Icons.Shield />
              </div>
              <h3 className="text-slate-900 font-bold text-lg mb-2">🛡️ Local Safety Shield</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Restricts all file executions inside isolated processes. No external networks or cloud environments receive your proprietary code.
              </p>
            </div>


            {/* Feature 5 */}
            <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-premium hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-6 shadow-inner">
                <Icons.Download />
              </div>
              <h3 className="text-slate-900 font-bold text-lg mb-2">⚡ Multi-Language Workspace</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Comprehensive offline workspace support for compiling and validating structures in Python, Node.js, C++, Rust, and Go.
              </p>
            </div>


            {/* Feature 6 */}
            <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-premium hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-6 shadow-inner">
                <Icons.Lock />
              </div>
              <h3 className="text-slate-900 font-bold text-lg mb-2">💾 Session Persistence</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Safeguards your project history and console logs locally. Resume deep development sessions instantly upon workspace restart.
              </p>
            </div>


          </div>


        </div>
      </section>


      {}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-20">
            <span className="font-bold text-xs text-cyan-600 tracking-widest uppercase block">// SECTION 03: WORKFLOW AGENT</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              How SpiderNotebook Performs
            </h2>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-medium italic">
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
              <div key={idx} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center text-center shadow-premium relative">
                <div className="w-10 h-10 bg-slate-900 text-white text-xs font-bold rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md">
                  {step.num}
                </div>
                <span className="text-slate-900 font-extrabold text-base mb-1.5">{step.title}</span>
                <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>


        </div>
      </section>


      {}
      <section className="py-24 bg-slate-50/50 border-t border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
            <span className="font-bold text-xs text-cyan-600 tracking-widest uppercase block">// SECTION 04: USE CASES</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Engineered for Enterprise Development Use
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
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
              <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-8 shadow-premium flex flex-col justify-between hover:border-cyan-200 transition-all">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shadow-inner">
                    <Icons.Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-slate-900 font-bold text-base">{uc.title}</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">{uc.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-50 flex">
                  <span className="text-[10px] text-cyan-700 font-bold uppercase tracking-wider bg-cyan-50 px-3 py-1 rounded-full">
                    {uc.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>


        </div>
      </section>


      {}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Icons.Lock className="w-4 h-4" /> Local Isolation Architecture
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Privacy isn't a feature.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-500">It is the architecture.</span>
              </h3>
              
              <p className="text-slate-500 leading-relaxed text-sm">
                Most AI coding tools stream entire repository directories directly to external cloud hosts. SpiderNotebook executes all parsing and compilation passes on your device, ensuring intellectual property never leaves your local machine.
              </p>


              <blockquote className="border-l-4 border-cyan-500 pl-4 italic text-slate-600 font-medium text-xs">
                "We don't just respect your privacy. We ARCHITECT it."
              </blockquote>


              <div className="space-y-3 text-xs font-semibold text-slate-600 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-2 text-slate-800">
                    <Icons.Check className="text-emerald-500" /> Source Code Storage
                  </span>
                  <span className="text-cyan-700 font-bold uppercase">100% Local Disk</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-2 text-slate-800">
                    <Icons.Check className="text-emerald-500" /> Local Subprocess Execution
                  </span>
                  <span className="text-cyan-700 font-bold uppercase">Device Container</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-2 text-slate-800">
                    <Icons.Check className="text-emerald-500" /> Environment Keys & Configs
                  </span>
                  <span className="text-cyan-700 font-bold uppercase">Never Transmitted</span>
                </div>
              </div>
            </div>


            <div className="lg:col-span-6 bg-slate-50 border border-slate-100 p-8 rounded-3xl shadow-premium flex flex-col justify-center items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center text-2xl shadow-inner">
                <Icons.Shield className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 text-lg">Zero-Knowledge Secure Sandboxing</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Your code runs exclusively in local sub-processes on your hardware, preventing data leaks.
                </p>
              </div>
              <div className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-mono text-slate-500 shadow-sm">
                <span className="text-emerald-600 font-bold">● HOST ISOLATION PROMPT LAYER</span> | SECURE LOGICAL SANDBOX
              </div>
            </div>


          </div>
        </div>
      </section>


      {}
      <section id="specs" className="py-24 bg-slate-50/50 border-t border-b border-slate-100 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-20">
            <span className="font-bold text-xs text-cyan-600 tracking-widest uppercase block">// SECTION 05: BENCHMARKS</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Why SpiderNotebook?
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Compare core workspace capabilities and parameters with conventional cloud-dependent code generation extensions.
            </p>
          </div>


          <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-premium max-w-5xl mx-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="p-6">Feature Core Profile</th>
                  <th className="p-6 text-slate-400">Other AI Agents</th>
                  <th className="p-6 text-cyan-400 bg-slate-850">SpiderNotebook</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-800 font-medium">
                <tr>
                  <td className="p-6 font-bold">Execution Sandbox Engine</td>
                  <td className="p-6 text-slate-500">Static chat suggestions</td>
                  <td className="p-6 bg-cyan-50/25 text-cyan-800 font-semibold flex items-center gap-2">
                    <Icons.Check /> Dynamic IDE sandbox execution
                  </td>
                </tr>
                <tr>
                  <td className="p-6 font-bold">Security Model Boundaries</td>
                  <td className="p-6 text-slate-500">Transmits data to cloud</td>
                  <td className="p-6 bg-cyan-50/25 text-cyan-800 font-semibold">
                    <span className="flex items-center gap-2"><Icons.Check /> 100% Local sandbox execution</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-6 font-bold">Test Suite Execution Output</td>
                  <td className="p-6 text-slate-500">None (suggests syntax only)</td>
                  <td className="p-6 bg-cyan-50/25 text-cyan-800 font-semibold">
                    <span className="flex items-center gap-2"><Icons.Check /> Real-time console diagnostics</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-6 font-bold">System Memory Overhead</td>
                  <td className="p-6 text-slate-500">Requires resource-intensive clusters</td>
                  <td className="p-6 bg-cyan-50/25 text-cyan-800 font-bold">
                    <span className="flex items-center gap-2"><Icons.Check /> Fully optimized on 8GB RAM</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>


          {/* System Requirements Parameters display */}
          <div className="max-w-4xl mx-auto mt-16 bg-white border border-slate-100 p-8 sm:p-12 rounded-3xl shadow-premium">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div>
                <span className="block font-bold text-slate-900 uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
                  <Icons.Desktop className="text-cyan-500" /> Supported Platforms
                </span>
                <ul className="space-y-3 text-slate-500 font-semibold">
                  <li className="flex items-center gap-2"><Icons.Check /> Microsoft Windows 10 & 11 (x64)</li>
                  <li className="flex items-center gap-2"><Icons.Check /> macOS Intel & Apple Silicon (ARM64)</li>
                  <li className="flex items-center gap-2"><Icons.Check /> Linux major distributions (x64 AppImage)</li>
                </ul>
              </div>
              
              <div>
                <span className="block font-bold text-slate-900 uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
                  <Icons.Cpu className="text-cyan-500" /> Local System Pre-requisites
                </span>
                <ul className="space-y-3 text-slate-500 font-semibold">
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
      <section id="faq" className="py-24 bg-white border-b border-slate-100 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 mb-16">
            <span className="font-bold text-xs text-cyan-600 tracking-widest uppercase block">// SECTION 07: FAQ</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
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
              <div key={idx} className="border border-slate-200/60 rounded-2xl bg-slate-50/50 overflow-hidden">
                <button 
                  onClick={() => toggleFAQ(idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <span>{item.q}</span>
                  <span className="text-cyan-600 font-extrabold text-lg">
                    {openFAQ === idx ? '−' : '+'}
                  </span>
                </button>
                {openFAQ === idx && (
                  <div className="p-5 bg-white border-t border-slate-200/60 text-slate-500 text-xs leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>


        </div>
      </section>


      {}
      <section id="download" className="py-24 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white overflow-hidden relative scroll-mt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.06)_0%,transparent_100%)] pointer-events-none"></div>


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
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl flex flex-col justify-between space-y-6 shadow-premium hover:border-cyan-500/30 transition-all">
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
                  className="block w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-center rounded-xl transition-colors"
                >
                  Get from Microsoft Store
                </a>
                <button 
                  onClick={() => triggerToast("Windows Executable Setup", "Your standalone setup.exe installer compilation has begun!")}
                  className="block w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-300 font-semibold text-center rounded-xl transition-colors border border-slate-800"
                >
                  Download Offline Installer (.exe)
                </button>
              </div>
            </div>


            {/* macOS Card */}
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl flex flex-col justify-between space-y-6 shadow-premium hover:border-cyan-500/30 transition-all">
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
                  className="block w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-center rounded-xl transition-colors"
                >
                  Download Apple Silicon (.dmg)
                </button>
                <button 
                  onClick={() => triggerToast("macOS Intel DMG", "Compiling standalone legacy build for Intel macOS x64 architectures...")}
                  className="block w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-300 font-semibold text-center rounded-xl transition-colors border border-slate-800"
                >
                  Download Intel Version (.dmg)
                </button>
              </div>
            </div>


            {/* Linux Card */}
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl flex flex-col justify-between space-y-6 shadow-premium hover:border-cyan-500/30 transition-all">
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
                  className="block w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-center rounded-xl transition-colors"
                >
                  Download AppImage (.AppImage)
                </button>
                <button 
                  onClick={() => triggerToast("Linux Tarball Archive", "Generating offline tar.gz binaries mirror file...")}
                  className="block w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-300 font-semibold text-center rounded-xl transition-colors border border-slate-800"
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
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
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
                          ? 'bg-cyan-50 text-cyan-800 border-l-4 border-cyan-500'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
            <main className="lg:col-span-9 bg-white border border-slate-100 rounded-3xl p-8 lg:p-12 shadow-sm min-h-[600px] space-y-8">
              
              {docsActiveSection === 'overview' && (
                <article className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest block mb-2">Documentation — Section 01</span>
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900">Platform Overview</h2>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    SpiderNotebook operates as an architectural wrapper built around <strong>Spider Code Engine</strong>, a sandboxed local-execution workspace pipeline. Traditional coding copilots stream your live active file parameters and surrounding database tables to external servers for query completions.
                  </p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    By relying on local container boundaries and self-hosted model engines, SpiderNotebook prevents code exfiltration and secures mission-critical proprietary logic from third-party leakage vectors.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                      <span className="font-extrabold text-xs text-slate-800 block">The Local Loop</span>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        LLM calls are routed over an offline system interface directly to the active compiler runtime, yielding near-zero network latency.
                      </p>
                    </div>
                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                      <span className="font-extrabold text-xs text-slate-800 block">Spider Code Engine</span>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        A portable daemon controlling standard process execution flags on Windows, macOS, and Linux to run tests safely.
                      </p>
                    </div>
                  </div>
                </article>
              )}

              {docsActiveSection === 'models' && (
                <article className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest block mb-2">Documentation — Section 02</span>
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900">Proprietary AI Models</h2>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    SpiderNotebook comes preconfigured with two high-efficiency, specialized language models optimized to run offline.
                  </p>

                  <div className="space-y-6 mt-6">
                    {/* Model 1 */}
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">Mimo v2.5 — Primary Intelligence Model</h4>
                        <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-800 text-[10px] font-bold rounded-full uppercase">Core Engine</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Mimo v2.5 is our primary large-scale reasoning model. Powers deep code analysis, multi-file refactoring, architecture suggestions, test generation, and complex debugging across all supported languages.
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-slate-500">
                        <div className="bg-white p-2 rounded-xl border border-slate-150"><strong>Context</strong> 250k tokens</div>
                        <div className="bg-white p-2 rounded-xl border border-slate-150"><strong>Specialization</strong> Full-stack reasoning</div>
                        <div className="bg-white p-2 rounded-xl border border-slate-150"><strong>Latency</strong> Optimized inference</div>
                      </div>
                    </div>

                    {/* Model 2 */}
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">DeepSeek v4 — Fast Completion Engine</h4>
                        <span className="px-2.5 py-0.5 bg-slate-200 text-slate-800 text-[10px] font-bold rounded-full uppercase">Low Latency</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Optimized for real-time autocomplete, inline suggestions, and lightning-fast code completions. Built for speed with a massive 250k context window for deep project understanding.
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-slate-500">
                        <div className="bg-white p-2 rounded-xl border border-slate-150"><strong>Context</strong> 250k tokens</div>
                        <div className="bg-white p-2 rounded-xl border border-slate-150"><strong>Specialization</strong> Fast completions</div>
                        <div className="bg-white p-2 rounded-xl border border-slate-150"><strong>Latency</strong> Millisecond response</div>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {docsActiveSection === 'backend' && (
                <article className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest block mb-2">Documentation — Section 03</span>
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900">Backend API & Requests</h2>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    The <strong>Spider Code Engine</strong> local daemon exposes secure internal endpoints. Developers can interface with this backend using standard REST calls. Below are structured layouts for compiler and chat payloads.
                  </p>

                  <div className="space-y-4">
                    <span className="block font-bold text-slate-800 text-xs uppercase tracking-wider">
                      1. Trigger Local Sandbox Compilation Request
                    </span>
                    <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-xs overflow-x-auto">
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

                    <span className="block font-bold text-slate-800 text-xs uppercase tracking-wider pt-2">
                      2. Code Analysis Prompt Payload
                    </span>
                    <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-xs overflow-x-auto">
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
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest block mb-2">Documentation — Section 04</span>
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900">Custom Provider Configuration</h2>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Configure any OpenAI-compatible provider directly inside SpiderNotebook. Connect your own inference servers, hosted APIs, or private model endpoints.
                  </p>

                  {/* Live Form Preview */}
                  <div className="bg-slate-900 rounded-2xl p-6 space-y-5">
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
                      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                        <span className="text-sm text-white font-mono">myprovider</span>
                      </div>
                      <span className="text-[9px] text-slate-500">Lowercase letters, numbers, hyphens, or underscores</span>
                    </div>

                    {/* Display Name */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Display name</label>
                      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                        <span className="text-sm text-white font-mono">My AI Provider</span>
                      </div>
                    </div>

                    {/* Base URL */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base URL</label>
                      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                        <span className="text-sm text-cyan-400 font-mono">https://api.myprovider.com/v1</span>
                      </div>
                    </div>

                    {/* API Key */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">API key</label>
                      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                        <span className="text-sm text-slate-500 font-mono italic">••••••••••••••••</span>
                      </div>
                      <span className="text-[9px] text-slate-500">Optional. Leave empty if you manage auth via headers.</span>
                    </div>

                    {/* Models */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Models</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-500 uppercase">ID</span>
                          <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5">
                            <span className="text-xs text-white font-mono">model-id</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-500 uppercase">Name</span>
                          <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5">
                            <span className="text-xs text-white font-mono">Display Name</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Headers */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Headers <span className="text-slate-600">(optional)</span></label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-500 uppercase">Header</span>
                          <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5">
                            <span className="text-xs text-slate-400 font-mono">Header-Name</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-500 uppercase">Value</span>
                          <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5">
                            <span className="text-xs text-slate-400 font-mono">value</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors mt-4">
                      Submit Configuration
                    </button>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-slate-500 mt-4">
                    <Icons.Check className="text-emerald-500 w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Once submitted, SpiderNotebook validates the endpoint and makes your custom models available in the model selector instantly.</span>
                  </div>
                </article>
              )}

              {docsActiveSection === 'github' && (
                <article className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest block mb-2">Documentation — Section 05</span>
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900">GitHub Enterprise Sync</h2>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Safely commit code and synchronize workspace states directly through our agent commands without sharing private configuration keys on-cloud.
                  </p>

                  <div className="space-y-4 mt-6">
                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                      <h4 className="font-bold text-slate-900 text-xs">Authenticating Local Repositories</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        SpiderNotebook uses your system's SSH keys or local keychain credentials to connect with GitHub, GitHub Enterprise, or GitLab. We do not store, intercept, or request passwords. All authentication procedures are delegated directly to your machine's secure command-line shell.
                      </p>
                    </div>

                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                      <h4 className="font-bold text-slate-900 text-xs">Direct Git Command Payload Execution</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Instruct SpiderNotebook to commit optimizations via local shells:
                      </p>
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px]">
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
      <footer className="bg-white border-t border-slate-100 text-slate-500 py-16 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                S
              </div>
              <span className="text-slate-900 font-bold text-base">SpiderNotebook</span>
            </div>
            <p className="text-xs leading-relaxed">
              A secure, local AI coding agent and workspace designed to compile, refactor, and debug your directories with absolute code privacy.
            </p>
            <div className="flex gap-4 text-base text-cyan-600 pt-2 font-semibold">
              <a href="#" className="hover:text-slate-900">GitHub</a>
              <a href="#" className="hover:text-slate-900">Discord</a>
              <a href="#" className="hover:text-slate-900">Reddit</a>
              <a href="#" className="hover:text-slate-900">Twitter</a>
            </div>
          </div>


          <div className="space-y-3.5">
            <span className="block text-slate-900 font-bold tracking-wider uppercase text-xs">Directories</span>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li><a href="#overview" className="hover:text-cyan-600">Overview</a></li>
              <li><a href="#features" className="hover:text-cyan-600">Core Features</a></li>
              <li><a href="#specs" className="hover:text-cyan-600">Requirements</a></li>
            </ul>
          </div>


          <div className="space-y-3.5">
            <span className="block text-slate-900 font-bold tracking-wider uppercase text-xs">Publisher Details</span>
            <p className="text-xs leading-relaxed font-semibold">
              M4Spider Corp<br />
              Hyderabad, Telangana, India<br />
              Email Support: <a href="mailto:vvvr8412@gmail.com" className="text-cyan-600 hover:underline">vvvr8412@gmail.com</a>
            </p>
          </div>


          <div className="space-y-3.5">
            <span className="block text-slate-900 font-bold tracking-wider uppercase text-xs">Enterprise Deployment</span>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Microsoft Store Verified
              </span>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                Conforms with default Windows application sandbox parameters to ensure optimal hardware isolated runtime security.
              </p>
            </div>
          </div>


        </div>


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-100 text-center text-[11px] text-slate-400 space-y-1.5 font-medium">
          <p>© 2026 M4Spider. Built with 🕷️ in India. Windows, macOS, Linux, and associated systems trademarks are properties of their respective owners.</p>
        </div>
      </footer>


      {/* Toast Notification Container */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short bg-white border border-slate-200 p-5 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-500 flex items-center justify-center text-base shadow-inner">
            <Icons.Download className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="block text-xs font-extrabold text-slate-900">{toast.title}</span>
            <span className="block text-[11px] text-slate-500">{toast.desc}</span>
          </div>
        </div>
      )}


    </div>
  );
}