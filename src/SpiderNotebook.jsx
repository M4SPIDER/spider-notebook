import React, { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_THEME = {
  '--spider-dark': '#0a1d1d',
  '--spider-med': '#113a3a',
  '--spider-light': '#1e5f5f',
  '--spider-neon-blue': '#00ffff',
  '--spider-glow': 'rgba(0, 255, 255, 0.5)',
  '--spider-text': '#e0ffff',
  '--spider-text-dim': '#99cccc',
  '--shadow-neon-blue': '0 0 15px 5px rgba(0, 255, 255, 0.25)',
};

const DEFAULT_FILES = [
  {
    name: 'main.sp',
    kind: 'file',
    content: `spy {
  import python;
  import cpp;

  fn main() {
    print("Welcome to Spider Notebook");
    python.run("print('Python linked')");
    cpp.run("std::cout << \\"C++ linked\\" << std::endl;");
  }
}`,
  },
  {
    name: 'router.py',
    kind: 'file',
    content: `def build_route(name: str) -> dict:
    return {
        "name": name,
        "status": "ready",
    }
`,
  },
  {
    name: 'engine.cpp',
    kind: 'file',
    content: `#include <iostream>

int main() {
    std::cout << "Spider engine online" << std::endl;
    return 0;
}
`,
  },
];

const INITIAL_TERMINAL_OUTPUT = [
  'Welcome to SpiderNoteBook!',
  'Load a project or create a new file to get started.',
];
const NOTEBOOK_DB_NAME = 'SpiderAIDB';
const NOTEBOOK_DB_VERSION = 1;
const NOTEBOOK_STORE_NAME = 'notebookState';
const NOTEBOOK_STATE_KEY = 'main';
const NOTEBOOK_WS_URL = 'wss://spy.m4spider.com/';

const openNotebookDB = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(NOTEBOOK_DB_NAME, NOTEBOOK_DB_VERSION);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains('chats')) db.createObjectStore('chats', { keyPath: 'id' });
    if (!db.objectStoreNames.contains(NOTEBOOK_STORE_NAME)) db.createObjectStore(NOTEBOOK_STORE_NAME, { keyPath: 'id' });
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const loadNotebookState = async () => {
  const db = await openNotebookDB();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(NOTEBOOK_STORE_NAME, 'readonly');
    const store = tx.objectStore(NOTEBOOK_STORE_NAME);
    const req = store.get(NOTEBOOK_STATE_KEY);
    req.onsuccess = () => resolve(req.result?.value || null);
    req.onerror = () => reject(req.error);
  });
};

const saveNotebookState = async (value) => {
  const db = await openNotebookDB();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(NOTEBOOK_STORE_NAME, 'readwrite');
    tx.objectStore(NOTEBOOK_STORE_NAME).put({ id: NOTEBOOK_STATE_KEY, value, updatedAt: Date.now() });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

const SpiderLogo = () => (
  <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 4, 15 7, 15 15, 12 18, 9 15, 9 7" fill="rgba(0, 255, 255, 0.15)" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3.5" fill="currentColor" fillOpacity="0.1" />
    <path d="M12 4 L 12 18" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
    <path d="M9 7 L 3 1 L 1 4" />
    <path d="M9 10 L 2 5 L 0 9" />
    <path d="M15 7 L 21 1 L 23 4" />
    <path d="M15 10 L 22 5 L 24 9" />
    <path d="M9 15 L 3 23 L 1 20" />
    <path d="M9 12 L 2 17 L 0 13" />
    <path d="M15 15 L 21 23 L 23 20" />
    <path d="M15 12 L 22 17 L 24 13" />
    <circle cx="10.5" cy="5.5" r="0.5" fill="currentColor" />
    <circle cx="13.5" cy="5.5" r="0.5" fill="currentColor" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3 1.343 3 3v3H9v-3c0-1.657 1.343-3 3-3zm0 0V8a3 3 0 016 0v3m-6 0H6m12 0h1a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2h1" />
  </svg>
);

const TerminalIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const LightningIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const SpiderNotebook = () => {
  const [projectFiles, setProjectFiles] = useState(DEFAULT_FILES.map(({ name, kind }) => ({ name, kind })));
  const [fileContents, setFileContents] = useState(() => new Map(DEFAULT_FILES.map(file => [file.name, file.content])));
  const [openFiles, setOpenFiles] = useState(['main.sp']);
  const [activeFileId, setActiveFileId] = useState('main.sp');
  const [terminalOutput, setTerminalOutput] = useState(INITIAL_TERMINAL_OUTPUT);
  const [activeTerminalTab, setActiveTerminalTab] = useState('terminal');
  const [aiQuery, setAiQuery] = useState('');
  const [modalInfo, setModalInfo] = useState(null);
  const [isAiPanelVisible, setIsAiPanelVisible] = useState(false);
  const [isTerminalVisible, setIsTerminalVisible] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState('editor');
  const [wsStatus, setWsStatus] = useState('Disconnected');
  const [notebookReady, setNotebookReady] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const fileInputRef = useRef(null);
  const singleFileInputRef = useRef(null);
  const wsRef = useRef(null);

  const activeCode = activeFileId ? (fileContents.get(activeFileId) || '') : '';

  const showModal = (title, text) => setModalInfo({ title, text });
  const hideModal = () => setModalInfo(null);

  const handleFileClick = (file) => {
    if (!file?.name) return;
    setActiveFileId(file.name);
    setOpenFiles(prev => (prev.includes(file.name) ? prev : [...prev, file.name]));
  };

  const handleCloseTab = (event, fileName) => {
    event.stopPropagation();
    setOpenFiles(prev => {
      const next = prev.filter(name => name !== fileName);
      if (activeFileId === fileName) {
        setActiveFileId(next[0] || null);
      }
      return next;
    });
  };

  const handleCodeChange = (event) => {
    const value = event.target.value;
    if (!activeFileId) return;
    setFileContents(prev => {
      const next = new Map(prev);
      next.set(activeFileId, value);
      return next;
    });
  };

  const appendTerminal = (line) => setTerminalOutput(prev => [...prev, String(line)]);

  useEffect(() => {
    let mounted = true;
    loadNotebookState()
      .then((saved) => {
        if (!mounted) return;
        if (saved?.projectFiles?.length) {
          setProjectFiles(saved.projectFiles);
          setFileContents(new Map(saved.fileEntries || []));
          setOpenFiles(saved.openFiles?.length ? saved.openFiles : [saved.projectFiles[0]?.name].filter(Boolean));
          setActiveFileId(saved.activeFileId || saved.projectFiles[0]?.name || null);
          setTerminalOutput(saved.terminalOutput?.length ? saved.terminalOutput : INITIAL_TERMINAL_OUTPUT);
          setActiveTerminalTab(saved.activeTerminalTab || 'terminal');
        }
        setNotebookReady(true);
      })
      .catch(() => setNotebookReady(true));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!notebookReady) return;
    const payload = {
      projectFiles,
      fileEntries: Array.from(fileContents.entries()),
      openFiles,
      activeFileId,
      terminalOutput: terminalOutput.slice(-120),
      activeTerminalTab,
    };
    saveNotebookState(payload).catch(() => {});
  }, [projectFiles, fileContents, openFiles, activeFileId, terminalOutput, activeTerminalTab, notebookReady]);

  useEffect(() => () => {
    if (wsRef.current) {
      try { wsRef.current.close(1000, 'Notebook cleanup'); } catch {}
    }
  }, []);

  const callNotebookAI = async (userPrompt, systemInstruction = '') => {
    const response = await fetch('/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: systemInstruction ? `${systemInstruction}\n\n${userPrompt}` : userPrompt,
        mode: 'chat',
      }),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || 'Notebook AI request failed');
    }
    return text;
  };

  const handleSave = () => {
    if (!activeFileId) {
      showModal('No File', 'Open a file first.');
      return;
    }
    appendTerminal(`Saved ${activeFileId}`);
    showModal('Saved', `${activeFileId} saved successfully.`);
    setShowSaveAlert(true);
    setTimeout(() => setShowSaveAlert(false), 1800);
  };

  const handleWsConnect = (url = NOTEBOOK_WS_URL) => {
    if (wsRef.current && wsStatus === 'Connected') {
      wsRef.current.close(1000, 'User initiated disconnect');
      return;
    }
    if (wsStatus === 'Connecting') return;
    setWsStatus('Connecting');
    appendTerminal('Spy Engine: Attempting connection...');
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => {
        setWsStatus('Connected');
        appendTerminal('Spy Engine: Connected');
        try {
          ws.send(JSON.stringify({ type: 'connect_note', message: 'Hello, Spider Node Book!' }));
        } catch {}
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data?.type || 'stdout';
          const message = String(data?.message || data?.file || event.data || '').trim();
          if (type === 'run_started') appendTerminal(`Running ${message}`);
          else if (type === 'error') appendTerminal(`Execution Error: ${message}`);
          else if (message) appendTerminal(message);
        } catch {
          appendTerminal(String(event.data || 'Raw websocket message'));
        }
      };
      ws.onclose = () => {
        setWsStatus('Disconnected');
        wsRef.current = null;
        appendTerminal('Spy Engine: Disconnected');
      };
      ws.onerror = () => {
        setWsStatus('Error');
        appendTerminal('Spy Engine: Error');
      };
    } catch (error) {
      setWsStatus('Error');
      appendTerminal(`Spy Engine: Connection failed (${error.message})`);
    }
  };

  const handleRunEngine = () => {
    if (!activeFileId) {
      showModal('No File', 'Open a file first.');
      return;
    }
    const content = fileContents.get(activeFileId);
    setActiveTerminalTab('terminal');
    if (wsStatus !== 'Connected' || !wsRef.current) {
      showModal('WebSocket Error', 'Connect Spy Engine first.');
      return;
    }
    if (!content || !content.trim()) {
      showModal('WebSocket Error', 'Cannot send an empty file.');
      return;
    }
    try {
      wsRef.current.send(content);
      appendTerminal(`Sent ${activeFileId} to Spy Engine`);
    } catch (error) {
      appendTerminal(`WebSocket Send Failed: ${error.message}`);
      showModal('WS Send Error', error.message);
    }
  };

  const handleOpenProject = () => {
    fileInputRef.current?.click();
  };

  const handleOpenFileClick = () => {
    singleFileInputRef.current?.click();
  };

  const handleNewProject = () => {
    const name = `new_project_${Date.now().toString(36)}.sp`;
    setProjectFiles(prev => [...prev, { name, kind: 'file' }]);
    setFileContents(prev => {
      const next = new Map(prev);
      next.set(name, 'spy {\n  fn main() {\n    print("New Spider project");\n  }\n}');
      return next;
    });
    setOpenFiles(prev => [...prev, name]);
    setActiveFileId(name);
    appendTerminal(`Created ${name}`);
  };

  const getCurrentCode = () => {
    if (!activeFileId) {
      showModal('No File', 'Open file.');
      return null;
    }
    const code = fileContents.get(activeFileId);
    if (typeof code === 'undefined' || code.trim() === '') {
      showModal('Empty File', 'No code.');
      return null;
    }
    return code;
  };

  const handleGenerateCode = () => {
    if (!activeFileId) {
      showModal('No File', 'Open file.');
      return;
    }
    if (!aiQuery.trim()) {
      showModal('Empty Prompt', 'Enter prompt in AI input area.');
      return;
    }
    const code = getCurrentCode();
    if (!code) return;
    callNotebookAI(
      `Generate only raw code for the existing open file ${activeFileId}. Current code:\n\n${code}\n\nInstruction:\n${aiQuery}`,
      'Act as Spider Notebook coding AI. Return only code.'
    ).then((generatedCode) => {
      setFileContents(prev => {
        const next = new Map(prev);
        next.set(activeFileId, generatedCode.trim());
        return next;
      });
      appendTerminal(`AI generated code for ${activeFileId}`);
      setAiQuery('');
    }).catch((error) => showModal('Notebook AI Error', error.message));
  };

  const handleExplainCode = () => {
    const code = getCurrentCode();
    if (!code) return;
    callNotebookAI(
      `Explain the following code from file ${activeFileId}:\n\`\`\`\n${code}\n\`\`\``,
      'Provide a detailed, beginner-friendly explanation of the provided code.'
    ).then((text) => showModal('AI Explanation', text)).catch((error) => showModal('Notebook AI Error', error.message));
  };

  const handleCritiqueCode = () => {
    const code = getCurrentCode();
    if (!code) return;
    callNotebookAI(
      `Critique the following code from file ${activeFileId}:\n\`\`\`\n${code}\n\`\`\``,
      'Act as a senior software architect. Provide a constructive critique focusing on efficiency, readability, and security.'
    ).then((text) => showModal('AI Critique', text)).catch((error) => showModal('Notebook AI Error', error.message));
  };

  const handleFixErrors = () => {
    const code = getCurrentCode();
    if (!code) return;
    callNotebookAI(
      `Fix all obvious errors in the following file and return only corrected code.\nFile: ${activeFileId}\n\`\`\`\n${code}\n\`\`\``,
      'Return only the raw corrected code.'
    ).then((fixedCode) => {
      setFileContents(prev => {
        const next = new Map(prev);
        next.set(activeFileId, fixedCode.trim());
        return next;
      });
      showModal('AI Fix Applied', `The AI has updated the file ${activeFileId} with suggested fixes.`);
      appendTerminal(`AI applied fixes to ${activeFileId}`);
    }).catch((error) => showModal('Notebook AI Error', error.message));
  };

  const readFiles = async (files, useRelative = false) => {
    const nextProjectFiles = [];
    const nextFileEntries = new Map();
    for (const file of Array.from(files || [])) {
      const filePath = useRelative && file.webkitRelativePath ? file.webkitRelativePath : file.name;
      const content = await file.text();
      nextProjectFiles.push({ name: filePath, kind: 'file' });
      nextFileEntries.set(filePath, content);
    }
    nextProjectFiles.sort((a, b) => a.name.localeCompare(b.name));
    return { nextProjectFiles, nextFileEntries };
  };

  const handleFilesUploaded = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const { nextProjectFiles, nextFileEntries } = await readFiles(files, true);
    setProjectFiles(nextProjectFiles);
    setFileContents(nextFileEntries);
    const nextOpen = nextProjectFiles.slice(0, 3).map(file => file.name);
    setOpenFiles(nextOpen);
    setActiveFileId(nextOpen[0] || null);
    appendTerminal(`Project opened with ${nextProjectFiles.length} file(s)`);
    event.target.value = null;
  };

  const handleSingleFilesUploaded = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const { nextProjectFiles, nextFileEntries } = await readFiles(files, false);
    setProjectFiles(prev => {
      const merged = [...prev];
      nextProjectFiles.forEach(file => {
        if (!merged.some(item => item.name === file.name)) merged.push(file);
      });
      merged.sort((a, b) => a.name.localeCompare(b.name));
      return merged;
    });
    setFileContents(prev => {
      const merged = new Map(prev);
      nextFileEntries.forEach((value, key) => merged.set(key, value));
      return merged;
    });
    const firstNew = nextProjectFiles[0]?.name || null;
    setOpenFiles(prev => {
      const next = [...prev];
      nextProjectFiles.forEach(file => {
        if (!next.includes(file.name)) next.push(file.name);
      });
      return next;
    });
    if (firstNew) setActiveFileId(firstNew);
    appendTerminal(`Opened ${nextProjectFiles.length} file(s)`);
    event.target.value = null;
  };

  const themeStyle = useMemo(() => DEFAULT_THEME, []);

  return (
    <div
      className="flex flex-col min-h-screen w-full overflow-hidden text-[var(--spider-text)] font-sans antialiased"
      style={{
        ...themeStyle,
        backgroundColor: 'var(--spider-dark)',
      }}
    >
      <style>{`
        .spider-notebook-shell ::-webkit-scrollbar { width: 8px; height: 8px; }
        .spider-notebook-shell ::-webkit-scrollbar-track { background: var(--spider-med); }
        .spider-notebook-shell ::-webkit-scrollbar-thumb { background: var(--spider-light); border-radius: 4px; }
        .spider-notebook-shell ::-webkit-scrollbar-thumb:hover { background: var(--spider-neon-blue); }
      `}</style>

      <div className="spider-notebook-shell flex flex-col flex-1 min-h-screen">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFilesUploaded} webkitdirectory="" multiple />
        <input ref={singleFileInputRef} type="file" className="hidden" onChange={handleSingleFilesUploaded} multiple />
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--spider-med)] border-b border-[var(--spider-light)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg" style={{ boxShadow: '0 0 10px rgba(0,255,255,0.15)' }}>
              <SpiderLogo />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-lg truncate">Spider Notebook</h1>
              <p className="text-[var(--spider-text-dim)] text-xs truncate">Qt6 + C++ style notebook UI</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => handleWsConnect()} className={`text-sm font-medium px-4 py-2 rounded-lg ${wsStatus === 'Connected' ? 'bg-red-500/20 text-red-200' : 'bg-[#133838] text-[#7CE7FF]'}`}>
              {wsStatus === 'Connected' ? 'Disconnect Engine' : wsStatus === 'Connecting' ? 'Connecting...' : 'Connect Engine'}
            </button>
            <button onClick={handleSave} className="bg-[var(--spider-light)] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-opacity-80">Save</button>
            <button onClick={handleRunEngine} className="bg-[var(--spider-neon-blue)] text-[var(--spider-dark)] text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90">Run Engine</button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex bg-[var(--spider-dark)] overflow-hidden">
          <div className="hidden md:flex flex-col bg-[var(--spider-med)] w-64 border-r border-[var(--spider-light)] flex-shrink-0 h-full">
            <div className="p-4 border-b border-[var(--spider-light)]">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">NOTEBOOK FILES</h2>
            </div>
            <div className="p-4 space-y-2 border-b border-[var(--spider-light)]">
              <button onClick={handleOpenProject} className="w-full bg-[var(--spider-neon-blue)] text-[var(--spider-dark)] font-medium py-2.5 px-4 rounded-md hover:opacity-90 text-sm flex items-center justify-center gap-2">
                <FolderIcon />
                <span>Open Project</span>
              </button>
              <button onClick={handleOpenFileClick} className="w-full bg-[var(--spider-light)] text-[var(--spider-text)] font-medium py-2.5 px-4 rounded-md hover:bg-opacity-80 text-sm flex items-center justify-center gap-2">
                <FileIcon />
                <span>Open File(s)</span>
              </button>
              <button onClick={handleNewProject} className="w-full bg-[var(--spider-light)] text-[var(--spider-text)] font-medium py-2.5 px-4 rounded-md hover:bg-opacity-80 text-sm flex items-center justify-center gap-2">
                <span className="text-base leading-none">+</span>
                <span>New Project</span>
              </button>
            </div>
            <div className="p-4 border-b border-[var(--spider-light)]">
              <div className="relative">
                <input type="text" placeholder="Search files..." className="w-full bg-[var(--spider-dark)] text-[var(--spider-text)] border border-[var(--spider-light)] rounded-md py-2 px-3 text-sm focus:outline-none focus:border-[var(--spider-neon-blue)]" />
                <svg className="w-4 h-4 text-[var(--spider-text-dim)] absolute right-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="text-sm">
                <div className="font-semibold text-[var(--spider-text-dim)] text-xs uppercase tracking-wide mb-3">
                  {projectFiles.length > 0 ? 'Project Files' : 'No Project'}
                </div>
                <div className="space-y-1">
                  {projectFiles.map(file => {
                    const isActive = activeFileId === file.name;
                    const isOpen = openFiles.includes(file.name);
                    return (
                      <div
                        key={file.name}
                        onClick={() => handleFileClick(file)}
                        className={`pl-3 py-2 rounded flex items-center cursor-pointer transition-all duration-200 ${
                          isActive
                            ? 'bg-[var(--spider-neon-blue)] text-[var(--spider-dark)]'
                            : isOpen
                              ? 'bg-[var(--spider-light)] text-white'
                              : 'text-[var(--spider-text-dim)] hover:bg-[var(--spider-light)] hover:text-white'
                        }`}
                      >
                        <FileIcon />
                        <span className="ml-2 truncate text-sm">{file.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="bg-[var(--spider-med)] border-b border-[var(--spider-light)] flex-shrink-0">
              <div className="flex overflow-x-auto">
                {openFiles.map(fileName => (
                  <button
                    key={fileName}
                    onClick={() => handleFileClick({ name: fileName, kind: 'file' })}
                    className={`flex items-center space-x-2 py-3 px-4 border-r border-[var(--spider-light)] flex-shrink-0 min-w-0 transition-all duration-200 ${
                      activeFileId === fileName
                        ? 'bg-[var(--spider-dark)] text-white border-b-2 border-[var(--spider-neon-blue)]'
                        : 'text-[var(--spider-text-dim)] hover:bg-[var(--spider-light)] hover:text-white'
                    }`}
                  >
                    <FileIcon />
                    <span className="truncate max-w-xs text-sm">{fileName}</span>
                    <span onClick={(e) => handleCloseTab(e, fileName)} className="text-[var(--spider-text-dim)] hover:text-white text-xs ml-1 transition-colors duration-200">
                      ×
                    </span>
                  </button>
                ))}
                {openFiles.length === 0 && (
                  <div className="py-3 px-4 text-[var(--spider-text-dim)] italic text-sm flex items-center space-x-2">
                    <FileIcon />
                    <span>No files open</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex min-h-0">
              <div className="flex-1 flex flex-col bg-[var(--spider-dark)] min-w-0">
                <div className="flex-1 p-6 overflow-auto">
                  <textarea
                    id="code-editor"
                    className="w-full h-full bg-transparent text-white font-mono text-sm border-none outline-none resize-none leading-relaxed"
                    value={activeCode}
                    onChange={handleCodeChange}
                    disabled={!activeFileId && projectFiles.length === 0}
                    placeholder={projectFiles.length === 0 ? 'Open Project or create a new file to get started...' : !activeFileId ? 'Select a file from the sidebar to start editing...' : ''}
                  />
                </div>
              </div>

              <div className="hidden md:flex w-80 flex-col bg-[var(--spider-med)] border-l border-[var(--spider-light)] flex-shrink-0">
                <div className="p-4 border-b border-[var(--spider-light)]">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <LightningIcon />
                    <span>AI Assistant</span>
                  </h3>
                </div>
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  <div className="relative">
                    <input
                      id="ai-query-input"
                      type="text"
                      placeholder="Enter prompt..."
                      className="w-full bg-[var(--spider-dark)] text-[var(--spider-text)] border border-[var(--spider-light)] rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-[var(--spider-neon-blue)]"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <button onClick={handleGenerateCode} className="p-3 bg-[var(--spider-dark)] rounded-lg text-white text-sm border border-[var(--spider-light)] hover:bg-[var(--spider-light)]">Generate Code</button>
                    <button onClick={handleExplainCode} className="p-3 bg-[var(--spider-dark)] rounded-lg text-white text-sm border border-[var(--spider-light)] hover:bg-[var(--spider-light)]">Explain Code</button>
                    <button onClick={handleCritiqueCode} className="p-3 bg-[var(--spider-dark)] rounded-lg text-white text-sm border border-[var(--spider-light)] hover:bg-[var(--spider-light)]">Critique Code</button>
                    <button onClick={handleFixErrors} className="p-3 bg-[var(--spider-dark)] rounded-lg text-white text-sm border border-[var(--spider-light)] hover:bg-[var(--spider-light)]">Fix Errors</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:hidden flex items-center justify-between p-4 bg-[var(--spider-med)] border-t border-[var(--spider-light)]">
              <div className="flex gap-2">
                <button onClick={() => setActiveMobileTab(activeMobileTab === 'files' ? 'editor' : 'files')} className={`p-2 rounded-lg ${activeMobileTab === 'files' ? 'bg-[var(--spider-neon-blue)] text-black' : 'bg-[var(--spider-light)] text-white'}`}>
                  <FolderIcon />
                </button>
                <button onClick={() => setIsAiPanelVisible(!isAiPanelVisible)} className={`p-2 rounded-lg ${isAiPanelVisible ? 'bg-[var(--spider-neon-blue)] text-black' : 'bg-[var(--spider-light)] text-white'}`}>
                  <LightningIcon />
                </button>
                <button onClick={() => setIsTerminalVisible(!isTerminalVisible)} className={`p-2 rounded-lg ${isTerminalVisible ? 'bg-[var(--spider-neon-blue)] text-black' : 'bg-[var(--spider-light)] text-white'}`}>
                  <TerminalIcon />
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} className="bg-[var(--spider-light)] text-white text-sm font-medium px-3 py-2 rounded-lg">Save</button>
                <button onClick={handleRunEngine} className="bg-[var(--spider-neon-blue)] text-[var(--spider-dark)] text-sm font-semibold px-3 py-2 rounded-lg">Run</button>
              </div>
            </div>

            {activeMobileTab === 'files' && (
              <div className="md:hidden bg-[var(--spider-med)] p-4 border-t border-[var(--spider-light)]">
                <div className="space-y-2">
                  {projectFiles.map(file => (
                    <div
                      key={file.name}
                      onClick={() => {
                        handleFileClick(file);
                        setActiveMobileTab('editor');
                      }}
                      className="p-3 bg-[var(--spider-dark)] rounded-lg text-white text-sm cursor-pointer active:bg-[var(--spider-light)] transition-colors flex items-center gap-2"
                    >
                      <FileIcon />
                      <span className="truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isAiPanelVisible && (
              <div className="md:hidden bg-[var(--spider-med)] border-t border-[var(--spider-light)] p-4 space-y-3">
                <input
                  type="text"
                  placeholder="Enter prompt..."
                  className="w-full bg-[var(--spider-dark)] text-white border border-[var(--spider-light)] rounded-lg py-3 px-4 text-sm"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleGenerateCode} className="p-3 bg-[var(--spider-dark)] rounded-lg text-white text-sm border border-[var(--spider-light)]">Generate</button>
                  <button onClick={handleExplainCode} className="p-3 bg-[var(--spider-dark)] rounded-lg text-white text-sm border border-[var(--spider-light)]">Explain</button>
                  <button onClick={handleCritiqueCode} className="p-3 bg-[var(--spider-dark)] rounded-lg text-white text-sm border border-[var(--spider-light)]">Critique</button>
                  <button onClick={handleFixErrors} className="p-3 bg-[var(--spider-dark)] rounded-lg text-white text-sm border border-[var(--spider-light)]">Fix</button>
                </div>
              </div>
            )}

            {isTerminalVisible && (
              <div className="bg-[var(--spider-med)] border-t border-[var(--spider-light)] flex-shrink-0">
                <div className="flex border-b border-[var(--spider-light)]">
                  <button
                    onClick={() => setActiveTerminalTab('terminal')}
                    className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTerminalTab === 'terminal' ? 'text-white bg-[var(--spider-dark)]' : 'text-[var(--spider-text-dim)]'}`}
                  >
                    <TerminalIcon />
                    <span>TERMINAL</span>
                  </button>
                  <button
                    onClick={() => showModal('Pro Feature', 'PowerShell coming soon!')}
                    className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTerminalTab === 'powershell' ? 'text-white bg-[var(--spider-dark)]' : 'text-[var(--spider-text-dim)] opacity-70'}`}
                  >
                    <span>POWERSHELL</span>
                    <LockIcon />
                  </button>
                </div>
                <div className="p-4 bg-[var(--spider-dark)] max-h-56 overflow-y-auto font-mono text-sm">
                  <div className="mb-2">
                    <p className="text-sm text-gray-400 flex items-center">
                      <LightningIcon />
                      <span className="ml-2">Spy Engine Status:</span>
                      <span className={`ml-2 ${wsStatus === 'Connected' ? 'text-green-400' : wsStatus === 'Connecting' ? 'text-yellow-400' : 'text-red-400'}`}>{wsStatus}</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    {activeTerminalTab === 'terminal' && terminalOutput.map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {modalInfo && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--spider-med)] rounded-lg shadow-[var(--shadow-neon-blue)] w-full max-w-xl max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-[var(--spider-light)]">
                <h3 className="text-lg font-semibold text-white">{modalInfo.title}</h3>
                <button onClick={hideModal} className="text-[var(--spider-text-dim)] hover:text-white text-3xl leading-none">&times;</button>
              </div>
              <div className="p-6 text-[var(--spider-text)] overflow-y-auto space-y-4">
                <pre className="whitespace-pre-wrap font-sans text-sm">{modalInfo.text}</pre>
              </div>
              <div className="p-4 border-t border-[var(--spider-light)] text-right">
                <button onClick={hideModal} className="bg-[var(--spider-neon-blue)] text-[var(--spider-dark)] text-sm font-semibold px-4 py-1.5 rounded-md hover:opacity-90">Close</button>
              </div>
            </div>
          </div>
        )}
        {showSaveAlert && (
          <div className="fixed bottom-4 right-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            File saved
          </div>
        )}
      </div>
    </div>
  );
};

export default SpiderNotebook;
