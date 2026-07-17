const SpiderNotebookPanel = ({ handleOpenProject, handleOpenFileClick, handleNewProject, projectFiles, openFiles, activeFileId, handleFileClick, FolderIcon, FileIcon }) => {
     return (
        // File Tree Panel - Only visible on medium screens and up (PC view)
        <div className="hidden md:flex flex-col bg-[var(--spider-med)] w-64 p-4 border-r border-[var(--spider-light)] flex-shrink-0 h-full overflow-y-auto">
            <span className="text-sm font-semibold mb-4">NOTEBOOK FILES</span>
            {/* --- FIX 1: Added "Open File(s)" button and adjusted margins --- */}
            <button onClick={handleOpenProject} className="bg-[var(--spider-neon-blue)] text-[var(--spider-dark)] text-sm font-semibold w-full py-2 rounded-md mb-2 hover:opacity-90">Open Project</button>
            <button onClick={handleOpenFileClick} className="bg-[var(--spider-light)] text-[var(--spider-text)] text-sm font-semibold w-full py-2 rounded-md mb-2 hover:bg-opacity-80">Open File(s)</button>
            <button onClick={handleNewProject} className="bg-[var(--spider-light)] text-[var(--spider-text)] text-sm font-semibold w-full py-2 rounded-md mb-4 hover:bg-opacity-80">New Project</button>
            
            <div className="relative mb-4"> <input type="text" placeholder="Search files..." className="w-full bg-[var(--spider-light)] border border-[var(--spider-light)] rounded-md py-1.5 px-3 text-sm focus:outline-none focus:border-[var(--spider-neon-blue)] focus:ring-1 focus:ring-[var(--spider-neon-blue)]" /> <svg className="w-4 h-4 text-[var(--spider-text-dim)] absolute right-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> </div>
            <div className="flex-grow text-sm space-y-1"> <div className="font-semibold">{projectFiles.length > 0 ? 'Project' : 'No Project'}</div> <div className="pl-2 space-y-1"> {projectFiles.map(file => { let bg='transparent'; let text='var(--spider-text)'; if(file.kind==='file'&&openFiles.includes(file.name)){bg='var(--spider-light)';text=activeFileId===file.name?'white':'var(--spider-text-dim)';} if(file.kind==='directory')return null; return ( <div key={file.name} onClick={() => handleFileClick(file)} className={`pl-4 rounded px-1 flex items-center ${file.kind==='file'?'cursor-pointer':'cursor-default'}`} style={{backgroundColor:bg,color:text}}><FileIcon /><span className="truncate">{file.name}</span></div> ) })} </div> </div>
        </div>
    );
};


// --- Full Page Components ---

// --- THIS IS THE START OF THE REFACTORED COMPONENT ---
// Spider Notebook App (Main IDE View)
// Spider Notebook App (Main IDE View) - WITH ALL ICONS RESTORED
const SpiderNotebookApp = ({ 
    openFiles, activeFileId, fileContents, projectFiles, terminalOutput, activeTerminalTab, 
    aiQuery, handleFileClick, handleCloseTab, handleCodeChange, handleSave, handleRunEngine, 
    setAiQuery, setActiveTerminalTab, showModal, LockIcon, FolderIcon, FileIcon, 
    handleOpenProject, handleOpenFileClick, handleNewProject,
    callFastAPI,
    wsStatus,
}) => {
    
    // --- State for Mobile Panel Visibility ---
    const [isAiPanelVisible, setIsAiPanelVisible] = useState(false);
    const [isTerminalVisible, setIsTerminalVisible] = useState(true);
    const [activeMobileTab, setActiveMobileTab] = useState('editor'); // 'editor', 'files', 'ai'

    const getCurrentCode = () => { 
        if (!activeFileId) { showModal("No File", "Open file."); return null; } 
        const code=fileContents.get(activeFileId); 
        if (typeof code==='undefined'||code.trim()==="") { showModal("Empty File", "No code."); return null; } 
        return code;
    };
    
    // NOTEBOOK AI HANDLERS
    const handleGenerateCode = async () => { 
        if (!activeFileId) { showModal("No File", "Open file."); return; } 
        if (!aiQuery) { showModal("Empty Prompt", "Enter prompt in AI input area."); return; } 
        const systemPrompt="Generate only raw code for the existing open file. If possible, use Spy Language multi-language format."; 
        const generatedCode=await callFastAPI('/api/generate/text', { prompt: aiQuery, system_instruction: systemPrompt }, 'chat'); 
        if (generatedCode && !generatedCode.error) { 
            const newContents=new Map(fileContents); 
            const oldContent=newContents.get(activeFileId)||""; 
            newContents.set(activeFileId, oldContent+"\n\n"+generatedCode.text); 
            setFileContents(newContents); 
            setAiQuery(""); 
        }
    };

    const handleExplainCode = async () => { 
        const code=getCurrentCode(); if (!code) return; 
        const userQuery=`Explain the following code from file ${activeFileId}:\n\`\`\`\n${code}\n\`\`\``; 
        const systemPrompt="Provide a detailed, beginner-friendly explanation of the provided code. If it contains Spy Language elements, explain the cross-language interaction."; 
        const explanation=await callFastAPI('/api/generate/text', { prompt: userQuery, system_instruction: systemPrompt }, 'chat'); 
        if (explanation && !explanation.error) { showModal("AI Explanation", explanation.text); }
    };
    
    const handleCritiqueCode = async () => { 
        const code=getCurrentCode(); if (!code) return; 
        const userQuery=`Critique the following code from file ${activeFileId}. Focus on best practices, performance, and cross-language compatibility (if applicable):\n\`\`\`\n${code}\n\`\`\``; 
        const systemPrompt="Act as a senior software architect. Provide a constructive critique focusing on efficiency and security."; 
        const critique=await callFastAPI('/api/generate/text', { prompt: userQuery, system_instruction: systemPrompt }, 'chat'); 
        if (critique && !critique.error) { showModal("AI Critique", critique.text); }
    };
    
    const handleFixErrors = async () => { 
        const code=getCurrentCode(); if (!code) return; 
        const userQuery=`Fix all obvious errors and suggest improvements for the following code from file ${activeFileId}. Return ONLY the raw, corrected code, nothing else.\n\`\`\`\n${code}\n\`\`\``; 
        const systemPrompt="Fix the errors and return only the raw, corrected code. Do not add any conversational text."; 
        const fixedCode=await callFastAPI('/api/generate/text', { prompt: userQuery, system_instruction: systemPrompt }, 'chat'); 
        if (fixedCode && !fixedCode.error) { 
            const newContents=new Map(fileContents); 
            newContents.set(activeFileId, fixedCode.text); 
            setFileContents(newContents);
            showModal("AI Fix Applied", `The AI has updated the file ${activeFileId} with suggested fixes.`);
        }
    };

    // FIXED: Mobile action handlers that close the file panel
    const handleMobileOpenProject = () => {
        handleOpenProject();
        setActiveMobileTab('editor'); // Close file panel and go to editor
    };

    const handleMobileOpenFileClick = () => {
        handleOpenFileClick();
        setActiveMobileTab('editor'); // Close file panel and go to editor
    };

    const handleMobileNewProject = () => {
        handleNewProject();
        setActiveMobileTab('editor'); // Close file panel and go to editor
    };

    const handleMobileFileClick = (file) => {
        handleFileClick(file);
        setActiveMobileTab('editor'); // Close file panel and go to editor
    };

    return (
        // Main container
        <div className="w-full h-full flex bg-[var(--spider-dark)] overflow-hidden">
            
            {/* --- DESKTOP LAYOUT (Hidden on mobile) --- */}
            <div className="hidden md:flex w-full h-full">
                {/* Left Sidebar: File Explorer */}
                <div className="flex flex-col bg-[var(--spider-med)] w-64 border-r border-[var(--spider-light)] flex-shrink-0 h-full">
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-[var(--spider-light)]">
                        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">NOTEBOOK FILES</h2>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="p-4 space-y-2 border-b border-[var(--spider-light)]">
                        <button 
                            onClick={handleOpenProject}
                            className="w-full bg-[var(--spider-neon-blue)] text-[var(--spider-dark)] font-medium py-2.5 px-4 rounded-md hover:opacity-90 transition-all duration-200 text-sm flex items-center justify-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                            </svg>
                            <span>Open Project</span>
                        </button>
                        <button 
                            onClick={handleOpenFileClick}
                            className="w-full bg-[var(--spider-light)] text-[var(--spider-text)] font-medium py-2.5 px-4 rounded-md hover:bg-opacity-80 transition-all duration-200 text-sm flex items-center justify-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
                            </svg>
                            <span>Open File(s)</span>
                        </button>
                        <button 
                            onClick={handleNewProject}
                            className="w-full bg-[var(--spider-light)] text-[var(--spider-text)] font-medium py-2.5 px-4 rounded-md hover:bg-opacity-80 transition-all duration-200 text-sm flex items-center justify-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            <span>New Project</span>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-4 border-b border-[var(--spider-light)]">
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search files..." 
                                className="w-full bg-[var(--spider-dark)] text-[var(--spider-text)] border border-[var(--spider-light)] rounded-md py-2 px-3 text-sm focus:outline-none focus:border-[var(--spider-neon-blue)] focus:ring-1 focus:ring-[var(--spider-neon-blue)]" 
                            />
                            <svg className="w-4 h-4 text-[var(--spider-text-dim)] absolute right-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                    </div>

                    {/* File Tree */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        <div className="text-sm">
                            <div className="font-semibold text-[var(--spider-text-dim)] text-xs uppercase tracking-wide mb-3">
                                {projectFiles.length > 0 ? 'Project Files' : 'No Project'}
                            </div>
                            <div className="space-y-1">
                                {projectFiles.map(file => { 
                                    if (file.kind === 'directory') return null;
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

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    
                    {/* Editor Tabs */}
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
                                    <span 
                                        onClick={(e) => handleCloseTab(e, fileName)} 
                                        className="text-[var(--spider-text-dim)] hover:text-white text-xs ml-1 transition-colors duration-200"
                                    >
                                        ×
                                    </span>
                                </button> 
                            ))} 
                            {openFiles.length === 0 && ( 
                                <div className="py-3 px-4 text-[var(--spider-text-dim)] italic text-sm flex items-center space-x-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    <span>No files open</span>
                                </div> 
                            )} 
                        </div>
                    </div>
                    
                    {/* Editor + AI Panel Row */}
                    <div className="flex-1 flex min-h-0">
                        {/* Code Editor */}
                        <div className="flex-1 flex flex-col bg-[var(--spider-dark)] min-w-0">
                            <div className="flex-1 p-6 overflow-auto">
                                <textarea 
                                    id="code-editor" 
                                    className="w-full h-full bg-transparent text-white font-mono text-sm border-none outline-none resize-none leading-relaxed"
                                    value={fileContents.get(activeFileId) || ''} 
                                    onChange={handleCodeChange} 
                                    disabled={!activeFileId && projectFiles.length === 0} 
                                    placeholder={projectFiles.length === 0 ? "Open Project or create a new file to get started..." : !activeFileId ? "Select a file from the sidebar to start editing..." : ""} 
                                />
                            </div>
                        </div>
                        
                        {/* AI Panel */}
                        <div className="w-80 flex flex-col bg-[var(--spider-med)] border-l border-[var(--spider-light)] flex-shrink-0">
                            <div className="p-4 border-b border-[var(--spider-light)]">
                                <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                                    <svg className="w-4 h-4 text-[var(--spider-neon-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                    </svg>
                                    <span>AI Assistant</span>
                                </h3>
                            </div>
                            
                            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                                {/* AI Prompt Input */}
                                <div className="relative">
                                    <input 
                                        id="ai-query-input" 
                                        type="text" 
                                        placeholder="✨ Enter prompt..." 
                                        className="w-full bg-[var(--spider-dark)] text-[var(--spider-text)] border border-[var(--spider-light)] rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-[var(--spider-neon-blue)] focus:ring-1 focus:ring-[var(--spider-neon-blue)]" 
                                        value={aiQuery} 
                                        onChange={(e) => setAiQuery(e.target.value)} 
                                    />
                                    <svg className="w-4 h-4 text-[var(--spider-text-dim)] absolute right-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </div>
                                
                                {/* AI Action Buttons */}
                                <div className="space-y-3">
                                    <button 
                                        id="btn-generate-code" 
                                        onClick={handleGenerateCode} 
                                        className="w-full flex items-center space-x-3 p-3 bg-[var(--spider-dark)] rounded-lg cursor-pointer hover:bg-opacity-80 text-left border border-[var(--spider-light)] hover:border-[var(--spider-neon-blue)] transition-all duration-200"
                                    >
                                        <span className="text-xl">✨</span>
                                        <span className="text-sm font-semibold text-[var(--spider-text)]">Generate Code</span>
                                    </button>
                                    <button 
                                        id="btn-explain-code" 
                                        onClick={handleExplainCode} 
                                        className="w-full flex items-center space-x-3 p-3 bg-[var(--spider-dark)] rounded-lg cursor-pointer hover:bg-opacity-80 text-left border border-[var(--spider-light)] hover:border-[var(--spider-neon-blue)] transition-all duration-200"
                                    >
                                        <span className="text-xl">💡</span>
                                        <span className="text-sm font-semibold text-[var(--spider-text)]">Explain Code</span>
                                    </button>
                                    <button 
                                        id="btn-critique-code" 
                                        onClick={handleCritiqueCode} 
                                        className="w-full flex items-center space-x-3 p-3 bg-[var(--spider-dark)] rounded-lg cursor-pointer hover:bg-opacity-80 text-left border border-[var(--spider-light)] hover:border-[var(--spider-neon-blue)] transition-all duration-200"
                                    >
                                        <span className="text-xl">📐</span>
                                        <span className="text-sm font-semibold text-[var(--spider-text)]">Critique Code</span>
                                    </button>
                                    <button 
                                        id="btn-fix-errors" 
                                        onClick={handleFixErrors} 
                                        className="w-full flex items-center space-x-3 p-3 bg-[var(--spider-dark)] rounded-lg cursor-pointer hover:bg-opacity-80 text-left border border-[var(--spider-light)] hover:border-[var(--spider-neon-blue)] transition-all duration-200"
                                    >
                                        <span className="text-xl">🩹</span>
                                        <span className="text-sm font-semibold text-[var(--spider-text)]">Fix Errors</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Terminal Area */}
                    <div className="h-64 flex flex-col bg-[var(--spider-med)] border-t border-[var(--spider-light)] flex-shrink-0">
                        {/* Terminal Tabs */}
                        <div className="flex border-b border-[var(--spider-light)]">
                            <button 
                                onClick={() => setActiveTerminalTab('terminal')} 
                                className={`py-3 px-6 text-sm font-semibold flex items-center transition-all duration-200 ${
                                    activeTerminalTab === 'terminal' 
                                        ? 'text-white bg-[var(--spider-dark)] border-b-2 border-[var(--spider-neon-blue)]' 
                                        : 'text-[var(--spider-text-dim)] hover:text-white'
                                }`}
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                TERMINAL
                            </button>
                            <button 
                                onClick={() => showModal("Pro Feature", "PowerShell integration coming soon!")} 
                                className={`py-3 px-6 text-sm font-semibold flex items-center transition-all duration-200 ${
                                    activeTerminalTab === 'powershell' 
                                        ? 'text-white bg-[var(--spider-dark)] border-b-2 border-[var(--spider-neon-blue)]' 
                                        : 'text-[var(--spider-text-dim)] hover:text-white opacity-70'
                                }`}
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                                </svg>
                                POWERSHELL
                                <LockIcon />
                            </button>
                        </div>
                        
                        {/* Terminal Content */}
                        <div className="flex-1 p-4 bg-[var(--spider-dark)] overflow-y-auto font-mono text-sm">
                            {/* Status Bar */}
                            <div className="mb-3 pb-2 border-b border-[var(--spider-light)]">
                                <p className="text-sm font-semibold text-gray-400 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                    </svg>
                                    Spy Engine Status: 
                                    <span className={`ml-2 ${
                                        wsStatus === 'Connected' ? 'text-green-400' : 
                                        wsStatus === 'Connecting' ? 'text-yellow-400' : 
                                        'text-red-400'
                                    }`}>
                                        {wsStatus}
                                    </span>
                                </p>
                            </div>
                            
                            {/* Terminal Output */}
                            <div className="space-y-1">
                                {activeTerminalTab === 'terminal' && terminalOutput.map((line, index) => (
                                    <p key={index} dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />
                                ))}
                                {activeTerminalTab === 'powershell' && (
                                    <p className="text-[var(--spider-text-dim)] italic flex items-center">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                        </svg>
                                        PowerShell integration coming soon. Use Terminal for now.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MOBILE LAYOUT (Visible on mobile) --- */}
            <div className="md:hidden flex flex-col w-full h-full">
                
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-4 bg-[var(--spider-med)] border-b border-[var(--spider-light)]">
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={() => setActiveMobileTab(activeMobileTab === 'files' ? 'editor' : 'files')}
                            className={`p-2 rounded-lg ${
                                activeMobileTab === 'files' 
                                    ? 'bg-[var(--spider-neon-blue)] text-black' 
                                    : 'bg-[var(--spider-light)] text-white'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                            </svg>
                        </button>
                        <h1 className="text-lg font-semibold text-white">Spider Notebook</h1>
                    </div>
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => setIsAiPanelVisible(!isAiPanelVisible)}
                            className={`p-2 rounded-lg ${isAiPanelVisible ? 'bg-[var(--spider-neon-blue)] text-black' : 'bg-[var(--spider-light)] text-white'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                        </button>
                        <button 
                            onClick={() => setIsTerminalVisible(!isTerminalVisible)}
                            className={`p-2 rounded-lg ${isTerminalVisible ? 'bg-[var(--spider-neon-blue)] text-black' : 'bg-[var(--spider-light)] text-white'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Content Area */}
                <div className="flex-1 flex flex-col min-h-0">
                    
                    {/* File Manager (Hidden by default) */}
                    {activeMobileTab === 'files' && (
                        <div className="flex-1 bg-[var(--spider-med)] p-4 overflow-y-auto">
                            <div className="space-y-3">
                                {/* FIXED: All three buttons now close the file panel */}
                                <button 
                                    onClick={handleMobileOpenProject}
                                    className="w-full bg-[var(--spider-neon-blue)] text-[var(--spider-dark)] font-medium py-3 px-4 rounded-lg text-sm flex items-center justify-center space-x-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                                    </svg>
                                    <span>Open Project</span>
                                </button>
                                <button 
                                    onClick={handleMobileOpenFileClick}
                                    className="w-full bg-[var(--spider-light)] text-white font-medium py-3 px-4 rounded-lg text-sm flex items-center justify-center space-x-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
                                    </svg>
                                    <span>Open File(s)</span>
                                </button>
                                <button 
                                    onClick={handleMobileNewProject}
                                    className="w-full bg-[var(--spider-light)] text-white font-medium py-3 px-4 rounded-lg text-sm flex items-center justify-center space-x-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                    <span>New Project</span>
                                </button>
                                
                                <div className="mt-4">
                                    <h3 className="text-sm font-semibold text-white mb-2 flex items-center space-x-2">
                                        <FileIcon />
                                        <span>Project Files</span>
                                    </h3>
                                    <div className="space-y-1">
                                        {projectFiles.map(file => (
                                            <div 
                                                key={file.name} 
                                                onClick={() => handleMobileFileClick(file)}
                                                className="p-3 bg-[var(--spider-dark)] rounded-lg text-white text-sm cursor-pointer active:bg-[var(--spider-light)] transition-colors flex items-center space-x-2"
                                            >
                                                <FileIcon />
                                                <span className="truncate">{file.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Editor Area (Default view) */}
                    {activeMobileTab === 'editor' && (
                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Mobile Tabs */}
                            <div className="bg-[var(--spider-med)] border-b border-[var(--spider-light)] flex-shrink-0">
                                <div className="flex overflow-x-auto">
                                    {openFiles.map(fileName => ( 
                                        <button 
                                            key={fileName} 
                                            onClick={() => handleFileClick({ name: fileName, kind: 'file' })} 
                                            className={`flex items-center space-x-2 py-3 px-4 border-r border-[var(--spider-light)] flex-shrink-0 min-w-0 ${
                                                activeFileId === fileName 
                                                    ? 'bg-[var(--spider-dark)] text-white' 
                                                    : 'text-[var(--spider-text-dim)]'
                                            }`}
                                        >
                                            <FileIcon />
                                            <span className="truncate max-w-32 text-sm">{fileName}</span>
                                            <span 
                                                onClick={(e) => handleCloseTab(e, fileName)} 
                                                className="text-[var(--spider-text-dim)] text-xs ml-1"
                                            >
                                                ×
                                            </span>
                                        </button> 
                                    ))} 
                                    {openFiles.length === 0 && ( 
                                        <div className="py-3 px-4 text-[var(--spider-text-dim)] italic text-sm flex items-center space-x-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                            </svg>
                                            <span>No files open</span>
                                        </div> 
                                    )} 
                                </div>
                            </div>
                            
                            {/* Editor */}
                            <div className="flex-1 bg-[var(--spider-dark)] p-4 overflow-auto">
                                <textarea 
                                    className="w-full h-full bg-transparent text-white font-mono text-sm border-none outline-none resize-none leading-relaxed"
                                    value={fileContents.get(activeFileId) || ''} 
                                    onChange={handleCodeChange} 
                                    disabled={!activeFileId && projectFiles.length === 0} 
                                    placeholder={projectFiles.length === 0 ? "Open Project..." : !activeFileId ? "Select file..." : ""} 
                                />
                            </div>
                        </div>
                    )}

                    {/* AI Panel (Collapsible) */}
                    {isAiPanelVisible && (
                        <div className="bg-[var(--spider-med)] border-t border-[var(--spider-light)] max-h-64 overflow-y-auto">
                            <div className="p-4 space-y-4">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="✨ Enter prompt..." 
                                        className="w-full bg-[var(--spider-dark)] text-white border border-[var(--spider-light)] rounded-lg py-3 px-4 text-sm"
                                        value={aiQuery} 
                                        onChange={(e) => setAiQuery(e.target.value)} 
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={handleGenerateCode}
                                        className="p-3 bg-[var(--spider-dark)] rounded-lg text-white text-sm border border-[var(--spider-light)] active:bg-[var(--spider-light)] transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <span>✨</span>
                                        <span>Generate Code</span>
                                    </button>
                                    <button 
                                        onClick={handleExplainCode}
                                        className="p-3 bg-[var(--spider-dark)] rounded-lg text-white text-sm border border-[var(--spider-light)] active:bg-[var(--spider-light)] transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <span>💡</span>
                                        <span>Explain Code</span>
                                    </button>
                                    <button 
                                        onClick={handleCritiqueCode}
                                        className="p-3 bg-[var(--spider-dark)] rounded-lg text-white text-sm border border-[var(--spider-light)] active:bg-[var(--spider-light)] transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <span>📐</span>
                                        <span>Critique Code</span>
                                    </button>
                                    <button 
                                        onClick={handleFixErrors}
                                        className="p-3 bg-[var(--spider-dark)] rounded-lg text-white text-sm border border-[var(--spider-light)] active:bg-[var(--spider-light)] transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <span>🩹</span>
                                        <span>Fix Errors</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Terminal (Collapsible) */}
                    {isTerminalVisible && (
                        <div className="bg-[var(--spider-med)] border-t border-[var(--spider-light)] flex-shrink-0">
                            <div className="flex border-b border-[var(--spider-light)]">
                                <button 
                                    onClick={() => setActiveTerminalTab('terminal')} 
                                    className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center space-x-2 ${
                                        activeTerminalTab === 'terminal' 
                                            ? 'text-white bg-[var(--spider-dark)]' 
                                            : 'text-[var(--spider-text-dim)]'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <span>TERMINAL</span>
                                </button>
                                <button 
                                    onClick={() => showModal("Pro Feature", "PowerShell coming soon!")} 
                                    className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center space-x-2 ${
                                        activeTerminalTab === 'powershell' 
                                            ? 'text-white bg-[var(--spider-dark)]' 
                                            : 'text-[var(--spider-text-dim)] opacity-70'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                                    </svg>
                                    <span>POWERSHELL</span>
                                    <LockIcon />
                                </button>
                            </div>
                            
                            <div className="p-4 bg-[var(--spider-dark)] max-h-48 overflow-y-auto font-mono text-sm">
                                <div className="mb-2">
                                    <p className="text-sm text-gray-400 flex items-center">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                        </svg>
                                        Spy Engine Status: 
                                        <span className={`ml-2 ${
                                            wsStatus === 'Connected' ? 'text-green-400' : 
                                            wsStatus === 'Connecting' ? 'text-yellow-400' : 
                                            'text-red-400'
                                        }`}>
                                            {wsStatus}
                                        </span>
                                    </p>
                                </div>
                                
                                <div className="space-y-1">
                                    {activeTerminalTab === 'terminal' && terminalOutput.map((line, index) => (
                                        <p key={index} dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
