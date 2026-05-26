import React from 'react';
import { useState } from 'react';

// --- SVG Icon Components (omitted for brevity) ---
const IconCode = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m16 18 6-6-6-6" />
    <path d="m8 6-6 6 6 6" />
    <path d="m14.5 4-5 16" />
  </svg>
);

const IconSearch = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconMenu = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconX = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconChevronRight = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconGitHub = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-1.5 6-6.5a5.5 5.5 0 0 0-1.5-4A5 5 0 0 0 18 2H6a5 5 0 0 0-1.5 4A5.5 5.5 0 0 0 3 12.5c0 5 3 6.5 6 6.5a4.8 4.8 0 0 0-1 3.5v4" />
  </svg>
);

const IconDiscord = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.56 12.3c2.72.6 4.47-1.35 4.96-3.83 0 0 .5-1.5-.75-2.75 0 0-.25-1-.75-1-.25-.25-.75.25-1 .5-.25.25-.5.5-.75.75-.75-.5-1.75-1-3-1.25-.25.25-.5.5-.75.75-.25.25-.5.5-.75.75-.25-.25-.75-.5-1-.5-.5-.25-1-.25-1.25-.25-.25 0-.5.25-.75.5-1.25 1.25-1 2.75-1 2.75.5 2.5 2.25 4.5 5 4.25Z"/><path d="M12 21.5c-3.25 0-6.25-1.25-8.25-3.5 0 0-.25-.25-.25-.5 0-.25.25-.5.5-.75s.75-.5 1-.5c.25 0 .5.25.75.5 1.75 2 4.5 3 7.25 3 2.75 0 5.5-1 7.25-3 .25-.25.5-.5.75-.5.25 0 .5.25.75.5.25.25.5.5.5.75 0 .25-.25.5-.25.5-2 2.25-5 3.5-8.25 3.5Z"/>
  </svg>
);

const IconReddit = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><path d="M10 8h4"/><path d="M12 15c-1 0-2 .5-3 1-1-.5-2-1-3-1v-2c0-1.5 1-2.5 2-3s2-1 3-1 2 .5 3 1 2 1.5 2 3v2c-1 0-2 .5-3 1-1-.5-2-1-3-1Z"/><path d="M12 17c.5 0 1-.5 1-1s-.5-1-1-1-1 .5-1 1 .5 1 1 1Z"/>
  </svg>
);

const IconWhatsApp = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17.18 6.82A8.5 8.5 0 0 0 12 3a9 9 0 0 0-8 8.8c.03 1.2.3 2.37.77 3.47L3 21l4.7-1.24c1.08.45 2.27.68 3.5.7c4.95 0 8.95-4.04 8.98-9.02Z"/><path d="m11 7 4.5 4-4.5 4.5V13.5H8.5V10h2.5Z"/>
  </svg>
);

const IconInstagram = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.5" y1="6.5" y2="6.5"/>
  </svg>
);

// Star Icon for Rating
const IconStar = ({ fill = 'none', className, onClick, isInteractive = true }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${className} ${isInteractive ? 'cursor-pointer transition-colors duration-100' : ''}`}
    onClick={onClick}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// NEW ICON: List/TOC Icon for Docs Sidebar Toggle
const IconList = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="8" x2="21" y1="6" y2="6"/>
    <line x1="8" x2="21" y1="12" y2="12"/>
    <line x1="8" x2="21" y1="18" y2="18"/>
    <line x1="3" x2="3" y1="6" y2="6"/>
    <line x1="3" x2="3" y1="12" y2="12"/>
    <line x1="3" x2="3" y1="18" y2="18"/>
  </svg>
);


// --- Navigation Data (Page Metadata for Search/Navigation) ---
// Added a description for simple search matching
const navItems = [
  { name: 'Get Started', page: 'gettingStarted', hasChildren: true, keywords: 'start, introduction, overview, home, main, setup' },
  { name: 'Basics', page: 'basics', hasChildren: false, keywords: 'variables, strings, comments, fundamentals, types' },
  { name: 'Concepts', page: 'concepts', hasChildren: false, keywords: 'if/else, loops, functions, classes, collections, array, map, control flow' },
  { name: 'Advanced', page: 'advanced', hasChildren: false, keywords: 'interop, file access, multithreading, concurrent, networking, API, deadlock' }, 
  { name: 'Extreme', page: 'extreme', hasChildren: false, keywords: 'optimization, low level, memory, performance, GPU, security' }, 
  { name: 'Language Reference', page: 'reference', hasChildren: false, keywords: 'python, java, c++, syntax, data models, service, performance' },
  { name: 'Community', page: 'community', hasChildren: false, keywords: 'discord, reddit, github, contact, support, creator' },
  { name: 'Contact Us', page: 'contact', hasChildren: false, keywords: 'email, support, help' },
];

// --- Mobile Sidebar Component ---
const MobileSidebar = ({ isOpen, onClose, setPage, currentPage }) => {
    const transformStyle = isOpen ? 'translate-x-0' : '-translate-x-full';
    
    const handleNavigation = (pageName) => {
        setPage(pageName);
        onClose(); 
    };

    return (
        <>
            {/* Backdrop Overlay (only shown when open) */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <div
                className={`fixed top-0 left-0 h-full w-64 max-w-xs bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${transformStyle}`}
            >
                {/* Header (Title and Close Button) */}
                <div className="flex justify-between items-center h-16 px-4 border-b border-gray-800">
                    <span className="text-xl font-bold text-cyan-400">Navigation</span>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white"
                        aria-label="Close menu"
                    >
                        <IconX className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation Links (Increased text size and padding) */}
                <nav className="p-4 flex flex-col gap-2">
                    {navItems.map((item) => (
                        <button
                            key={item.page}
                            onClick={() => handleNavigation(item.page)}
                            className={`flex items-center justify-between w-full text-left px-4 py-3 rounded-lg transition-colors duration-150 text-base ${
                                currentPage === item.page
                                    ? 'bg-cyan-600 text-white font-semibold'
                                    : 'text-gray-300 hover:bg-gray-800'
                            }`}
                        >
                            {item.name}
                            {currentPage === item.page && <IconChevronRight className="w-5 h-5" />}
                        </button>
                    ))}
                </nav>
            </div>
        </>
    );
};

// --- Search Bar Overlay Component ---
const SearchBarOverlay = ({ isOpen, onClose, setSearchQuery }) => {
    const opacityStyle = isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none';
    const scaleStyle = isOpen ? 'scale-100' : 'scale-95';
    
    const handleSearch = (e) => {
        e.preventDefault();
        const query = e.target.search.value.trim();
        setSearchQuery(query); // Set the search query in the App state
        onClose();
    };

    return (
        <div 
            className={`fixed inset-0 bg-black/80 z-40 transition-opacity duration-300 flex items-start justify-center p-4 sm:p-10 ${opacityStyle}`}
            onClick={onClose} 
        >
            <div 
                className={`w-full max-w-2xl bg-gray-900 rounded-xl shadow-2xl transform transition-transform duration-300 ${scaleStyle}`}
                onClick={(e) => e.stopPropagation()} 
            >
                <div className="p-4 sm:p-6">
                    <form onSubmit={handleSearch} className="flex items-center gap-3">
                        <IconSearch className="h-6 w-6 text-gray-500 flex-shrink-0" />
                        <input
                            type="search"
                            name="search"
                            placeholder="Search documentation (e.g., Python class, C++ loop...)"
                            className="w-full bg-transparent border-none focus:ring-0 text-white text-lg placeholder-gray-500 outline-none"
                            autoFocus
                        />
                        <button type="submit" className="p-2 rounded-full text-cyan-400 hover:bg-gray-800 flex-shrink-0" aria-label="Execute Search">
                            <IconChevronRight className="w-6 h-6 transform rotate-90" />
                        </button>
                        <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-red-900/50 flex-shrink-0" aria-label="Close Search">
                            <IconX className="w-6 h-6" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};


// --- Header Component (FIXED BUTTON STYLE AND ICON) ---
const Header = ({ onMenuClick, onSearchClick, onBack }) => (
  <header className="sticky top-0 z-20 w-full border-b border-gray-800 bg-gray-950 text-white mobile-header">
    <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        {/*
          UPDATED BUTTON:
          1. Removed the custom 'docs-sidebar-toggle' class entirely.
          2. Removed fixed size classes (w-12 h-12).
          3. Used only minimal padding (p-2) for better touch targets, and Tailwind classes for color/hover.
        */}
        <button 
            id="docs-sidebar-toggle" 
            onClick={onMenuClick}
            className="p-2 text-cyan-400 hover:text-white transition-colors duration-150 mr-2"
            title="Open Documentation Navigation"
        >
            <IconList className="w-6 h-6" />
        </button>

        <IconCode className="h-7 w-7 text-cyan-400" />
        <span className="text-xl font-bold">SpyLanguage Docs</span>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-cyan-600/70 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/10 hover:text-white transition-colors"
        >
          Back to Home
        </button>
        {/* Search Button */}
        <button
          aria-label="Search"
          onClick={onSearchClick}
          className="rounded-full p-2 text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <IconSearch className="h-6 w-6" />
        </button>
      </div>
    </nav>
  </header>
);

// --- Custom Code Block Component ---
const CodeBox = ({ children, language }) => {
    const label = language.toUpperCase() + " Block";
    const codeContent = children.props.children; 

    const copyToClipboard = () => {
        const textarea = document.createElement('textarea');
        textarea.value = codeContent;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        // Simple visual confirmation
        const button = document.getElementById(`copy-button-${language}`);
        const originalText = button.innerHTML;
        button.innerHTML = 'Copied!';
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 1500);
    };

    return (
        <div className="not-prose my-6 rounded-lg border border-gray-700 bg-gray-900 shadow-xl overflow-hidden">
            {/* Header with Language Label and Copy Button */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700 bg-gray-800/50">
                <span className="text-sm font-mono font-semibold text-fuchsia-300">{label}</span>
                <button
                    id={`copy-button-${language}`}
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-cyan-400 transition-colors duration-150 p-1 rounded-md"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2z"/></svg>
                    Copy Code
                </button>
            </div>
            {/* Code Content Area */}
            <div className="p-4 overflow-x-auto text-sm text-gray-100">
                {/* The 'prose' style will handle the inner <pre><code> */}
                <div className="prose dark:prose-invert max-w-none prose-code:text-fuchsia-300 prose-pre:bg-transparent prose-pre:p-0">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Page Content Wrapper ---
const ContentWrapper = ({ children }) => (
  <article className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-cyan-300 prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-cyan-100 prose-code:text-fuchsia-300">
    {children}
  </article>
);


// =========================================================
// --- PAGE CONTENT COMPONENTS (Defined Once and Correctly) ---
// =========================================================

const HomePage = ({ setPage }) => {
  const [activeTab, setActiveTab] = useState('creations');
  
  // Content for each tab
  const tabContent = {
    creations: (
      <div>
        <p>
          This is the primary goal of Spy Language. Combine the strengths of 
          each language in your Spider Notebook App to build complex, multi-domain
          applications.
        </p>
        <ol>
          <li>Use <strong>Python</strong> for rapid scripting, UI, and data manipulation.</li>
          <li>Use <strong>Java</strong> for building robust, scalable backend logic and services.</li>
          <li>Use <strong>C++</strong> for high-performance computation, physics engines, or direct hardware access.</li>
        </ol>
        <p>
          Start by creating a main Python script and offload heavy tasks to
          C++ or Java blocks.
        </p>
      </div>
    ),
    data: (
      <div>
        <p>
          Leverage Python's world-class data science ecosystem (like Pandas, NumPy,
          and Scikit-learn) for analysis and modeling.
        </p>
        <ol>
          <li>Use <strong>Python</strong> blocks to load, clean, and analyze your data.</li>
          <li>When performance is critical (e.g., on massive datasets), you can
            write custom data processing algorithms in a <strong>C++</strong> block.</li>
          <li>Serve your models or results using a <strong>Java</strong> block as a stable API endpoint.</li>
        </ol>
      </div>
    ),
    backend: (
      <div>
        <p>
          Build powerful and reliable backend systems using Java's mature
          ecosystem, enhanced with Python and C++.
        </p>
        <ol>
          <li>Use <strong>Java</strong> for the core application logic, database connections, and API endpoints.</li>
          <li>Use <strong>Python</strong> blocks for writing quick admin scripts, automation tasks, or data-driven reports.</li>
          <li>Integrate high-speed <strong>C++</strong> libraries for specialized tasks like 
            cryptography or real-time data streaming.</li>
        </ol>
      </div>
    ),
    automation: (
      <div>
        <p>
          Automate complex workflows that span multiple systems or domains.
        </p>
        <ol>
          <li>Use <strong>Python</strong> as the main "glue" language to script tasks and call other programs.</li>
          <li>Interface with enterprise-level Java applications by creating a <strong>Java</strong> block.</li>
          <li>Control low-level system processes or hardware directly using a <strong>C++</strong> block.</li>
        </ol>
      </div>
    ),
  };
  
  return (
    <ContentWrapper>
      <h1>Get started with Spy Language</h1>
      <p className="text-lg text-gray-400">
        Edit page: 3 November 2025
      </p>

      <div className="not-prose my-6 rounded-lg border border-cyan-900 bg-cyan-900/20 p-4">
        <span className="font-semibold text-cyan-300">Latest Release: 1.0.0</span>
      </div>

      <p>
        Spy Language is a modern, multi-domain format designed to make complex
        creations easier. It's concise, powerful, and interoperable,
        allowing you to combine Python, Java, and C++ in a single
        workflow within the <strong>Spider Notebook App</strong>.
      </p>
      <p>
        To start, why not take our tour? This tour covers the fundamentals of
        the Spy Language format and can be completed entirely within your
        browser.
      </p>
      
      {/* --- NEW SECTION: CODE BLOCK EXPLANATION --- */}
      <h2 id="what-is-a-code-block">What is a Code Block?</h2>
      <p>
        In the Spy Language format, a code block is a self-contained unit of code designated by the language it uses (Python, C++, or Java). When you write `\`\`\`python`, you are creating a block that the Spider Notebook App knows to execute using the Python interpreter.
      </p>

      <h3>Example: Spy Language Syntax</h3>
      <CodeBox language="text">
          <pre><code className="language-text">
{`
// This is what the code block syntax means at the start of every block:
\`\`\`python 
this is what code block means
\`\`\`
`}
          </code></pre>
      </CodeBox>
      {/* --- END NEW SECTION --- */}


      <button 
        className="not-prose mt-4 inline-block rounded-full bg-cyan-600 px-8 py-3 font-bold text-white shadow-[0_0_15px_theme(colors.cyan.600)] transition-shadow duration-300 hover:bg-cyan-700 hover:shadow-[0_0_20px_theme(colors.cyan.500)] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
        onClick={() => setPage('basics')}
      >
        Start Spy Language Tour →
      </button>

      {/* --- CORE BLOCKS DEMO (Moved down slightly) --- */}
      <h2 id="format">The Spy Language Format: Core Blocks</h2>
      <p>
        The power of Spy Language comes from combining Python, Java, and C++ in distinct, executable blocks within your Spider Notebook. This allows you to leverage the strengths of each language for different parts of your complex creation. This is what Spy Language syntax is!
      </p>

      <h3>Python Block (Scripting)</h3>
      <CodeBox language="python">
          <pre><code className="language-python">
{`
\`\`\`python
print("Hello World")
\`\`\`
`}
          </code></pre>
      </CodeBox>
      
      <h3>Java Block (Backend Service)</h3>
      <CodeBox language="java">
          <pre><code className="language-java">
{`
\`\`\`java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
\`\`\`
`}
          </code></pre>
      </CodeBox>

      <h3>C++ Block (Performance/System)</h3>
      <CodeBox language="cpp">
          <pre><code className="language-cpp">
{`
\`\`\`cpp
#include <iostream>
int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
\`\`\`
`}
          </code></pre>
      </CodeBox>
      {/* --- END CORE BLOCKS DEMO --- */}


      <h2 id="install">Install Spy Language</h2>
      <p>
        Spy Language is included by default in the <strong>Spider Notebook App</strong>.
        Just open the app and create a new Spy Notebook to get started.
        No separate installation is required.
      </p>

      <h2 id="use-cases">Choose your use case</h2>
      <div className="not-prose my-6 flex flex-wrap gap-2 border-b border-gray-800 pb-2">
        <button 
          className={`rounded-t-lg border-b-2 px-4 py-2 font-medium ${
            activeTab === 'creations' 
            ? 'border-cyan-500 text-cyan-400' 
            : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('creations')}
        >
          Complex Creations
        </button>
        <button 
          className={`rounded-t-lg border-b-2 px-4 py-2 font-medium ${
            activeTab === 'data' 
            ? 'border-cyan-500 text-cyan-400' 
            : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('data')}
        >
          Data Analysis
        </button>
        <button 
          className={`rounded-t-lg border-b-2 px-4 py-2 font-medium ${
            activeTab === 'backend' 
            ? 'border-cyan-500 text-cyan-400' 
            : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('backend')}
        >
          Backend Systems
        </button>
        <button 
          className={`rounded-t-lg border-b-2 px-4 py-2 font-medium ${
            activeTab === 'automation' 
            ? 'border-cyan-500 text-cyan-400' 
            : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('automation')}
        >
          Automation
        </button>
      </div>
      
      {/* Content for the tabs - This now renders dynamically */}
      <div className="mt-4">
        {tabContent[activeTab]}
      </div>
    </ContentWrapper>
  );
};

const BasicsPage = () => (
  <ContentWrapper>
    <h1>Spy Language Basics</h1>
    <p>
      Welcome to the beginner's pack! In the Spy Language format, you
      don't learn a new language. Instead, you use the standard "basics"
      of Python, Java, or C++ inside their designated code blocks.
    </p>

    {/* --- CODE BLOCK SYNTAX EXPLANATION --- */}
    <h2 id="spy-syntax-basics">Spy Language Syntax is Mandatory</h2>
    <p>
        Every code sample shown uses the Spy Language syntax, which requires the `\`\`\`[language]` declaration at the start of the block so the Spider Notebook App knows how to execute it. This is what Spy Language syntax is!
    </p>

    <p>
      Here’s how to handle the most common programming basics in each language.
    </p>

    {/* --- Variables and Data Types --- */}
    <h2 id="variables" className="!mt-12 border-t border-gray-800 pt-10">Variables and Data Types</h2>
    <p>
      Variables are containers for storing data values. The syntax
      is different for each language.
    </p>

    <h3>Python</h3>
    <p>
      Python is dynamically typed, so you don't need to declare
      the variable's type.
    </p>
    <CodeBox language="python">
        <pre><code className="language-python">
{`
\`\`\`python
# --- Python Block ---
# Variables are created when you assign a value
agent_name = "007"      # String
agent_level = 7         # Integer
agent_active = True     # Boolean
agent_rate = 9.5        # Float

print(f"Agent: {agent_name}")
print(f"Level: {agent_level}")
\`\`\`
`}
            </code></pre>
    </CodeBox>

    <h3>Java</h3>
    <p>
      Java is statically typed, meaning you must declare the
      variable's type before use.
    </p>
    <CodeBox language="java">
        <pre><code className="language-java">
{`
\`\`\`java
// --- Java Block ---
public class AgentInfo {
    public static void main(String[] args) {
        // You must declare the type
        String agentName = "007";
        int agentLevel = 7;
        boolean agentActive = true;
        double agentRate = 9.5;

        System.out.println("Agent: " + agentName);
        System.out.println("Level: " + agentLevel);
    }
}
\`\`\`
`}
            </code></pre>
    </CodeBox>

    <h3>C++</h3>
    <p>
      C++ is also statically typed. You must declare the type.
    </p>
    <CodeBox language="cpp">
        <pre><code className="language-cpp">
{`
\`\`\`cpp
// --- C++ Block ---
#include <iostream>
#include <string> // Required for string type

int main() {
    // You must declare the type
    std::string agentName = "007";
    int agentLevel = 7;
    bool agentActive = true;
    double agentRate = 9.5;

    std::cout << "Agent: " << agentName << std::endl;
    std::cout << "Level: " << agentLevel << std::endl;
    
    return 0;
}
\`\`\`
`}
            </code></pre>
    </CodeBox>
    
    {/* --- Strings --- */}
    <h2 id="strings" className="!mt-12 border-t border-gray-800 pt-10">Strings</h2>
    <p>
      Strings are used to store text. Here’s how to define and
      combine (concatenate) them.
    </p>

    <h3>Python</h3>
    <CodeBox language="python">
        <pre><code className="language-python">
{`
\`\`\`python
# --- Python Block ---
first_name = "James"
last_name = "Bond"

# Combine using f-strings (recommended)
full_name = f"{first_name} {last_name}"
print(full_name)

# Combine using +
mission = "Mission: " + "Skyfall"
print(mission)
\`\`\`
`}
            </code></pre>
    </CodeBox>

    <h3>Java</h3>
    <CodeBox language="java">
        <pre><code className="language-java">
{`
\`\`\`java
// --- Java Block ---
public class StringDemo {
    public static void main(String[] args) {
        String firstName = "James";
        String lastName = "Bond";

        // Combine using +
        String fullName = firstName + " " + lastName;
        System.out.println(fullName);

        String mission = "Mission: " + "Skyfall";
        System.out.println(mission);
    }
}
\`\`\`
`}
            </code></pre>
    </CodeBox>

    <h3>C++</h3>
    <CodeBox language="cpp">
        <pre><code className="language-cpp">
{`
\`\`\`cpp
// --- C++ Block ---
#include <iostream>
#include <string>

int main() {
    std::string firstName = "James";
    std::string lastName = "Bond";

    // Combine using +
    std::string fullName = firstName + " " + lastName;
    std::cout << fullName << std::endl;

    std::string mission = "Mission: " + "Skyfall";
    std::cout << mission << std::endl;
    
    return 0;
}
\`\`\`
`}
            </code></pre>
    </CodeBox>

    {/* --- Comments --- */}
    <h2 id="comments" className="!mt-12 border-t border-gray-800 pt-10">Comments</h2>
    <p>
      Comments are used to explain code. They are ignored by the
      compiler or interpreter.
    </p>
    
    <h3>Python</h3>
    <CodeBox language="python">
        <pre><code className="language-python">
{`
\`\`\`python
# --- Python Block ---
# This is a single-line comment

"""
This is a
multi-line comment
(technically a docstring, but used this way)
"""
x = 10 # This is an inline comment
\`\`\`
`}
            </code></pre>
    </CodeBox>
    
    <h3>Java</h3>
    <CodeBox language="java">
        <pre><code className="language-java">
{`
\`\`\`java
// --- Java Block ---
// This is a single-line comment

/*
This is a
multi-line comment
*/
int x = 10; // This is an inline comment
\`\`\`
`}
            </code></pre>
    </CodeBox>

    <h3>C++</h3>
    <CodeBox language="cpp">
        <pre><code className="language-cpp">
{`
\`\`\`cpp
// --- C++ Block ---
// This is a single-line comment

/*
This is a
multi-line comment
*/
int x = 10; // This is an inline comment
\`\`\`
`}
            </code></pre>
    </CodeBox>
  </ContentWrapper>
);

const ConceptsPage = () => (
    <ContentWrapper>
        <h1>Core Concepts</h1>
        <p>
            This section covers the core concepts you'll use in every
            Spy Language block, from basic syntax to defining reusable logic.
        </p>

        {/* --- CODE BLOCK SYNTAX EXPLANATION --- */}
        <h2 id="spy-syntax-concepts">Spy Language Syntax is Mandatory</h2>
        <p>
            Every code sample shown uses the Spy Language syntax, which requires the `\`\`\`[language]` declaration at the start of the block so the Spider Notebook App knows how to execute it. This is what Spy Language syntax is!
        </p>
        
        {/* --- Core Syntax --- */}
        <h2 id="syntax" className="!mt-12 border-t border-gray-800 pt-10">Core Syntax Example</h2>
        <p>
            A Spy Language file in your Spider Notebook App is a collection
            of code blocks. Here is the classic "Hello, World!" example
            demonstrating the required syntax for each block.
        </p>
        
        <CodeBox language="python">
            <pre><code className="language-python">
{`
\`\`\`python
# --- Python Block ---
print("Hello, World!")
\`\`\`
`}
            </code></pre>
        </CodeBox>

        <CodeBox language="java">
            <pre><code className="language-java">
{`
\`\`\`java
// --- Java Block ---
public class HelloWorld {
    public static void main(String[] args) {
        // System.out.println prints a line of text to the console
        System.out.println("Hello, World!");
    }
}
\`\`\`
`}
            </code></pre>
        </CodeBox>

        <CodeBox language="cpp">
            <pre><code className="language-cpp">
{`
\`\`\`cpp
// --- C++ Block ---
#include <iostream>

int main() {
    // std::cout is the standard output stream
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
\`\`\`
`}
            </code></pre>
        </CodeBox>

        {/* --- Control Flow --- */}
        <h2 id="control-flow" className="!mt-12 border-t border-gray-800 pt-10">Control Flow (if/else)</h2>
        <p>
            Control flow statements allow you to make decisions in your code.
            The most common is `if`/`else`.
        </p>

        <h3>Python</h3>
        <CodeBox language="python">
            <pre><code className="language-python">
{`
\`\`\`python
# --- Python Block ---
agent_clearance = 7

if agent_clearance > 5:
    print("Access Granted: Level 5+")
elif agent_clearance == 5:
    print("Access Granted: Level 5")
else:
    print("Access Denied")
\`\`\`
`}
            </code></pre>
        </CodeBox>

        <h3>Java</h3>
        <CodeBox language="java">
            <pre><code className="language-java">
{`
\`\`\`java
// --- Java Block ---
public class ControlFlow {
    public static void main(String[] args) {
        int agentClearance = 7;

        if (agentClearance > 5) {
            System.out.println("Access Granted: Level 5+");
        } else if (agentClearance == 5) {
            System.out.println("Access Granted: Level 5");
        } else {
            System.out.println("Access Denied");
        }
    }
}
\`\`\`
`}
            </code></pre>
        </CodeBox>

        <h3>C++</h3>
        <CodeBox language="cpp">
            <pre><code className="language-cpp">
{`
\`\`\`cpp
// --- C++ Block ---
#include <iostream>

int main() {
    int agentClearance = 7;

    if (agentClearance > 5) {
        std::cout << "Access Granted: Level 5+" << std::endl;
    } else if (agentClearance == 5) {
        std::cout << "Access Granted: Level 5" << std::endl;
    } else {
        std::cout << "Access Denied" << std::endl;
    }
    return 0;
}
\`\`\`
`}
            </code></pre>
        </CodeBox>
        
        {/* --- Loops --- */}
        <h2 id="loops" className="!mt-12 border-t border-gray-800 pt-10">Loops (for/while)</h2>
        <p>
            Loops allow you to repeat a block of code multiple times.
        </p>

        <h3>Python</h3>
        <CodeBox language="python">
            <pre><code className="language-python">
{`
\`\`\`python
# --- Python Block ---
# for loop
print("--- For Loop ---")
for i in range(5):
    print(f"Agent count: {i}")

# while loop
print("\\n--- While Loop ---")
count = 0
while count < 3:
    print(f"Checking systems... {count}")
    count += 1
\`\`\`
`}
            </code></pre>
        </CodeBox>

        <h3>Java</h3>
        <CodeBox language="java">
            <pre><code className="language-java">
{`
\`\`\`java
// --- Java Block ---
public class Loops {
    public static void main(String[] args) {
        // for loop
        System.out.println("--- For Loop ---");
        for (int i = 0; i < 5; i++) {
            System.out.println("Agent count: " + i);
        }

        // while loop
        System.out.println("\\n--- While Loop ---");
        int count = 0;
        while (count < 3) {
            System.out.println("Checking systems... " + count);
            count++;
        }
    }
}
\`\`\`
`}
            </code></pre>
        </CodeBox>

        <h3>C++</h3>
        <CodeBox language="cpp">
            <pre><code className="language-cpp">
{`
\`\`\`cpp
// --- C++ Block ---
#include <iostream>

int main() {
    // for loop
    std::cout << "--- For Loop ---" << std::endl;
    for (int i = 0; i < 5; i++) {
        std::cout << "Agent count: " << i << std::endl;
    }

    // while loop
    std::cout << "\\n--- While Loop ---" << std::endl;
    int count = 0;
    while (count < 3) {
        std::cout << "Checking systems... " << count << std::endl;
        count++;
    }
    return 0;
}
\`\`\`
`}
            </code></pre>
        </CodeBox>

        {/* --- Functions --- */}
        <h2 id="functions" className="!mt-12 border-t border-gray-800 pt-10">Functions</h2>
        <p>
            Functions are blocks of reusable code. You define them
            and then "call" them when you need them.
        </p>

        <h3>Python</h3>
        <CodeBox language="python">
            <pre><code className="language-python">
{`
\`\`\`python
# --- Python Block ---
def greet_agent(agent_id):
    """Greets a specific agent."""
    print(f"Welcome, Agent {agent_id}.")

def get_clearance_level(agent_id):
    # Some logic to find clearance
    if agent_id == "007":
        return 7
    return 3

# Call the functions
greet_agent("007")
level = get_clearance_level("007")
print(f"Clearance level: {level}")
\`\`\`
`}
            </code></pre>
        </CodeBox>

        <h3>Java</h3>
        <p>In Java, functions are called "methods" and must belong to a class.</p>
        <CodeBox language="java">
            <pre><code className="language-java">
{`
\`\`\`java
// --- Java Block ---
public class AgentUtils {
    
    // Method definition
    public void greetAgent(String agentId) {
        System.out.println("Welcome, Agent " + agentId);
    }

    public int getClearanceLevel(String agentId) {
        // Some logic to find clearance
        if ("007".equals(agentId)) {
            return 7;
        }
        return 3;
    }

    public static void main(String[] args) {
        // Create an instance of the class to call methods
        AgentUtils utils = new AgentUtils();
        
        // Call the methods
        utils.greetAgent("007");
        int level = utils.getClearanceLevel("007");
        System.out.println("Clearance level: " + level);
    }
}
\`\`\`
`}
            </code></pre>
        </CodeBox>

        <h3>C++</h3>
        <CodeBox language="cpp">
            <pre><code className="language-cpp">
{`
\`\`\`cpp
// --- C++ Block ---
#include <iostream>
#include <string>

// Function declaration (prototype)
void greetAgent(std::string agentId);
int getClearanceLevel(std::string agentId);

int main() {
    // Call the functions
    greetAgent("007");
    int level = getClearanceLevel("007");
    std::cout << "Clearance level: " << level << std::endl;
    return 0;
}

// Function definition
void greetAgent(std::string agentId) {
    std::cout << "Welcome, Agent " << agentId << std::endl;
}

int getClearanceLevel(std::string agentId) {
    // Some logic to find clearance
    if (agentId == "007") {
        return 7;
    }
    return 3;
}
\`\`\`
`}
            </code></pre>
        </CodeBox>

        {/* --- Collections --- */}
        <h2 id="collections" className="!mt-12 border-t border-gray-800 pt-10">Collections (Lists & Maps)</h2>
        <p>
            Collections are used to store groups of data. The most common
            are Lists (ordered items) and Maps (key-value pairs).
        </p>

        <h3>Python</h3>
        <p>Python uses `list` and `dict` (dictionary).</p>
        <CodeBox language="python">
            <pre><code className="language-python">
{`
\`\`\`python
# --- Python Block ---
# List
agents = ["007", "009", "M", "Q"]
print(f"First agent: {agents[0]}")
agents.append("Moneypenny")
print(f"Agents: {agents}")

# Dictionary (Map)
clearance = {"007": 7, "009": 5, "M": 10}
print(f"M's clearance: {clearance['M']}")
clearance["Q"] = 8
print(f"Clearances: {clearance}")
\`\`\`
`}
            </code></pre>
        </CodeBox>

        <h3>Java</h3>
        <p>Java uses `List` (commonly `ArrayList`) and `Map` (commonly `HashMap`).</p>
        <CodeBox language="java">
            <pre><code className="language-java">
{`
\`\`\`java
// --- Java Block ---
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CollectionsDemo {
    public static void main(String[] args) {
        // List
        List<String> agents = new ArrayList<>();
        agents.add("007");
        agents.add("009");
        agents.add("M");
        System.out.println("First agent: " + agents.get(0));
        
        // Map
        Map<String, Integer> clearance = new HashMap<>();
        clearance.put("007", 7);
        clearance.put("M", 10);
        System.out.println("M's clearance: " + clearance.get("M"));
    }
}
\`\`\`
`}
            </code></pre>
        </CodeBox>

        <h3>C++</h3>
        <p>C++ uses `std::vector` and `std::map` from the STL.</p>
        <CodeBox language="cpp">
            <pre><code className="language-cpp">
{`
\`\`\`cpp
// --- C++ Block ---
#include <iostream>
#include <vector>
#include <string>
#include <map>

int main() {
    // Vector (List)
    std::vector<std::string> agents = {"007", "009", "M"};
    std::cout << "First agent: " << agents[0] << std::endl;
    agents.push_back("Q");
    
    // Map
    std::map<std::string, int> clearance;
    clearance["007"] = 7;
    clearance["M"] = 10;
    std::cout << "M's clearance: " << clearance["M"] << std::endl;
    
    return 0;
}
\`\`\`
`}
            </code></pre>
        </CodeBox>

        {/* --- Classes & Objects --- */}
        <h2 id="classes" className="!mt-12 border-t border-gray-800 pt-10">Classes & Objects</h2>
        <p>
            Classes are blueprints for creating objects. This is the
            foundation of Object-Oriented Programming (OOP).
        </p>

        <h3>Python</h3>
        <CodeBox language="python">
            <pre><code className="language-python">
{`
\`\`\`python
# --- Python Block ---
class Agent:
    # Constructor
    def __init__(self, agent_id, status):
        self.agent_id = agent_id
        self.status = status

    # Method
    def report_status(self):
        print(f"Agent {self.agent_id} is {self.status}")

# Create an object (instance) of the class
bond = Agent("007", "Active")
bond.report_status() // Call the method
\`\`\`
`}
            </code></pre>
        </CodeBox>

        <h3>Java</h3>
        <CodeBox language="java">
            <pre><code className="language-java">
{`
\`\`\`java
// --- Java Block ---
public class Agent {
    // Fields
    String agentId;
    String status;

    // Constructor
    public Agent(String agentId, String status) {
        this.agentId = agentId;
        this.status = status;
    }

    // Method
    public void reportStatus() {
        System.out.println("Agent " + this.agentId + " is " + this.status);
    }
    
    public static void main(String[] args) {
        // Create an object (instance) of the class
        Agent bond = new Agent("007", "Active");
        bond.reportStatus(); // Call the method
    }
}
\`\`\`
`}
            </code></pre>
        </CodeBox>

        <h3>C++</h3>
        <CodeBox language="cpp">
            <pre><code className="language-cpp">
{`
\`\`\`cpp
// --- C++ Block ---
#include <iostream>
#include <string>

class Agent {
public:
    // Fields
    std::string agentId;
    std::string status;

    // Constructor
    Agent(std::string id, std::string st) {
        agentId = id;
        status = st;
    }

    // Method
    void reportStatus() {
        std::cout << "Agent " << agentId << " is " << status << std::endl;
    }
};

int main() {
    // Create an object (instance) of the class
    Agent bond("007", "Active");
    bond.reportStatus(); // Call the method
    return 0;
}
\`\`\`
`}
            </code></pre>
        </CodeBox>
    </ContentWrapper>
);


// --- NEW ADVANCED PAGE CONTENT (Multiple Blocks per Section) ---
const AdvancedPage = () => (
    <ContentWrapper>
        <h1>Advanced Spy Language</h1>
        <p>
            The Advanced section focuses on interoperability, concurrent execution, and handling external data sources. These concepts are crucial when building complex, multi-layered applications in your Spider Notebook App.
        </p>
        
        <h2 id="spy-syntax-advanced">Spy Language Syntax is Mandatory</h2>
        <p>
            Every code sample shown uses the Spy Language syntax, which requires the `\`\`\`[language]` declaration at the start of the block so the Spider Notebook App knows how to execute it. This is what Spy Language syntax is!
        </p>

        {/* --- Advanced Example 1: Interoperability: Python Orchestrating C++ Processing --- */}
        <h2 id="interop" className="!mt-12 border-t border-gray-800 pt-10">Advanced 1: Python Orchestrating C++ Processing</h2>
        <p>
            This example shows Python setting up the data (Data Science strength) and calling a highly efficient C++ routine for heavy mathematical computation.
        </p>

        <h3>C++ Block (1/2): High-Speed Dot Product Calculation</h3>
        <p>
            This C++ code defines the core, performance-critical function.
        </p>
        <CodeBox language="cpp">
            <pre><code className="language-cpp">
{`
\`\`\`cpp
#include <iostream>
#include <vector>
#include <numeric>

// Core function for high-speed calculation
// Assume Spy Bridge handles passing the vector data efficiently.
double calculate_dot_product(const std::vector<double>& a, const std::vector<double>& b) {
    if (a.size() != b.size()) {
        std::cerr << "Error: Vectors must be the same size for dot product." << std::endl;
        return 0.0;
    }
    double result = 0.0;
    for (size_t i = 0; i < a.size(); ++i) {
        result += a[i] * b[i]; // CPU-intensive loop
    }
    return result;
}

// C++ code to be compiled and linked by the Spider Notebook
\`\`\`
`}
            </code></pre>
        </CodeBox>

        <h3>Python Block (2/2): Data Setup and Execution</h3>
        <p>
            Python sets up large NumPy arrays and executes the C++ function via the conceptual Spy Bridge.
        </p>
        <CodeBox language="python">
            <pre><code className="language-python">
{`
\`\`\`python
# --- Python Block ---
import numpy as np
# from spy_bridge import cpp_call # Conceptual function

# 1. Python sets up large datasets
vector_a = np.random.rand(1000).tolist()
vector_b = np.random.rand(1000).tolist()

print(f"Data prepared: {len(vector_a)} elements each.")

# 2. Simulate calling the C++ function
# result = cpp_call("calculate_dot_product", vector_a, vector_b)
result = 450.789 # Simulated result

print(f"Result from C++ Dot Product: {result:.3f}")

if result > 400.0:
    print("Protocol: High computation threshold met.")
\`\`\`
`}
            </code></pre>
        </CodeBox>
        
        {/* --- Advanced Example 3: Concurrency and Deadlock Management (Java) (UPDATED SECTION) --- */}
        <h2 id="concurrency" className="!mt-12 border-t border-gray-800 pt-10">Advanced 2: Concurrency and Deadlock Management (Java)</h2>
        <p>
            When using Java for core application services, managing concurrent access to shared resources is essential to prevent data corruption and **deadlocks**. Deadlocks occur when two threads are blocked indefinitely, each waiting for the other to release a resource.
        </p>

        <h3>Java Block: Deadlock Prevention via Consistent Locking Order</h3>
        <p>
            This example shows how to safely transfer funds between two accounts (resources) by guaranteeing that the lock on the `source` account is **always** acquired before the lock on the `destination` account. This consistent locking order is the key to preventing deadlocks.
        </p>
        <CodeBox language="java">
            <pre><code className="language-java">
{`
\`\`\`java
// --- Java Block: Concurrency Example ---
// This requires Java's synchronized keyword for thread safety.

public class Account {
    private final int id;
    private double balance;

    public Account(int id, double balance) {
        this.id = id;
        this.balance = balance;
    }

    public void withdraw(double amount) {
        balance -= amount;
        System.out.println("Account " + id + " withdrew " + amount);
    }

    public void deposit(double amount) {
        balance += amount;
        System.out.println("Account " + id + " deposited " + amount);
    }
    
    public int getId() { return id; }
    public double getBalance() { return balance; }
}

public class DeadlockSafeTransfer {
    /**
     * Safely transfers funds between two accounts, preventing deadlock 
     * by always locking the account with the smaller ID first.
     */
    public static void transfer(Account source, Account destination, double amount) {
        
        // 1. Determine the locking order based on a consistent criterion (Account ID)
        final Object lock1 = (source.getId() < destination.getId()) ? source : destination;
        final Object lock2 = (source.getId() < destination.getId()) ? destination : source;

        // 2. Acquire locks in the fixed order (lock1 then lock2)
        synchronized (lock1) {
            System.out.println("Thread acquired lock on Account ID: " + ((Account)lock1).getId());
            synchronized (lock2) {
                System.out.println("Thread acquired lock on Account ID: " + ((Account)lock2).getId());
                
                // 3. Perform the transaction inside the critical section
                if (source.getBalance() >= amount) {
                    source.withdraw(amount);
                    destination.deposit(amount);
                    System.out.println("TRANSFER SUCCESSFUL: " + amount);
                } else {
                    System.out.println("TRANSFER FAILED: Insufficient funds in Account " + source.getId());
                }
            }
        }
    }

    public static void main(String[] args) {
        Account agentBond = new Account(7, 1000.0);
        Account qBranch = new Account(1, 5000.0);

        System.out.println("Initial Bond: " + agentBond.getBalance());
        System.out.println("Initial Q: " + qBranch.getBalance());

        // Example: Transfer from Bond (7) to Q (1) -> Locks 1 then 7
        transfer(agentBond, qBranch, 100.0);

        // Example: Transfer from Q (1) to Bond (7) -> Locks 1 then 7 (consistent order)
        transfer(qBranch, agentBond, 200.0);

        System.out.println("\\nFinal Bond: " + agentBond.getBalance());
        System.out.println("Final Q: " + qBranch.getBalance());
    }
}
\`\`\`
`}
            </code></pre>
        </CodeBox>


        {/* --- Advanced Example 4: Python for Automated System Monitoring (Renumbered) --- */}
        <h2 id="monitoring" className="!mt-12 border-t border-gray-800 pt-10">Advanced 3: Python for Automated Monitoring</h2>
        <p>
            Python is the best language for automation, using its easy syntax to monitor system health and generate reports.
        </p>
        
        <h3>Python Block (1/1): System Check Script</h3>
        <CodeBox language="python">
            <pre><code className="language-python">
{`
\`\`\`python
# --- Python Block ---
import time
import random

def check_system_status(system_id):
    # Simulate API call or system check
    latency_ms = random.randint(50, 500)
    cpu_load = random.uniform(10.0, 95.0)
    
    if cpu_load > 90 and latency_ms > 400:
        status = "ALERT: High Load & Latency"
    elif cpu_load > 70:
        status = "WARNING: Elevated CPU"
    else:
        status = "OK"
        
    print(f"System {system_id}: Status={status}, CPU={cpu_load:.1f}%, Latency={latency_ms}ms")
    return status

# Run the check for multiple systems
systems = ["ALPHA-DB", "BETA-API", "GAMMA-PROC"]
print("--- Automated System Monitor Running ---")
for s in systems:
    check_system_status(s)
    time.sleep(0.5)
\`\`\`
`}
            </code></pre>
        </CodeBox>

        
        {/* --- Advanced Example 2: Java REST Service Simulation (Renumbered and moved down) --- */}
        <h2 id="java-service" className="!mt-12 border-t border-gray-800 pt-10">Advanced 4: Java REST Service Simulation</h2>
        <p>
            A typical enterprise pattern uses a Java backend service to manage application state and database access, ensuring robust concurrency and stability.
        </p>

        <h3>Java Block (1/2): Data Model (POJO)</h3>
        <p>
            The immutable data structure used by the service.
        </p>
        <CodeBox language="java">
            <pre><code className="language-java">
{`
\`\`\`java
// Agent Data Model for the Service
public class AgentProfile {
    private final String id;
    private final String alias;
    private final int status_code;

    public AgentProfile(String id, String alias, int statusCode) {
        this.id = id;
        this.alias = alias;
        this.status_code = statusCode;
    }
    
    // Getters...
    public String getId() { return id; }
    public String getAlias() { return alias; }
    public int getStatusCode() { return status_code; }
}
\`\`\`
`}
            </code></pre>
        </CodeBox>

        <h3>Java Block (2/2): Profile Service Logic</h3>
        <p>
            The service class handling business logic and concurrency. Note the use of `ConcurrentHashMap` for built-in thread-safe data access.
        </p>
        <CodeBox language="java">
            <pre><code className="language-java">
{`
\`\`\`java
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class ProfileService {
    // Use a concurrent map for thread safety in a service environment
    // ConcurrentHashMap handles internal locking for basic operations, avoiding deadlocks.
    private static final Map<String, AgentProfile> DATABASE = new ConcurrentHashMap<>();

    public static AgentProfile fetchProfile(String id) {
        System.out.println("[JAVA SERVICE] Fetching profile for ID: " + id);
        return DATABASE.getOrDefault(id, new AgentProfile(id, "Unknown", 404));
    }

    public static void saveProfile(AgentProfile profile) {
        DATABASE.put(profile.getId(), profile);
        System.out.println("[JAVA SERVICE] Profile saved for: " + profile.getAlias());
    }
    
    public static void main(String[] args) {
        // Initialization example
        saveProfile(new AgentProfile("007", "Bond", 200));
        AgentProfile profile = fetchProfile("007");
        System.out.println("Service response: " + profile.getAlias());
    }
}
\`\`\`
`}
            </code></pre>
        </CodeBox>

    </ContentWrapper>
);

// --- NEW EXTREME PAGE CONTENT (Multiple Blocks per Section) ---
const ExtremePage = () => (
    <ContentWrapper>
        <h1>Extreme Spy Language</h1>
        <p>
            The Extreme section targets the boundary of what's possible in the Spider Notebook App, focusing on absolute performance optimization and low-level control achieved by leveraging raw C++ capabilities. These techniques are reserved for the most demanding multi-domain applications.
        </p>

        <h2 id="spy-syntax-extreme">Spy Language Syntax is Mandatory</h2>
        <p>
            Every code sample shown uses the Spy Language syntax, which requires the `\`\`\`[language]` declaration at the start of the block so the Spider Notebook App knows how to execute it. This is what Spy Language syntax is!
        </p>
        
        {/* --- Extreme Example 1: C++ Low-Level Cryptographic Pipeline --- */}
        <h2 id="low-level-crypto" className="!mt-12 border-t border-gray-800 pt-10">Extreme 1: C++ Low-Level Cryptographic Pipeline</h2>
        <p>
            For maximum security and speed, critical data transformation (like encryption/decryption) should be handled using C++ with direct memory access.
        </p>

        <h3>C++ Block (1/2): Fast Byte Array Transformation</h3>
        <p>
            A function to perform a fast, in-place XOR operation on a byte buffer, essential for low-latency network security protocols.
        </p>
        <CodeBox language="cpp">
            <pre><code className="language-cpp">
{`
\`\`\`cpp
#include <iostream>
#include <vector>

// Function: Performs a fast, in-place XOR operation on a byte 
void fast_byte_transform(std::vector<unsigned char>& data, unsigned char key) {
    // Direct memory access via pointers for maximum speed
    unsigned char* ptr = data.data();
    size_t size = data.size();

    for (size_t i = 0; i < size; ++i) {
        ptr[i] ^= key; 
    }
    std::cout << "[C++] Data transformed (XOR applied) on " << size << " bytes." << std::endl;
}

int main() {
    // C++ block initialization (if needed)
}
\`\`\`
`}
            </code></pre>
        </CodeBox>

        <h3>Python Block (2/2): Data Handling and Verification</h3>
        <p>
            Python handles the high-level data input and output, passing the raw data to the C++ block for processing.
        </p>
        <CodeBox language="python">
            <pre><code className="language-python">
{`
\`\`\`python
# --- Python Block ---
# Simulate raw encrypted packet data
raw_encrypted_data = [0x1A, 0x2B, 0x3C, 0x4D, 0x5E]
secret_key = 0xFF

print(f"Python: Original Data (1st byte): {hex(raw_encrypted_data[0])}")

# Simulate calling the C++ function with the list (passed as byte vector)
# SpyBridge.call_cpp("fast_byte_transform", raw_encrypted_data, secret_key)

# The data is mutated in-place by the C++ block (simulation)
raw_decrypted_data = [d ^ secret_key for d in raw_encrypted_data] 

print(f"Python: Decrypted Data (1st byte): {hex(raw_decrypted_data[0])}")

if raw_decrypted_data[0] == 0xE5: # 0x1A ^ 0xFF = 0xE5
    print("Verification: Decryption successful.")
\`\`\`
`}
            </code></pre>
        </CodeBox>
        
        {/* --- Extreme Example 2: Hybrid Financial Simulation (Java/C++) --- */}
        <h2 id="hybrid-finance" className="!mt-12 border-t border-gray-800 pt-10">Extreme 2: Hybrid Financial Simulation</h2>
        <p>
            Simulating complex financial models requires the stability of Java for pricing logic and the speed of C++ for Monte Carlo simulations over millions of iterations.
        </p>
        
        <h3>Java Block (1/2): Pricing Model Core</h3>
        <p>
            Java ensures the financial model integrity and provides the entry point for the simulation.
        </p>
        <CodeBox language="java">
            <pre><code className="language-java">
{`
\`\`\`java
import java.util.Random;

public class MonteCarloPricer {
    
    public double runSimulation(double initialPrice, int iterations) {
        System.out.println("[JAVA] Running Monte Carlo for " + iterations + " iterations...");
        // Imagine this calls a fast C++ loop for the heavy lifting
        
        double simulatedPrice = initialPrice * 1.05; // Simulate a positive return
        return simulatedPrice;
    }

    // For execution in the Spy Notebook
    public static void main(String[] args) {
        double final_price = new MonteCarloPricer().runSimulation(100.0, 1000000);
        System.out.println("[JAVA] Final Simulated Price: " + final_price);
    }
}
\`\`\`
`}
            </code></pre>
        </CodeBox>
        
        <h3>C++ Block (2/2): High-Throughput Random Generator</h3>
        <p>
            C++ is used here to generate extremely fast, high-quality random numbers needed for the millions of Monte Carlo iterations.
        </p>
        <CodeBox language="cpp">
            <pre><code className="language-cpp">
{`
\`\`\`cpp
#include <iostream>
#include <random>
#include <vector>

// Function: Generates a batch of high-quality random numbers fast
std::vector<double> generate_fast_normals(size_t count) {
    std::random_device rd;
    std::mt19937 generator(rd()); // Mersenne Twister engine
    std::normal_distribution<> distribution(0.0, 1.0); // Mean 0, Std Dev 1
    
    std::vector<double> results;
    results.reserve(count);

    for (size_t i = 0; i < count; ++i) {
        results.push_back(distribution(generator));
    }
    std::cout << "[C++] Generated " << count << " high-quality random normals." << std::endl;
    return results;
}

int main() {
    // This C++ block provides a utility function for Java to call.
}
\`\`\`
`}
            </code></pre>
        </CodeBox>
    </ContentWrapper>
);

const LanguageReferencePage = () => (
  <ContentWrapper>
    <h1>Spy Language Reference</h1>
    <p>
      The Spy Language is not a single language, but a unified format
      for combining Python, Java, and C++ blocks within the
      <strong>Spider Notebook App</strong>. Each block is designated
      by its language, allowing you to use the best tool for the job.
    </p>

    {/* --- CODE BLOCK SYNTAX EXPLANATION (ADDED) --- */}
    <h2 id="spy-syntax-reference">Spy Language Syntax is Mandatory</h2>
    <p>
        Every code sample shown uses the Spy Language
         syntax, which requires the `\`\`\`[language]` declaration at the start of the block so the Spider Notebook App knows how to execute it. This is what Spy Language syntax is!
    </p>
    
    {/* --- Python Section --- */}
    <h2 id="python" className="!mt-12 border-t border-gray-800 pt-10">Python</h2>
    <p>
      Python serves as the primary scripting and data manipulation layer
      within the Spy Language format. It's ideal for quick prototyping,
      data analysis, and machine learning tasks.
    </p>
    <h3>Using Python Blocks</h3>
    <p>
      In the Spider Notebook App, simply designate a code block as "Python"
      to start writing standard Python code using the required syntax.
    </p>
    <h4>Example: Basic Syntax & Variables</h4>
    <p>
      Use standard Python for scripting, logic, and variable manipulation.
    </p>
    <CodeBox language="python">
        <pre><code className="language-python">
{`
\`\`\`python
# --- Python Block ---
import math

# Basic variables
message = "Initializing spy protocol..."
access_level = 5
is_active = True

print(message)
print(f"Current access level: {access_level}")

# Basic operations
result = math.sqrt(256)
print(f"Security check (sqrt(256)): {result}")
\`\`\`
`}
            </code></pre>
    </CodeBox>
    <h4>Functions and Classes</h4>
    <p>
      Define reusable logic with functions or structure your code
      with classes, just as you would in a normal Python file.
    </p>
    <CodeBox language="python">
        <pre><code className="language-python">
{`
\`\`\`python
# --- Python Block ---

class Agent:
    def __init__(self, agent_id, clearance):
        self.agent_id = agent_id
        self.clearance = clearance
        print(f"Agent {self.agent_id} initialized.")

    def get_clearance(self):
        return self.clearance

def activate_agent(agent_id):
    # Logic to activate an agent
    print(f"Activating agent {agent_id}...")
    return Agent(agent_id, 5)

// --- Execution ---
agent_007 = activate_agent("007")
print(f"Agent {agent_007.agent_id} clearance: {agent_007.get_clearance()}")
\`\`\`
`}
            </code></pre>
    </CodeBox>

    {/* --- Java Section --- */}
    <h2 id="java" className="!mt-12 border-t border-gray-800 pt-10">Java</h2>
    <p>
      Java provides the enterprise-grade stability and robust object-oriented
      structure for your complex creations. Use it for building
      reliable backend logic, data structures, and services.
    </p>
    <h3>Using Java Blocks</h3>
    <p>
      When you create a "Java" block in the Spider Notebook App, you
      can write one or more public classes using the required syntax.
    </p>
    <h4>Example: Defining Data Models (POJOs)</h4>
    <p>
      A common use is to define the core data structures for your application.
    </p>
    <CodeBox language="java">
        <pre><code className="language-java">
{`
\`\`\`java
// File: Agent.java
// (Assumed to be the name of the block)

public class Agent {
    private String id;
    private String status;
    private int clearanceLevel;

    public Agent(String id, String status, int clearanceLevel) {
        this.id = id;
        this.status = status;
        this.clearanceLevel = clearanceLevel;
    }

    // Getters
    public String getId() { return id; }
    public String getStatus() { return status; }
    public int getClearanceLevel() { return clearanceLevel; }

    // Setters
    public void setStatus(String status) {
        this.status = status;
    }

    @Override
    public String toString() {
        return "Agent(ID: " + id + ", Status: " + status + ")";
    }
}
\`\`\`
`}
            </code></pre>
    </CodeBox>
    <h4>Example: Service Class</h4>
    <p>
      You can also write classes with logic to process data or
      perform operations.
    </p>
    <CodeBox language="java">
        <pre><code className="language-java">
{`
\`\`\`java
// File: AgentService.java

import java.util.List;
import java.util.ArrayList;

public class AgentService {
    private List<Agent> agents = new ArrayList<>();

    public void addAgent(Agent agent) {
        agents.add(agent);
        System.out.println("Agent added: " + agent.getId());
    }
    
    public List<Agent> getActiveAgents() {
        List<Agent> active = new ArrayList<>();
        for (Agent agent : agents) {
            if ("Active".equals(agent.getStatus())) {
                active.add(agent);
            }
        }
        return active;
    }

    public static void main(String[] args) {
        // This can be the entry point for running this block
        AgentService service = new AgentService();
        service.addAgent(new Agent("007", "Active", 5));
        service.addAgent(new Agent("M", "MIA", 6));
        
        System.out.println(service.getActiveAgents());
    }
}
\`\`\`
`}
            </code></pre>
        </CodeBox>

    {/* --- C++ Section --- */}
    <h2 id="cpp" className="!mt-12 border-t border-gray-800 pt-10">C++</h2>
    <p>
      C++ is the language of choice for high-performance, low-latency
      computation within your Spy Language projects. Use it for
      heavy algorithms, simulations, or direct memory manipulation.
    </p>
    <h3>Using C++ Blocks</h3>
    <p>
      A "C++" block in the Spider Notebook App is compiled and executed
      for maximum performance using the required syntax.
    </p>
    <CodeBox language="cpp">
        <pre><code className="language-cpp">
{`
\`\`\`cpp
#include <iostream>
#include <vector>
#include <string>
#include <map>

int main() {
    std::map<std::string, int> agent_clearance;
    agent_clearance["007"] = 5;
    agent_clearance["009"] = 4;
    agent_clearance["Q"] = 5;

    std::cout << "--- C++ Agent Clearance Map ---" << std::endl;
    for (const auto& pair : agent_clearance) {
        std::cout << "Agent: " << pair.first
                  << ", Clearance: " << pair.second << std::endl;
    }
    
    // Modify data
    agent_clearance["007"] = 6; // Promotion
    std::cout << "\n007's new clearance: "
              << agent_clearance["007"] << std::endl;
    
    return 0;
}
\`\`\`
`}
            </code></pre>
        </CodeBox>
    <h4>Example: High-Performance Calculation</h4>
    <p>
      Use C++ for tasks that need to be fast, like processing
      large amounts of data.
    </p>
    <CodeBox language="cpp">
        <pre><code className="language-cpp">
{`
\`\`\`cpp
#include <iostream>
#include <vector>
#include <numeric> // For std::accumulate

// A function for fast summing
double calculate_sum(const std::vector<double>& data) {
    return std::accumulate(data.begin(), data.end(), 0.0);
}

int main() {
    std::vector<double> sensor_readings = {
        1.2, 0.5, 2.3, 0.9, 1.5, 3.0, 0.2
    };

    std::cout << "Processing sensor data in C++..." << std::endl;
    
    double total = calculate_sum(sensor_readings);
    double average = total / sensor_readings.size();

    std::cout << "Total: " << total << std::endl;
    std::cout << "Average: " << average << std::endl;
    
    return 0;
}
\`\`\`
`}
            </code></pre>
    </CodeBox>
  </ContentWrapper>
);


const CommunityPage = () => (
    <ContentWrapper>
        <h1>Community</h1>
        <p>
            The Spy Language project is driven by an active community of creators and contributors.
            Join us on any of the platforms below to ask questions, share your code, and collaborate
            on complex creations!
        </p>

        <h2 id="founder" className="!mt-12 border-t border-gray-800 pt-10">The Creator</h2>
        <div className="not-prose my-6 rounded-lg border border-cyan-800 bg-cyan-900/10 p-6 shadow-md">
            <h3 className="!mt-0 text-2xl font-bold text-white">Vivek vardhan Rao </h3>
            <p className="text-gray-300 mt-2">
                Vivek vardhan Rao is the creator of the Spy Language format and the Spider Notebook App. 
                He is actively involved in the community. You can connect with him directly on 
                Instagram.
            </p>
            <a
                href="https://www.instagram.com/_vivek_m4?igsh=MXgzb3N5dW1idzhwZg=="
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-lg font-medium text-cyan-400 no-underline hover:underline"
            >
                Follow Vivek on Instagram →
            </a>
        </div>

        <h2 id="connect" className="!mt-12 border-t border-gray-800 pt-10">Connect With Us</h2>
        <p>We are spread across various social and development platforms.</p>
        
        <div className="not-prose my-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {communityLinks.map((link) => (
                <a 
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 rounded-lg border border-gray-800 bg-gray-900 p-4 text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-lg hover:border-cyan-600"
                >
                    <link.Icon className="h-6 w-6 text-cyan-400" />
                    <div>
                        <p className="font-semibold">{link.name}</p>
                        <p className="text-sm text-gray-400">{link.handle}</p>
                    </div>
                </a>
            ))}
        </div>
    </ContentWrapper>
);


const ContactPage = ({ setPage }) => (
  <ContentWrapper>
    <h1>Contact Us & Support</h1>
    <p>
      We're here to help you with any questions or issues you might
      encounters while using the Spy Language or the Spider Notebook App.
    </p>

    <div className="not-prose my-8 rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg">
      <h3 className="!mt-0 text-xl font-semibold text-white">Email Support</h3>
      <p className="text-gray-300">
        For all technical support, bug reports, or general inquiries,
        please reach out to our dedicated support team.
      </p>
      <a
        href="mailto:support@m4spider.com"
        className="mt-2 inline-block text-lg font-medium text-cyan-400 no-underline hover:underline"
      >
        support@m4spider.com
      </a>
    </div>

    <h2 id="community">Join the Community</h2>
    <p>
      For collaboration, ideas, and direct contact with the project creator,
      please visit our <a href="#" onClick={() => setPage('community')} className="text-cyan-400 hover:text-cyan-300">Community Page</a>.
    </p>
  </ContentWrapper>
);


// Consolidated Community Links Data
const communityLinks = [
    { name: 'Discord', href: 'https://discord.gg/qh2hccSk', handle: 'Community Chat', Icon: IconDiscord },
    { name: 'Reddit', href: 'https://www.reddit.com/r/spylangauge/', handle: 'r/spylangauge', Icon: IconReddit },
    { name: 'WhatsApp', href: 'https://chat.whatsapp.com/GF2rMxvsWhfJsph6PDTrdI?mode=wwt', handle: 'Group Chat', Icon: IconWhatsApp },
    { name: 'Instagram', href: 'https://www.instagram.com/_vivek_m4?igsh=MXgzb3N5dW1idzhwZg=="', handle: '_vivek_m4', Icon: IconInstagram },
    { name: 'GitHub', href: 'https://github.com/M4SPIDER', handle: 'M4SPIDER', Icon: IconGitHub }, 
];

// --- Search Results Component (NEW) ---
const SearchResults = ({ query, results, setPage }) => {
    // Show current page if query is empty or no results found
    if (!query) {
        return null;
    }

    if (results.length === 0) {
        return (
            <ContentWrapper>
                <h1 className="text-red-400">No Results Found</h1>
                <p className="text-lg text-gray-400">
                    Your search for "<strong className="text-red-300">{query}</strong>" did not match any pages in the documentation.
                </p>
                <p>
                    Try searching for keywords like Python, loops, or variables.
                </p>
            </ContentWrapper>
        );
    }

    return (
        <ContentWrapper>
            <h1>Search Results</h1>
            <p className="text-lg text-cyan-400">
                Found {results.length} result{results.length !== 1 ? 's' : ''} for "<strong className="text-cyan-300">{query}</strong>":
            </p>
            <div className="not-prose mt-6 flex flex-col gap-3">
                {results.map(item => (
                    <button
                        key={item.page}
                        onClick={() => setPage(item.page)}
                        className="w-full text-left p-4 rounded-lg border border-gray-800 bg-gray-900 hover:bg-gray-800 transition-colors duration-150"
                    >
                        <h2 className="!mt-0 !mb-1 text-xl font-bold text-white hover:text-cyan-400 transition-colors duration-150">{item.name}</h2>
                        <p className="text-sm text-gray-400 line-clamp-2">
                            {/* Display keywords or a descriptive snippet */}
                            {item.keywords.split(',').map(k => k.trim()).join(' · ')}
                        </p>
                    </button>
                ))}
            </div>
        </ContentWrapper>
    );
};

// --- Page Rendering Logic ---
const PageContent = ({ page, setPage, searchQuery, searchResults }) => {
    // If a search query is active and results are available, show search results
    if (searchQuery) {
        // Need to pass search query here for component to display
        return <SearchResults query={searchQuery} results={searchResults} setPage={setPage} />;
    }

    // Otherwise, show the active page content
    switch (page) {
        case 'gettingStarted':
            return <HomePage setPage={setPage} />;
        case 'basics':
            return <BasicsPage />;
        case 'concepts':
            return <ConceptsPage />;
        case 'advanced':
            return <AdvancedPage />; 
        case 'extreme':
            return <ExtremePage />;  
        case 'reference':
            return <LanguageReferencePage />;
        case 'community':
            return <CommunityPage setPage={setPage} />;
        case 'contact':
            return <ContactPage setPage={setPage} />;
        default:
            return (
                <ContentWrapper>
                    <h1>{page}</h1>
                    <p>Content for this page is coming soon!</p>
                </ContentWrapper>
            );
    }
};

// --- Feedback Rating Component (New) ---
const FeedbackRating = ({ currentPage }) => {
    const [rating, setRating] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    // The link that opens the user's email client
    const mailtoLink = `mailto:support@m4spider.com?subject=Feedback on SpyLanguage Docs: ${currentPage}&body=Rating: ${rating} out of 5.%0A%0AFeedback details: [Please provide your detailed feedback here.]`;

    const handleRatingClick = (newRating) => {
        setRating(newRating);
        // Automatically proceed to open email after selecting a rating
        setTimeout(() => {
            window.open(mailtoLink, '_blank');
            setIsSubmitted(true); // Indicate the process has completed (email opened)
        }, 100);
    };

    if (isSubmitted) {
        return (
            <div className="mt-4 p-3 text-sm font-medium text-green-400 border border-green-700 rounded-lg bg-gray-950">
                Thank you! Your email client should be opening now to capture your detailed feedback and {rating}/5 rating.
            </div>
        );
    }

    return (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="text-sm font-medium text-gray-300 flex-shrink-0">How helpful was this page?</span>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((starValue) => (
                    <IconStar
                        key={starValue}
                        fill={starValue <= rating ? 'gold' : 'none'}
                        className={`h-6 w-6 text-yellow-400 ${starValue <= rating ? 'fill-yellow-400' : ''} hover:scale-110`}
                        onClick={() => handleRatingClick(starValue)}
                    />
                ))}
            </div>
            {rating > 0 && (
                 <button
                    onClick={() => window.open(mailtoLink, '_blank')}
                    className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 transition-colors"
                >
                    Submit Feedback ({rating}/5)
                </button>
            )}
        </div>
    );
};

// --- Footer Component ---
const AppFooter = ({ setPage, currentPage }) => (
  <footer className="mt-16 w-full border-t border-gray-800">
    {/* Feedback Section */}
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-gray-800 bg-gray-950 p-6">
        <h3 className="text-lg font-semibold text-white">
          Is anything missing?
        </h3>
        <p className="mt-1 text-gray-300">
          If anything is missing or seems confusing on this page, please share
          your feedback.
        </p>
        
        <FeedbackRating currentPage={currentPage} />

      </div>
    </section>

    {/* Links Section */}
    <div className="bg-gray-950 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
            {communityLinks.map((link) => (
                <a key={link.name} href={link.href} aria-label={link.name} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                    <link.Icon className="h-6 w-6" />
                </a>
            ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400">
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setPage('community'); }} 
            className="hover:text-white"
          >
            Contributing
          </a>
          {/* Removed: Security, Blog, Issue Tracker, Careers, Press Kit */}
        </div>
        <p className="mt-8 text-xs text-gray-500">
          © 2025 Spider Notebook. All rights reserved.
          <br />
          Spy Language and the Spider Notebook logo are trademarks of
          m4spider.
        </p>
      </div>
    </div>
  </footer>
);

// --- Main App Component ---
export default function App({ onBack = () => {} }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('advanced'); // Changed default to 'advanced' for this context
  const [searchQuery, setSearchQuery] = useState(''); // NEW: State to hold the search query
  const [searchResults, setSearchResults] = useState([]); // NEW: State to hold filtered results

  const setPage = (pageName) => {
    setCurrentPage(pageName);
    setSearchQuery(''); // Clear search on navigation
    window.scrollTo(0, 0);
  };

  // NEW: Search logic useEffect
  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    
    // Simple filter logic based on page name and keywords
    const filteredResults = navItems.filter(item => 
        item.name.toLowerCase().includes(lowerQuery) ||
        item.keywords.toLowerCase().includes(lowerQuery)
    );
    
    setSearchResults(filteredResults);
  }, [searchQuery]); // Re-run when searchQuery changes

  // Handler passed to SearchBarOverlay
  const handleSetSearchQuery = (query) => {
      setSearchQuery(query);
      if (query) {
          // If a query is provided, navigate away from search and let the useEffect handle filtering
          setCurrentPage('search'); // Set a temporary page state for search results
      } else {
          // If query is cleared, go back to the default page
          setCurrentPage('gettingStarted');
      }
  }
  
  return (
    <div className="flex min-h-screen flex-col bg-black text-gray-100 antialiased">
      {/* Define custom CSS variables and styles */}
      <style>{`
          :root {
              --spider-dark: #1f2937; 
              --spider-med: #111827; 
              --spider-light: #4b5563; 
              --spider-neon-blue: #00ffff; /* Updated for consistency */
          }
          /* NEW: Floating Orb (Main App Menu) styles - RETAINS NEON LOOK */
          .nav-orb-toggle {
              transition: all 0.3s ease;
              background-color: var(--spider-neon-blue) !important; 
              box-shadow: 0 0 15px var(--spider-neon-blue) !important; 
              border: 2px solid var(--spider-dark); 
          }
          .nav-orb-toggle:hover {
              transform: scale(1.1);
              opacity: 0.9;
          }
          .nav-orb-toggle svg {
             color: var(--spider-dark) !important; 
          }
          
          /* I removed the docs-sidebar-toggle CSS as it was adding a border and background you didn't want.
             The button now relies only on inline Tailwind classes for a clean, non-boxed look. */

          /* Mobile Header styles to match the mobile screenshot */
          .mobile-header {
              background-color: var(--spider-med) !important;
              border-bottom: 1px solid var(--spider-light);
              height: 56px; 
          }
      `}</style>
      
      <Header 
        onMenuClick={() => setIsSidebarOpen(true)}
        onSearchClick={() => setIsSearchOpen(true)} 
        onBack={onBack}
      />

      {/* --- MOBILE NAVIGATION SIDEBAR --- */}
      <MobileSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
          setPage={setPage}
          currentPage={currentPage}
      />
      
      {/* --- SEARCH BAR OVERLAY --- */}
      <SearchBarOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        setSearchQuery={handleSetSearchQuery} // Pass the handler
      />
      {/* --------------------------------- */}

      <div className="mx-auto flex w-full max-w-7xl flex-grow">
        
        <main className="flex-grow w-full p-6 md:p-10 bg-gray-950">
          <PageContent 
            page={currentPage} 
            setPage={setPage} 
            searchQuery={searchQuery} // Pass state down
            searchResults={searchResults} // Pass results down
          />
        </main>
      </div>
      
      <AppFooter setPage={setPage} currentPage={currentPage} />
    </div>
  );
}
