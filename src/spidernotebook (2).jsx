import React, { useState, useEffect } from 'react';

const Icons = {
  Spider () = (
    svg className=w-5 h-5 text-white animate-pulse fill=none viewBox=0 0 24 24 stroke=currentColor strokeWidth={2}
      path strokeLinecap=round strokeLinejoin=round d=M12 3v18M3 12h18M6 6l12 12M6 18L12 12m0 0L18 6 
    svg
  ),
  Download ({ className = w-5 h-5 }) = (
    svg className={className} fill=none viewBox=0 0 24 24 stroke=currentColor strokeWidth={2}
      path strokeLinecap=round strokeLinejoin=round d=M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4 
    svg
  ),
  Desktop ({ className = w-5 h-5 }) = (
    svg className={className} fill=none viewBox=0 0 24 24 stroke=currentColor strokeWidth={2}
      path strokeLinecap=round strokeLinejoin=round d=M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z 
    svg
  ),
  Apple ({ className = w-5 h-5 }) = (
    svg className={className} fill=currentColor viewBox=0 0 24 24
      path d=M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.73-1.18 1.87-1.03 2.98 1.12.09 2.27-.58 2.98-1.42z 
    svg
  ),
  Windows ({ className = w-5 h-5 }) = (
    svg className={className} fill=currentColor viewBox=0 0 24 24
      path d=M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.102zM10.8 1.95L24 0v11.55H10.8V1.95zM10.8 12.45H24v11.55l-13.2-1.95v-9.6z 
    svg
  ),
  Linux ({ className = w-5 h-5 }) = (
    svg className={className} fill=currentColor viewBox=0 0 24 24
      path d=M12 2c-.5 0-1 .1-1.5.3-3.2 1.3-4.5 4.5-4.5 7.7v1.1c-.1.5-.2.9-.3 1.4-.4 1.7-.8 3.5-1.1 5.3-.2.9.1 1.7.7 2.3.8.8 2 1.2 3.2 1.2 1.6 0 3.1-.3 4.5-.9 1.4.6 2.9.9 4.5.9 1.2 0 2.4-.4 3.2-1.2.6-.6.9-1.4.7-2.3-.3-1.8-.7-3.6-1.1-5.3-.1-.5-.2-.9-.3-1.4v-1.1c0-3.2-1.3-6.4-4.5-7.7C13 2.1 12.5 2 12 2zm0 1.5c.3 0 .7.1 1 .2 2.3.9 3.5 3.3 3.5 6.3v.9l.4 1.7c.3 1.5.7 3.1.9 4.6.1.5-.1.8-.3 1-.4.4-1.1.6-1.8.6h-2.1c-.6-1-1.5-1.8-2.6-2.1v-.8c.4-.1.8-.4 1-.8s.2-.9-.1-1.3c-.3-.4-.8-.6-1.3-.6-.5 0-1 .2-1.3.6-.3.4-.3.9-.1 1.3s.6.7 1 .8v.8c-1.1.3-2 1.1-2.6 2.1H5.8c-.7 0-1.4-.2-1.8-.6-.2-.2-.4-.5-.3-1 .2-1.5.6-3.1.9-4.6l.4-1.7v-.9C5 13.3 6.2 10.9 8.5 10c.3-.1.7-.2 1-.2.8 0 1.6.2 2.5.5V10c0-.4.3-.8.8-.8s.8.4.8.8v.3c.9-.3 1.7-.5 2.4-.5z 
    svg
  ),
  Check ({ className = w-4 h-4 text-emerald-500 }) = (
    svg className={className} fill=none viewBox=0 0 24 24 stroke=currentColor strokeWidth={3}
      path strokeLinecap=round strokeLinejoin=round d=M5 13l4 4L19 7 
    svg
  ),
  ArrowRight ({ className = w-4 h-4 }) = (
    svg className={className} fill=none viewBox=0 0 24 24 stroke=currentColor strokeWidth={2}
      path strokeLinecap=round strokeLinejoin=round d=M14 5l7 7m0 0l-7 7m7-7H3 
    svg
  ),
  Terminal ({ className = w-5 h-5 }) = (
    svg className={className} fill=none viewBox=0 0 24 24 stroke=currentColor strokeWidth={2}
      path strokeLinecap=round strokeLinejoin=round d=M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z 
    svg
  ),
  BookOpen ({ className = w-5 h-5 }) = (
    svg className={className} fill=none viewBox=0 0 24 24 stroke=currentColor strokeWidth={2}
      path strokeLinecap=round strokeLinejoin=round d=M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253 
    svg
  ),
  Shield ({ className = w-5 h-5 }) = (
    svg className={className} fill=none viewBox=0 0 24 24 stroke=currentColor strokeWidth={2}
      path strokeLinecap=round strokeLinejoin=round d=M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z 
    svg
  ),
  Lock ({ className = w-5 h-5 }) = (
    svg className={className} fill=none viewBox=0 0 24 24 stroke=currentColor strokeWidth={2}
      path strokeLinecap=round strokeLinejoin=round d=M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z 
    svg
  ),
  Github ({ className = w-5 h-5 }) = (
    svg className={className} fill=currentColor viewBox=0 0 24 24
      path fillRule=evenodd clipRule=evenodd d=M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z 
    svg
  ),
  Cpu ({ className = w-5 h-5 }) = (
    svg className={className} fill=none viewBox=0 0 24 24 stroke=currentColor strokeWidth={2}
      path strokeLinecap=round strokeLinejoin=round d=M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z 
    svg
  ),
  Menu ({ className = w-6 h-6 }) = (
    svg className={className} fill=none viewBox=0 0 24 24 stroke=currentColor strokeWidth={2}
      path strokeLinecap=round strokeLinejoin=round d=M4 6h16M4 12h16M4 18h16 
    svg
  ),
  X ({ className = w-6 h-6 }) = (
    svg className={className} fill=none viewBox=0 0 24 24 stroke=currentColor strokeWidth={2}
      path strokeLinecap=round strokeLinejoin=round d=M6 18L18 6M6 6l12 12 
    svg
  )
};

const CODE_PRESETS = {
  python {
    filename spider_fastapi_sandbox.py,
    language Python,
    code `from fastapi import FastAPI, HTTPException

app = FastAPI(title=SpiderNotebook AI Workspace)

@app.get(items{item_id})
def read_item(item_id int)
    if item_id  0
        raise HTTPException(status_code=400, detail=Invalid item ID)
    return {id item_id, status active}`,
    agentAnalysis Analyzed your FastAPI routing scheme. The route parameters look solid! Recommended checking inputs with custom Pydantic validators to improve type safety during runtime compilation loops.
  },
  javascript {
    filename spider_express_sandbox.js,
    language JavaScript,
    code `const express = require('express');
const app = express();

 Secure local middleware layer
app.use((req, res, next) = {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});`,
    agentAnalysis Successfully validated standard security middleware. The Express compiler logs indicate complete compatibility with local network sandbox routing rules.
  },
  cpp {
    filename spider_memory_sandbox.cpp,
    language C++,
    code `#include iostream
#include vector

int main() {
    stdvectorint numbers = {10, 20, 30};
     Ensure thread-safe index bounds checking
    stdcout  Data   numbers.at(0)  stdendl;
    return 0;
}`,
    agentAnalysis Smart implementation utilizing vector boundary index checks. This effectively bypasses potential segmentation faults and double-destruction failures inside memory limits.
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState('landing');  'landing' or 'docs'
  const [activeTab, setActiveTab] = useState('python');
  const [devCount, setDevCount] = useState(5);
  const [hoursSaved, setHoursSaved] = useState(10);
  const [detectedOS, setDetectedOS] = useState('Analyzing system environment...');
  const [osIcon, setOsIcon] = useState('desktop');
  const [openFAQ, setOpenFAQ] = useState(null);
  const [toast, setToast] = useState({ visible false, title '', desc '' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [docsActiveSection, setDocsActiveSection] = useState('overview');

   Platform detection logic (strictly on-load parameters)
  useEffect(() = {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('win') !== -1) {
      setDetectedOS(Windows 10  11 Desktop (Verified Architecture));
      setOsIcon('windows');
    } else if (ua.indexOf('mac') !== -1) {
      setDetectedOS(macOS Apple Silicon & Intel Architectures);
      setOsIcon('apple');
    } else if (ua.indexOf('linux') !== -1) {
      setDetectedOS(Linux Standalone Distribution (Portable .AppImage));
      setOsIcon('linux');
    } else {
      setDetectedOS(Universal Computer Environment Platform Supported);
      setOsIcon('desktop');
    }
  }, []);

   Utility toast notification system
  const triggerToast = (title, desc) = {
    setToast({ visible true, title, desc });
    setTimeout(() = {
      setToast({ visible false, title '', desc '' });
    }, 4500);
  };

   ROI Calculator Calculations
  const monthlyHoursSaved = devCount  hoursSaved  4;
  const estimatedSavings = monthlyHoursSaved  50;  assuming $50hr standard software engineer rate

  const toggleFAQ = (index) = {
    setOpenFAQ(openFAQ === index  null  index);
  };

  return (
    div className=font-sans text-slate-900 bg-white min-h-screen selectionbg-cyan-50020 selectiontext-slate-900 overflow-x-hidden antialiased
      
      { NAVIGATION BAR }
      nav className=sticky top-0 z-50 bg-white95 backdrop-blur-md border-b border-slate-100 transition-all
        div className=max-w-7xl mx-auto px-4 smpx-6 lgpx-8
          div className=flex items-center justify-between h-20
            { Logo }
            button onClick={() = setCurrentView('landing')} className=flex items-center gap-3 text-left focusoutline-none
              div className=w-10 h-10 bg-gradient-to-tr from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-50020
                Icons.Spider 
              div
              div
                div className=flex items-center gap-2
                  span className=text-xl font-bold tracking-tight text-slate-900SpiderNotebookspan
                  span className=text-[10px] bg-cyan-100 text-cyan-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widerLocal IDEspan
                div
                span className=block text-xs text-slate-500 tracking-wide font-mediumSecure AI Workspacespan
              div
            button

            { Nav Directory (Desktop) }
            div className=hidden mdflex items-center gap-8 text-sm font-semibold text-slate-600
              button 
                onClick={() = setCurrentView('landing')} 
                className={`transition-colors ${currentView === 'landing'  'text-cyan-600'  'hovertext-cyan-600'}`}
              
                Product
              button
              button 
                onClick={() = {
                  setCurrentView('docs');
                  setDocsActiveSection('overview');
                }} 
                className={`flex items-center gap-1.5 transition-colors ${currentView === 'docs'  'text-cyan-600'  'hovertext-cyan-600'}`}
              
                Icons.BookOpen className=w-4 h-4 text-cyan-500 
                Docs & APIs
              button
              a href=#overview onClick={() = setCurrentView('landing')} className=hovertext-cyan-600 transition-colorsOverviewa
              a href=#features onClick={() = setCurrentView('landing')} className=hovertext-cyan-600 transition-colorsCapabilitiesa
              a href=#roi onClick={() = setCurrentView('landing')} className=hovertext-cyan-600 transition-colorsROI Estimatora
            div

            { Action CTA }
            div className=hidden mdflex items-center gap-4
              button 
                onClick={() = {
                  setCurrentView('landing');
                  setTimeout(() = {
                    const el = document.getElementById('download');
                    if (el) el.scrollIntoView({ behavior 'smooth' });
                  }, 100);
                }}
                className=inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hoverfrom-cyan-600 hoverto-cyan-700 text-white text-xs font-bold tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-50020
              
                Icons.Download className=w-4 h-4 mr-2  Download Free
              button
            div

            { Mobile Menu Button }
            div className=mdhidden
              button 
                onClick={() = setMobileMenuOpen(!mobileMenuOpen)}
                className=p-2 rounded-lg text-slate-600 hoverbg-slate-50
              
                {mobileMenuOpen  Icons.X   Icons.Menu }
              button
            div
          div
        div

        { Mobile Directory Dropdown }
        {mobileMenuOpen && (
          div className=mdhidden border-t border-slate-100 bg-white px-4 pt-4 pb-6 space-y-3
            button 
              onClick={() = { setCurrentView('landing'); setMobileMenuOpen(false); }} 
              className=block w-full text-left py-2 text-sm font-semibold text-slate-600
            
              Product
            button
            button 
              onClick={() = { setCurrentView('docs'); setMobileMenuOpen(false); }} 
              className=block w-full text-left py-2 text-sm font-semibold text-cyan-600
            
              Docs & APIs
            button
            a href=#overview onClick={() = { setCurrentView('landing'); setMobileMenuOpen(false); }} className=block py-2 text-sm font-semibold text-slate-600Overviewa
            a href=#features onClick={() = { setCurrentView('landing'); setMobileMenuOpen(false); }} className=block py-2 text-sm font-semibold text-slate-600Capabilitiesa
            button 
              onClick={() = {
                setCurrentView('landing');
                setMobileMenuOpen(false);
                setTimeout(() = {
                  const el = document.getElementById('download');
                  if (el) el.scrollIntoView({ behavior 'smooth' });
                }, 100);
              }}
              className=flex items-center justify-center w-full py-3 bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl
            
              Icons.Download className=w-4 h-4 mr-2  Download Free
            button
          div
        )}
      nav

      { RENDER VIEW CONTROLLER }
      {currentView === 'landing'  (
        
          {}
          header className=relative pt-12 pb-20 lgpt-20 lgpb-32 bg-gradient-to-b from-slate-50 via-white to-white overflow-hidden
            { Soft cyan decorative glow background vector }
            div className=absolute top-14 left-12 -translate-x-12 w-[600px] h-[600px] bg-cyan-5005 rounded-full blur-3xl pointer-events-nonediv

            div className=max-w-7xl mx-auto px-4 smpx-6 lgpx-8 relative z-10
              div className=grid grid-cols-1 lggrid-cols-12 gap-12 lggap-16 items-center
                
                { Left Content Column }
                div className=lgcol-span-6 space-y-8 text-center lgtext-left
                  div className=inline-flex items-center gap-2 px-3.5 py-1.5 bg-cyan-50010 text-cyan-800 rounded-full text-xs font-bold uppercase tracking-wider
                    span className=w-2 h-2 rounded-full bg-cyan-500 animate-pulsespan
                    Secure Local Sandbox IDE & Agent
                  div

                  h1 className=text-4xl smtext-5xl lgtext-6xl font-extrabold tracking-tight leading-tight text-slate-900
                    Stop Browsing.br 
                    span className=text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-500Start Commanding.span
                  h1

                  p className=text-lg text-slate-500 leading-relaxed font-normal max-w-xl mx-auto lgmx-0
                    SpiderNotebook is a secure, local-first AI agent and workspace designed to compile, refactor, and debug your directories with absolute code privacy. It executes operations entirely on your local machine.
                  p

                  { Dynamic OS Signature Detection Card }
                  div className=p-4 bg-white border border-slate-100 rounded-2xl max-w-lg mx-auto lgmx-0 flex items-center justify-between shadow-sm
                    div className=flex items-center gap-3
                      div className=w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-cyan-500
                        {osIcon === 'windows' && Icons.Windows className=w-6 h-6 }
                        {osIcon === 'apple' && Icons.Apple className=w-6 h-6 }
                        {osIcon === 'linux' && Icons.Linux className=w-6 h-6 }
                        {osIcon === 'desktop' && Icons.Desktop className=w-6 h-6 }
                      div
                      div className=text-left
                        span className=block text-[10px] uppercase text-slate-400 font-bold tracking-widerDETECTED COMPILER PLATFORMspan
                        span className=font-bold text-xs text-slate-800{detectedOS}span
                      div
                    div
                    span className=px-3 py-1 bg-emerald-50 text-[10px] text-emerald-600 font-bold uppercase rounded-lg border border-emerald-100 flex items-center gap-1.5
                      span className=w-1.5 h-1.5 bg-emerald-500 rounded-fullspan Secure Sandbox
                    span
                  div

                  { Call-to-actions }
                  div className=flex flex-col smflex-row items-center justify-center lgjustify-start gap-4
                    a 
                      href=#download 
                      className=w-full smw-auto flex items-center justify-center gap-3 bg-slate-900 hoverbg-slate-800 text-white font-bold text-sm px-8 py-4 rounded-xl transition-all shadow-xl shadow-slate-90010
                    
                      spanGet Local Desktop Buildspan
                      Icons.ArrowRight 
                    a

                    a 
                      href=#simulator 
                      className=w-full smw-auto flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-600 font-bold text-sm px-8 py-4 rounded-xl hoverbg-slate-50 hoverborder-slate-300 transition-all
                    
                      Icons.Terminal className=text-cyan-500 
                      spanInteractive IDE Demospan
                    a
                  div

                  p className=text-xs text-slate-400 font-medium text-center lgtext-left
                    Supports Windows, macOS (IntelM-series) & Linux. Optimized to execute fully on 8GB RAM setups.
                  p
                div

                { Right Simulator Column }
                div id=simulator className=lgcol-span-6 scroll-mt-24
                  div className=relative bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-5005
                    
                    { Header Mock bar }
                    div className=flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100
                      div className=flex items-center gap-2
                        span className=w-3 h-3 rounded-full bg-slate-200span
                        span className=w-3 h-3 rounded-full bg-slate-200span
                        span className=w-3 h-3 rounded-full bg-slate-200span
                        span className=ml-4 font-mono text-[11px] text-slate-500 font-semibold
                          {CODE_PRESETS[activeTab].filename}
                        span
                      div
                      div className=px-2.5 py-1 bg-cyan-100 rounded-lg text-cyan-800 font-bold text-[10px] tracking-wider uppercase
                        LOCAL AI AGENT
                      div
                    div

                    { Preset Controls }
                    div className=flex items-center gap-3 px-6 py-3 bg-white border-b border-slate-100 overflow-x-auto
                      {Object.keys(CODE_PRESETS).map((key) = (
                        button
                          key={key}
                          onClick={() = setActiveTab(key)}
                          className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all ${
                            activeTab === key
                               'bg-cyan-50 text-cyan-700 border border-cyan-20050'
                               'bg-slate-50 text-slate-500 hoverbg-slate-100 border border-transparent'
                          }`}
                        
                          {CODE_PRESETS[key].language} Preset
                        button
                      ))}
                    div

                    { Simulated IDE Content Grid }
                    div className=grid grid-cols-1 mdgrid-cols-12 min-h-[340px]
                      { Left Code Editor Area }
                      div className=mdcol-span-7 bg-slate-900 p-5 font-mono text-xs overflow-y-auto leading-relaxed relative flex flex-col justify-between
                        pre className=text-slate-200 whitespace-pre
                          code{CODE_PRESETS[activeTab].code}code
                        pre
                        div className=absolute top-3 right-3
                          button 
                            onClick={() = {
                              navigator.clipboard.writeText(CODE_PRESETS[activeTab].code);
                              triggerToast(Clipboard Copied, Simulated file source code copy successful!);
                            }} 
                            className=text-slate-400 hovertext-white p-1.5 bg-slate-80080 rounded-lg border border-slate-700 transition-colors
                            title=Copy code payload
                          
                            span className=text-[10px] uppercase font-bold tracking-widerCopy Codespan
                          button
                        div
                      div

                      { Right Assistant Execution Log Area }
                      div className=mdcol-span-5 p-5 flex flex-col justify-between bg-slate-50 border-l border-slate-100
                        div className=space-y-4
                          div className=text-[9px] font-bold text-slate-400 tracking-wider uppercase
                             WORKSPACE AGENT OUTPUT
                          div
                          div className=text-[11px] leading-relaxed text-slate-600 font-medium
                            span className=font-bold text-cyan-600Spider Agentspan {CODE_PRESETS[activeTab].agentAnalysis}
                          div
                        div

                        div className=mt-4 pt-3 border-t border-slate-20060 flex items-center justify-between text-[10px] text-slate-500 font-bold font-mono
                          span className=flex items-center gap-1.5 text-emerald-600
                            span className=w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulsespan Compilation Safe
                          span
                          span className=text-cyan-600 uppercase font-bold100% Isolatedspan
                        div
                      div
                    div

                  div
                div

              div
            div
          header

          {}
          section id=overview className=py-24 border-t border-slate-100 bg-white scroll-mt-20
            div className=max-w-7xl mx-auto px-4 smpx-6 lgpx-8
              div className=grid grid-cols-1 lggrid-cols-12 gap-16 items-center
                
                { Context Paragraph Copy Block }
                div className=lgcol-span-7 space-y-6
                  span className=font-bold text-xs text-cyan-600 tracking-widest uppercase block SECTION 01 PRODUCT OVERVIEWspan
                  h2 className=text-3xl smtext-4xl font-extrabold tracking-tight text-slate-900
                    Other AI chatbots talk.br 
                    span className=text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-500This one WORKS.span
                  h2
                  
                  p className=text-slate-500 text-base smtext-lg leading-relaxed
                    SpiderNotebook is a local AI development agent that compiles, refactors, and tests software structures right in your local workspace. Instead of copying-and-pasting block templates continuously from browser tabs into your files, let SpiderNotebook command your sandbox securely on your machine.
                  p

                  div className=grid grid-cols-1 smgrid-cols-2 gap-4 pt-4
                    div className=p-5 rounded-2xl border border-slate-100 bg-white shadow-sm
                      span className=text-cyan-700 block font-bold text-sm mb-1.5
                        Icons.Terminal className=inline w-4 h-4 mr-1.5 text-cyan-500  Integrated Sandbox Environment
                      span
                      p className=text-slate-500 text-xs leading-relaxed
                        Combines secure local workspace mapping with compilation, terminal routing execution, and active diagnostic layers.
                      p
                    div
                    div className=p-5 rounded-2xl border border-slate-100 bg-white shadow-sm
                      span className=text-cyan-700 block font-bold text-sm mb-1.5
                        Icons.Lock className=inline w-4 h-4 mr-1.5 text-cyan-500  Absolute Source Code Privacy
                      span
                      p className=text-slate-500 text-xs leading-relaxed
                        Runs entirely on your machine. Zero proprietary logic layers or API tokens are transmitted to external cloud systems.
                      p
                    div
                  div
                div

                { ROI Savings Estimator Slider Block }
                div id=roi className=lgcol-span-5 p-8 bg-slate-50 border border-slate-100 rounded-3xl shadow-sm scroll-mt-24
                  h3 className=font-bold text-sm text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2
                    Icons.Cpu className=text-cyan-500 w-4 h-4  Developer Productivity Savings Estimator
                  h3
                  p className=text-xs text-slate-500 mb-6 font-medium
                    Calculate the operational hours and dollar-value savings from shifting automated diagnostics to SpiderNotebook's local workspace.
                  p

                  div className=space-y-6
                    
                    { Dev Count Input Range }
                    div
                      div className=flex justify-between text-xs font-bold mb-2
                        span className=text-slate-700Team Size (Engineers)span
                        span className=text-cyan-600{devCount} Developersspan
                      div
                      input 
                        type=range 
                        min=1 
                        max=50 
                        value={devCount} 
                        onChange={(e) = setDevCount(parseInt(e.target.value))}
                        className=w-full accent-cyan-500 bg-slate-200 h-1.5 rounded-lg cursor-pointer 
                      
                    div

                    { Hours Saved Input Range }
                    div
                      div className=flex justify-between text-xs font-bold mb-2
                        span className=text-slate-700Hours Saved  Week Per Developerspan
                        span className=text-cyan-600{hoursSaved} Hoursspan
                      div
                      input 
                        type=range 
                        min=2 
                        max=25 
                        value={hoursSaved} 
                        onChange={(e) = setHoursSaved(parseInt(e.target.value))}
                        className=w-full accent-cyan-500 bg-slate-200 h-1.5 rounded-lg cursor-pointer 
                      
                    div

                    { Dynamic Value Readout Display }
                    div className=pt-6 border-t border-slate-20060 grid grid-cols-2 gap-4 text-center
                      div className=p-3 bg-white rounded-2xl border border-slate-100 shadow-sm
                        span className=block text-[10px] font-bold text-slate-400 uppercaseMonthly Saved Hoursspan
                        span className=text-2xl font-black text-slate-800{monthlyHoursSaved} hrsspan
                      div
                      div className=p-3 bg-white rounded-2xl border border-slate-100 shadow-sm
                        span className=block text-[10px] font-bold text-slate-400 uppercaseEstimated Savingsspan
                        span className=text-2xl font-black text-cyan-600${estimatedSavings.toLocaleString()}span
                      div
                    div

                    div className=text-[10px] text-center text-slate-400 italic
                      Estimates assume standard $50hour fully burdened developer overhead cost matrix.
                    div

                  div
                div

              div
            div
          section

          {}
          section id=features className=py-24 bg-slate-5050 border-t border-b border-slate-100 scroll-mt-20
            div className=max-w-7xl mx-auto px-4 smpx-6 lgpx-8
              
              div className=text-center space-y-4 max-w-2xl mx-auto mb-20
                span className=font-bold text-xs text-cyan-600 tracking-widest uppercase block SECTION 02 CAPABILITIESspan
                h2 className=text-3xl smtext-4xl font-extrabold tracking-tight text-slate-900
                  Engineered for Secure Development Velocity
                h2
                p className=text-slate-500 text-sm smtext-base leading-relaxed
                  Designed from the ground up for high-performance offline compilation, advanced sandbox isolation, and local code assistance.
                p
              div

              div className=grid grid-cols-1 mdgrid-cols-2 lggrid-cols-3 gap-8
                
                { Feature 1 }
                div className=p-8 bg-white border border-slate-100 rounded-2xl shadow-sm hover-translate-y-1 transition-all duration-300
                  div className=w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-6 shadow-inner
                    Icons.Terminal 
                  div
                  h3 className=text-slate-900 font-bold text-lg mb-2🔍 Local Code Explorationh3
                  p className=text-slate-500 text-sm leading-relaxed
                    Prompt SpiderNotebook to search your active directory structure. It instantly maps out references, dependencies, and index patterns.
                  p
                div

                { Feature 2 }
                div className=p-8 bg-white border border-slate-100 rounded-2xl shadow-sm hover-translate-y-1 transition-all duration-300
                  div className=w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-6 shadow-inner
                    Icons.Cpu 
                  div
                  h3 className=text-slate-900 font-bold text-lg mb-2👁️ Visual Code Diagnosticsh3
                  p className=text-slate-500 text-sm leading-relaxed
                    The agent parses code graphs to visually map and explain logical execution, ensuring memory allocations and references are sound.
                  p
                div

                { Feature 3 }
                div className=p-8 bg-white border border-slate-100 rounded-2xl shadow-sm hover-translate-y-1 transition-all duration-300
                  div className=w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-6 shadow-inner
                    Icons.Spider 
                  div
                  h3 className=text-slate-900 font-bold text-lg mb-2⌨️ Smart Boilerplate Generationh3
                  p className=text-slate-500 text-sm leading-relaxed
                    Directly scaffolding functions, interface parameters, and modular layers. Generates robust blueprints conforming to local styles.
                  p
                div

                { Feature 4 }
                div className=p-8 bg-white border border-slate-100 rounded-2xl shadow-sm hover-translate-y-1 transition-all duration-300
                  div className=w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-6 shadow-inner
                    Icons.Shield 
                  div
                  h3 className=text-slate-900 font-bold text-lg mb-2🛡️ Local Safety Shieldh3
                  p className=text-slate-500 text-sm leading-relaxed
                    Restricts all file executions inside isolated processes. No external networks or cloud environments receive your proprietary code.
                  p
                div

                { Feature 5 }
                div className=p-8 bg-white border border-slate-100 rounded-2xl shadow-sm hover-translate-y-1 transition-all duration-300
                  div className=w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-6 shadow-inner
                    Icons.Download 
                  div
                  h3 className=text-slate-900 font-bold text-lg mb-2⚡ Multi-Language Workspaceh3
                  p className=text-slate-500 text-sm leading-relaxed
                    Comprehensive offline workspace support for compiling and validating structures in Python, Node.js, C++, Rust, and Go.
                  p
                div

                { Feature 6 }
                div className=p-8 bg-white border border-slate-100 rounded-2xl shadow-sm hover-translate-y-1 transition-all duration-300
                  div className=w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-6 shadow-inner
                    Icons.Lock 
                  div
                  h3 className=text-slate-900 font-bold text-lg mb-2💾 Session Persistenceh3
                  p className=text-slate-500 text-sm leading-relaxed
                    Safeguards your project history and console logs locally. Resume deep development sessions instantly upon workspace restart.
                  p
                div

              div

            div
          section

          {}
          section id=faq className=py-24 bg-white border-b border-slate-100 scroll-mt-20
            div className=max-w-4xl mx-auto px-4 smpx-6 lgpx-8
              
              div className=text-center space-y-4 mb-16
                span className=font-bold text-xs text-cyan-600 tracking-widest uppercase block SECTION 03 FAQspan
                h2 className=text-3xl font-extrabold tracking-tight text-slate-900
                  Frequently Asked Questions
                h2
                p className=text-slate-500 text-sm leading-relaxed
                  Find comprehensive answers on deployment, local integrations, and data security.
                p
              div

              div className=space-y-4 text-sm
                {[
                  {
                    q Is SpiderNotebook really free to download and run,
                    a Yes. SpiderNotebook is completely free to download and run locally on Windows, macOS, and Linux. By running the language processing and container compiler loop locally on your machine, there are zero server costs for us to pass down to you.
                  },
                  {
                    q Does SpiderNotebook collect code telemetry or directory logs,
                    a No. Your source code privacy is one of our primary structural rules. All generation and debugging execution steps run strictly inside your local system storage environment. No analytics telemetry or file payloads are transmitted to any cloud servers.
                  },
                  {
                    q How does the secure sandbox run local compilations,
                    a SpiderNotebook uses isolated sub-processes on your local machine to safely run and compile the targeted code blocks. This guarantees code checks and diagnostic logs compile with speed and accuracy without risk to your host OS architecture.
                  }
                ].map((item, idx) = (
                  div key={idx} className=border border-slate-20060 rounded-2xl bg-slate-5050 overflow-hidden
                    button 
                      onClick={() = toggleFAQ(idx)}
                      className=w-full flex items-center justify-between p-5 text-left font-bold text-slate-800 hoverbg-slate-50 transition-colors
                    
                      span{item.q}span
                      span className=text-cyan-600 font-extrabold text-lg
                        {openFAQ === idx  '−'  '+'}
                      span
                    button
                    {openFAQ === idx && (
                      div className=p-5 bg-white border-t border-slate-20060 text-slate-500 text-xs leading-relaxed
                        {item.a}
                      div
                    )}
                  div
                ))}
              div

            div
          section

          {}
          section id=reviews className=py-24 bg-white border-b border-slate-100
            div className=max-w-7xl mx-auto px-4 smpx-6 lgpx-8
              
              div className=text-center space-y-4 max-w-2xl mx-auto mb-20
                span className=font-bold text-xs text-cyan-600 tracking-widest uppercase block SECTION 04 CLIENT CASE REVIEWSspan
                h2 className=text-3xl smtext-4xl font-extrabold tracking-tight text-slate-900
                  Feedback from active operators
                h2
                p className=text-slate-500 text-sm leading-relaxed
                  Read feedback from developers and security professionals using SpiderNotebook.
                p
              div

              div className=grid grid-cols-1 mdgrid-cols-2 gap-8 max-w-4xl mx-auto
                
                { Review 1 }
                div className=bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between
                  p className=text-slate-600 italic text-sm leading-relaxed
                    SpiderNotebook has completely streamlined our local workspace workflows. The ability to run complex code refactoring tests completely offline without worrying about source code leakage is phenomenal.
                  p
                  div className=mt-8 flex items-center gap-3 border-t border-slate-100 pt-5
                    div className=w-10 h-10 bg-slate-100 text-slate-800 font-black rounded-full flex items-center justify-center
                      D
                    div
                    div
                      span className=block font-bold text-xs text-slate-900Senior Software Engineerspan
                      span className=text-[10px] font-semibold text-slate-400Bangalore, Indiaspan
                    div
                  div
                div

                { Review 2 }
                div className=bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between
                  p className=text-slate-600 italic text-sm leading-relaxed
                    The local-first compilation design is brilliant. Our internal intellectual property has to stay inside our firewall, and SpiderNotebook respects this boundary perfectly while giving us full coding assistance.
                  p
                  div className=mt-8 flex items-center gap-3 border-t border-slate-100 pt-5
                    div className=w-10 h-10 bg-slate-100 text-slate-800 font-black rounded-full flex items-center justify-center
                      S
                    div
                    div
                      span className=block font-bold text-xs text-slate-900Security Researcherspan
                      span className=text-[10px] font-semibold text-slate-400California, USAspan
                    div
                  div
                div

              div

            div
          section

          {}
          section id=download className=py-24 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white overflow-hidden relative scroll-mt-20
            div className=absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.06)_0%,transparent_100%)] pointer-events-nonediv

            div className=max-w-6xl mx-auto px-4 smpx-6 lgpx-8 text-center space-y-8 relative z-10
              div className=space-y-3
                span className=font-bold text-xs text-cyan-400 tracking-widest uppercase block SYSTEM DEPLOYMENTspan
                h3 className=text-3xl smtext-4xl font-extrabold tracking-tight
                  Ready to Command Your Workspace
                h3
                p className=text-slate-400 text-sm max-w-xl mx-auto leading-relaxed
                  Free forever. No credit cards needed. No servers required. Your AI coding agent runs safely and securely on YOUR machine.
                p
              div

              div className=grid grid-cols-1 mdgrid-cols-3 gap-8 max-w-5xl mx-auto pt-4 text-xs text-left
                
                { Windows Card }
                div className=p-6 bg-slate-90060 border border-slate-800 rounded-3xl flex flex-col justify-between space-y-6 shadow-sm hoverborder-cyan-50030 transition-all
                  div className=space-y-4
                    span className=text-4xl text-cyan-400 blockIcons.Windows className=w-10 h-10 span
                    h4 className=font-bold text-white text-baseMicrosoft Windowsh4
                    p className=text-[11px] text-slate-400 leading-relaxed
                      Compatible with Windows 10 & 11 environments (x64 architecture). Direct executable package.
                    p
                  div
                  
                  div className=space-y-2
                    a 
                      href=httpsapps.microsoft.comdetail9ngj207gmk74 
                      target=_blank 
                      rel=noopener noreferrer
                      className=block w-full py-3 bg-cyan-500 hoverbg-cyan-400 text-slate-950 font-bold text-center rounded-xl transition-colors
                    
                      Get from Microsoft Store
                    a
                    button 
                      onClick={() = triggerToast(Windows Executable Setup, Your standalone setup.exe installer compilation has begun!)}
                      className=block w-full py-2.5 bg-slate-950 hoverbg-slate-900 text-slate-300 font-semibold text-center rounded-xl transition-colors border border-slate-800
                    
                      Download Offline Installer (.exe)
                    button
                  div
                div

                { macOS Card }
                div className=p-6 bg-slate-90060 border border-slate-800 rounded-3xl flex flex-col justify-between space-y-6 shadow-sm hoverborder-cyan-50030 transition-all
                  div className=space-y-4
                    span className=text-4xl text-cyan-400 blockIcons.Apple className=w-10 h-10 span
                    h4 className=font-bold text-white text-baseApple macOSh4
                    p className=text-[11px] text-slate-400 leading-relaxed
                      Optimized for Apple Silicon (M1M2M3M4) & Intel-based architectures. Safe workspace package.
                    p
                  div
                  
                  div className=space-y-2
                    button 
                      onClick={() = triggerToast(macOS Apple Silicon DMG, Compiling local build for Apple Silicon (M-series)...)}
                      className=block w-full py-3 bg-cyan-500 hoverbg-cyan-400 text-slate-950 font-bold text-center rounded-xl transition-colors
                    
                      Download Apple Silicon (.dmg)
                    button
                    button 
                      onClick={() = triggerToast(macOS Intel DMG, Compiling standalone legacy build for Intel macOS x64 architectures...)}
                      className=block w-full py-2.5 bg-slate-950 hoverbg-slate-900 text-slate-300 font-semibold text-center rounded-xl transition-colors border border-slate-800
                    
                      Download Intel Version (.dmg)
                    button
                  div
                div

                { Linux Card }
                div className=p-6 bg-slate-90060 border border-slate-800 rounded-3xl flex flex-col justify-between space-y-6 shadow-sm hoverborder-cyan-50030 transition-all
                  div className=space-y-4
                    span className=text-4xl text-cyan-400 blockIcons.Linux className=w-10 h-10 span
                    h4 className=font-bold text-white text-baseLinux Coreh4
                    p className=text-[11px] text-slate-400 leading-relaxed
                      Standard binary build compatible with major distributions. Portable workspace package format.
                    p
                  div
                  
                  div className=space-y-2
                    button 
                      onClick={() = triggerToast(Linux Standalone AppImage, Preparing standalone AppImage mirror container payload...)}
                      className=block w-full py-3 bg-cyan-500 hoverbg-cyan-400 text-slate-950 font-bold text-center rounded-xl transition-colors
                    
                      Download AppImage (.AppImage)
                    button
                    button 
                      onClick={() = triggerToast(Linux Tarball Archive, Generating offline tar.gz binaries mirror file...)}
                      className=block w-full py-2.5 bg-slate-950 hoverbg-slate-900 text-slate-300 font-semibold text-center rounded-xl transition-colors border border-slate-800
                    
                      Download Archive (.tar.gz)
                    button
                  div
                div

              div

              div className=pt-4 text-xs text-slate-400 max-w-md mx-auto flex items-center justify-center gap-2
                Icons.Shield className=text-cyan-400 w-4 h-4 
                spanDirect client build. Safe download from M4Spider. Built with 🕷️ in India.span
              div

            div
          section
        
      )  (
        div className=max-w-7xl mx-auto px-4 smpx-6 lgpx-8 py-10
          div className=grid grid-cols-1 lggrid-cols-12 gap-10
            
            { DOCS SIDEBAR }
            aside className=lgcol-span-3 space-y-6
              div className=p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4
                span className=block text-[10px] font-bold text-slate-400 tracking-wider uppercase
                  Workspace Documentation
                span
                
                nav className=space-y-1
                  {[
                    { id 'overview', label '1. Platform Overview' },
                    { id 'models', label '2. Proprietary AI Models' },
                    { id 'backend', label '3. Backend API & Requests' },
                    { id 'custom', label '4. Custom Endpoint Mapping' },
                    { id 'github', label '5. GitHub Enterprise Sync' }
                  ].map((sec) = (
                    button
                      key={sec.id}
                      onClick={() = setDocsActiveSection(sec.id)}
                      className={`block w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        docsActiveSection === sec.id
                           'bg-cyan-50 text-cyan-800 border-l-4 border-cyan-500'
                           'text-slate-600 hoverbg-slate-100 hovertext-slate-900'
                      }`}
                    
                      {sec.label}
                    button
                  ))}
                nav
              div

              div className=p-5 bg-gradient-to-tr from-cyan-900 to-slate-900 text-white rounded-2xl space-y-3
                span className=block text-[10px] font-bold text-cyan-400 tracking-wider uppercaseLocal Server Statusspan
                div className=flex items-center gap-2 text-xs font-semibold
                  span className=w-2 h-2 rounded-full bg-emerald-400 animate-pingspan
                  spanlocalhost4098 - Onlinespan
                div
                p className=text-[10px] text-slate-300 leading-relaxed
                  Open Code local compilation daemon is active and listening securely on loopback interface adapters.
                p
              div
            aside

            { DOCS CONTENT WINDOW }
            main className=lgcol-span-9 bg-white border border-slate-100 rounded-3xl p-8 lgp-12 shadow-sm min-h-[600px] space-y-8
              
              {docsActiveSection === 'overview' && (
                article className=space-y-6
                  div className=border-b border-slate-100 pb-4
                    span className=text-[10px] font-bold text-cyan-600 uppercase tracking-widest block mb-2Documentation  Section 01span
                    h2 className=text-2xl lgtext-3xl font-extrabold text-slate-900Platform Overviewh2
                  div
                  p className=text-sm text-slate-500 leading-relaxed
                    SpiderNotebook operates as an architectural wrapper built around strongOpen Codestrong, a sandboxed local-execution workspace pipeline. Traditional coding copilots stream your live active file parameters and surrounding database tables to external servers for query completions. 
                  p
                  p className=text-sm text-slate-500 leading-relaxed
                    By relying on local container boundaries and self-hosted model engines, SpiderNotebook prevents code exfiltration and secures mission-critical proprietary logic from third-party leakage vectors.
                  p
                  
                  div className=grid grid-cols-1 mdgrid-cols-2 gap-4 mt-4
                    div className=p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2
                      span className=font-extrabold text-xs text-slate-800 blockThe Local Loopspan
                      p className=text-xs text-slate-500 leading-relaxed
                        LLM calls are routed over an offline system interface directly to the active compiler runtime, yielding near-zero network latency.
                      p
                    div
                    div className=p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2
                      span className=font-extrabold text-xs text-slate-800 blockOpen Code Enginespan
                      p className=text-xs text-slate-500 leading-relaxed
                        A portable daemon controlling standard process execution flags on Windows, macOS, and Linux to run tests safely.
                      p
                    div
                  div
                article
              )}

              {docsActiveSection === 'models' && (
                article className=space-y-6
                  div className=border-b border-slate-100 pb-4
                    span className=text-[10px] font-bold text-cyan-600 uppercase tracking-widest block mb-2Documentation  Section 02span
                    h2 className=text-2xl lgtext-3xl font-extrabold text-slate-900Proprietary AI Modelsh2
                  div
                  p className=text-sm text-slate-500 leading-relaxed
                    SpiderNotebook comes preconfigured with two high-efficiency, specialized language weights optimized to run offline inside limited RAM allocations.
                  p

                  div className=space-y-6 mt-6
                    { Model 1 }
                    div className=p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-3
                      div className=flex items-center justify-between flex-wrap gap-2
                        h4 className=font-bold text-slate-900 text-smSpider AI v1 (Mino Fine-Tuned)h4
                        span className=px-2.5 py-0.5 bg-cyan-100 text-cyan-800 text-[10px] font-bold rounded-full uppercaseProprietary Corespan
                      div
                      p className=text-xs text-slate-500 leading-relaxed
                        Mino is our proprietary model fine-tuned specifically for local compilation workflows, AST analysis, memory limits safety diagnostics, and unit-test scaffolding. It has extensive familiarity with thread-safety boundaries and low-level system design patterns.
                      p
                      div className=grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-slate-500
                        div className=bg-white p-2 rounded-xl border border-slate-150strongSizestrong 7.3B paramsdiv
                        div className=bg-white p-2 rounded-xl border border-slate-150strongContextstrong 16k tokensdiv
                        div className=bg-white p-2 rounded-xl border border-slate-150strongRAM reqstrong ~4.8 GBdiv
                      div
                    div

                    { Model 2 }
                    div className=p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-3
                      div className=flex items-center justify-between flex-wrap gap-2
                        h4 className=font-bold text-slate-900 text-smSpider AI Flash (DeepSeek v4 Base)h4
                        span className=px-2.5 py-0.5 bg-slate-200 text-slate-800 text-[10px] font-bold rounded-full uppercaseLow Latencyspan
                      div
                      p className=text-xs text-slate-500 leading-relaxed
                        Distilled and quantized specifically to optimize auto-complete interactions and lightning-fast line operations. Built upon robust DeepSeek v4 code-intelligence weights, optimized to respond within milliseconds.
                      p
                      div className=grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-slate-500
                        div className=bg-white p-2 rounded-xl border border-slate-150strongSizestrong 3.2B paramsdiv
                        div className=bg-white p-2 rounded-xl border border-slate-150strongContextstrong 8k tokensdiv
                        div className=bg-white p-2 rounded-xl border border-slate-150strongRAM reqstrong ~2.1 GBdiv
                      div
                    div
                  div
                article
              )}

              {docsActiveSection === 'backend' && (
                article className=space-y-6
                  div className=border-b border-slate-100 pb-4
                    span className=text-[10px] font-bold text-cyan-600 uppercase tracking-widest block mb-2Documentation  Section 03span
                    h2 className=text-2xl lgtext-3xl font-extrabold text-slate-900Backend API & Requestsh2
                  div
                  p className=text-sm text-slate-500 leading-relaxed
                    The strongOpen Codestrong local engine daemon exposes secure endpoints on codelocalhost4098code. Developers can interface with this backend using standard REST calls. Below are structured layouts for compiler and chat payloads.
                  p

                  div className=space-y-4
                    span className=block font-bold text-slate-800 text-xs uppercase tracking-wider
                      1. Trigger Local Sandbox Compilation Request
                    span
                    div className=bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-xs overflow-x-auto
                      span className=text-cyan-400POSTspan httplocalhost4098apiv1sandboxcompile
                      pre className=mt-4 text-slate-300
{`{
  project_path Usersdeveloperworkspacespider-app,
  entry_point main.py,
  environment python3.10,
  timeout_seconds 15
}`}
                      pre
                    div

                    span className=block font-bold text-slate-800 text-xs uppercase tracking-wider pt-2
                      2. Code Analysis Prompt Payload
                    span
                    div className=bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-xs overflow-x-auto
                      span className=text-cyan-400POSTspan httplocalhost4098apiv1modelsgenerate
                      pre className=mt-4 text-slate-300
{`{
  model spider-ai-v1-mino,
  prompt Review standard vectors boundaries in this C++ block.,
  temperature 0.2,
  options {
    max_context_window 8192,
    quantization INT4_Q
  }
}`}
                      pre
                    div
                  div
                article
              )}

              {docsActiveSection === 'custom' && (
                article className=space-y-6
                  div className=border-b border-slate-100 pb-4
                    span className=text-[10px] font-bold text-cyan-600 uppercase tracking-widest block mb-2Documentation  Section 04span
                    h2 className=text-2xl lgtext-3xl font-extrabold text-slate-900Custom Endpoint Mappingh2
                  div
                  p className=text-sm text-slate-500 leading-relaxed
                    Enterprise operators with custom, pre-existing local LLM clusters or private network inference endpoints can map custom paths inside SpiderNotebook.
                  p
                  p className=text-sm text-slate-500 leading-relaxed
                    Simply configure your local configuration file inside the workspace root configuration matrix
                  p

                  div className=p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4
                    span className=font-bold text-slate-800 text-xs block
                      Edit local configuration directory code~.spidernotebookconfig.jsoncode
                    span
                    div className=bg-slate-900 text-slate-100 p-5 rounded-xl font-mono text-xs overflow-x-auto
                      pre className=text-slate-300
{`{
  custom_providers [
    {
      name corporate-custom-cluster,
      api_base http10.10.15.428000v1,
      auth_token bearer-sk-prod-yourtoken-safeguard,
      enabled_models [
        custom-fine-tuned-llama-70b,
        custom-refactoring-coder
      ]
    }
  ]
}`}
                      pre
                    div
                    div className=flex items-start gap-2 text-xs text-slate-500
                      Icons.Check className=text-emerald-500 w-4 h-4 mt-0.5 flex-shrink-0 
                      spanOnce configured, reboot the SpiderNotebook daemon to instantly make these available in the selection drop-downs.span
                    div
                  div
                article
              )}

              {docsActiveSection === 'github' && (
                article className=space-y-6
                  div className=border-b border-slate-100 pb-4
                    span className=text-[10px] font-bold text-cyan-600 uppercase tracking-widest block mb-2Documentation  Section 05span
                    h2 className=text-2xl lgtext-3xl font-extrabold text-slate-900GitHub Enterprise Synch2
                  div
                  p className=text-sm text-slate-500 leading-relaxed
                    Safely commit code and synchronize workspace states directly through our agent commands without sharing private configuration keys on-cloud.
                  p

                  div className=space-y-4 mt-6
                    div className=p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3
                      h4 className=font-bold text-slate-900 text-xsAuthenticating Local Repositoriesh4
                      p className=text-xs text-slate-500 leading-relaxed
                        SpiderNotebook uses your system's SSH keys or local keychain credentials to connect with GitHub, GitHub Enterprise, or GitLab. We do not store, intercept, or request passwords. All authentication procedures are delegated directly to your machine's secure command-line shell.
                      p
                    div

                    div className=p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3
                      h4 className=font-bold text-slate-900 text-xsDirect Git Command Payload Executionh4
                      p className=text-xs text-slate-500 leading-relaxed
                        Instruct SpiderNotebook to commit optimizations via local shells
                      p
                      div className=bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px]
                        $ spideragent run Refactor vector boundaries inside main.cpp, run validation, and commit changes
                      div
                    div
                  div
                article
              )}

            main
          div
        div
      )}

      { FOOTER }
      footer className=bg-white border-t border-slate-100 text-slate-500 py-16 text-sm
        div className=max-w-7xl mx-auto px-4 smpx-6 lgpx-8 grid grid-cols-1 mdgrid-cols-4 gap-12
          
          div className=space-y-4
            div className=flex items-center gap-2.5
              div className=w-8 h-8 bg-gradient-to-tr from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm shadow-md
                S
              div
              span className=text-slate-900 font-bold text-baseSpiderNotebookspan
            div
            p className=text-xs leading-relaxed
              A secure, local AI coding agent and workspace designed to compile, refactor, and debug your directories with absolute code privacy.
            p
            div className=flex gap-4 text-xs text-cyan-600 pt-2 font-semibold
              a href=# className=hovertext-slate-900GitHuba
              a href=# className=hovertext-slate-900Discorda
              a href=# className=hovertext-slate-900Reddita
              a href=# className=hovertext-slate-900Twittera
            div
          div

          div className=space-y-3.5
            span className=block text-slate-900 font-bold tracking-wider uppercase text-xsDirectoriesspan
            ul className=space-y-2.5 text-xs font-semibold
              libutton onClick={() = setCurrentView('landing')} className=hovertext-cyan-600 text-leftOverviewbuttonli
              libutton onClick={() = setCurrentView('landing')} className=hovertext-cyan-600 text-leftCore Featuresbuttonli
              libutton onClick={() = { setCurrentView('docs'); setDocsActiveSection('overview'); }} className=hovertext-cyan-600 text-leftDocumentation Portalbuttonli
            ul
          div

          div className=space-y-3.5
            span className=block text-slate-900 font-bold tracking-wider uppercase text-xsPublisher Detailsspan
            p className=text-xs leading-relaxed font-semibold
              M4Spider Corpbr 
              Hyderabad, Telangana, Indiabr 
              Email Support a href=mailtovvvr8412@gmail.com className=text-cyan-600 hoverunderlinevvvr8412@gmail.coma
            p
          div

          div className=space-y-3.5
            span className=block text-slate-900 font-bold tracking-wider uppercase text-xsEnterprise Deploymentspan
            div className=p-4 bg-slate-50 border border-slate-100 rounded-2xl
              span className=flex items-center gap-1.5 text-[10px] font-bold text-emerald-600
                span className=w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulsespan Microsoft Store Verified
              span
              p className=text-[11px] text-slate-500 mt-1.5 leading-relaxed
                Conforms with default Windows application sandbox parameters to ensure optimal hardware isolated runtime security.
              p
            div
          div

        div

        div className=max-w-7xl mx-auto px-4 smpx-6 lgpx-8 mt-16 pt-8 border-t border-slate-100 text-center text-[11px] text-slate-400 space-y-1.5 font-medium
          p© 2026 M4Spider. Built with 🕷️ in India. Windows, macOS, Linux, and associated systems trademarks are properties of their respective owners.p
        div
      footer

      { Toast Notification Container }
      {toast.visible && (
        div className=fixed bottom-6 right-6 z-50 bg-white border border-slate-200 p-5 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm animate-bounce-short
          div className=w-10 h-10 rounded-xl bg-cyan-50 text-cyan-500 flex items-center justify-center text-base shadow-inner
            Icons.Download className=w-5 h-5 
          div
          div className=text-left
            span className=block text-xs font-extrabold text-slate-900{toast.title}span
            span className=block text-[11px] text-slate-500{toast.desc}span
          div
        div
      )}

    div
  );
}