import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Folder, FileCode, Settings, Terminal, Play, Cpu, Sparkles, ChevronRight, 
  Trash2, Plus, RefreshCw, Layers, Monitor, HelpCircle, Eye, Sliders, 
  Wifi, ShieldAlert, X, ChevronDown, Check, Download, FolderOpen, FileUp, 
  Code, MessageSquare, Menu, Activity
} from 'lucide-react';

const themeMap = {
  zinc: {
    '--spider-bg-dark': '#09090b',         // Zinc 950
    '--spider-bg-surface': '#18181b',      // Zinc 900
    '--spider-bg-element': '#27272a',      // Zinc 800
    '--spider-border': '#2d2d30',          // Soft high-end border
    '--spider-accent': '#06b6d4',          // Premium Electric Cyan
    '--spider-success': '#10b981',         // Clean Emerald
    '--spider-text': '#f4f4f5',            // Zinc 100
    '--spider-text-dim': '#a1a1aa',        // Zinc 400
    '--spider-text-dark': '#52525b',       // Zinc 600
    '--terminal-stdout': '#38bdf8',        // Elegant Sky Blue
    '--terminal-info': '#a78bfa',          // Pale lavender
    '--terminal-error': '#f87171',         // Pastel Red
    '--terminal-warning': '#facc15'        // Soft yellow
  },
  slate: {
    '--spider-bg-dark': '#020617',         // Slate 950
    '--spider-bg-surface': '#0f172a',      // Slate 900
    '--spider-bg-element': '#1e293b',      // Slate 800
    '--spider-border': '#334155',          // Slate 700
    '--spider-accent': '#3b82f6',          // Royal Indigo Blue
    '--spider-success': '#34d399',         // Emerald Green
    '--spider-text': '#f8fafc',            // Slate 50
    '--spider-text-dim': '#94a3b8',        // Slate 400
    '--spider-text-dark': '#475569',       // Slate 600
    '--terminal-stdout': '#60a5fa',        // Royal blue
    '--terminal-info': '#c084fc',          // Bright purple
    '--terminal-error': '#ef4444',         // Red 500
    '--terminal-warning': '#f59e0b'        // Amber 500
  },
  obsidian: {
    '--spider-bg-dark': '#000000',         // True black
    '--spider-bg-surface': '#0a0a0a',      // Deep pitch
    '--spider-bg-element': '#171717',      // Zinc 900 border matching
    '--spider-border': '#262626',          // Dark line accent
    '--spider-accent': '#10b981',          // Minty Green
    '--spider-success': '#22c55e',         // Solid Emerald
    '--spider-text': '#ffffff',            // White
    '--spider-text-dim': '#737373',        // Neutral 500
    '--spider-text-dark': '#404040',       // Neutral 700
    '--terminal-stdout': '#10b981',        // Emerald text output
    '--terminal-info': '#2dd4bf',          // Vibrant Teal
    '--terminal-error': '#f43f5e',         // Rose 500
    '--terminal-warning': '#fbbf24'        // Gold Warning
  },
  teal: {
    '--spider-bg-dark': '#031416',         // Deep Forest Dark-Teal
    '--spider-bg-surface': '#052125',      // Premium Dark Teal Surface
    '--spider-bg-element': '#0b3940',      // Balanced Contrast Teal
    '--spider-border': '#11464f',          // Soft high-tech teal line matching
    '--spider-accent': '#14b8a6',          // Electric neon mint teal
    '--spider-success': '#2dd4bf',         // Mint highlight glow
    '--spider-text': '#f0fdfa',            // Ultra light glowing green-white
    '--spider-text-dim': '#99f6e4',        // Pale mint accent text
    '--spider-text-dark': '#0d9488',       // Forest solid background teal
    '--terminal-stdout': '#2dd4bf',        // Beautiful bright terminal text
    '--terminal-info': '#a78bfa',          // Lavenders
    '--terminal-error': '#f43f5e',         // Bright Crimson
    '--terminal-warning': '#facc15'        // Warnings gold
  }
};

const initialVirtualFiles = [
  {
    path: '/spider',
    name: 'spider',
    type: 'directory',
    isOpen: true,
    protected: true
  },
  {
    path: '/spider/engine.spy',
    name: 'engine.spy',
    type: 'file',
    content: `/*
 * Spider Engine Core — Runtime Entry Point
 */

\`\`\`python
import torch
import sys

print("=== Spider Engine Core ===")
print(f"CUDA Available: {torch.cuda.is_available()}")
\`\`\`
`
  },
  {
    path: '/main.spy',
    name: 'main.spy',
    type: 'file',
    content: `/*
 * Spider Bridge Architecture Hybrid Runtime
 * Merging Compiled Systems and Interpreted Scripting Contexts
 */

\`\`\`python
import sys
import torch
print("=== Python Execution Core ===")
print(f"CUDA Available: {torch.cuda.is_available()}")
print(f"Primary GPU Allocated: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None'}")
\`\`\`
`
  }
];

const gpuClusters = [
  {
    id: 'h100-mega',
    name: 'H100 SXM5 Tensor Core Cluster',
    gpuType: 'NVIDIA H100 SXM5 (80GB VRAM)',
    status: 'Operational',
    temperature: 42,
    activeNodes: 12,
    totalNodes: 32,
    bandwidth: '3.2 TB/s',
    tflops: '67,000 TFLOPS',
            costPerHour: 215,
    scaleFactor: 8
  },
  {
    id: 'a100-flex',
    name: 'A100 NVLink Compute Node Pool',
    gpuType: 'NVIDIA A100 Tensor Core (40GB VRAM)',
    status: 'Operational',
    temperature: 48,
    activeNodes: 18,
    totalNodes: 64,
    bandwidth: '2.0 TB/s',
    tflops: '39,000 TFLOPS',
    costPerHour: 107,
    scaleFactor: 16
  },
  {
    id: 'h200-ultra',
    name: 'H200 Ultra Memory Pool',
    gpuType: 'NVIDIA H200 (141GB HBM3e VRAM)',
    status: 'Idle',
    temperature: 36,
    activeNodes: 0,
    totalNodes: 16,
    bandwidth: '4.8 TB/s',
    tflops: '98,000 TFLOPS',
    costPerHour: 403,
    scaleFactor: 4
  },
  {
    id: 'gh200-grace',
    name: 'GH200 Grace Hopper Superchip Pod',
    gpuType: 'NVIDIA GH200 Grace Hopper Pod',
    status: 'Operational',
    temperature: 51,
    activeNodes: 8,
    totalNodes: 8,
    bandwidth: '5.0 TB/s',
    tflops: '120,000 TFLOPS',
    costPerHour: 748,
    scaleFactor: 8
  }
];

const DB_NAME = 'SpiderNotebookDB';
const DB_VERSION = 1;
const STORE_NAME = 'workspace';

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = (event) => resolve(event.target.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const getDBValue = async (key, fallback) => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result !== undefined ? request.result : fallback);
      };
      request.onerror = () => resolve(fallback);
    });
  } catch (e) {
    return fallback;
  }
};

const setDBValue = async (key, value) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Failed to write to IndexedDB:", e);
  }
};

function highlightCode(code, filename) {
  if (!code) return '';
  const ext = filename ? filename.split('.').pop() : 'txt';
  
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (ext === 'py' || ext === 'spy') {
    escaped = escaped
      .replace(/\b(def|class|import|from|print|return|if|else|elif|for|while|try|except|in|is|as|lambda|with|auto|struct|fn)\b/g, '<span style="color: var(--terminal-info, #a78bfa);" class="font-semibold">$1</span>')
      .replace(/(["'])(.*?)\1/g, '<span style="color: var(--spider-success, #10b981);">"$2"</span>')
      .replace(/(#.*)/g, '<span style="color: var(--spider-text-dark, #52525b); font-style: italic;">$1</span>')
      .replace(/\b(self|device|torch|cuda|std|io|printf)\b/g, '<span style="color: var(--spider-accent, #06b6d4);">$1</span>')
      .replace(/(\b\d+\b)/g, '<span class="text-orange-400">$1</span>');
  } else if (ext === 'cpp' || ext === 'c' || ext === 'h') {
    escaped = escaped
      .replace(/\b(int|void|double|float|char|class|struct|public|private|protected|return|if|else|for|while|auto|const|std|cout|endl)\b/g, '<span style="color: var(--terminal-info, #a78bfa);" class="font-semibold">$1</span>')
      .replace(/(#include.*)/g, '<span class="text-pink-400">$1</span>')
      .replace(/(["'])(.*?)\1/g, '<span style="color: var(--spider-success, #10b981);">"$2"</span>')
      .replace(/(\/\/.*)/g, '<span style="color: var(--spider-text-dark, #52525b); font-style: italic;">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: var(--spider-text-dark, #52525b); font-style: italic;">$1</span>')
      .replace(/(\b\d+\b)/g, '<span class="text-orange-400">$1</span>');
  } else if (ext === 'json') {
    escaped = escaped
      .replace(/(".*?")\s*:/g, '<span style="color: var(--spider-accent, #06b6d4);" class="font-semibold">$1</span> :')
      .replace(/:\s*(".*?")/g, ': <span style="color: var(--spider-success, #10b981);">$2</span>')
      .replace(/:\s*(\b\d+\b|true|false)/g, ': <span class="text-orange-400">$1</span>');
  }

  return escaped;
}

const SpiderFileExplorer = ({ 
  virtualFiles, 
  activeFileId, 
  handleFileClick, 
  handleCreateNode, 
  handleDeleteNode,
  handleOpenProject,
  handleOpenFileClick,
  handleNewProject
}) => {
  const [isCreating, setIsCreating] = useState(null);
  const [createPath, setCreatePath] = useState('');
  const [nodeName, setNodeName] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const createFormRef = useRef(null);

  useEffect(() => {
    if (isCreating && createFormRef.current) {
      createFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isCreating]);

  const isNodeVisible = (nodePath) => {
    const parts = nodePath.split('/').filter(Boolean);
    if (parts.length <= 1) return true; 

    for (let i = 1; i < parts.length; i++) {
      const parentPath = '/' + parts.slice(0, i).join('/');
      const parentFolder = virtualFiles.find(f => f.path === parentPath);
      if (parentFolder && !parentFolder.isOpen) {
        return false;
      }
    }
    return true;
  };

  const renderTreeNodes = () => {
    const sorted = [...virtualFiles]
      .filter(f => !filterQuery || f.name.toLowerCase().includes(filterQuery.toLowerCase()))
      .sort((a, b) => {
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        return a.path.localeCompare(b.path);
      });

    return sorted.map((node) => {
      const parts = node.path.split('/').filter(Boolean);
      const depth = parts.length;
      const isSelected = activeFileId === node.path;

      if (!isNodeVisible(node.path)) {
        return null;
      }

      return (
        <div 
          key={node.path}
          style={{ paddingLeft: `${depth * 14}px` }}
          className={`group flex items-center justify-between py-2 px-3 rounded-lg text-xs font-mono cursor-pointer transition-all duration-150 ${
            isSelected 
              ? 'bg-[var(--spider-bg-element)] text-white shadow-sm' 
              : 'text-[var(--spider-text-dim)] hover:bg-[var(--spider-bg-element)]/40 hover:text-white'
          }`}
          onClick={() => handleFileClick(node)}
        >
          <div className="flex items-center truncate min-w-0">
            {node.type === 'directory' ? (
              <Folder className={`w-4 h-4 mr-2 text-[var(--spider-accent)] shrink-0 transition-transform ${node.isOpen ? 'rotate-90' : ''}`} />
            ) : (
              <FileCode className="w-4 h-4 mr-2 text-[var(--spider-text-dim)] shrink-0" />
            )}
            <span className="truncate tracking-wide">{node.name}</span>
          </div>

          <div className="flex items-center space-x-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
            {node.type === 'directory' && (
              <>
                {!node.protected && (
                  <button 
                    title="Create File"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreatePath(node.path);
                      setIsCreating('file');
                    }}
                    className="hover:text-[var(--spider-accent)] p-1 text-xs text-[var(--spider-text-dim)]"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </>
            )}
            {!node.protected && (
              <button 
                title="Delete Item"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteNode(node.path);
                }}
                className="text-[var(--spider-text-dark)] hover:text-red-400 p-1"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-4 font-sans text-sm pb-16 lg:pb-0">
      <div className="flex flex-col space-y-2 border-b pb-4 flex-shrink-0" style={{ borderColor: 'var(--spider-border)' }}>
        <h3 className="text-[10px] font-bold tracking-wider uppercase text-[var(--spider-text-dark)]">Workspace Tasks</h3>
        <button 
          onClick={handleOpenProject} 
          className="bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-semibold w-full py-2.5 rounded-lg transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
        >
          <FolderOpen size={14} /> Open Project Folder
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={handleOpenFileClick} 
            className="border text-xs font-medium py-2 rounded-lg transition-all bg-[var(--spider-bg-dark)] hover:bg-[var(--spider-bg-element)] text-[var(--spider-text-dim)] flex items-center justify-center gap-1.5 min-h-[40px] touch-manipulation"
            style={{ borderColor: 'var(--spider-border)' }}
          >
            <FileUp size={13} /> Open File
          </button>
          <button 
            onClick={handleNewProject} 
            className="border text-xs font-medium py-2 rounded-lg transition-all bg-[var(--spider-bg-dark)] hover:bg-[var(--spider-bg-element)] text-[var(--spider-text-dim)] flex items-center justify-center gap-1.5 min-h-[40px] touch-manipulation"
            style={{ borderColor: 'var(--spider-border)' }}
          >
            <RefreshCw size={13} /> Clear Workspace
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between flex-shrink-0 px-1">
        <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--spider-text-dark)]">Project Hierarchy</span>
        <div className="flex space-x-2">
          <button 
            title="New File" 
            onClick={() => { setCreatePath('/'); setIsCreating('file'); }}
            className="text-xs text-[var(--spider-text-dim)] hover:text-white p-1"
          >
            <FileCode size={15} />
          </button>
          <button 
            title="New Folder" 
            onClick={() => { setCreatePath('/'); setIsCreating('directory'); }}
            className="text-xs text-[var(--spider-text-dim)] hover:text-white p-1"
          >
            <Folder size={15} />
          </button>
        </div>
      </div>

      <div className="relative flex-shrink-0 px-1">
        <input 
          type="text" 
          placeholder="Search components..." 
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border w-full outline-none transition-all placeholder-zinc-500 bg-[var(--spider-bg-dark)] text-[var(--spider-text)]"
          style={{ borderColor: 'var(--spider-border)' }}
        />
        {filterQuery && (
          <button 
            onClick={() => setFilterQuery('')} 
            className="absolute right-3 top-2.5 text-xs text-[var(--spider-text-dim)] hover:text-white font-bold"
          >
            ×
          </button>
        )}
      </div>

      {isCreating && (
        <div ref={createFormRef} className="border p-3.5 rounded-lg flex-shrink-0 mx-1 shadow-md space-y-3 bg-[var(--spider-bg-surface)]" style={{ borderColor: 'var(--spider-border)' }}>
          <p className="text-[10px] text-[var(--spider-text-dark)] font-sans">New item inside <code className="font-mono bg-[var(--spider-bg-dark)] px-1 py-0.5 rounded">{createPath}</code>:</p>
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder={isCreating === 'file' ? 'script.spy' : 'src'}
              value={nodeName}
              autoFocus
              onChange={(e) => setNodeName(e.target.value)}
              className="bg-black text-white text-xs px-2.5 py-2 rounded border border-zinc-800 w-full outline-none focus:border-zinc-700 font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateNode(createPath, nodeName, isCreating);
                  setNodeName('');
                  setIsCreating(null);
                }
              }}
            />
            <button 
              onClick={() => {
                handleCreateNode(createPath, nodeName, isCreating);
                setNodeName('');
                setIsCreating(null);
              }}
              className="bg-white text-zinc-950 text-xs px-4 py-2 rounded font-semibold hover:bg-zinc-100 min-h-[36px]"
            >
              Add
            </button>
          </div>
          <button 
            onClick={() => setIsCreating(null)}
            className="text-[10px] text-[var(--spider-text-dim)] hover:text-white underline"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5 pr-1 py-1">
        {renderTreeNodes()}
      </div>
    </div>
  );
};

const SpiderGPUClusterCenter = ({ activeCluster, onSelectCluster, onDeployToCluster }) => {
  const [allocationCount, setAllocationCount] = useState(8);

  const cluster = useMemo(() => {
    return gpuClusters.find(c => c.id === activeCluster) || gpuClusters[0];
  }, [activeCluster]);

  const clusterThroughputBars = useMemo(() => {
    return [38,52,45,68,42,55,71,48,62,58,44,73,50,65,47,60,53,69,41,57,63,46,70,54,49,66,43,59,51,67,40,64,56,72,45,61,48,68,52,44,67,55];
  }, []);

  return (
    <div className="border rounded-2xl p-4 sm:p-6 space-y-6 backdrop-blur-md shadow-sm font-sans bg-[var(--spider-bg-surface)]/60" style={{ borderColor: 'var(--spider-border)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-4" style={{ borderColor: 'var(--spider-border)' }}>
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Cpu className="text-[var(--spider-accent)]" size={18} /> Compute Clusters Node Control
          </h3>
          <p className="text-xs text-[var(--spider-text-dim)] mt-1">Scale dynamic, multi-threaded ML training pipelines on physical H100 backends instantly.</p>
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <span className="flex h-2 w-2 relative">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {cluster.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {gpuClusters.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectCluster(c.id)}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 active:scale-98 min-h-[120px] ${
              activeCluster === c.id 
                ? 'bg-[var(--spider-bg-element)] text-white shadow-md'
                : 'text-[var(--spider-text-dim)] bg-[var(--spider-bg-surface)]/40 hover:bg-[var(--spider-bg-element)]/40 hover:text-white'
            }`}
            style={{ borderColor: activeCluster === c.id ? 'var(--spider-accent)' : 'var(--spider-border)' }}
          >
            <div>
              <div className="text-xs font-bold tracking-wide truncate mb-1" style={{ color: activeCluster === c.id ? 'var(--spider-accent)' : '#fff' }}>{c.name}</div>
              <div className="text-[10px] font-mono text-[var(--spider-text-dark)]">{c.gpuType}</div>
            </div>
            <div className="mt-5 flex items-baseline space-x-1">
              <span className="text-lg font-mono font-semibold text-white">₹{c.costPerHour.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-[var(--spider-text-dim)] font-sans">/hr/node</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        <div className="lg:col-span-2 border p-4 sm:p-5 rounded-xl space-y-4 bg-[var(--spider-bg-dark)]/40" style={{ borderColor: 'var(--spider-border)' }}>
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-zinc-200 uppercase tracking-wider">Telemetry Diagnostics</span>
            <span className="font-mono text-[var(--spider-text-dim)] bg-[var(--spider-bg-element)] px-2 py-0.5 rounded text-[10px]">{cluster.tflops} Performance</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="border p-3 rounded-lg bg-[var(--spider-bg-surface)]/50 text-center sm:text-left" style={{ borderColor: 'var(--spider-border)' }}>
              <span className="block text-[9px] uppercase tracking-wider font-semibold text-[var(--spider-text-dark)]">IO Bandwidth</span>
              <span className="text-sm font-semibold font-mono text-zinc-100 block mt-1 truncate">{cluster.bandwidth}</span>
            </div>
            <div className="border p-3 rounded-lg bg-[var(--spider-bg-surface)]/50 text-center sm:text-left" style={{ borderColor: 'var(--spider-border)' }}>
              <span className="block text-[9px] uppercase tracking-wider font-semibold text-[var(--spider-text-dark)]">Temp Limit</span>
              <span className="text-sm font-semibold font-mono text-zinc-100 block mt-1 truncate">{cluster.temperature}°C</span>
            </div>
            <div className="border p-3 rounded-lg bg-[var(--spider-bg-surface)]/50 text-center sm:text-left" style={{ borderColor: 'var(--spider-border)' }}>
              <span className="block text-[9px] uppercase tracking-wider font-semibold text-[var(--spider-text-dark)]">Active Nodes</span>
              <span className="text-sm font-semibold font-mono text-zinc-100 block mt-1 truncate">{cluster.activeNodes} / {cluster.totalNodes}</span>
            </div>
          </div>

          <div className="relative h-20 border rounded-lg overflow-hidden flex items-end bg-[var(--spider-bg-dark)]/60" style={{ borderColor: 'var(--spider-border)' }}>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:10px_10px]"></div>
            <div className="absolute top-2 left-3 text-[10px] text-[var(--spider-text-dim)] flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: 'var(--spider-accent)' }}></span>
              <span className="font-medium tracking-wide">Cluster Link IO Streams</span>
            </div>
            <div className="w-full h-full flex items-end px-3 pb-1 space-x-0.5 sm:space-x-1">
              {clusterThroughputBars.map((h, i) => (
                <div 
                  key={i} 
                  className="flex-1 rounded-t-sm transition-all duration-500 bg-white opacity-45 hover:opacity-100"
                  style={{ height: `${h}%` }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        <div className="border p-4 sm:p-5 rounded-xl flex flex-col justify-between space-y-4 bg-[var(--spider-bg-dark)]/40" style={{ borderColor: 'var(--spider-border)' }}>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-zinc-200 uppercase tracking-wider">Dynamic Scaler</span>
              <span className="font-mono text-zinc-100 bg-[var(--spider-bg-element)] px-2.5 py-1 rounded text-xs font-bold">{allocationCount} Instances</span>
            </div>
            <p className="text-xs text-[var(--spider-text-dim)] leading-relaxed">Adjust cluster compute allocation elastically. Pods auto-scale dynamic compiled thread execution vectors safely.</p>
            
            <div className="pt-2">
              <input 
                type="range" 
                min={1} 
                max={32} 
                value={allocationCount} 
                onChange={(e) => setAllocationCount(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-[9px] font-mono mt-1 text-[var(--spider-text-dark)]">
                <span>1 Node</span>
                <span>16 Nodes</span>
                <span>32 Nodes</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3" style={{ borderColor: 'var(--spider-border)' }}>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-[var(--spider-text-dim)]">Estimated Run Cost:</span>
              <span className="text-base font-mono font-bold text-white">₹{(cluster.costPerHour * allocationCount).toLocaleString('en-IN')}/hr</span>
            </div>
            <button
              onClick={() => onDeployToCluster(cluster.id, allocationCount)}
              className="w-full bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold py-3 rounded-lg active:scale-95 transition-all uppercase tracking-wider min-h-[44px]"
            >
              Deploy Instance Matrix
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [virtualFiles, setVirtualFiles] = useState(initialVirtualFiles);
  const [openFiles, setOpenFiles] = useState(['/spider/engine.spy', '/main.spy']);
  const [activeFileId, setActiveFileId] = useState('/main.spy');
  const [currentTheme, setCurrentTheme] = useState('zinc');
  const [activeCluster, setActiveCluster] = useState('h100-mega');
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'gpu'
  const [mobileSubTab, setMobileSubTab] = useState('editor'); // 'explorer', 'editor', 'preview', 'console', 'ai'
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [wsStatus, setWsStatus] = useState('Disconnected');
  const [wsUrl, setWsUrl] = useState('wss://spy.m4spider.com/');
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [appScale, setAppScale] = useState(1.0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [deleteConfirmPath, setDeleteConfirmPath] = useState(null);
  
  const [liveGpuUsage, setLiveGpuUsage] = useState(44.8);
  const [liveNetLatency, setLiveNetLatency] = useState(12);
  const [liveNetSpeed, setLiveNetSpeed] = useState(1.2);
  const [realNetSpeed, setRealNetSpeed] = useState(null);
  const [diskUsage, setDiskUsage] = useState(null);

  const [aiMessages, setAiMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi, I’m Spider AI. I can analyze compiled system performance, optimize threads, or map cluster configurations. What are we building today?'
    }
  ]);



  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');

  const [terminalOutput, setTerminalOutput] = useState([
    `<span style="color: var(--spider-text-dim); opacity: 0.65;">[SYSTEM] m4::spider compiler workspace loaded. Ready for pipeline orchestration.</span>`,
    `<span style="color: var(--spider-text-dim); opacity: 0.65;">[SYSTEM] GPU Node cluster connections synced. Active backend online.</span>`
  ]);

  const wsRef = useRef(null);
  const textareaRef = useRef(null);
  const folderInputRef = useRef(null);
  const filesInputRef = useRef(null);

  useEffect(() => {
    const loadStoredData = async () => {
      const storedTheme = await getDBValue('currentTheme', 'zinc');
      const storedWsUrl = await getDBValue('wsUrl', 'wss://spy.m4spider.com/');
      const storedScale = await getDBValue('appScale', 1.0);

      setCurrentTheme(storedTheme);
      setWsUrl(storedWsUrl);
      setAppScale(storedScale);
      setIsLoaded(true);
    };
    loadStoredData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      setDBValue('currentTheme', currentTheme);
    }
  }, [currentTheme, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      setDBValue('wsUrl', wsUrl);
    }
  }, [wsUrl, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      setDBValue('appScale', appScale);
    }
  }, [appScale, isLoaded]);

  useEffect(() => {
    const theme = themeMap[currentTheme] || themeMap.zinc;
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [currentTheme]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveGpuUsage(prev => {
        const delta = (Math.random() - 0.5) * 4;
        const next = prev + delta;
        return parseFloat(Math.max(10, Math.min(99, next)).toFixed(1));
      });
      setLiveNetLatency(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = prev + delta;
        return Math.max(5, Math.min(45, next));
      });
      setLiveNetSpeed(prev => {
        const delta = (Math.random() - 0.5) * 0.1;
        const next = prev + delta;
        return parseFloat(Math.max(0.4, Math.min(4.8, next)).toFixed(1));
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      setRealNetSpeed(conn.downlink || null);
      setLiveNetLatency(conn.rtt || 12);
      const updateConn = () => {
        setRealNetSpeed(conn.downlink || null);
        setLiveNetLatency(conn.rtt || 12);
      };
      conn.addEventListener('change', updateConn);
      return () => conn.removeEventListener('change', updateConn);
    }
  }, []);

  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(est => {
        const usedGB = (est.usage / (1024 * 1024 * 1024)).toFixed(2);
        const totalGB = (est.quota / (1024 * 1024 * 1024)).toFixed(1);
        setDiskUsage({ used: usedGB, total: totalGB });
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${appScale * 100}%`;
  }, [appScale]);

  const activeFolder = useMemo(() => {
    if (!activeFileId) return '/';
    const parts = activeFileId.split('/').filter(Boolean);
    if (parts.length <= 1) return '/';
    return '/' + parts.slice(0, -1).join('/');
  }, [activeFileId]);

  const triggerDialog = (title, message) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const appendToTerminal = useCallback((text, type = 'stdout') => {
    let coloredText = '';
    switch (type) {
      case 'stdout':
        coloredText = `<span style="color: var(--terminal-stdout, #38bdf8); font-weight: 500;">${text}</span>`;
        break;
      case 'info':
        coloredText = `<span style="color: var(--terminal-info, #a78bfa);">ℹ [INFO] ${text}</span>`;
        break;
      case 'error':
        coloredText = `<span style="color: var(--terminal-error, #f87171);">✖ [ERROR] ${text}</span>`;
        break;
      case 'warning':
        coloredText = `<span style="color: var(--terminal-warning, #facc15);">⚠ [WARN] ${text}</span>`;
        break;
      default:
        coloredText = `<span style="color: var(--spider-text-dim, #a1a1aa);">${text}</span>`;
    }
    setTerminalOutput(prev => [...prev, coloredText]);
  }, []);

  const runLocalSimulation = (fileName, content) => {
    appendToTerminal(`[COMPILER] Initiating LLVM bytecode compilation for target: ${fileName}`, 'info');
    
    setTimeout(() => {
      appendToTerminal(`[CUDA-GRID] Pinned thread dimensions mapped directly to active serverless cores.`, 'info');
      appendToTerminal(`[HOST-OUTPUT] Execution pipeline synced successfully:`, 'stdout');
      
      if (content.includes('torch')) {
        appendToTerminal(`=== Torch ML Environment Dynamic Target ===`, 'stdout');
        appendToTerminal(`CUDA Acceleration Status: True`, 'stdout');
        appendToTerminal(`Cluster Active Device: NVIDIA H100 GPU (80GB SMX5 Cores Enabled)`, 'stdout');
        appendToTerminal(`Float32 Tensor operations complete in 0.038ms.`, 'stdout');
      } else if (content.includes('iostream')) {
        appendToTerminal(`=== Compiled C++ LLVM Dynamic Binary Output ===`, 'stdout');
        appendToTerminal(`Assigned GPU vector thread blocks safely.`, 'stdout');
        appendToTerminal(`Execution finished with clean Exit Code: 0`, 'stdout');
      } else {
        appendToTerminal(`Engine compiled and completed in cloud cluster context.`, 'stdout');
      }
    }, 450);
  };

  const connectWebSocket = useCallback(() => {
    if (wsRef.current && wsStatus === 'Connected') {
      wsRef.current.close(1000, 'User requested termination');
      return;
    }

    setWsStatus('Connecting');
    appendToTerminal(`Initializing remote secure WS handshake with compiler daemon...`, 'info');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('Connected');
        appendToTerminal(`Connected to high-performance remote serverless execution kernel.`, 'info');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          let message = (data.message || '').trim();

          const pathRegex = /(?:C:\\Users\\|D:\/home\/Tools\/|File\s+)[\w\s\\/.-]+\.(py|cpp|java|exe|ld\.exe|collect2\.exe|javac)/g;
          let isPathError = false;

          let cleanMessage = message.replace(pathRegex, (match) => {
            isPathError = true;
            if (match.startsWith("File ")) {
              const fileNameMatch = match.match(/["']?([^:"']+\.(py|cpp|java|spy))["']?/i);
              return `[File Error: ${fileNameMatch ? fileNameMatch[1] : 'Unknown File'}]`;
            }
            return 'Security Framework Path Guard Filtered';
          });

          if (isPathError || data.type === 'error') {
            appendToTerminal(cleanMessage || "Error during compilation framework run", 'error');
          } else {
            appendToTerminal(message, 'stdout');
          }
        } catch (e) {
          appendToTerminal(event.data, 'stdout');
        }
      };

      ws.onclose = (event) => {
        setWsStatus('Disconnected');
        appendToTerminal(`Remote WebSockets disconnected cleanly (Code: ${event.code})`, 'warning');
        wsRef.current = null;
      };

      ws.onerror = () => {
        setWsStatus('Error');
        appendToTerminal(`WebSocket pipeline broke. Verify server address in settings.`, 'error');
        wsRef.current = null;
      };

    } catch (e) {
      setWsStatus('Error');
      appendToTerminal(`Handshake initialization failed: ${e.message}`, 'error');
    }
  }, [wsUrl, wsStatus, appendToTerminal]);

  const handleRunEngine = () => {
    const file = virtualFiles.find(f => f.path === activeFileId);
    if (!file || file.type !== 'file') {
      triggerDialog("Target Needed", "Select a runnable file target from the hierarchy tree first.");
      return;
    }

    if (!file.content || !file.content.trim()) {
      triggerDialog("Empty File", "Zero byte files cannot be evaluated by compiler engines.");
      return;
    }

    appendToTerminal(`[DEPLOY] Transmitting bytecode context for compiled target: ${file.name}`, 'info');

    if (wsRef.current && wsStatus === 'Connected') {
      wsRef.current.send(JSON.stringify({
        type: 'run_file',
        fileName: file.name,
        content: file.content
      }));
    } else {
      appendToTerminal('Device is offline. Please link the hub and try again later.', 'warning');
    }

    // Auto switch to mobile Preview tab so users immediately see visual logs
    if (window.innerWidth < 1024) {
      setMobileSubTab('preview');
    }
  };

  const handleDeployToCluster = (clusterId, scale) => {
    const file = virtualFiles.find(f => f.path === activeFileId);
    appendToTerminal(`[INFRA-SCALE] Bootstrapping ${scale} ML-Engine instances for cluster [${clusterId}]`, 'info');
    
    if (file && file.type === 'file') {
      appendToTerminal(`[INFRA-SYNC] Binding execution schema: [${file.name}] as direct serverless target context.`, 'info');
      handleRunEngine();
    } else {
      appendToTerminal(`[COMPUTE] Cloud workers initialized and scaled. Active state online.`, 'stdout');
    }
  };

  const handleSave = () => {
    const file = virtualFiles.find(f => f.path === activeFileId);
    if (!file || file.type !== 'file') return;

    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    appendToTerminal(`Dispatched local export download buffer for file: [${file.name}]`, 'info');
  };

  const handleOpenProject = () => {
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };

  const handleOpenFileClick = () => {
    if (filesInputRef.current) {
      filesInputRef.current.click();
    }
  };

  const handleNewProject = () => {
    setVirtualFiles(initialVirtualFiles);
    setOpenFiles(['/spider/engine.spy', '/main.spy']);
    setActiveFileId('/main.spy');
    appendToTerminal('Workspace context initialized back to empty scratch template.', 'info');
  };

  const handleFolderUploadChange = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    appendToTerminal(`[UPLOAD] Processing folder ingestion stream. Parsing ${files.length} elements...`, 'info');
    
    const parsedFiles = [];
    const directoryPaths = new Set();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = '/' + file.webkitRelativePath;
      const content = await file.text();
      
      const parts = relPath.split('/').filter(Boolean);
      let currentPath = '';
      for (let j = 0; j < parts.length - 1; j++) {
        currentPath += '/' + parts[j];
        directoryPaths.add(currentPath);
      }

      parsedFiles.push({
        path: relPath,
        name: file.name,
        type: 'file',
        content: content
      });
    }

    const directoryNodes = Array.from(directoryPaths).map(dirPath => {
      const parts = dirPath.split('/');
      return {
        path: dirPath,
        name: parts[parts.length - 1],
        type: 'directory',
        isOpen: true
      };
    });

    const combined = [...directoryNodes, ...parsedFiles];
    setVirtualFiles(combined);
    
    const firstFile = parsedFiles[0];
    if (firstFile) {
      setOpenFiles([firstFile.path]);
      setActiveFileId(firstFile.path);
    }
    appendToTerminal(`[UPLOAD] Ingested directory structures successfully mapped.`, 'stdout');
  };

  const handleFilesUploadChange = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    appendToTerminal(`[UPLOAD] Buffering ${files.length} flat files into project workspace...`, 'info');
    const newFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const content = await file.text();
      const path = '/' + file.name;

      newFiles.push({
        path: path,
        name: file.name,
        type: 'file',
        content: content
      });
    }

    setVirtualFiles(prev => {
      const filteredPrev = prev.filter(p => !newFiles.some(n => n.path === p.path));
      return [...filteredPrev, ...newFiles];
    });

    if (newFiles.length > 0) {
      setOpenFiles(prev => Array.from(new Set([...prev, ...newFiles.map(f => f.path)])));
      setActiveFileId(newFiles[0].path);
    }
  };

  const handleCreateNode = (parentPath, name, type) => {
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    const cleanParent = parentPath === '/' ? '' : parentPath;
    const finalPath = `${cleanParent}/${cleanName}`;

    if (virtualFiles.some(f => f.path === finalPath)) {
      triggerDialog("Name Collision", "An item with this identical node path is already tracked.");
      return;
    }

    const newNode = {
      path: finalPath,
      name: cleanName,
      type,
      content: type === 'file' ? '// Start coding here...\n' : undefined,
      isOpen: type === 'directory' ? true : undefined
    };

    setVirtualFiles(prev => [...prev, newNode]);
    
    if (cleanParent) {
      setVirtualFiles(prev => prev.map(f => {
        if (f.path === cleanParent) {
          return { ...f, isOpen: true };
        }
        return f;
      }));
    }

    if (type === 'file') {
      setOpenFiles(prev => [...prev, finalPath]);
      setActiveFileId(finalPath);
    }
    appendToTerminal(`Created virtual entity: -> ${finalPath}`, 'info');
  };

  const handleDeleteNode = (path) => {
    const node = virtualFiles.find(f => f.path === path);
    if (node && node.protected) {
      triggerDialog("Protected", "This system folder cannot be deleted.");
      return;
    }
    setDeleteConfirmPath(path);
  };

  const confirmDeleteNode = () => {
    if (!deleteConfirmPath) return;
    const pathToDelete = deleteConfirmPath;

    setVirtualFiles(prev => prev.filter(f => f.path !== pathToDelete && !f.path.startsWith(pathToDelete + '/')));
    setOpenFiles(prev => prev.filter(p => p !== pathToDelete));
    if (activeFileId === pathToDelete) {
      const remaining = openFiles.filter(p => p !== pathToDelete);
      setActiveFileId(remaining[0] || null);
    }
    appendToTerminal(`Evicted dynamic project path from virtual tracking: ${pathToDelete}`, 'warning');
    setDeleteConfirmPath(null);
  };

  const handleFileClick = (node) => {
    if (node.type === 'file') {
      if (!openFiles.includes(node.path)) {
        setOpenFiles(prev => [...prev, node.path]);
      }
      setActiveFileId(node.path);
      // Pushes editor tab active on mobile layout instantly on file select
      if (window.innerWidth < 1024) {
        setMobileSubTab('editor');
      }
    } else {
      setVirtualFiles(prev => prev.map(f => {
        if (f.path === node.path) {
          return { ...f, isOpen: !f.isOpen };
        }
        return f;
      }));
    }
  };

  const handleCodeChange = (val) => {
    setVirtualFiles(prev => prev.map(f => {
      if (f.path === activeFileId) {
        return { ...f, content: val };
      }
      return f;
    }));
  };

  const activeFile = useMemo(() => {
    return virtualFiles.find(f => f.path === activeFileId && f.type === 'file');
  }, [virtualFiles, activeFileId]);

  const callFastAPI = useCallback(async (prompt) => {
    try {
      const res = await fetch("/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      if (!res.ok) throw new Error("API stream compilation error.");
      const rawText = await res.text();
      return { text: rawText };
    } catch (err) {
      return { error: err.message };
    }
  }, []);

  const handleAiAction = async (actionType, explicitQuery) => {
    if (!activeFile) {
      triggerDialog("Focus Required", "Please select a file inside the code canvas to execute AI alignment directives.");
      return;
    }

    setAiLoading(true);
    let prompt = '';
    let displayUserMessage = explicitQuery || '';
    
    if (actionType === 'custom') {
      prompt = `Directives: ${displayUserMessage}. Current File [${activeFile.name}]:\n${activeFile.content}`;
    } else {
      switch (actionType) {
        case 'generate':
          displayUserMessage = explicitQuery || `Generate compute block: ${aiQuery}`;
          prompt = `Generate code inside [${activeFile.name}] targeting serverless compute. Directives: ${aiQuery}`;
          break;
        case 'explain':
          displayUserMessage = "Explain compile schema execution bounds";
          prompt = `Explain the following matrix compute logic details inside [${activeFile.name}]:\n${activeFile.content}`;
          break;
        case 'critique':
          displayUserMessage = "Analyze memory optimization margins";
          prompt = `Analyze GPU scale performance and thread mapping metrics for:\n${activeFile.content}`;
          break;
        case 'fix':
          displayUserMessage = "Apply CUDA optimization blocks";
          prompt = `Optimize compiler threads and fix allocation syntax structures in:\n${activeFile.content}`;
          break;
      }
    }

    setAiMessages(prev => [...prev, { role: 'user', text: displayUserMessage }]);
    appendToTerminal(`[COGNITIVE] Dispatching context vectors to serverless AI core...`, 'info');
    
    const response = await callFastAPI(prompt);
    setAiLoading(false);

    if (response && !response.error) {
      const payloadText = response.text || 'Inference call evaluated cleanly.';
      if (actionType === 'fix' || actionType === 'generate') {
        handleCodeChange(activeFile.content + "\n\n" + payloadText);
        setAiQuery('');
        setAiMessages(prev => [...prev, { role: 'assistant', text: `Optimized dynamic block injected cleanly into canvas sheet [${activeFile.name}].` }]);
        appendToTerminal(`[COGNITIVE] Code modified inside [${activeFile.name}] successfully.`, 'info');
      } else {
        setAiMessages(prev => [...prev, { role: 'assistant', text: payloadText }]);
      }
    } else {
      setTimeout(() => {
        let mockedResponse = '';
        if (actionType === 'explain') {
          mockedResponse = `Evaluated target: \`${activeFile.name}\`.\nThis module orchestrates mixed-runtime compiler grids to partition tensors across your hot H100 GPU clusters seamlessly. Performance limits look highly streamlined.`;
        } else if (actionType === 'critique') {
          mockedResponse = `### LLVM Thread Compiler Critique\n* **Thread Layout:** Linear mapping prevents grid indexing bottlenecks.\n* **Physical GPU Bounds:** Thermals mapped optimally at ${liveGpuUsage > 60 ? 'high-performance profiles' : 'cool idle brackets'}.`;
        } else {
          mockedResponse = `Engine validated ML code segments cleanly. Direct compilation vectors computed and updated.`;
        }
        setAiMessages(prev => [...prev, { role: 'assistant', text: mockedResponse }]);
        appendToTerminal(`[AI-AGENT] Evaluated local optimization analysis cleanly.`, 'stdout');
      }, 500);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--spider-bg-dark)] text-[var(--spider-text)] font-sans select-none">
      
      <input type="file" ref={folderInputRef} onChange={handleFolderUploadChange} webkitdirectory="true" directory="true" className="hidden" />
      <input type="file" ref={filesInputRef} onChange={handleFilesUploadChange} multiple className="hidden" />

      {/* ================= HEADER BAR ================= */}
      <header className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0 z-30 relative bg-[var(--spider-bg-dark)]" style={{ borderColor: 'var(--spider-border)' }}>
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-1.5">
            <div className="w-5 h-5 flex items-center justify-center text-[var(--spider-accent)] shrink-0">
              <Activity size={18} className="animate-pulse" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">Spider Notebook</span>
            <span className="text-[9px] bg-[var(--spider-bg-element)] text-[var(--spider-text-dim)] px-1.5 py-0.5 rounded font-mono">v5.12</span>
          </div>
          
          <div className="hidden lg:flex items-center space-x-1 p-0.5 rounded-lg border bg-[var(--spider-bg-surface)]" style={{ borderColor: 'var(--spider-border)' }}>
            <button 
              onClick={() => setActiveTab('editor')}
              className={`px-3.5 py-1 text-xs font-semibold rounded-md transition-all ${activeTab === 'editor' ? 'bg-[var(--spider-bg-element)] text-white shadow-sm' : 'text-[var(--spider-text-dim)] hover:text-white'}`}
            >
              Workspace Studio
            </button>
            <button 
              onClick={() => setActiveTab('gpu')}
              className={`px-3.5 py-1 text-xs font-semibold rounded-md transition-all ${activeTab === 'gpu' ? 'bg-[var(--spider-bg-element)] text-white shadow-sm' : 'text-[var(--spider-text-dim)] hover:text-white'}`}
            >
              Cloud Hub Center
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Engine Status Tag */}
          <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1.5 border rounded-lg bg-[var(--spider-bg-surface)]/60" style={{ borderColor: 'var(--spider-border)' }}>
            <span className={`w-1.5 h-1.5 rounded-full ${wsStatus === 'Connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-[10px] text-[var(--spider-text-dim)] font-mono font-medium">{wsStatus}</span>
          </div>
          
          <button 
            onClick={connectWebSocket}
            className={`hidden sm:inline-block px-3 py-1.5 text-[11px] font-bold tracking-wide transition-all rounded-lg border ${
              wsStatus === 'Connected' 
                ? 'bg-[var(--spider-bg-dark)] text-[var(--spider-text-dim)]' 
                : 'bg-[var(--spider-bg-element)] text-white'
            }`}
            style={{ borderColor: 'var(--spider-border)' }}
          >
            {wsStatus === 'Connected' ? 'Kill Hub' : 'Link Hub'}
          </button>

          {/* Core Execute Action */}
          <button 
            onClick={handleRunEngine} 
            className="bg-white hover:bg-zinc-100 text-zinc-950 font-extrabold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm text-xs min-h-[36px] active:scale-95 touch-manipulation"
          >
            <Play size={13} fill="currentColor" /> <span className="hidden xs:inline">Run Code</span>
          </button>
          
          <button onClick={() => setShowSettingsModal(true)} className="p-2 border rounded-lg hover:bg-[var(--spider-bg-element)] transition-all flex items-center justify-center min-h-[36px] min-w-[36px] touch-manipulation" style={{ borderColor: 'var(--spider-border)', color: 'var(--spider-text-dim)' }}>
            <Settings size={15} />
          </button>
        </div>
      </header>

      {/* ================= DESKTOP ENGINE SUB BAR ================= */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2 border-b bg-[var(--spider-bg-surface)] select-none" style={{ borderColor: 'var(--spider-border)' }}>
        <div className="flex items-center space-x-1 p-0.5 rounded-lg border bg-[var(--spider-bg-dark)] w-full" style={{ borderColor: 'var(--spider-border)' }}>
          <button 
            onClick={() => setActiveTab('editor')}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'editor' ? 'bg-[var(--spider-bg-element)] text-white' : 'text-[var(--spider-text-dim)]'}`}
          >
            Code Studio
          </button>
          <button 
            onClick={() => setActiveTab('gpu')}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'gpu' ? 'bg-[var(--spider-bg-element)] text-white' : 'text-[var(--spider-text-dim)]'}`}
          >
            Cloud Clusters
          </button>
        </div>
      </div>

      {/* ================= PRIMARY APP WORKSPACE ================= */}
      <div className="flex-1 min-h-0 flex relative bg-[var(--spider-bg-dark)]">
        {activeTab === 'editor' ? (
          <>
            {/* --- DESKTOP LEFT SIDEBAR: FILE EXPLORER --- */}
            <aside className="hidden lg:flex lg:flex-col lg:relative lg:w-64 lg:p-4 lg:border-r lg:flex-shrink-0 lg:h-full bg-[var(--spider-bg-surface)]" style={{ borderColor: 'var(--spider-border)' }}>
              <SpiderFileExplorer 
                virtualFiles={virtualFiles}
                activeFileId={activeFileId}
                handleFileClick={handleFileClick}
                handleCreateNode={handleCreateNode}
                handleDeleteNode={handleDeleteNode}
                handleOpenProject={handleOpenProject}
                handleOpenFileClick={handleOpenFileClick}
                handleNewProject={handleNewProject}
              />
            </aside>

            {/* --- CORE WORKSPACE SWITCHER AREA --- */}
            <main className="flex-1 flex flex-col min-w-0 bg-[var(--spider-bg-dark)] relative">
              
              {/* Desktop Multi-Tabs header wrapper */}
              <div className="hidden lg:flex border-b flex-shrink-0 items-center justify-between overflow-x-auto select-none bg-[var(--spider-bg-surface)]" style={{ borderColor: 'var(--spider-border)' }}>
                <div className="flex">
                  {openFiles.map(filePath => {
                    const node = virtualFiles.find(f => f.path === filePath);
                    const name = node ? node.name : filePath.split('/').pop();
                    const isActive = activeFileId === filePath;

                    return (
                      <button
                        key={filePath}
                        onClick={() => handleFileClick({ path: filePath, type: 'file' })}
                        className={`flex items-center space-x-2 py-2.5 px-4 border-r flex-shrink-0 min-w-0 transition-all text-xs font-mono font-medium relative ${isActive ? 'text-white' : 'text-[var(--spider-text-dim)] hover:text-zinc-300'}`}
                        style={{ 
                          borderColor: 'var(--spider-border)',
                          backgroundColor: isActive ? 'var(--spider-bg-dark)' : 'transparent',
                          boxShadow: isActive ? 'inset 0 -2px 0 0 var(--spider-accent)' : 'none'
                        }}
                      >
                        <FileCode size={13} />
                        <span className="truncate max-w-[110px] tracking-wide">{name}</span>
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            const index = openFiles.indexOf(filePath);
                            const nextOpen = openFiles.filter(p => p !== filePath);
                            setOpenFiles(nextOpen);
                            if (activeFileId === filePath) {
                              setActiveFileId(nextOpen[index] || nextOpen[index - 1] || null);
                            }
                          }}
                          className="hover:text-red-400 font-bold ml-1.5 text-[11px] text-[var(--spider-text-dark)]"
                        >
                          ×
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ================= DESKTOP SIDE-BY-SIDE / MOBILE TABBED VIEWS ================= */}
              <div className="flex-1 flex flex-col min-h-0">
                
                {/* 1. FILE TREE (MOBILE TAB VIEW ONLY) */}
                <div className={`lg:hidden flex-1 overflow-y-auto p-4 bg-[var(--spider-bg-surface)] ${mobileSubTab === 'explorer' ? 'block' : 'hidden'}`}>
                  <SpiderFileExplorer 
                    virtualFiles={virtualFiles}
                    activeFileId={activeFileId}
                    handleFileClick={handleFileClick}
                    handleCreateNode={handleCreateNode}
                    handleDeleteNode={handleDeleteNode}
                    handleOpenProject={handleOpenProject}
                    handleOpenFileClick={handleOpenFileClick}
                    handleNewProject={handleNewProject}
                  />
                </div>

                {/* 2. LIVE CODE CANVAS EDITOR PANES */}
                <div className={`flex flex-col min-h-0 relative bg-[var(--spider-bg-dark)]/40 ${mobileSubTab === 'editor' ? 'flex' : 'hidden'} lg:flex`}>
                  <div className="flex-shrink-0 px-4 py-2 border-b flex justify-between items-center bg-[var(--spider-bg-surface)]" style={{ borderColor: 'var(--spider-border)' }}>
                    <span className="text-[10px] font-bold font-mono text-[var(--spider-text-dark)] tracking-wider">EDIT CANVAS</span>
                    <button onClick={handleSave} className="text-[10px] text-[var(--spider-text-dim)] hover:text-white flex items-center gap-1.5 touch-manipulation">
                      <Download size={11} /> Save Script
                    </button>
                  </div>
                  
                  <div className="flex-1 min-h-0 relative">
                    {activeFile ? (
                      <div className="absolute inset-0 overflow-auto">
                        <div className="relative p-4">
                          <pre 
                            className="font-mono text-[14px] leading-relaxed whitespace-pre-wrap break-all text-[var(--spider-text)] pointer-events-none"
                            style={{ fontFamily: '"JetBrains Mono", Menlo, Consolas, monospace' }}
                            dangerouslySetInnerHTML={{ __html: highlightCode(activeFile.content, activeFile.name) + '\n\n' }}
                          />
                          <textarea
                            ref={textareaRef}
                            value={activeFile.content}
                            onChange={(e) => handleCodeChange(e.target.value)}
                            className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white p-4 font-mono text-[16px] lg:text-[14px] leading-relaxed whitespace-pre-wrap break-all border border-transparent outline-none resize-none focus:ring-0 focus:border-transparent select-text"
                            style={{ 
                              fontFamily: '"JetBrains Mono", Menlo, Consolas, monospace',
                              WebkitTextFillColor: 'transparent'
                            }}
                            placeholder="// Enter your CUDA machine learning pipeline parameters here..."
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full select-none text-[var(--spider-text-dim)] text-center p-6 space-y-3">
                        <Code size={28} className="text-[var(--spider-text-dark)]" />
                        <p className="text-xs font-semibold">Select a tracked module from exploration tree to edit.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. CONSOLE FEED (MOBILE TAB VIEW ONLY) */}
                <div className={`lg:hidden flex-1 flex flex-col min-h-0 bg-black/40 ${mobileSubTab === 'console' ? 'flex' : 'hidden'}`}>
                  <div className="flex-shrink-0 px-4 py-2 border-b flex justify-between items-center bg-[var(--spider-bg-surface)]" style={{ borderColor: 'var(--spider-border)' }}>
                    <span className="text-[10px] font-bold text-[var(--spider-text-dim)] flex items-center gap-1.5 font-mono">
                      <Terminal size={12} /> CONSOLE STDOUT
                    </span>
                    <button onClick={() => setTerminalOutput([])} className="text-[9px] uppercase font-bold text-red-400 touch-manipulation">Clear Console</button>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed select-text space-y-1 bg-black/80">
                    {terminalOutput.map((line, index) => (
                      <p key={index} dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />
                    ))}
                  </div>
                </div>

                {/* 5. SPIDER AI CHAT (MOBILE TAB VIEW ONLY) */}
                <div className={`lg:hidden flex-1 flex flex-col min-h-0 bg-[var(--spider-bg-surface)] ${mobileSubTab === 'ai' ? 'flex' : 'hidden'}`}>
                  <div className="p-3 border-b flex justify-between items-center bg-[var(--spider-bg-dark)]/40" style={{ borderColor: 'var(--spider-border)' }}>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5"><Sparkles size={14} className="text-amber-400" /> Spider Assistant AI</span>
                    {aiLoading && <span className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--spider-accent)' }}></span>}
                  </div>
                  
                  <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {aiMessages.map((msg, index) => (
                      <div key={index} className={`flex flex-col space-y-1 p-3 rounded-xl max-w-[90%] border ${msg.role === 'user' ? 'text-white ml-auto bg-[var(--spider-bg-element)]' : 'text-[var(--spider-text-dim)] bg-[var(--spider-bg-dark)]/50'}`} style={{ borderColor: 'var(--spider-border)' }}>
                        <span className="text-[9px] font-bold text-[var(--spider-text-dark)] uppercase">{msg.role === 'user' ? 'Client Request' : 'Spider AI'}</span>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap select-text">{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t space-y-3 bg-[var(--spider-bg-dark)]/20" style={{ borderColor: 'var(--spider-border)' }}>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Request neural optimization block..." 
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        className="flex-grow text-white placeholder-zinc-500 border rounded-lg py-2.5 px-3 text-xs outline-none bg-[var(--spider-bg-dark)]"
                        style={{ borderColor: 'var(--spider-border)' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && aiQuery.trim()) {
                            handleAiAction('custom', aiQuery);
                          }
                        }}
                      />
                      <button 
                        onClick={() => handleAiAction('custom', aiQuery)} 
                        className="bg-white hover:bg-zinc-100 text-zinc-950 font-bold px-3 py-1 text-xs rounded-lg active:scale-95 transition-all"
                      >
                        Ask
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <button onClick={() => handleAiAction('generate')} className="p-2 border rounded-lg bg-[var(--spider-bg-dark)] text-zinc-300">✨ Generate code</button>
                      <button onClick={() => handleAiAction('explain')} className="p-2 border rounded-lg bg-[var(--spider-bg-dark)] text-zinc-300">💡 Explain dynamic</button>
                      <button onClick={() => handleAiAction('critique')} className="p-2 border rounded-lg bg-[var(--spider-bg-dark)] text-zinc-300">📐 Critique map</button>
                      <button onClick={() => handleAiAction('fix')} className="p-2 border rounded-lg bg-[var(--spider-bg-dark)] text-zinc-300">🩹 Optimizations</button>
                    </div>
                  </div>
                </div>

              </div>

              {/* --- DESKTOP DRAWER FOOTER PANEL: CONSOLE FEED --- */}
              <div className="hidden lg:flex lg:h-56 lg:flex-col lg:bg-[var(--spider-bg-dark)] lg:border-t" style={{ borderColor: 'var(--spider-border)' }}>
                <div className="flex select-none justify-between items-center px-4 py-2 border-b bg-[var(--spider-bg-surface)]/40" style={{ borderColor: 'var(--spider-border)' }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider flex items-center text-[var(--spider-text-dim)] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full mr-2 bg-[var(--spider-accent)]"></span>
                    STDOUT COMPILER STREAMS
                  </span>
                  <button onClick={() => setTerminalOutput([])} className="text-[9px] uppercase font-bold font-mono px-2 py-0.5 rounded border text-[var(--spider-text-dim)] hover:text-white bg-[var(--spider-bg-dark)]" style={{ borderColor: 'var(--spider-border)' }}>
                    Clear Terminal
                  </button>
                </div>
                <div className="flex-grow p-4 overflow-y-auto font-mono text-[11px] leading-relaxed select-text space-y-1 bg-black/30">
                  {terminalOutput.map((line, index) => (
                    <p key={index} dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />
                  ))}
                </div>
              </div>

            </main>

            {/* --- DESKTOP RIGHT SIDEBAR: SPIDER AI --- */}
            <aside className="hidden lg:flex lg:flex-col lg:relative lg:w-80 lg:border-l lg:flex-shrink-0 lg:h-full lg:overflow-hidden bg-[var(--spider-bg-surface)]" style={{ borderColor: 'var(--spider-border)' }}>
              <div className="p-4 border-b flex justify-between items-center bg-[var(--spider-bg-dark)]/10" style={{ borderColor: 'var(--spider-border)' }}>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Sparkles size={14} className="text-amber-400" /> Spider Cognitive Assistant
                </h3>
                {aiLoading && <span className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--spider-accent)' }}></span>}
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                {aiMessages.map((msg, index) => (
                  <div key={index} className={`flex flex-col space-y-1 p-3 rounded-xl max-w-[90%] border ${msg.role === 'user' ? 'text-white ml-auto bg-[var(--spider-bg-element)]' : 'text-[var(--spider-text-dim)] bg-[var(--spider-bg-dark)]/50'}`} style={{ borderColor: 'var(--spider-border)' }}>
                    <span className="text-[9px] font-bold text-[var(--spider-text-dark)] uppercase">{msg.role === 'user' ? 'User Kernel Instruction' : 'AI Assistant Agent'}</span>
                    <p className="leading-relaxed whitespace-pre-wrap select-text">{msg.text}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t space-y-3 bg-[var(--spider-bg-dark)]/10" style={{ borderColor: 'var(--spider-border)' }}>
                <div className="relative flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Optimize compiled threads..." 
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    className="w-full text-white placeholder-zinc-500 border rounded-lg py-2.5 px-3 text-xs outline-none bg-[var(--spider-bg-dark)]"
                    style={{ borderColor: 'var(--spider-border)' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && aiQuery.trim()) {
                        handleAiAction('custom', aiQuery);
                      }
                    }}
                  />
                  <button 
                    onClick={() => handleAiAction('custom', aiQuery)} 
                    className="bg-white hover:bg-zinc-100 text-zinc-950 font-bold px-3 py-1 text-xs rounded-lg active:scale-95"
                  >
                    Ask
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
                  <button onClick={() => handleAiAction('generate')} className="p-2 border rounded-lg flex items-center justify-center gap-1.5 transition-colors bg-[var(--spider-bg-dark)] hover:bg-[var(--spider-bg-element)] text-[var(--spider-text)]" style={{ borderColor: 'var(--spider-border)' }}>
                    <span>✨ Code gen</span>
                  </button>
                  <button onClick={() => handleAiAction('explain')} className="p-2 border rounded-lg flex items-center justify-center gap-1.5 transition-colors bg-[var(--spider-bg-dark)] hover:bg-[var(--spider-bg-element)] text-[var(--spider-text)]" style={{ borderColor: 'var(--spider-border)' }}>
                    <span>💡 Explain</span>
                  </button>
                  <button onClick={() => handleAiAction('critique')} className="p-2 border rounded-lg flex items-center justify-center gap-1.5 transition-colors bg-[var(--spider-bg-dark)] hover:bg-[var(--spider-bg-element)] text-[var(--spider-text)]" style={{ borderColor: 'var(--spider-border)' }}>
                    <span>📐 Critique</span>
                  </button>
                  <button onClick={() => handleAiAction('fix')} className="p-2 border rounded-lg flex items-center justify-center gap-1.5 transition-colors bg-[var(--spider-bg-dark)] hover:bg-[var(--spider-bg-element)] text-[var(--spider-text)]" style={{ borderColor: 'var(--spider-border)' }}>
                    <span>🩹 Optimizations</span>
                  </button>
                </div>
              </div>
            </aside>
          </>
        ) : (
          /* --- GPU CLOUD CONSOLE DASHBOARD --- */
          <div className="flex-grow p-4 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6 pb-20 lg:pb-6">
            <SpiderGPUClusterCenter 
              activeCluster={activeCluster}
              onSelectCluster={setActiveCluster}
              onDeployToCluster={handleDeployToCluster}
            />
          </div>
        )}
      </div>

      {/* ================= MOBILE BOTTOM NAVIGATION BAR ================= */}
      {activeTab === 'editor' && (
        <nav className="lg:hidden flex items-center justify-around h-16 border-t bg-[var(--spider-bg-surface)] shrink-0 z-20 select-none pb-safe" style={{ borderColor: 'var(--spider-border)' }}>
          <button 
            onClick={() => setMobileSubTab('explorer')}
            className={`flex flex-col items-center justify-center flex-grow py-1 gap-1.5 text-[10px] font-bold tracking-wide transition-all ${mobileSubTab === 'explorer' ? 'text-[var(--spider-accent)] scale-105' : 'text-[var(--spider-text-dim)] hover:text-white'}`}
          >
            <Folder size={16} />
            <span>Files</span>
          </button>
          <button 
            onClick={() => setMobileSubTab('editor')}
            className={`flex flex-col items-center justify-center flex-grow py-1 gap-1.5 text-[10px] font-bold tracking-wide transition-all ${mobileSubTab === 'editor' ? 'text-[var(--spider-accent)] scale-105' : 'text-[var(--spider-text-dim)] hover:text-white'}`}
          >
            <Code size={16} />
            <span>Code</span>
          </button>
          <button 
            onClick={() => setMobileSubTab('console')}
            className={`flex flex-col items-center justify-center flex-grow py-1 gap-1.5 text-[10px] font-bold tracking-wide transition-all ${mobileSubTab === 'console' ? 'text-[var(--spider-accent)] scale-105' : 'text-[var(--spider-text-dim)] hover:text-white'}`}
          >
            <Terminal size={16} />
            <span>Stdout</span>
          </button>
          <button 
            onClick={() => setMobileSubTab('ai')}
            className={`flex flex-col items-center justify-center flex-grow py-1 gap-1.5 text-[10px] font-bold tracking-wide transition-all ${mobileSubTab === 'ai' ? 'text-[var(--spider-accent)] scale-105' : 'text-[var(--spider-text-dim)] hover:text-white'}`}
          >
            <MessageSquare size={16} />
            <span>AI Assist</span>
          </button>
        </nav>
      )}

      {/* ================= TELEMETRY APP FOOTER BAR ================= */}
      <footer className="border-t px-4 py-2 flex justify-between items-center text-[10px] font-sans flex-shrink-0 select-none bg-[var(--spider-bg-dark)] text-[var(--spider-text-dim)] overflow-x-auto whitespace-nowrap gap-4" style={{ borderColor: 'var(--spider-border)' }}>
        <div className="flex items-center space-x-3.5 shrink-0">
          <span className="flex items-center space-x-1.5 text-[var(--spider-text)] font-semibold">
            <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            <span>main/mesh-grid</span>
          </span>
          <span className="text-[var(--spider-text-dark)]">|</span>
          <span className="flex items-center">
            <span className="text-[var(--spider-text-dark)] mr-1">PWD:</span>
            <span className="font-mono bg-[var(--spider-bg-element)]/60 text-[var(--spider-accent)] px-1.5 py-0.5 rounded text-[10px]">{activeFolder}</span>
          </span>
          <span className="text-[var(--spider-text-dark)] hidden md:inline">|</span>
          <span className="hidden md:flex items-center space-x-1.5">
            <span className="text-[var(--spider-text-dark)]">Latency:</span>
            <span className="font-mono font-bold text-[var(--spider-success)]">{liveNetLatency}ms</span>
          </span>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <span className="flex items-center space-x-1.5">
            <span className="text-[var(--spider-text-dark)] font-medium">GPU Load:</span>
            <span className="font-mono text-xs font-bold text-white">{liveGpuUsage}%</span>
          </span>
          <span className="text-[var(--spider-text-dark)]">|</span>
          <span className="truncate max-w-[150px] font-mono text-[var(--spider-text-dim)]">{activeFileId || 'No source active'}</span>
        </div>
      </footer>

      {/* ================= CONFIGURATIONS MODAL (ADAPTIVE BOTTOM SHEET ON MOBILE) ================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end lg:items-center justify-center z-[100] p-0 lg:p-4 backdrop-blur-sm transition-all duration-200">
          <div className="w-full lg:max-w-md p-6 font-sans text-xs rounded-t-2xl lg:rounded-2xl shadow-xl space-y-6 bg-[var(--spider-bg-surface)] border-t lg:border" style={{ borderColor: 'var(--spider-border)' }}>
            <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: 'var(--spider-border)' }}>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Settings size={14} /> Pipeline Configurations
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-xl text-[var(--spider-text-dim)] hover:text-white p-1">×</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[var(--spider-text-dim)] font-bold uppercase tracking-wide text-[9px]">Workspace Scaling Factor</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0.8"
                    max="1.2"
                    step="0.05"
                    value={appScale}
                    onChange={(e) => setAppScale(parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-white"
                  />
                  <span className="text-zinc-200 font-mono font-bold min-w-[35px] text-right">{Math.round(appScale * 100)}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[var(--spider-text-dim)] font-bold uppercase tracking-wide text-[9px]">Palette Studio Preset Themes</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(themeMap).map(key => (
                    <button
                      key={key}
                      onClick={() => setCurrentTheme(key)}
                      className={`p-2.5 border rounded-lg text-left flex items-center space-x-1.5 transition-all capitalize min-h-[40px] touch-manipulation ${currentTheme === key ? 'border-white text-white shadow-sm' : 'text-[var(--spider-text-dim)]'}`}
                      style={{ 
                        borderColor: currentTheme === key ? 'var(--spider-accent, #fff)' : 'var(--spider-border)',
                        backgroundColor: 'var(--spider-bg-dark)'
                      }}
                    >
                      <span 
                        className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" 
                        style={{ backgroundColor: (themeMap[key] || themeMap.zinc)['--spider-accent'] }}
                      />
                      <span className="text-[10px] font-bold truncate">{key} Theme</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t text-right" style={{ borderColor: 'var(--spider-border)' }}>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="bg-white hover:bg-zinc-100 text-zinc-950 font-bold px-5 py-3 w-full lg:w-auto rounded-lg transition-all min-h-[44px] touch-manipulation"
              >
                Apply Parameters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CUSTOM DESTRUCTIVE DELETE ACTION SHEET ================= */}
      {deleteConfirmPath && (
        <div className="fixed inset-0 bg-black/85 flex items-end lg:items-center justify-center z-[120] p-0 lg:p-4 backdrop-blur-sm">
          <div className="bg-[var(--spider-bg-surface)] border-t lg:border w-full lg:max-w-sm p-5 font-sans rounded-t-2xl lg:rounded-2xl shadow-2xl space-y-4" style={{ borderColor: 'var(--spider-border)' }}>
            <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: 'var(--spider-border)' }}>
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert size={14} /> Destructive Operation
              </h3>
              <button onClick={() => setDeleteConfirmPath(null)} className="text-sm text-[var(--spider-text-dim)] hover:text-white p-1">×</button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-[var(--spider-text)] font-semibold">
                Confirm node removal path:
              </p>
              <div className="p-3 rounded-lg bg-[var(--spider-bg-dark)] border" style={{ borderColor: 'var(--spider-border)' }}>
                <span className="font-mono text-xs text-red-400 break-all block leading-tight">
                  {deleteConfirmPath}
                </span>
              </div>
              <p className="text-[10px] text-[var(--spider-text-dim)] leading-relaxed">
                Evaluating deletion vectors completely purges the selected code path directories and nested elements forever.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-1.5">
              <button
                onClick={() => setDeleteConfirmPath(null)}
                className="flex-1 bg-[var(--spider-bg-element)] text-[var(--spider-text)] px-4 py-3 rounded-lg text-xs font-semibold border transition-colors min-h-[44px] touch-manipulation"
                style={{ borderColor: 'var(--spider-border)' }}
              >
                Retreat
              </button>
              <button
                onClick={confirmDeleteNode}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg text-xs font-bold shadow-md active:scale-95 transition-all min-h-[44px] touch-manipulation"
              >
                Yes, Purge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= INFO DIALOG SHEET ================= */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-end lg:items-center justify-center z-[110] p-0 lg:p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border-t lg:border border-zinc-850 w-full lg:max-w-lg p-5 font-sans rounded-t-2xl lg:rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle size={14} className="text-[var(--spider-accent)]" /> {dialogTitle}
              </h3>
              <button onClick={() => setDialogOpen(false)} className="text-lg text-zinc-400 hover:text-white p-1">×</button>
            </div>
            <div className="text-zinc-300 text-xs leading-relaxed max-h-60 overflow-y-auto pr-1 whitespace-pre-wrap select-text">
              {dialogMessage}
            </div>
            <div className="text-right">
              <button 
                onClick={() => setDialogOpen(false)} 
                className="bg-zinc-100 hover:bg-white text-zinc-950 font-bold px-5 py-3 w-full lg:w-auto rounded-lg text-xs min-h-[44px] touch-manipulation"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}