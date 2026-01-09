
// ----------------------------------------------------------------------
// React Imports
// ----------------------------------------------------------------------
import React, { useState, useEffect, useCallback, useRef ,useMemo } from 'react';
// ----------------------------------------------------------------------
// Firebase Core
// ----------------------------------------------------------------------
import { initializeApp } from 'firebase/app';

// ----------------------------------------------------------------------
// Firebase Auth
// ----------------------------------------------------------------------
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  updateProfile
} from 'firebase/auth';

// ----------------------------------------------------------------------
// Firebase Firestore (Chat history / Docs)
// ----------------------------------------------------------------------
import {
  getFirestore,
  collection,
  query,
  where,
  addDoc,
  getDocs,
  onSnapshot,
  setDoc,
  doc,
  limit
} from 'firebase/firestore';

// ----------------------------------------------------------------------
// Firebase Realtime Database (Streaming / Live messages)
// ----------------------------------------------------------------------
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  push,
  remove,
  query as rtdbQuery,
  orderByChild,
  limitToLast
} from 'firebase/database';

// ----------------------------------------------------------------------
// Local Imports
// ----------------------------------------------------------------------
import SpyDocs from './SpyDocs';

// --- Extracted Info from PDF ---
const pdfContent = `
Spider Notebook & Spy Language
Revolutionizing AI-Powered Cross-Language Compilation and Unified Development

1. Introduction
Spy Language and Spider Notebook together form a unified AI-driven ecosystem that merges multiple programming languages—Python, C++, Java, and Kotlin—into one hybrid runtime environment. It enables real-time code translation, execution, and interaction between compiled and interpreted languages with no dependency conflicts. Built from the ground up using C++ and LLVM, Spy Language compiles \`.sp\` files into native executables, while Spider Notebook provides a visual and interactive coding space for cross-language collaboration.

2. Spider Notebook App
Spider Notebook is the official development environment for Spy Language. It offers a powerful hybrid IDE experience similar to VS Code or PyCharm, but optimized for multi-runtime execution. It features live AI assistance, visual workflow orchestration, and full offline compilation capabilities.
- Built using Qt6 and C++ for high performance.
- Integrated AI suggestions and auto-completion.
- Supports execution of Python, C++, Java, and Kotlin from within one notebook.
- Offline compiler and interpreter management for \`.sp\` files.
- Cross-platform design supporting Windows and Linux.

3. Spy Language Overview
Spy Language (or SpiderLang) is a next-generation, LLVM-based programming language designed for AI-powered, cross-language execution. It merges the strengths of interpreted scripting and compiled systems programming into a single modern syntax inspired by Swift but with original semantics and grammar.
- Compiled with LLVM backend for high performance native output.
- Supports dynamic imports from Python, Java, C++, and Kotlin.
- Hybrid compiler–interpreter model enables AI-assisted runtime execution.
- Inbuilt support for memory-level IPC, multi-threaded streaming, and AI execution units.
- Output \`.exe\` builds with zero external dependencies.

4. Architecture Stack
Spy Architecture follows a modular LLVM-backed structure known as the Spy Bridge Architecture Stack. It consists of multiple interlinked layers:
- SpyCore – Handles compilation, memory management, and inter-language linking.
- SpyBridge – Real-time IPC communication between languages and runtime instances.
- SpyAI – Embedded neural engine that predicts next-line code, manages context, and assists debugging.
- Spider Notebook – Visual interface for hybrid runtime control.
- Spy Package Manager – Handles \`.spkg\` dependency modules and binary distribution.

5. Collaboration and Expansion
Spider Notebook and Spy Language are open for collaboration with R&D teams and tech companies. The vision is to establish Spy as a universal AI-language platform capable of integrating any compiled or interpreted language at runtime. Collaborations are sought for IDE enhancement, compiler optimization, and AI integration.
- Potential partners: Microsoft, Google, JetBrains, and open-source communities.
- Focus areas: multi-runtime architecture, AI-assisted code translation, secure file-level IPC.
- Goal: create the first language ecosystem that unifies all major programming paradigms.

6. Contact & Vision
Developed and envisioned by Vivek Vardhan Rao, Spy Language represents a leap towards intelligent software bridging — connecting humans, compilers, and AI systems under one universal runtime. For collaboration, partnerships, or demo scheduling, reach out through LinkedIn or official communication channels.
`;


// --- Example Snippets and Simulated Output ---
const examples = [
    { id: 1, title: "Simple Python Print", code: `python {\n  print("Hello from Python in Spy!")\n}`, output: "Hello from Python in Spy!" },
    { id: 2, title: "Basic C++ Output", code: `c++ {\n  #include <iostream>\n  int main() {\n    std::cout << "C++ says hi!" << std::endl;\n    return 0;\n}\n}`, output: "C++ says hi!" },
    { id: 3, title: "Java Greeting", code: `java {\n  public class Main {\n    public static void main(String[] args) {\n      System.out.println("Java is ready!");\n    }\n  }\n}`, output: "Java is ready!" }
];

const initialTerminalOutput = [
    'Welcome to SpiderNoteBook!',
    'Load a project or create a new file to get started.',
];

// Placeholder data for the sidebar chat history links (FIXED LOCATION)
const mockChatLinks = [
    { id: 1, title: "Last Project Review" },
    { id: 2, title: "Multi-language ideas" },
    { id: 3, title: "Refactoring request" }
];

// --- Theme Definitions (NEW) ---
const themeMap = {
    // Current Default (Red/Blue Neon)
    red: {
        '--spider-dark': '#0d0c22',
        '--spider-med': '#1a1a3a',
        '--spider-light': '#2a2a52',
        '--spider-neon-blue': '#00bfff',
        '--spider-glow': 'rgba(0, 191, 255, 0.5)',
        '--spider-text': '#d1d5db',
        '--spider-text-dim': '#6b7280',
    },
    // Romantic (Purple/Pink Neon)
    romantic: {
        '--spider-dark': '#1e0a29',
        '--spider-med': '#3a164b',
        '--spider-light': '#5e2378',
        '--spider-neon-blue': '#ff63b8', // Hot Pink
        '--spider-glow': 'rgba(255, 99, 184, 0.5)',
        '--spider-text': '#fce7f3',
        '--spider-text-dim': '#b894c5',
    },
    // Teal (Green/Cyan Tech)
    // MATCHES USER SCREENSHOT COLOR PALETTE
    teal: {
        '--spider-dark': '#0a1d1d', // Very dark teal/green
        '--spider-med': '#113a3a', // Medium teal/green for panels
        '--spider-light': '#1e5f5f', // Lighter teal/green for buttons/borders
        '--spider-neon-blue': '#00ffff', // Cyan/Aqua for accents (Matching the mobile button glow)
        '--spider-glow': 'rgba(0, 255, 255, 0.5)',
        '--spider-text': '#e0ffff',
        '--spider-text-dim': '#99cccc',
    },
    // Sky Blue (Bright Light Blue)
    sky_blue: {
        '--spider-dark': '#101a33',
        '--spider-med': '#1e305e',
        '--spider-light': '#385e99',
        '--spider-neon-blue': '#64b5f6', // Light Blue
        '--spider-glow': 'rgba(100, 181, 246, 0.5)',
        '--spider-text': '#f0f8ff',
        '--spider-text-dim': '#a0c4ff',
    },
    // Black (True Black/High Contrast)
    black: {
        '--spider-dark': '#000000',
        '--spider-med': '#121212',
        '--spider-light': '#212121',
        '--spider-neon-blue': '#00ff00', // Green Neon
        '--spider-glow': 'rgba(0, 255, 0, 0.5)',
        '--spider-text': '#ffffff',
        '--spider-text-dim': '#cccccc',
    },
};

// --- Helper: Format PDF Text for Landing Page ---
const formatPdfTextForLanding = (text) => {
     return text
        .split('\n\n') // Split into paragraphs
        .map(para => para.trim())
        .filter(para => para)
        .map((para, pIndex) => {
            if (pIndex === 0 && para.includes('Spider Notebook & Spy Language')) { return null; }
             if (pIndex === 1 && para.includes('Revolutionizing')) { return null; }
            if (/^\*\*\d+\.\s.*?\*\*$/.test(para)) {
                return <h2 key={pIndex} className="text-xl font-semibold text-white mt-6 mb-3">{para.slice(2, -2)}</h2>;
            }
             if (para.startsWith('- ')) { return <li key={pIndex} className="ml-6 list-disc mb-1">{para.slice(2)}</li> }
             if (/^\d+\s/.test(para)) {
                 const prevPara = pIndex > 0 ? text.split('\n\n')[pIndex - 1]?.trim() : null;
                 if (prevPara?.includes("2. Spider Notebook App") || prevPara?.includes("3. Spy Language Overview")) {
                    return <li key={pIndex} className="ml-6 list-decimal mb-1">{para.substring(para.indexOf(' ')+1)}</li>;
                 }
             }
            return <p key={pIndex} className="mb-3 text-sm leading-relaxed">{para}</p>;
        });
};

// --- NEW MODAL: Privacy Assurance ---
const PrivacyModal = ({ show, onClose }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-85 flex items-center justify-center z-[70] p-4 animate-fade-in">
            <div className="bg-[var(--spider-dark)] border border-[var(--spider-neon-blue)] rounded-lg shadow-[var(--shadow-neon-blue)] w-full max-w-lg flex flex-col">
                <div className="p-6 text-[var(--spider-text)] space-y-4">
                    <h3 className="text-2xl font-bold text-[var(--spider-neon-blue)] mb-3 flex items-center">
                        <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.238A6 6 0 0012 2a6 6 0 00-6 6v10a6 6 0 0012 0V8a6 6 0 00-6-6z"></path></svg>
                        Your Privacy is Safe with M4 Spider
                    </h3>
                    <p className="text-sm">
                        Welcome to the M4 Spider platform! We want you to know that your data and Spy-formatted code are fully protected.
                    </p>
                    <p className="text-sm">
                        Your account information and all persistent data (like chat history) are secured and encrypted using Firebase Authentication and Firestore.This ensures:
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-[var(--spider-text-dim)]">
                            <li>Cross-Device Persistence: Sign in anywhere (PC, mobile) without losing your data.</li>
                            <li>High-Grade Encryption: Data is secured both in transit and at rest.</li>
                        </ul>
                    </p>
                </div>
                <div className="p-4 border-t border-[var(--spider-light)] text-right">
                    <button onClick={onClose} className="bg-[var(--spider-neon-blue)] text-black text-sm font-semibold px-4 py-1.5 rounded-md hover:opacity-90">I Understand</button>
                </div>
            </div>
        </div>
    );
};


// --- NEW: Login Page Component (Updated for M4 Spider Login and Firebase Auth Pattern) ---
const LoginPage = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userName, setUserName] = useState(''); // NEW: State for User Name
    const [error, setError] = useState('');
    const [isSignUpMode, setIsSignUpMode] = useState(false); // New state to control default view

    // User's provided Firebase configuration as a fallback
    const USER_FIREBASE_CONFIG = {
        apiKey: "AIzaSyBS1aGZZ2RDx2RKji1jOO-7spiY5QzJjh8",
        authDomain: "m4-spider.firebaseapp.com",
        projectId: "m4-spider",
        storageBucket: "m4-spider.firebasestorage.app",
        messagingSenderId: "154970150789",
        appId: "1:154970150789:web:60796710cacca377edd6ec",
        measurementId: "G-TGTWRTF7EX"
    };

    // --- Firebase Auth Setup (MANDATORY for real persistence) ---
    const [auth, setAuth] = useState(null);
    useEffect(() => {
        try {
            // 1. Try to get the configuration from the global environment variable
            let configString = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
            let firebaseConfig = JSON.parse(configString);
            
            // 2. If environment config is empty or invalid, fall back to the hardcoded config
            if (Object.keys(firebaseConfig).length === 0 || !firebaseConfig.apiKey) {
                firebaseConfig = USER_FIREBASE_CONFIG;
                console.warn("Using hardcoded Firebase configuration as environment config is unavailable.");
            }

            if (firebaseConfig.apiKey) {
                 // Initialize the Firebase App and Auth service
                 const app = initializeApp(firebaseConfig, 'm4-spider-login');
                 setAuth(getAuth(app));
                 // Clear any previous configuration error if successful
                 setError(''); 
            } else {
                 setError("Authentication service is unavailable. Missing valid Firebase configuration.");
            }
        } catch (e) {
            console.error("Failed to initialize Firebase in LoginPage:", e);
            setError("Authentication service is unavailable. Configuration failed to parse.");
        }
    }, []);
    // --- End Firebase Setup ---

    // Helper to handle successful authentication
    const handleAuthSuccess = (user) => {
         onLoginSuccess({ 
             email: user.email, 
             name: user.displayName || user.email.split('@')[0] || 'User' 
         });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            // FIX 1 APPLIED: Check if auth object is available before trying to use it.
            if (!auth) {
                 setError("Authentication service is not ready. Please wait a moment.");
                 return;
            }

            // REAL FIREBASE LOGIN: This requires the user to exist (i.e., signed up first)
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            handleAuthSuccess(userCredential.user);

        } catch (err) {
            let errorMessage = "An unknown error occurred.";
            if (err.message.includes("api-down") || !auth) { // Added !auth for clarity
                 errorMessage = "Authentication service is unavailable. Please check your network or deployment configuration.";
            } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
                errorMessage = "Invalid email or password. Please Sign Up first if you don't have an account.";
            } else if (err.message.includes("missing-credentials")) {
                errorMessage = "Please enter both email and password.";
            } else {
                errorMessage = `Sign In failed: ${err.code || 'Check credentials'}.`;
            }
            setError(errorMessage);
        }
    };
    
    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            // FIX 1 APPLIED: Check if auth object is available before trying to use it.
            if (!auth) {
                 setError("Authentication service is not ready. Please wait a moment.");
                 return;
            }
            if (!userName.trim()) {
                setError("Please enter a user name.");
                return;
            }
            
            // 1. REAL FIREBASE SIGNUP
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // 2. UPDATE USER PROFILE with Display Name
            await updateProfile(userCredential.user, {
                displayName: userName.trim()
            });

            // 3. SUCCESS
            handleAuthSuccess(userCredential.user);

        } catch (err) {
            let errorMessage = "An unknown error occurred.";
            if (err.message.includes("api-down") || !auth) { // Added !auth for clarity
                errorMessage = "Authentication service is unavailable. Please check your network or deployment configuration.";
            } else if (err.code === "auth/email-already-in-use") {
                errorMessage = "This email is already registered. Please Sign In.";
            } else if (err.message.includes("missing-credentials")) {
                errorMessage = "Please enter email, password, and user name.";
            } else {
                errorMessage = `Sign Up failed: ${err.code || 'Check credentials'}.`;
            }
            setError(errorMessage);
        }
    };


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black text-white p-4 pattern-spider-web relative">
             <div className="absolute inset-0 bg-black bg-opacity-75 z-0"></div>
            <div className="relative z-10 w-full max-w-md bg-[var(--spider-med)] rounded-xl shadow-xl p-8 border border-[var(--spider-light)] animate-fade-in-up">
                <div className="text-center mb-8">
                     <svg className="w-16 h-16 inline-block mb-4 text-[var(--spider-neon-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-1.096.906-2.407.906-3.846 0-3.517-1.009-6.799-2.753-9.571m-3.44-2.04l.054-.09A13.916 13.916 0 0016 11a4 4 0 11-8 0c0 1.017.07 2.019.203 3m2.118 6.844a21.88 21.88 0 00-3.644-3.572M12 6.04A3.001 3.001 0 009 3c-1.657 0-3 1.343-3 3s1.343 3 3 3a3.001 3.001 0 003-2.96z"></path></svg>
                    <h1 className="text-3xl font-bold text-white">M4 Spider Login</h1>
                    <p className="text-sm text-[var(--spider-text-dim)] mt-1">{isSignUpMode ? 'Create your universal account.' : 'Access your unified development environment.'}</p>
                </div>
                <form onSubmit={isSignUpMode ? handleSignUp : handleLogin} className="space-y-6">
                     {isSignUpMode && ( // NEW: User Name input only for Sign Up
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-[var(--spider-text-dim)]">User Name</label>
                            <input id="username" name="username" type="text" required value={userName} onChange={(e) => setUserName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-[var(--spider-light)] border border-[var(--spider-light)] rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-[var(--spider-neon-blue)] focus:ring-1 focus:ring-[var(--spider-neon-blue)] sm:text-sm" placeholder="Your Display Name" />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[var(--spider-text-dim)]">Email address</label>
                        <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-[var(--spider-light)] border border-[var(--spider-light)] rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-[var(--spider-neon-blue)] focus:ring-1 focus:ring-[var(--spider-neon-blue)] sm:text-sm" placeholder="you@example.com" />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-[var(--spider-text-dim)]">Password</label>
                        <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-[var(--spider-light)] border border-[var(--spider-light)] rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-[var(--spider-neon-blue)] focus:ring-1 focus:ring-[var(--spider-neon-blue)] sm:text-sm" placeholder="••••••••" />
                    </div>
                    {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                    
                    {/* Dynamic Action Button */}
                    <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-[var(--spider-neon-blue)] hover:opacity-90 transition"> {isSignUpMode ? 'Create Account' : 'Sign In'} </button>

                    {/* Switch Mode Link */}
                    <div className="text-center">
                        <button type="button" onClick={() => { setIsSignUpMode(prev => !prev); setError(''); setUserName(''); }} className="text-xs text-[var(--spider-text-dim)] hover:text-white transition underline">
                            {isSignUpMode ? 'Already have an account? Sign In' : 'Need an account? Sign Up First'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Helper Components for LandingPage (Icons & Logo) ---

// Custom inline SVG for the Spider Logo
const SpiderLogo = () => (
    <svg className="w-12 h-12 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Geometric Body (Faceted Processor Core) */}
        <polygon points="12 4, 15 7, 15 15, 12 18, 9 15, 9 7" fill="rgba(0, 255, 255, 0.15)" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="3.5" fill="currentColor" fillOpacity="0.1" />
        <path d="M12 4 L 12 18" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.7"/>
        
        {/* Legs (Circuit Traces) */}
        {/* Top Left (L1, L2) */}
        <path d="M9 7 L 3 1 L 1 4" />
        <path d="M9 10 L 2 5 L 0 9" />
        {/* Top Right (R1, R2) */}
        <path d="M15 7 L 21 1 L 23 4" />
        <path d="M15 10 L 22 5 L 24 9" />
        
        {/* Bottom Left (L3, L4) */}
        <path d="M9 15 L 3 23 L 1 20" />
        <path d="M9 12 L 2 17 L 0 13" />
        {/* Bottom Right (R3, R4) */}
        <path d="M15 15 L 21 23 L 23 20" />
        <path d="M15 12 L 22 17 L 24 13" />
        
        {/* Connectors / Eyes (Small Dots) */}
        <circle cx="10.5" cy="5.5" r="0.5" fill="currentColor" />
        <circle cx="13.5" cy="5.5" r="0.5" fill="currentColor" />
    </svg>
);

const Icon = ({ name, className }) => {
    // Simple mapping for Lucide icons used in the HTML
    const icons = {
        brain: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 11a7 7 0 0 0 7-7 4.9 4.9 0 0 0-5.85-5.5m-2.3 0a4.9 4.9 0 0 0-5.85 5.5 7 7 0 0 0 7 7 4.9 4.9 0 0 0 5.85-5.5"/><path d="M12 17a7 7 0 0 0 7-7 4.9 4.9 0 0 0-5.85-5.5m-2.3 0a4.9 4.9 0 0 0-5.85 5.5 7 7 0 0 0 7 7 4.9 4.9 0 0 0 5.85-5.5"/></svg>),
    plugZap: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m13 2-2 4h3l-2 4-4-8z"/><path d="M12 22v-6"/><path d="M2 16h20"/><path d="M16 16v-6"/><path d="M8 16v-6"/></svg>),
    gauge: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 14v4"/><path d="M18.4 12a6 6 0 0 1-12.8 0"/><path d="M18.4 12a10 10 0 0 0-12.8 0"/><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/></svg>),
    layers3d: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 2l-8 4 8 4 8-4-8-4z"/><path d="M4 12l8 4 8-4"/><path d="M4 18l8 4 8-4"/></svg>),
    layoutDashboard: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>),
    cpu: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M15 9V7h-2V5h-2v2H9v2H7v2h2v2h2v2h2v-2h2v-2h-2V9h-2z"/></svg>),
    link: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.54-7.54l-3 3a5 5 0 0 0-.54 7.54z"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.54 7.54l3-3a5 5 0 0 0 .54-7.54z"/></svg>),
    sparkles: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M13.92 3.32a1 1 0 0 0-1.84 0l-3.49 6.82a1 1 0 0 1-.77.58L3.26 12a1 1 0 0 0 0 1.84l6.56 3.49a1 1 0 0 1 .58.77l3.32 6.47a1 1 0 0 0 1.84 0l3.49-6.82a1 1 0 0 1 .77-.58L22.74 12a1 1 0 0 0 0-1.84l-6.56-3.49a1 1 0 0 1-.58-.77z"/></svg>),
    };
    return icons[name] || <div className={className}>?</div>;
};


// --- Landing Page Component (REWRITTEN to match new UI) ---
const LandingPage = ({ onNavigate, onShowExample }) => {
    
    // --- Tagline Animation Logic (NEW) ---
    const taglines = [
        "Revolutionizing AI-Powered Cross-Language Compilation",
        "The Hybrid Runtime Environment for Complex Creation",
        "Compile C++, Script Python, Run Seamlessly",
        "Powered by Qt6, C++, and LLVM Backend"
    ];
    const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
    const [taglineVisible, setTaglineVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            // Start fade out
            setTaglineVisible(false);
            
            // Wait for fade out, then update text and fade in
            setTimeout(() => {
                setCurrentTaglineIndex(prevIndex => (prevIndex + 1) % taglines.length);
                setTaglineVisible(true);
            }, 300); // Matches the transition speed
        }, 5000); 

        return () => clearInterval(interval);
    }, [taglines.length]);

    const taglineText = taglines[currentTaglineIndex];
    // --- End Tagline Animation Logic ---

    
    return (
        <div className="flex-grow h-full bg-[var(--primary-bg)] text-[var(--spider-text)] overflow-y-auto">
            <main className="container mx-auto px-4 py-16">

                {/* Header: Quantum Hub */}
                <header id="quantum-hub" className="flex items-start justify-between mb-20 md:flex-row flex-col">
                    <div className="flex items-start">
                        {/* DEFINITIVE SPIDER Logo (Custom Inline SVG - Tech Spider) */}
                        <div className="p-4 mr-6 rounded-lg logo-glow" style={{ '--accent-teal': 'var(--spider-neon-blue)' }}>
                            <SpiderLogo />
                        </div>
                        <div>
                            <h1 className="text-6xl font-extrabold tracking-tight text-white mb-2">M4 Spider</h1>
                            <h2 className="text-xl font-light text-cyan-300 logo-glow" style={{ '--accent-teal': 'var(--spider-neon-blue)' }}>Quantum Compiler</h2>
                            {/* Animated Tagline */}
                            <p 
                                id="tagline" 
                                className={`mt-2 text-lg text-gray-400 min-h-[1.5rem] transition-opacity duration-300 ${taglineVisible ? 'opacity-100' : 'opacity-0'}`}
                                style={{ color: 'var(--spider-text-dim)' }}
                            >
                                {taglineText}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Hero Section: The Compiler Node */}
                <section id="hero" className="mb-24">
                    <h3 className="text-3xl font-bold mb-8 text-gray-200">The Compiler Node: Hybrid Runtime Environment</h3>
                    <p className="mb-6 text-gray-400 max-w-4xl mx-auto">
                        SpiderNoteBook and Spy Language together form a unified AI-driven ecosystem that merges multiple programming languages—Python, C++, Java, and Kotlin—into one hybrid runtime environment. It enables real-time code translation, execution, and interaction between compiled and interpreted languages with no dependency conflicts.
                    </p>
                    <div className="max-w-4xl mx-auto terminal-glow rounded-xl p-6 relative">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs uppercase font-mono text-cyan-400 tracking-widest" style={{ color: 'var(--spider-neon-blue)' }}>Live Compiler Demo</span>
                        </div>

                        {/* START: CODE EXAMPLE SECTION - GUARANTEED SEPARATION */}
                        <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
    <span className="text-green-400">```python</span>{'\n'}
    <span className="text-yellow-400">print</span>(<span className="text-orange-400">"Hello World"</span>){'\n'}
    <span className="text-green-400">```</span>{'\n'}
    {'\n'}
    <span className="text-green-400">```cpp</span>{'\n'}
    <span className="text-cyan-400">#include</span> <span className="text-red-400">&lt;iostream&gt;</span>{'\n'}
    {'\n'}
    <span className="text-yellow-400">int</span> main() {'{'}{'\n'}
    {'    '}<span className="text-cyan-400">std::cout</span> <span className="text-red-400">&lt;&lt;</span> <span className="text-orange-400">"Hello, World!"</span> <span className="text-red-400">&lt;&lt;</span> <span className="text-cyan-400">std::endl</span>;{'\n'}
    {'    '}<span className="text-yellow-400">return</span> <span className="text-red-400">0</span>;{'\n'}
    {'}'}{'\n'}
    <span className="text-green-400">```</span>{'\n'}
    {'\n'}
    <span className="text-green-400">```java</span>{'\n'}
    <span className="text-yellow-400">public</span> <span className="text-blue-400">class</span> HelloWorld {'{'}{'\n'}
    {'    '}<span className="text-yellow-400">public</span> <span className="text-yellow-400">static</span> <span className="text-yellow-400">void</span> main(<span className="text-blue-400">String</span>[] args) {'{'}{'\n'}
    {'        '}<span className="text-blue-400">System</span>.<span className="text-yellow-400">out</span>.<span className="text-yellow-400">println</span>(<span className="text-orange-400">"Hello, World!"</span>);{'\n'}
    {'    '}{'}'}{'\n'}
    {'}'}{'\n'}
    <span className="text-green-400">```</span>{'\n'}
    {'\n'}
    <span className="text-green-400">Output:</span> <span className="text-white font-bold">Runtime 0.001s</span>{'\n'}
    <span className="text-cyan-300">python output:</span> <span className="text-white font-bold">Hello World</span>{'\n'}
    <span className="text-cyan-300">c++ output:</span> <span className="text-white font-bold">Hello, World!</span>{'\n'}
    <span className="text-cyan-300">java output:</span> <span className="text-white font-bold">Hello, World!</span>
                        </pre>
                        {/* END: CODE EXAMPLE SECTION */}
                        
                        {/* CTA Buttons - Adapted to use React navigation */}
                        <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                            <button 
                                onClick={() => onNavigate('notebook')} 
                                className="px-8 py-3 rounded-lg font-bold text-lg text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-lg logo-glow"
                                style={{ backgroundColor: 'var(--spider-neon-blue)', color: 'var(--spider-dark)', boxShadow: `0 0 15px var(--spider-neon-blue)` }}
                            >
                                Get M4 Spider Launcher for PC
                            </button>
                            <button 
                                onClick={() => onNavigate('notebook')} 
                                className="px-8 py-3 text-lg font-medium text-cyan-400 border border-cyan-400 rounded-lg hover:bg-cyan-400 hover:text-black transition-colors"
                                style={{ color: 'var(--spider-neon-blue)', borderColor: 'var(--spider-neon-blue)', hoverBackgroundColor: 'var(--spider-neon-blue)' }}
                            >
                                Explore the LLVM Backend
                            </button>
                        </div>
                    </div>
                </section>

                {/* Features Section: Core Domains */}
                <section id="features" className="mb-24">
                    <h3 className="text-3xl font-bold mb-12 text-gray-200 text-center">Core Domains: Unified Power & Language Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Feature 1: Spy AI */}
                        <div className="feature-card rounded-xl p-6 text-center">
                            <div className="flex justify-center mb-4">
                                <Icon name="brain" className="w-10 h-10 text-cyan-400 logo-glow" style={{ color: 'var(--spider-neon-blue)' }}/>
                            </div>
                            <h4 className="text-xl font-semibold mb-2 text-white">🧠 Spy AI Engine</h4>
                            <p className="text-gray-400 text-sm">Embedded neural engine (SpyAI) predicts next-line code, manages context, and provides intelligent code unification across all supported languages.</p>
                        </div>

                        {/* Feature 2: Hybrid Runtime */}
                        <div className="feature-card rounded-xl p-6 text-center">
                            <div className="flex justify-center mb-4">
                                <Icon name="plugZap" className="w-10 h-10 text-cyan-400 logo-glow" style={{ color: 'var(--spider-neon-blue)' }}/>
                            </div>
                            <h4 className="text-xl font-semibold mb-2 text-white">🕸️ Spy Language (SPY)</h4>
                            <p className="text-gray-400 text-sm">Next-gen, LLVM-based language merging compiled and interpreted strengths. Outputs `.exe` builds with zero external dependencies.</p>
                        </div>

                        {/* Feature 3: High Performance IDE */}
                        <div className="feature-card rounded-xl p-6 text-center">
                            <div className="flex justify-center mb-4">
                                <Icon name="gauge" className="w-10 h-10 text-cyan-400 logo-glow" style={{ color: 'var(--spider-neon-blue)' }}/>
                            </div>
                            <h4 className="text-xl font-semibold mb-2 text-white">⚡ High Performance IDE</h4>
                            <p className="text-gray-400 text-sm">The Spider Notebook is built using Qt6 and native C++ for unparalleled speed, visual workflow, and full offline compilation capabilities.</p>
                        </div>

                        {/* Feature 4: Cross-Language Linking */}
                        <div className="feature-card rounded-xl p-6 text-center">
                            <div className="flex justify-center mb-4">
                                <Icon name="layers3d" className="w-10 h-10 text-cyan-400 logo-glow" style={{ color: 'var(--spider-neon-blue)' }}/>
                            </div>
                            <h4 className="text-xl font-semibold mb-2 text-white">🌐 Cross-Language Linking</h4>
                            <p className="text-gray-400 text-sm">Features dynamic imports from Python, Java, C++, and Kotlin, utilizing the SpyBridge for real-time IPC communication.</p>
                        </div>
                    </div>
                </section>

                {/* Architecture Stack */}
                <section id="architecture" className="mb-24">
                    <h3 className="text-3xl font-bold mb-12 text-gray-200 text-center">Architecture Stack: The Spy Bridge Framework</h3>
                    <p className="text-center text-gray-400 mb-12 max-w-4xl mx-auto">
                        The Spy Architecture follows a modular LLVM-backed structure known as the Spy Bridge Architecture Stack. This stack ensures seamless, high-speed interaction across all language runtimes.
                    </p>

                    <div className="flex flex-col items-center space-y-8">
                        {/* Layer 1: Spider Notebook (Visual Interface) */}
                        <div className="w-full max-w-xs p-4 rounded-xl arch-node text-center">
                            <Icon name="layoutDashboard" className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
                            <p className="font-bold text-lg text-white">Spider Notebook</p>
                            <p className="text-sm text-gray-400">Visual interface for hybrid runtime control.</p>
                        </div>

                        {/* Connector Line */}
                        <div className="arch-line w-0.5 h-8 bg-cyan-400" style={{ backgroundColor: 'var(--spider-neon-blue)', boxShadow: `0 0 5px var(--spider-neon-blue)` }}></div>
                        
                        {/* Core Layer: Spy Bridge and Spy Core */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
                            {/* Spy Core */}
                            <div className="p-6 rounded-xl arch-node text-center">
                                <Icon name="cpu" className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
                                <p className="font-bold text-lg text-white">SpyCore</p>
                                <p className="text-xs text-gray-400 mt-1">Compilation, memory management, and inter-language linking.</p>
                            </div>
                            {/* Spy Bridge */}
                            <div className="p-6 rounded-xl arch-node text-center">
                                <Icon name="link" className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
                                <p className="font-bold text-lg text-white">SpyBridge</p>
                                <p className="text-xs text-gray-400 mt-1">Real-time IPC communication between languages and runtime instances.</p>
                            </div>
                        </div>

                        {/* Connector Line */}
                        <div className="arch-line w-0.5 h-8 bg-cyan-400" style={{ backgroundColor: 'var(--spider-neon-blue)', boxShadow: `0 0 5px var(--spider-neon-blue)` }}></div>

                        {/* Foundation Layer: Spy AI */}
                        <div className="w-full max-w-xs p-4 rounded-xl arch-node text-center bg-teal-500/20 border-teal-400 shadow-teal-500/50" style={{ border: `1px solid var(--spider-neon-blue)`, boxShadow: `0 0 10px var(--spider-neon-blue)` }}>
                            <Icon name="sparkles" className="w-6 h-6 mx-auto mb-2 text-teal-300" />
                            <p className="font-bold text-xl text-teal-300">SpyAI Foundation</p>
                            <p className="text-sm text-gray-300">Embedded Neural Engine for Predictive Execution.</p>
                        </div>
                    </div>
                </section>


                {/* Collaboration and Vision */}
                <section id="collaboration" className="mb-24 pt-16 border-t border-gray-800">
                    <h3 className="text-3xl font-bold mb-12 text-gray-200 text-center">Collaboration & Universal Runtime Vision</h3>

                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Vision Statement */}
                        <div className="md:col-span-2 p-8 feature-card rounded-xl">
                            <h4 className="text-2xl font-semibold mb-4 text-white">Vision: Intelligent Software Bridging</h4>
                            <p className="text-gray-400 leading-relaxed mb-4">
                                Developed and envisioned by Vivek Vardhan Rao, Spy Language represents a leap towards intelligent software bridging — connecting humans, compilers, and AI systems under one universal runtime. 
                                The goal is to create the first language ecosystem that unifies all major programming paradigms.
                            </p>
                            <p className="text-cyan-400 font-medium" style={{ color: 'var(--spider-neon-blue)' }}>Focus Areas: Multi-runtime architecture, AI-assisted code translation, secure file-level IPC.</p>
                        </div>

                        {/* Contact & Partners */}
                        <div className="p-8 feature-card rounded-xl text-center">
                            <h4 className="text-2xl font-semibold mb-4 text-cyan-400" style={{ color: 'var(--spider-neon-blue)' }}>Join the Ecosystem</h4>
                            <p className="text-gray-300 mb-4">We are actively seeking collaboration with R&D teams and tech companies like Microsoft, Google, and JetBrains.</p>
                            
                            <p className="text-sm text-gray-500 mb-2">For partnerships or demos, please contact:</p>
                            <a href="mailto:support@Ms4Spider.com" className="text-xl font-bold text-secondary-accent hover:underline" style={{ color: 'var(--secondary-accent)' }}>
                                support@M4Spider.com
                            </a>
                        </div>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="text-center py-8 border-t border-gray-800 text-gray-600 text-sm flex-shrink-0">
                SpiderNoteBook & Spy Language - A Hybrid Compilation Platform | &copy; 2025 Vivek Vardhan Rao
            </footer>
        </div>
    );
};


// --- Panel Components (Only Sidebar for Notebook) ---

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

const SpiderAIApp = ({ 
    currentUser, 
    showModal, 
    callFastAPI, 
    activeAIMode, 
    setActiveAIMode, 
    uploadedFile, 
    setUploadedFile, 
    uploadedImage, 
    setUploadedImage 
}) => {
    // ---------- State ----------
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', content: 'Welcome! I am Spider AI. Select a tool from the (+) menu to begin, or start chatting for code assistance.', type: 'text' }
    ]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [recentChats, setRecentChats] = useState([]);
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [abortController, setAbortController] = useState(null);
    const [streamingMessage, setStreamingMessage] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    // ---------- Streaming State ----------
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamedContent, setStreamedContent] = useState('');
    const [showContinueButton, setShowContinueButton] = useState(false);
    const [lastStreamId, setLastStreamId] = useState(null);
    
    // ---------- Full Code Mode State ----------
    const [isFullCodeMode, setIsFullCodeMode] = useState(false);
    const [generatedFiles, setGeneratedFiles] = useState([]);
    const [projectMetadata, setProjectMetadata] = useState({
        name: '',
        type: '',
        description: '',
        totalFiles: 0
    });
    const [activeFileIndex, setActiveFileIndex] = useState(0);
    const [isProjectView, setIsProjectView] = useState(false);

    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);
    const streamReaderRef = useRef(null);
    const accumulatedTokensRef = useRef('');
    const fileContentBufferRef = useRef('');

    const getAppId = () => typeof __app_id !== 'undefined' ? __app_id : 'default-m4-app';
    const LOCAL_STORAGE_KEY = `spider_chat_history_${getAppId()}_${(currentUser?.email || 'anon')}`;
    
    // ---------- Persistent User ID ----------
    const getPersistentUserId = useCallback(() => {
        const key = `spider_user_id_${getAppId()}`;
        let userId = localStorage.getItem(key);
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem(key, userId);
        }
        return userId;
    }, [getAppId]);

    // ---------- Full Code Detection Patterns ----------
    const fullCodePatterns = useMemo(() => ({
        strong: [
            'write full code',
            'give full code',
            'provide full code',
            'complete code',
            'entire code',
            'full implementation',
            'complete implementation',
            'entire application',
            'complete project',
            'entire project',
            'full project',
            'whole application',
            'create a complete',
            'build a complete',
            'develop a complete',
            'make a complete',
            'generate a complete',
            'with all files',
            'with entire codebase',
            'with complete source',
            'including all dependencies',
            'with package.json',
            'with requirements.txt'
        ],
        
        medium: [
            'full stack',
            'complete app',
            'entire app',
            'full app',
            'with frontend and backend',
            'with database',
            'with api',
            'with all components',
            'with all modules',
            'with configuration',
            'with setup',
            'with installation',
            'multi-file',
            'multiple files',
            'file structure',
            'project structure',
            'directory structure',
            'folder structure'
        ],
        
        projectTypes: [
            'todo app',
            'calculator',
            'weather app',
            'chat application',
            'e-commerce',
            'blog platform',
            'social media',
            'dashboard',
            'admin panel',
            'portfolio website',
            'rest api',
            'crud application',
            'fullstack',
            'mern stack',
            'mean stack',
            'react app',
            'vue app',
            'angular app',
            'node.js app',
            'django app',
            'flask app',
            'mobile app',
            'desktop app'
        ]
    }), []);

    // ---------- Math Detection Patterns ----------
    const mathPatterns = useMemo(() => ({
        latexInline: [
            /\$([^$]+?)\$/g,                         // $...$
            /\$\\displaystyle\s*([^$]+?)\$/g,        // $\displaystyle ...$
            /\\\(([^)]+?)\\\)/g,                     // \(...\)
            /\\\[([\s\S]+?)\\\]/g,                   // \[...\]
            /\\begin\{equation\}([\s\S]+?)\\end\{equation\}/g,
            /\\begin\{align\}([\s\S]+?)\\end\{align\}/g,
            /\\begin\{gather\}([\s\S]+?)\\end\{gather\}/g,
            /\\boxed\{([^}]+?)\}/g                   // \boxed{...}
        ],
        
        mathKeywords: [
            'calculate',
            'solve',
            'equation',
            'formula',
            'theorem',
            'derivative',
            'integral',
            'matrix',
            'vector',
            'function',
            'limit',
            'sum',
            'product',
            'sqrt',
            'frac',
            'sin',
            'cos',
            'tan',
            'log',
            'ln',
            'exp',
            'pi',
            'theta',
            'alpha',
            'beta',
            'gamma',
            'delta',
            'epsilon',
            'sigma',
            'omega',
            'infty',
            'rightarrow',
            'leftarrow',
            'Rightarrow',
            'Leftarrow',
            'approx',
            'equiv',
            'propto',
            'partial',
            'nabla',
            'int',
            'sum',
            'prod',
            'lim'
        ]
    }), []);

    // ---------- Detect Full Code Request ----------
    const detectFullCodeRequest = useCallback((text) => {
        if (!text || typeof text !== 'string') return false;
        
        const lowerText = text.toLowerCase();
        let score = 0;
        
        // Check strong patterns (2 points each)
        fullCodePatterns.strong.forEach(pattern => {
            if (lowerText.includes(pattern)) score += 2;
        });
        
        // Check medium patterns (1 point each)
        fullCodePatterns.medium.forEach(pattern => {
            if (lowerText.includes(pattern)) score += 1;
        });
        
        // Check for project type mentions
        fullCodePatterns.projectTypes.forEach(type => {
            if (lowerText.includes(type)) score += 1;
        });
        
        // Check for explicit file requests
        const fileExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.css', '.json', '.md', '.txt'];
        fileExtensions.forEach(ext => {
            if (lowerText.includes(ext)) score += 1;
        });
        
        // Check for file count mentions
        const fileCountMatch = lowerText.match(/(\d+)\s*(files|file)/);
        if (fileCountMatch && parseInt(fileCountMatch[1]) > 1) {
            score += 2;
        }
        
        // Check for structure keywords
        if (lowerText.includes('structure') || lowerText.includes('architecture')) {
            score += 1;
        }
        
        // Threshold for triggering full code mode
        return score >= 3;
    }, [fullCodePatterns]);

    // ---------- Detect Math Request ----------
    const detectMathRequest = useCallback((text) => {
        if (!text) return false;
        
        const lowerText = text.toLowerCase();
        
        // Check for math keywords
        const hasMathKeywords = mathPatterns.mathKeywords.some(keyword => 
            lowerText.includes(keyword) || 
            text.includes(`\\${keyword}`)
        );
        
        // Check for LaTeX patterns
        const hasLatex = mathPatterns.latexInline.some(pattern => pattern.test(text));
        
        // Check for common math phrases
        const mathPhrases = [
            'solve for',
            'calculate',
            'find the value',
            'prove that',
            'show that',
            'derivative of',
            'integral of',
            'limit of',
            'matrix',
            'vector',
            'equation'
        ];
        
        const hasMathPhrases = mathPhrases.some(phrase => lowerText.includes(phrase));
        
        return hasMathKeywords || hasLatex || hasMathPhrases;
    }, [mathPatterns]);

    // ---------- Detect Large Code Request ----------
    const detectLargeCodeRequest = useCallback((text) => {
        if (!text) return false;
        
        const lowerText = text.toLowerCase();
        
        // Code-specific keywords that usually mean large responses
        const codeKeywords = [
            'write code for',
            'create a function',
            'build a program',
            'develop an application',
            'implement',
            'algorithm for',
            'data structure',
            'database schema',
            'api endpoint',
            'complete script',
            'entire program',
            'source code'
        ];
        
        // Check length - long questions usually mean long answers
        const isLongQuestion = text.length > 100;
        
        // Check for code block indicators
        const hasCodeIndicators = codeKeywords.some(keyword => lowerText.includes(keyword));
        
        // Check for multiple file mentions
        const hasMultipleFiles = lowerText.match(/\d+\s*(?:files|file)/);
        
        return isLongQuestion && (hasCodeIndicators || hasMultipleFiles);
    }, []);

    // ---------- Decision: When to Use Streaming ----------
    const shouldUseStreaming = useCallback((text, isFullCode, mode) => {
        // Always stream for these cases:
        if (isFullCode) return true;
        if (mode === "analyze_file") return true;
        if (detectLargeCodeRequest(text)) return true;
        
        // Check for streaming keywords in user request
        const streamingKeywords = [
            'stream',
            'live',
            'real-time',
            'as you type',
            'show step by step',
            'show process',
            'type it out'
        ];
        
        const lowerText = text.toLowerCase();
        const userRequestsStreaming = streamingKeywords.some(keyword => lowerText.includes(keyword));
        
        return userRequestsStreaming;
    }, [detectLargeCodeRequest]);

    // ---------- Extract Project Metadata ----------
    const extractProjectMetadata = useCallback((text) => {
        const lowerText = text.toLowerCase();
        const metadata = {
            name: 'Untitled Project',
            type: 'web',
            description: 'Generated by Spider AI',
            totalFiles: 0,
            techStack: [],
            hasFrontend: false,
            hasBackend: false,
            hasDatabase: false
        };
        
        // Detect project type
        if (lowerText.includes('react') || lowerText.includes('frontend')) {
            metadata.type = 'react';
            metadata.techStack.push('React');
            metadata.hasFrontend = true;
        }
        if (lowerText.includes('node') || lowerText.includes('backend') || lowerText.includes('api')) {
            metadata.type = metadata.type === 'react' ? 'mern' : 'node';
            metadata.techStack.push('Node.js');
            metadata.hasBackend = true;
        }
        if (lowerText.includes('mongodb') || lowerText.includes('database')) {
            metadata.techStack.push('MongoDB');
            metadata.hasDatabase = true;
        }
        if (lowerText.includes('python') || lowerText.includes('django') || lowerText.includes('flask')) {
            metadata.type = 'python';
            metadata.techStack.push('Python');
            metadata.hasBackend = true;
        }
        
        // Try to extract project name
        const nameMatch = lowerText.match(/(?:create|build|make|generate)\s+(?:a|an)?\s+([a-z\s]+?)(?:\s+(?:app|application|project|website|platform))/);
        if (nameMatch) {
            metadata.name = nameMatch[1].trim().replace(/\b\w/g, l => l.toUpperCase());
        }
        
        return metadata;
    }, []);

    // ---------- Parse Generated Code for Files ----------
    const parseCodeForFiles = useCallback((text) => {
        if (!text) return [];
        
        const files = [];
        const lines = text.split('\n');
        let currentFile = null;
        let currentContent = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Detect file headers
            const fileHeaderMatch = line.match(/^(?:File|Filename|File name|## |# |📁|📄)\s*[:：]?\s*(.+?\.(?:js|jsx|ts|tsx|py|html|css|json|md|txt|yml|yaml|xml|env))$/i);
            const pathMatch = line.match(/^([a-zA-Z0-9_\-./]+\.(?:js|jsx|ts|tsx|py|html|css|json|md|txt|yml|yaml|xml|env))$/);
            
            if (fileHeaderMatch || pathMatch) {
                // Save previous file if exists
                if (currentFile && currentContent.length > 0) {
                    files.push({
                        ...currentFile,
                        content: currentContent.join('\n').trim()
                    });
                }
                
                const fileName = (fileHeaderMatch?.[1] || pathMatch?.[1]).trim();
                currentFile = {
                    name: fileName,
                    path: fileName.includes('/') ? fileName : `/${fileName}`,
                    language: getLanguageFromExtension(fileName),
                    size: 0,
                    lastModified: Date.now()
                };
                currentContent = [];
                continue;
            }
            
            // Accumulate content
            if (currentFile) {
                currentContent.push(line);
            }
        }
        
        // Save last file
        if (currentFile && currentContent.length > 0) {
            files.push({
                ...currentFile,
                content: currentContent.join('\n').trim(),
                size: currentContent.join('\n').length
            });
        }
        
        return files;
    }, []);

    const getLanguageFromExtension = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        const map = {
            'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
            'py': 'python', 'html': 'html', 'css': 'css', 'scss': 'scss', 'json': 'json',
            'md': 'markdown', 'txt': 'text', 'yml': 'yaml', 'yaml': 'yaml', 'xml': 'xml'
        };
        return map[ext] || 'text';
    };

    // ---------- LaTeX Math Processing ----------
    const processMathContent = useCallback((text) => {
        if (!text) return [];
        
        const blocks = [];
        let currentText = '';
        let i = 0;
        
        while (i < text.length) {
            // Check for inline math: $...$
            if (text[i] === '$' && i + 1 < text.length && text[i + 1] !== '$') {
                // Flush previous text
                if (currentText.trim()) {
                    blocks.push({ type: "text", content: currentText });
                    currentText = '';
                }
                
                // Find closing $
                let j = i + 1;
                while (j < text.length && text[j] !== '$') j++;
                
                if (j < text.length) {
                    const latex = text.substring(i + 1, j);
                    try {
                        const html = katex.renderToString(latex, {
                            throwOnError: false,
                            displayMode: false
                        });
                        blocks.push({ type: "math-inline", content: latex, html });
                    } catch (error) {
                        blocks.push({ type: "text", content: `$${latex}$` });
                    }
                    i = j + 1;
                    continue;
                }
            }
            
            // Check for display math: $$...$$
            if (text.substr(i, 2) === '$$' && i + 2 < text.length) {
                // Flush previous text
                if (currentText.trim()) {
                    blocks.push({ type: "text", content: currentText });
                    currentText = '';
                }
                
                // Find closing $$
                let j = i + 2;
                while (j < text.length - 1 && text.substr(j, 2) !== '$$') j++;
                
                if (j < text.length - 1) {
                    const latex = text.substring(i + 2, j);
                    try {
                        const html = katex.renderToString(latex, {
                            throwOnError: false,
                            displayMode: true
                        });
                        blocks.push({ type: "math-display", content: latex, html });
                    } catch (error) {
                        blocks.push({ type: "text", content: `$$${latex}$$` });
                    }
                    i = j + 2;
                    continue;
                }
            }
            
            // Check for LaTeX brackets: \(...\)
            if (text.substr(i, 2) === '\\(' && i + 2 < text.length) {
                // Flush previous text
                if (currentText.trim()) {
                    blocks.push({ type: "text", content: currentText });
                    currentText = '';
                }
                
                // Find closing \)
                let j = i + 2;
                while (j < text.length - 1 && text.substr(j, 2) !== '\\)') j++;
                
                if (j < text.length - 1) {
                    const latex = text.substring(i + 2, j);
                    try {
                        const html = katex.renderToString(latex, {
                            throwOnError: false,
                            displayMode: false
                        });
                        blocks.push({ type: "math-inline", content: latex, html });
                    } catch (error) {
                        blocks.push({ type: "text", content: `\\(${latex}\\)` });
                    }
                    i = j + 2;
                    continue;
                }
            }
            
            // Check for LaTeX brackets: \[...\]
            if (text.substr(i, 2) === '\\[' && i + 2 < text.length) {
                // Flush previous text
                if (currentText.trim()) {
                    blocks.push({ type: "text", content: currentText });
                    currentText = '';
                }
                
                // Find closing \]
                let j = i + 2;
                while (j < text.length - 1 && text.substr(j, 2) !== '\\]') j++;
                
                if (j < text.length - 1) {
                    const latex = text.substring(i + 2, j);
                    try {
                        const html = katex.renderToString(latex, {
                            throwOnError: false,
                            displayMode: true
                        });
                        blocks.push({ type: "math-display", content: latex, html });
                    } catch (error) {
                        blocks.push({ type: "text", content: `\\[${latex}\\]` });
                    }
                    i = j + 2;
                    continue;
                }
            }
            
            // Check for \boxed{...}
            if (text.substr(i, 7) === '\\boxed{' && i + 7 < text.length) {
                // Flush previous text
                if (currentText.trim()) {
                    blocks.push({ type: "text", content: currentText });
                    currentText = '';
                }
                
                // Find closing }
                let j = i + 7;
                let braceCount = 1;
                while (j < text.length && braceCount > 0) {
                    if (text[j] === '{') braceCount++;
                    if (text[j] === '}') braceCount--;
                    j++;
                }
                
                if (braceCount === 0) {
                    const latex = text.substring(i + 7, j - 1);
                    try {
                        const html = katex.renderToString(`\\boxed{${latex}}`, {
                            throwOnError: false,
                            displayMode: true
                        });
                        blocks.push({ type: "math-boxed", content: latex, html });
                    } catch (error) {
                        blocks.push({ type: "text", content: `\\boxed{${latex}}` });
                    }
                    i = j;
                    continue;
                }
            }
            
            // Add regular character
            currentText += text[i];
            i++;
        }
        
        // Flush remaining text
        if (currentText.trim()) {
            blocks.push({ type: "text", content: currentText });
        }
        
        return blocks;
    }, []);

    // ---------- IndexedDB Configuration ----------
    const DB_NAME = 'SpiderAIChatsDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'chats';

    // ---------- Detect Mobile & Responsive ----------
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile) {
                setSidebarOpen(false);
            }
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // ---------- Auto-resize textarea ----------
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    }, [message]);

    // ---------- Open Database ----------
    const openDatabase = useCallback(() => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => {
                reject(new Error(`Failed to open database: ${request.error}`));
            };
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('userId', 'userId', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('appId', 'appId', { unique: false });
                }
            };
        });
    }, []);

    const getUserId = useCallback(() => {
        return currentUser?.email || currentUser?.id || getPersistentUserId();
    }, [currentUser, getPersistentUserId]);

    // ---------- Load Recent Chats ----------
    const loadRecentChats = useCallback(async () => {
        try {
            const db = await openDatabase();
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('userId');
            
            const userId = getUserId();
            const range = IDBKeyRange.only(userId);
            const request = index.getAll(range);
            
            return new Promise((resolve) => {
                request.onsuccess = () => {
                    const chats = request.result || [];
                    const sortedChats = chats
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, 10)
                        .map(chat => ({
                            id: chat.id,
                            title: chat.title || 'Untitled Chat',
                            timestamp: chat.timestamp,
                            mode: chat.mode || 'chat'
                        }));
                    
                    setRecentChats(sortedChats);
                    resolve(sortedChats);
                    db.close();
                };
                
                request.onerror = () => {
                    console.error('Error loading recent chats:', request.error);
                    setRecentChats([]);
                    resolve([]);
                    db.close();
                };
            });
        } catch (error) {
            console.error('Error in loadRecentChats:', error);
            setRecentChats([]);
            return [];
        }
    }, [openDatabase, getUserId]);

    // ---------- Load Specific Chat ----------
    const loadChatById = useCallback(async (chatId) => {
        if (!chatId) return;
        
        try {
            const db = await openDatabase();
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(chatId);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    if (request.result) {
                        const chat = request.result;
                        try {
                            const history = JSON.parse(chat.history || '[]');
                            if (Array.isArray(history) && history.length > 0) {
                                setChatHistory(history);
                                setActiveChatId(chatId);
                                resolve(history);
                            } else {
                                throw new Error('Invalid chat history');
                            }
                        } catch (parseError) {
                            console.error('Error parsing chat history:', parseError);
                            reject(parseError);
                        }
                    } else {
                        reject(new Error('Chat not found'));
                    }
                    db.close();
                };
                
                request.onerror = () => {
                    reject(request.error);
                    db.close();
                };
            });
        } catch (error) {
            console.error('Error in loadChatById:', error);
            throw error;
        }
    }, [openDatabase]);

    // ---------- Save Chat History ----------
    const saveChatHistory = useCallback(async (history) => {
        if (!Array.isArray(history) || history.length <= 1) return;
        
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
        } catch (e) {
            console.warn('LocalStorage save failed:', e);
        }
        
        const userId = getUserId();
        const chatTitle = (history[1]?.content || 'New Chat')
            .toString()
            .substring(0, 50)
            .trim() || 'New Chat';
        
        const chatData = {
            id: activeChatId || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: chatTitle,
            history: JSON.stringify(history),
            timestamp: Date.now(),
            mode: history[1]?.type || 'chat',
            userId: userId,
            appId: getAppId()
        };
        
        try {
            const db = await openDatabase();
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            store.put(chatData);
            
            transaction.oncomplete = () => {
                if (!activeChatId) {
                    setActiveChatId(chatData.id);
                }
                loadRecentChats();
                db.close();
            };
            
            transaction.onerror = () => {
                console.error('Error saving to IndexedDB:', transaction.error);
                db.close();
            };
        } catch (error) {
            console.error('Error saving chat:', error);
        }
    }, [activeChatId, openDatabase, getUserId, loadRecentChats]);

    // ---------- Delete Chat ----------
    const deleteChat = useCallback(async (chatId) => {
        if (!chatId) return;
        
        setIsDeleting(true);
        try {
            const db = await openDatabase();
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            store.delete(chatId);
            
            transaction.oncomplete = () => {
                if (activeChatId === chatId) {
                    handleNewChat();
                }
                loadRecentChats();
                db.close();
                setIsDeleting(false);
            };
            
            transaction.onerror = () => {
                console.error('Error deleting chat:', transaction.error);
                db.close();
                setIsDeleting(false);
            };
        } catch (error) {
            console.error('Error in deleteChat:', error);
            setIsDeleting(false);
        }
    }, [activeChatId, openDatabase, loadRecentChats]);

    // ---------- Initialize ----------
    useEffect(() => {
        const initializeChats = async () => {
            try {
                await loadRecentChats();
                
                if (recentChats.length > 0) {
                    try {
                        await loadChatById(recentChats[0].id);
                    } catch (error) {
                        console.log('Starting new chat');
                    }
                }
            } catch (error) {
                console.error('Error initializing chats:', error);
            }
        };
        
        initializeChats();
    }, [currentUser]);

    // Auto-save chat history
    useEffect(() => {
        if (chatHistory.length > 1) {
            const timeoutId = setTimeout(() => {
                saveChatHistory(chatHistory);
            }, 500);
            
            return () => clearTimeout(timeoutId);
        }
    }, [chatHistory, saveChatHistory]);

    // Scroll to bottom when chat updates
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, streamingMessage, streamedContent]);

    // ---------- Fast Typing Animation ----------
    const typeText = useCallback((text, onComplete) => {
        if (!text) {
            onComplete?.();
            return;
        }
        
        const words = text.split(' ');
        let currentText = '';
        let wordIndex = 0;
        
        const typeNextWord = () => {
            if (wordIndex < words.length) {
                const wordsToAdd = words.slice(wordIndex, wordIndex + 2 + Math.floor(Math.random() * 3));
                currentText += (currentText ? ' ' : '') + wordsToAdd.join(' ');
                wordIndex += wordsToAdd.length;
                
                setStreamingMessage(prev => ({
                    ...prev,
                    content: currentText
                }));
                
                setTimeout(typeNextWord, 10 + Math.random() * 20);
            } else {
                onComplete?.();
            }
        };
        
        typeNextWord();
    }, []);

    // ---------- Enhanced Streaming Handler ----------
    const handleStreamResponse = useCallback(async (response) => {
        if (!response.body) {
            throw new Error('ReadableStream not supported in this browser');
        }

        const reader = response.body.getReader();
        streamReaderRef.current = reader;
        
        const decoder = new TextDecoder();
        let buffer = '';
        let isFirstChunk = true;
        let startTime = Date.now();
        let tokenCount = 0;

        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    // Check if response was truncated
                    if (accumulatedTokensRef.current.length > 0 && !accumulatedTokensRef.current.trim().endsWith('.')) {
                        setShowContinueButton(true);
                    }
                    break;
                }
                
                // Decode the chunk
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                
                // Process lines
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        
                        if (data === '[DONE]') {
                            // Streaming complete
                            console.log(`Stream completed. Tokens: ${tokenCount}, Time: ${Date.now() - startTime}ms`);
                            break;
                        }
                        
                        try {
                            const parsed = JSON.parse(data);
                            
                            if (parsed.text) {
                                tokenCount++;
                                accumulatedTokensRef.current += parsed.text;
                                
                                // Update streaming content
                                setStreamedContent(prev => prev + parsed.text);
                                
                                // In full code mode, parse files as they arrive
                                if (isFullCodeMode) {
                                    fileContentBufferRef.current += parsed.text;
                                    // Try to parse files from buffer periodically
                                    if (tokenCount % 20 === 0) {
                                        const files = parseCodeForFiles(fileContentBufferRef.current);
                                        if (files.length > 0) {
                                            setGeneratedFiles(files);
                                        }
                                    }
                                }
                                
                                // Show continue button if we detect incomplete code blocks
                                if (parsed.text.includes('```') && !accumulatedTokensRef.current.includes('```\n```')) {
                                    const codeBlockCount = (accumulatedTokensRef.current.match(/```/g) || []).length;
                                    if (codeBlockCount % 2 === 1) {
                                        // Unclosed code block
                                        setShowContinueButton(true);
                                    }
                                }
                            }
                            
                            if (parsed.stream_id) {
                                setLastStreamId(parsed.stream_id);
                            }
                            
                            if (parsed.is_full_code) {
                                setIsFullCodeMode(true);
                                setShowContinueButton(true);
                            }
                            
                        } catch (e) {
                            console.warn('Failed to parse SSE data:', e);
                        }
                    }
                }
                
                // Speed up typing for first chunks
                if (isFirstChunk && accumulatedTokensRef.current.length > 50) {
                    isFirstChunk = false;
                }
            }
        } catch (error) {
            console.error('Stream reading error:', error);
            if (error.name !== 'AbortError') {
                throw error;
            }
        } finally {
            reader.releaseLock();
            
            // Parse final files if in full code mode
            if (isFullCodeMode && fileContentBufferRef.current) {
                const files = parseCodeForFiles(fileContentBufferRef.current);
                if (files.length > 0) {
                    setGeneratedFiles(files);
                    setProjectMetadata(prev => ({
                        ...prev,
                        totalFiles: files.length
                    }));
                }
            }
        }
    }, [isFullCodeMode, parseCodeForFiles]);

    // ---------- Continue Generation ----------
    const handleContinueGeneration = useCallback(async () => {
        if (!lastStreamId) return;
        
        setIsLoading(true);
        setIsStreaming(true);
        setShowContinueButton(false);
        
        const apiUrl = '/api/generate/continue';
        const apiPayload = {
            stream_id: lastStreamId,
            user_preference_id: getPersistentUserId(),
            firebase_token: currentUser?.firebaseToken || '',
            stream: true
        };
        
        try {
            const controller = new AbortController();
            setAbortController(controller);
            
            const response = await callFastAPI(apiUrl, apiPayload, 'chat', {
                signal: controller.signal,
                stream: true
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            await handleStreamResponse(response);
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Stream aborted by user');
            } else {
                console.error('Continue generation error:', error);
                showModal("Generation Error", `Failed to continue: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
        }
    }, [lastStreamId, getPersistentUserId, currentUser, callFastAPI, handleStreamResponse, showModal]);

    // ---------- Stop Generation ----------
    const handleStopGeneration = useCallback(() => {
        if (abortController) {
            abortController.abort();
            setAbortController(null);
        }
        if (streamReaderRef.current) {
            streamReaderRef.current.cancel();
            streamReaderRef.current = null;
        }
        
        setIsLoading(false);
        setIsStreaming(false);
        
        // Save whatever we've streamed so far
        if (accumulatedTokensRef.current) {
            const assistantMessage = {
                role: 'assistant',
                content: accumulatedTokensRef.current,
                type: 'text',
                ts: Date.now(),
                isPartial: true
            };
            setChatHistory(prev => [...prev, assistantMessage]);
            accumulatedTokensRef.current = '';
            setStreamedContent('');
        }
        
        setStreamingMessage(null);
    }, [abortController]);

    // ---------- Auto-detect Image Generation ----------
    const detectImageGeneration = (prompt) => {
        const lowerPrompt = prompt.toLowerCase();
        const imageTriggers = [
            'generate image', 'create image', 'make image', 'draw', 'paint',
            'picture of', 'photo of', 'image of', 'generate a picture',
            'create a picture', 'make a picture', 'visualize', 'illustrate',
            'show me an image', 'show me a picture', 'can you draw',
            'can you create an image', 'can you generate an image'
        ];
        
        return imageTriggers.some(trigger => lowerPrompt.includes(trigger));
    };

    // ---------- File / Image Upload Handlers ----------
    const handleFileUpload = (event) => {
        const file = event?.target?.files?.[0];
        if (!file) {
            if (event) event.target.value = null;
            return;
        }
        if (file.size > 1024 * 1024 * 10) {
            showModal("File Error", "File size exceeds 10MB limit.");
            event.target.value = null;
            return;
        }
        setUploadedFile(file);
        setUploadedImage(null);
        setMessage(`Analyze the contents of ${file.name}.`);
        event.target.value = null;
    };

    const handleImageUpload = (event) => {
        const file = event?.target?.files?.[0];
        if (!file) {
            if (event) event.target.value = null;
            return;
        }
        if (!file.type.startsWith('image/')) {
            showModal("File Error", "Please upload a valid image file.");
            event.target.value = null;
            return;
        }
        if (file.size > 1024 * 1024 * 5) {
            showModal("File Error", "Image size exceeds 5MB limit.");
            event.target.value = null;
            return;
        }
        setUploadedImage(file);
        setUploadedFile(null);
        setMessage("Transform or edit this image to: ");
        event.target.value = null;
    };

    // ---------- Fixed PlusMenu Component ----------
    const PlusMenu = useMemo(() => {
        return React.memo(({ setActiveAIMode: _setActiveAIMode, fileInputRef, imageInputRef }) => {
            const [open, setOpen] = useState(false);
            const menuRef = useRef(null);

            useEffect(() => {
                const handleClickOutside = (event) => {
                    if (menuRef.current && !menuRef.current.contains(event.target)) {
                        setOpen(false);
                    }
                };

                if (open) {
                    document.addEventListener('mousedown', handleClickOutside);
                    document.addEventListener('touchstart', handleClickOutside);
                }

                return () => {
                    document.removeEventListener('mousedown', handleClickOutside);
                    document.removeEventListener('touchstart', handleClickOutside);
                };
            }, [open]);

            const onUploadFile = (e) => {
                e.stopPropagation();
                setOpen(false);
                if (typeof _setActiveAIMode === 'function') _setActiveAIMode('file_analysis');
                setTimeout(() => fileInputRef.current?.click(), 50);
            };

            const onUploadImage = (e) => {
                e.stopPropagation();
                setOpen(false);
                if (typeof _setActiveAIMode === 'function') _setActiveAIMode('image_edit');
                setTimeout(() => imageInputRef.current?.click(), 50);
            };

            const onGenImage = (e) => {
                e.stopPropagation();
                setOpen(false);
                if (typeof _setActiveAIMode === 'function') _setActiveAIMode('image_gen');
            };

            const handleToggleMenu = (e) => {
                e.stopPropagation();
                setOpen(!open);
            };

            return (
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={handleToggleMenu} 
                        className="bg-[var(--spider-light)] text-white w-10 h-10 rounded-md flex items-center justify-center hover:opacity-90 transition touch-manipulation active:scale-95"
                        aria-label="Open menu"
                        aria-expanded={open}
                    >
                        {open ? '×' : '+'}
                    </button>
                    {open && (
                        <div className="absolute bottom-12 right-0 bg-[var(--spider-dark)] border border-[var(--spider-light)] rounded-md shadow-lg w-40 p-2 z-50">
                            <button 
                                onClick={onUploadFile} 
                                className="w-full text-left px-3 py-2 hover:bg-[var(--spider-light)] rounded-md text-sm flex items-center touch-manipulation active:scale-95 transition-colors"
                            >
                                <span className="mr-2">📄</span> Upload File
                            </button>
                            <button 
                                onClick={onUploadImage} 
                                className="w-full text-left px-3 py-2 hover:bg-[var(--spider-light)] rounded-md text-sm flex items-center touch-manipulation active:scale-95 transition-colors"
                            >
                                <span className="mr-2">🖼</span> Upload Image
                            </button>
                            <button 
                                onClick={onGenImage} 
                                className="w-full text-left px-3 py-2 hover:bg-[var(--spider-light)] rounded-md text-sm flex items-center touch-manipulation active:scale-95 transition-colors"
                            >
                                <span className="mr-2">🎨</span> Create Image
                            </button>
                        </div>
                    )}
                </div>
            );
        });
    }, []);

    // ---------- Optimized Content Processing ----------
    const processContent = useCallback((text) => {
        if (!text || typeof text !== "string") {
            return [{ type: "text", content: text || "" }];
        }

        const blocks = [];
        const lines = text.split('\n');
        let currentBlock = { type: "text", content: "" };
        let inCodeBlock = false;
        let codeLanguage = "";
        let codeContent = "";
        let tableRows = [];

        const flushCurrentBlock = () => {
            if (currentBlock.content.trim()) {
                blocks.push({ ...currentBlock });
                currentBlock = { type: "text", content: "" };
            }
        };

        const flushTable = () => {
            if (tableRows.length >= 2) {
                blocks.push({
                    type: "table",
                    content: tableRows.join('\n')
                });
                tableRows = [];
            }
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Handle code blocks
            if (line.trim().startsWith('```')) {
                if (!inCodeBlock) {
                    flushCurrentBlock();
                    flushTable();
                    inCodeBlock = true;
                    codeLanguage = line.trim().replace(/```/g, '').trim();
                    codeContent = "";
                } else {
                    inCodeBlock = false;
                    blocks.push({
                        type: "code",
                        language: codeLanguage || "text",
                        content: codeContent.trim()
                    });
                }
                continue;
            }

            if (inCodeBlock) {
                codeContent += line + '\n';
                continue;
            }

            // Handle tables
            const trimmedLine = line.trim();
            if (trimmedLine.includes('|') && 
                !trimmedLine.includes('```') && 
                !trimmedLine.startsWith('|--') &&
                trimmedLine.match(/[^\s|:-]/)) {
                
                const isSeparator = trimmedLine.match(/^[\s|:-]+$/);
                
                if (!isSeparator || (isSeparator && tableRows.length > 0)) {
                    tableRows.push(line);
                }
                
                let j = i + 1;
                while (j < lines.length && lines[j].trim().includes('|') && !lines[j].trim().startsWith('```')) {
                    tableRows.push(lines[j]);
                    j++;
                }
                
                if (j > i + 1) {
                    i = j - 1;
                }
                
                if (tableRows.length >= 2) {
                    flushCurrentBlock();
                    flushTable();
                    continue;
                } else {
                    tableRows.forEach(row => {
                        currentBlock.content += row + '\n';
                    });
                    tableRows = [];
                    continue;
                }
            } else {
                if (tableRows.length > 0) {
                    tableRows.forEach(row => {
                        currentBlock.content += row + '\n';
                    });
                    tableRows = [];
                }
            }

            // Regular text
            if (line.trim() === '') {
                flushCurrentBlock();
                currentBlock.content += '\n';
            } else {
                currentBlock.content += line + '\n';
            }
        }

        flushCurrentBlock();
        flushTable();

        if (inCodeBlock && codeContent.trim()) {
            blocks.push({
                type: "code",
                language: codeLanguage || "text",
                content: codeContent.trim()
            });
        }

        return blocks;
    }, []);

    // ---------- Enhanced Chat Bubble with Math Support ----------
    const ChatBubble = useMemo(() => {
        return React.memo(({ message }) => {
            const [contentBlocks, setContentBlocks] = useState([]);
            const [mathBlocks, setMathBlocks] = useState([]);
            const [combinedBlocks, setCombinedBlocks] = useState([]);

            useEffect(() => {
                // Process LaTeX math first
                const mathBlocks = processMathContent(message.content);
                
                // Then process regular content
                const regularBlocks = processContent(message.content);
                
                // Combine both
                const combined = [];
                let regularIndex = 0;
                let mathIndex = 0;
                
                // For now, just use regular blocks with math processing
                const blocks = processContent(message.content);
                setContentBlocks(blocks);
                
                // Apply syntax highlighting
                if (typeof window !== "undefined" && window.Prism) {
                    setTimeout(() => {
                        window.Prism.highlightAll();
                    }, 50);
                }
                
                // Re-render KaTeX for any math in text blocks
                setTimeout(() => {
                    document.querySelectorAll('.math-content').forEach(element => {
                        const latex = element.getAttribute('data-latex');
                        const isDisplay = element.classList.contains('math-display');
                        if (latex) {
                            try {
                                element.innerHTML = katex.renderToString(latex, {
                                    throwOnError: false,
                                    displayMode: isDisplay
                                });
                            } catch (error) {
                                element.textContent = isDisplay ? `$$${latex}$$` : `$${latex}$`;
                            }
                        }
                    });
                }, 100);
            }, [message.content, processContent, processMathContent]);

            const handleCopyCode = (content) => {
                navigator.clipboard.writeText(content);
            };

            const renderTable = (tableText) => {
                const rows = tableText.trim().split('\n').filter(r => r.trim());
                if (rows.length < 2) return null;

                const headers = rows[0].split('|').filter(c => c.trim()).map(c => c.trim());
                const separator = rows[1];
                const dataRows = rows.slice(2).filter(r => r.includes('|'));

                const alignments = separator.split('|').filter(c => c.trim()).map(col => {
                    if (col.startsWith(':') && col.endsWith(':')) return 'center';
                    if (col.endsWith(':')) return 'right';
                    return 'left';
                });

                return (
                    <div className="overflow-x-auto my-3 rounded-lg border border-[var(--spider-light)] bg-[var(--spider-dark)]">
                        <table className="min-w-full divide-y divide-[var(--spider-light)]">
                            <thead>
                                <tr className="bg-[var(--spider-med)]">
                                    {headers.map((header, idx) => (
                                        <th 
                                            key={idx}
                                            className={`px-4 py-3 text-left text-sm font-semibold text-white border-r border-[var(--spider-light)] last:border-r-0 ${
                                                alignments[idx] === 'center' ? 'text-center' :
                                                alignments[idx] === 'right' ? 'text-right' : 'text-left'
                                            }`}
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--spider-light)]">
                                {dataRows.map((row, rowIdx) => {
                                    const cells = row.split('|').filter(c => c.trim()).map(c => c.trim());
                                    return (
                                        <tr 
                                            key={rowIdx} 
                                            className={`${
                                                rowIdx % 2 === 0 
                                                    ? 'bg-[var(--spider-dark)]' 
                                                    : 'bg-[#0a2a2a]'
                                            } hover:bg-[var(--spider-light)] transition-colors`}
                                        >
                                            {cells.map((cell, cellIdx) => (
                                                <td 
                                                    key={cellIdx}
                                                    className={`px-4 py-3 text-sm text-white border-r border-[var(--spider-light)] last:border-r-0 ${
                                                        alignments[cellIdx] === 'center' ? 'text-center' :
                                                        alignments[cellIdx] === 'right' ? 'text-right' : 'text-left'
                                                    }`}
                                                >
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            };

            const renderMathBlock = (block) => {
                if (!block.html) {
                    return (
                        <div className={`my-2 ${block.type === 'math-display' || block.type === 'math-boxed' ? 'text-center' : ''}`}>
                            <span className="text-gray-400">
                                {block.type === 'math-display' ? `$$${block.content}$$` :
                                 block.type === 'math-boxed' ? `\\boxed{${block.content}}` :
                                 `$${block.content}$`}
                            </span>
                        </div>
                    );
                }

                return (
                    <div className={`my-2 ${block.type === 'math-display' || block.type === 'math-boxed' ? 'text-center' : ''}`}>
                        <div 
                            className={`inline-block ${block.type === 'math-boxed' ? 'border-2 border-green-500 p-2 rounded' : ''}`}
                            dangerouslySetInnerHTML={{ __html: block.html }}
                        />
                    </div>
                );
            };

            const bubbleClass = message.role === "user"
                ? "bg-[#00e5ff] text-black ml-auto"
                : "bg-[#004745] text-white mr-auto";

            return (
                <div
                    className={`flex w-full ${
                        message.role === "user" ? "justify-end" : "justify-start"
                    } mb-4 px-2`}
                >
                    <div
                        className={`px-4 py-3 rounded-2xl max-w-[95%] sm:max-w-4xl ${bubbleClass}`}
                    >
                        {message.type === "image" && message.base64_image && (
                            <div className="w-full rounded-xl overflow-hidden bg-black mb-3">
                                <img
                                    src={`data:image/jpeg;base64,${message.base64_image}`}
                                    alt="AI Generated"
                                    className="w-full h-auto max-h-96 object-contain"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = 
                                            '<div class="p-4 text-center text-gray-400">Image failed to load</div>';
                                    }}
                                />
                            </div>
                        )}

                        <div className="space-y-3">
                            {contentBlocks.map((block, index) => {
                                if (block.type === "code") {
                                    return (
                                        <div
                                            key={index}
                                            className="rounded-lg overflow-hidden relative group"
                                            style={{ background: "#0f0f0f" }}
                                        >
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <button
                                                    onClick={() => handleCopyCode(block.content)}
                                                    className="w-8 h-8 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 transition-colors touch-manipulation"
                                                    title="Copy code"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                            <pre className="overflow-x-auto p-4 m-0 text-sm" style={{ background: "#0f0f0f", lineHeight: "1.5", color: "white" }}>
                                                <code className={`language-${block.language}`}>
                                                    {block.content}
                                                </code>
                                            </pre>
                                        </div>
                                    );
                                }

                                if (block.type === "table") {
                                    return (
                                        <div key={index}>
                                            {renderTable(block.content)}
                                        </div>
                                    );
                                }

                                if (block.type === "text") {
                                    // Process math in text blocks
                                    const text = block.content;
                                    const parts = [];
                                    let lastIndex = 0;
                                    
                                    // Find inline math: $...$
                                    const inlineMathRegex = /\$([^$]+?)\$/g;
                                    let match;
                                    
                                    while ((match = inlineMathRegex.exec(text)) !== null) {
                                        // Add text before math
                                        if (match.index > lastIndex) {
                                            parts.push({
                                                type: 'text',
                                                content: text.substring(lastIndex, match.index)
                                            });
                                        }
                                        
                                        // Add math
                                        const latex = match[1];
                                        try {
                                            const html = katex.renderToString(latex, {
                                                throwOnError: false,
                                                displayMode: false
                                            });
                                            parts.push({
                                                type: 'math-inline',
                                                html,
                                                latex
                                            });
                                        } catch (error) {
                                            parts.push({
                                                type: 'text',
                                                content: `$${latex}$`
                                            });
                                        }
                                        
                                        lastIndex = match.index + match[0].length;
                                    }
                                    
                                    // Add remaining text
                                    if (lastIndex < text.length) {
                                        parts.push({
                                            type: 'text',
                                            content: text.substring(lastIndex)
                                        });
                                    }
                                    
                                    return (
                                        <div
                                            key={index}
                                            className="whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed"
                                        >
                                            {parts.map((part, partIndex) => {
                                                if (part.type === 'text') {
                                                    return <span key={partIndex}>{part.content}</span>;
                                                } else if (part.type === 'math-inline') {
                                                    return (
                                                        <span 
                                                            key={partIndex} 
                                                            className="math-content math-inline"
                                                            dangerouslySetInnerHTML={{ __html: part.html }}
                                                        />
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>
                                    );
                                }

                                return null;
                            })}
                        </div>
                    </div>
                </div>
            );
        });
    }, [processContent, processMathContent]);

    // Helper function for mode display
    const getModeText = () => {
        if (isFullCodeMode) return "Full Code Project";
        if (uploadedFile) return "File Analysis";
        if (uploadedImage) return "Image Edit";
        if (activeAIMode === 'image_gen') return "Create Image";
        if (activeAIMode === 'image_edit') return "Edit Image";
        return "Chat / Code / Image";
    };

    // ---------- New Chat Handler ----------
    const handleNewChat = () => {
        setUploadedFile(null);
        setUploadedImage(null);
        setActiveAIMode && setActiveAIMode('chat');
        setActiveChatId(null);
        setLastStreamId(null);
        setShowContinueButton(false);
        setIsFullCodeMode(false);
        setGeneratedFiles([]);
        setIsProjectView(false);
        setProjectMetadata({
            name: '',
            type: '',
            description: '',
            totalFiles: 0
        });
        accumulatedTokensRef.current = '';
        setStreamedContent('');
        fileContentBufferRef.current = '';
        const welcome = [{ 
            role: 'assistant', 
            content: 'Welcome! I am Spider AI. Select a tool from the (+) menu to begin, or start chatting for code assistance.', 
            type: 'text' 
        }];
        setChatHistory(welcome);
        try { 
            localStorage.removeItem(LOCAL_STORAGE_KEY); 
        } catch (e) { 
            console.warn("Error clearing localStorage:", e);
        }
    };

    // ---------- Enhanced Send Message ----------
    const handleSendMessage = async () => {
        if (!message.trim() && !uploadedFile && !uploadedImage) return;

        console.log('Sending message:', {
            persistentId: getPersistentUserId(),
            currentUser: currentUser,
            message: message
        });

        setIsLoading(true);
        const controller = new AbortController();
        setAbortController(controller);

        const fileCopy = uploadedFile;
        const imageCopy = uploadedImage;
        let mode = activeAIMode || "chat";

        // Auto-detect image generation
        if (!fileCopy && !imageCopy && detectImageGeneration(message)) {
            mode = 'image_gen';
        }

        // Auto-detect full code requests
        const isFullCodeRequest = detectFullCodeRequest(message);
        if (isFullCodeRequest && !fileCopy && !imageCopy) {
            setIsFullCodeMode(true);
            setProjectMetadata(extractProjectMetadata(message));
        }

        // Override based on file/image uploads
        if (fileCopy) mode = "analyze_file";
        if (imageCopy) mode = "image_edit";

        const userMessage = {
            role: 'user',
            content: message,
            type: mode,
            fileName: fileCopy ? fileCopy.name : undefined,
            imageName: imageCopy ? imageCopy.name : undefined,
            ts: Date.now(),
            isFullCodeRequest: isFullCodeRequest
        };

        setChatHistory(prev => [...prev, userMessage]);
        setMessage('');

        // Reset streaming state
        accumulatedTokensRef.current = '';
        setStreamedContent('');
        setShowContinueButton(false);
        setLastStreamId(null);
        fileContentBufferRef.current = '';

        // DECISION: When to use streaming vs normal API
        const shouldUseStreaming = 
            isFullCodeRequest ||                            // Full code mode
            detectLargeCodeRequest(message) ||              // Large code expected
            mode === "analyze_file" ||                      // File analysis
            message.toLowerCase().includes('stream') ||     // User explicitly asks for streaming
            message.toLowerCase().includes('step by step') || // Detailed explanations
            detectMathRequest(message);                     // Math problems

        console.log('Streaming decision:', {
            shouldUseStreaming,
            isFullCodeRequest,
            mode,
            messageLength: message.length
        });

        try {
            // FILE ANALYSIS (Always streaming because it's large)
            if (mode === "analyze_file" && fileCopy) {
                let fileContent;
                
                if (fileCopy.type.startsWith('text/') || 
                    fileCopy.name.endsWith('.txt') || 
                    fileCopy.name.endsWith('.py') ||
                    fileCopy.name.endsWith('.js') ||
                    fileCopy.name.endsWith('.html') ||
                    fileCopy.name.endsWith('.css') ||
                    fileCopy.name.endsWith('.md')) {
                    fileContent = await fileCopy.text();
                } else {
                    fileContent = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            try {
                                const base64 = reader.result.split(",")[1];
                                resolve(base64);
                            } catch (e) {
                                reject(e);
                            }
                        };
                        reader.onerror = (err) => reject(err);
                        reader.readAsDataURL(fileCopy);
                    });
                }

                const apiUrl = '/api/generate/text';
                const apiPayload = {
                    prompt: message || `Analyze the contents of ${fileCopy.name}`,
                    mode: "analyze_file",
                    filename: fileCopy.name,
                    file_content: fileContent,
                    file_type: fileCopy.type,
                    user_preference_id: getPersistentUserId(),
                    firebase_token: currentUser?.firebaseToken || '',
                    stream: true
                };
                
                console.log('Sending file analysis request with streaming');
                
                // Show streaming UI
                setIsStreaming(true);
                const initialStreamMessage = {
                    role: 'assistant',
                    content: '',
                    type: 'text',
                    ts: Date.now(),
                    isStreaming: true
                };
                setStreamingMessage(initialStreamMessage);
                
                const response = await callFastAPI(apiUrl, apiPayload, mode, {
                    signal: controller.signal,
                    stream: true
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                await handleStreamResponse(response);

                if (accumulatedTokensRef.current) {
                    const assistantMessage = {
                        role: 'assistant',
                        content: accumulatedTokensRef.current,
                        type: 'text',
                        ts: Date.now()
                    };
                    setChatHistory(prev => [...prev, assistantMessage]);
                }
            }
            // IMAGE EDIT
            else if (mode === "image_edit" && imageCopy) {
                const base64Image = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const b = reader.result.split(",")[1];
                            resolve(b);
                        } catch (e) {
                            reject(e);
                        }
                    };
                    reader.onerror = (err) => reject(err);
                    reader.readAsDataURL(imageCopy);
                });

                const apiUrl = '/api/generate/text';
                const apiPayload = {
                    prompt: message || "Edit this image",
                    mode: "image_edit",
                    image: base64Image,
                    strength: 0.7,
                    user_preference_id: getPersistentUserId(),
                    firebase_token: currentUser?.firebaseToken || '',
                    stream: false
                };
                
                console.log('Sending image edit request');
                
                const result = await callFastAPI(apiUrl, apiPayload, mode);

                const assistantMessage = {
                    role: 'assistant',
                    content: '',
                    type: 'image',
                    base64_image: result?.base64_image,
                    ts: Date.now()
                };
                setChatHistory(prev => [...prev, assistantMessage]);
}
            // IMAGE GENERATION
            else if (mode === "image_gen") {
                const apiUrl = '/api/generate/text';
                const apiPayload = { 
                    prompt: message, 
                    mode: 'image_gen',
                    aspect_ratio: aspectRatio,
                    user_preference_id: getPersistentUserId(),
                    firebase_token: currentUser?.firebaseToken || '',
                    stream: false
                };
                
                console.log('Sending image generation request');
                
                const result = await callFastAPI(apiUrl, apiPayload, mode);

                const assistantMessage = {
                    role: 'assistant',
                    content: '',
                    type: 'image',
                    base64_image: result?.base64_image,
                    ts: Date.now()
                };
                setChatHistory(prev => [...prev, assistantMessage]);
}
            // FULL CODE MODE (Always streaming)
            else if (isFullCodeRequest) {
                const apiUrl = '/api/generate/text';
                const apiPayload = { 
                    prompt: message, 
                    mode: "chat",
                    user_preference_id: getPersistentUserId(),
                    firebase_token: currentUser?.firebaseToken || '',
                    stream: true,
                    full_code_mode: true,
                    project_type: projectMetadata.type
                };
                
                console.log('Sending full-code request with streaming');
                
                // Show streaming UI
                setIsStreaming(true);
                const initialStreamMessage = {
                    role: 'assistant',
                    content: `Generating complete project: ${projectMetadata.name}...`,
                    type: 'text',
                    ts: Date.now(),
                    isStreaming: true
                };
                setStreamingMessage(initialStreamMessage);
                
                const response = await callFastAPI(apiUrl, apiPayload, mode, {
                    signal: controller.signal,
                    stream: true
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                await handleStreamResponse(response);

                if (accumulatedTokensRef.current) {
                    const assistantMessage = {
                        role: 'assistant',
                        content: accumulatedTokensRef.current,
                        type: 'text',
                        ts: Date.now(),
                        isFullCode: true,
                        files: generatedFiles.length > 0 ? generatedFiles : undefined
                    };
                    setChatHistory(prev => [...prev, assistantMessage]);
                    
                    if (generatedFiles.length > 0) {
                        setTimeout(() => {
                            setIsProjectView(true);
                            showModal("Project Generated", 
                                `Successfully generated ${generatedFiles.length} files.`
                            );
                        }, 500);
                    }
                }
            }
            // NORMAL CHAT (Decision based on shouldUseStreaming)
            else {
                if (shouldUseStreaming) {
                    // Use streaming for large/math responses
                    const apiUrl = '/api/generate/text';
                    const apiPayload = { 
                        prompt: message, 
                        mode,
                        user_preference_id: getPersistentUserId(),
                        firebase_token: currentUser?.firebaseToken || '',
                        stream: true
                    };
                    
                    console.log('Using streaming for this request');
                    
                    // Show streaming UI
                    setIsStreaming(true);
                    const initialStreamMessage = {
                        role: 'assistant',
                        content: '',
                        type: 'text',
                        ts: Date.now(),
                        isStreaming: true
                    };
                    setStreamingMessage(initialStreamMessage);
                    
                    const response = await callFastAPI(apiUrl, apiPayload, mode, {
                        signal: controller.signal,
                        stream: true
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    await handleStreamResponse(response);

                    if (accumulatedTokensRef.current) {
                        const assistantMessage = {
                            role: 'assistant',
                            content: accumulatedTokensRef.current,
                            type: 'text',
                            ts: Date.now()
                        };
                        setChatHistory(prev => [...prev, assistantMessage]);
                    }
                } else {
                    // Use normal API call for regular chat
                    const apiUrl = '/api/generate/text';
                    const apiPayload = { 
                        prompt: message, 
                        mode,
                        user_preference_id: getPersistentUserId(),
                        firebase_token: currentUser?.firebaseToken || '',
                        stream: false
                    };
                    
                    console.log('Using normal API call for regular chat');

                    const result = await callFastAPI(apiUrl, apiPayload, mode, {
                        signal: controller.signal,
                        stream: false
                    });

                    console.log('Received normal response:', {
                        hasText: !!result?.text,
                        textLength: result?.text?.length
                    });

                    if (result?.text) {
                        // Use fast typing animation for better UX
                        typeText(result.text, () => {
                            const assistantMessage = {
                                role: 'assistant',
                                content: result.text,
                                type: 'text',
                                ts: Date.now()
                            };
                            setChatHistory(prev => [...prev, assistantMessage]);
                            setStreamingMessage(null);
                        });
                    } else {
                        const assistantMessage = {
                            role: 'assistant',
                            content: result?.text || '',
                            type: 'text',
                            ts: Date.now()
                        };
                        setChatHistory(prev => [...prev, assistantMessage]);
}
}
}
        } catch (error) {
            console.error('API ERROR:', error);
            if (error.name === 'AbortError') {
                console.log('Request aborted by user');
            } else {
                const assistantError = {
                    role: 'assistant',
                    content: `Error: ${error?.message || 'Something went wrong.'}`,
                    type: 'text',
                    ts: Date.now()
                };
                setChatHistory(prev => [...prev, assistantError]);
            }
        } finally {
            // Clean up
            setAbortController(null);
            setUploadedFile(null);
            setUploadedImage(null);
            setIsLoading(false);
            setIsStreaming(false);
            setStreamingMessage(null);
            
            // Clear streaming content
            setStreamedContent('');
            accumulatedTokensRef.current = '';
        }
    };

    // ---------- Download Project ----------
    const downloadProjectAsZip = useCallback(async () => {
        if (generatedFiles.length === 0) {
            showModal("No Files", "No generated files to download.");
            return;
        }
        
        try {
            const projectData = {
                name: projectMetadata.name || 'spider-project',
                files: generatedFiles,
                metadata: projectMetadata,
                generatedAt: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(projectData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectMetadata.name || 'project'}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showModal("Project Downloaded", `Project "${projectMetadata.name}" has been downloaded.`);
        } catch (error) {
            console.error('Download error:', error);
            showModal("Download Error", "Failed to download project.");
        }
    }, [generatedFiles, projectMetadata, showModal]);

    // ---------- Project View Components ----------
    const ProjectFileTree = useMemo(() => {
        return React.memo(({ files, activeIndex, onSelectFile }) => {
            if (!files || files.length === 0) return null;
            
            const getFileIcon = (fileName) => {
                const ext = fileName.split('.').pop().toLowerCase();
                const icons = {
                    'js': '📜', 'jsx': '⚛️', 'ts': '📘', 'tsx': '⚛️',
                    'py': '🐍', 'html': '🌐', 'css': '🎨', 'json': '📦',
                    'md': '📝', 'txt': '📄'
                };
                return icons[ext] || '📄';
            };
            
            return (
                <div className="bg-[var(--spider-dark)] rounded-lg border border-[var(--spider-light)] p-3">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-white">Project Files</h4>
                        <span className="text-xs text-[var(--spider-text-dim)]">
                            {files.length} file{files.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                        {files.map((file, index) => (
                            <button
                                key={index}
                                onClick={() => onSelectFile(index)}
                                className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center space-x-2 transition-colors ${
                                    activeIndex === index
                                        ? 'bg-[var(--spider-light)] text-white'
                                        : 'text-[var(--spider-text)] hover:bg-[var(--spider-med)]'
                                }`}
                            >
                                <span>{getFileIcon(file.name)}</span>
                                <span className="truncate">{file.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            );
        });
    }, []);

    const FileViewer = useMemo(() => {
        return React.memo(({ file }) => {
            if (!file) return null;
            
            const handleCopyFile = () => {
                navigator.clipboard.writeText(file.content);
                showModal("Copied", "File content copied to clipboard!");
            };
            
            return (
                <div className="bg-[var(--spider-dark)] rounded-lg border border-[var(--spider-light)] p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-semibold text-white truncate">{file.name}</h4>
                            <span className="text-xs text-[var(--spider-text-dim)] bg-[var(--spider-med)] px-2 py-1 rounded">
                                {file.language}
                            </span>
                        </div>
                        <button
                            onClick={handleCopyFile}
                            className="text-xs bg-[var(--spider-light)] text-white px-3 py-1.5 rounded hover:opacity-90 transition-colors"
                        >
                            Copy
                        </button>
                    </div>
                    
                    <div className="bg-black rounded-lg overflow-hidden">
                        <pre className="text-sm p-4 overflow-x-auto max-h-96">
                            <code className={`language-${file.language}`}>
                                {file.content}
                            </code>
                        </pre>
                    </div>
                </div>
);
        });
    }, [showModal]);

    // ---------- Main JSX ----------
    return (
        <div className="flex flex-row h-full w-full bg-[var(--spider-dark)] text-[var(--spider-text)] overflow-hidden relative">
            {/* Desktop Sidebar */}
            {!isMobile && (
                <div className="hidden md:flex flex-col bg-[var(--spider-med)] w-64 p-4 border-r border-[var(--spider-light)] flex-shrink-0 space-y-4 overflow-y-auto">
                    <button 
                        onClick={handleNewChat} 
                        className="w-full bg-[var(--spider-neon-blue)] text-black text-sm font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition flex items-center space-x-2 justify-center active:scale-95"
                        disabled={isDeleting}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        <span>New Chat</span>
                    </button>

                    <div className="flex-grow pt-4 border-t border-[var(--spider-light)] overflow-y-auto">
                        <h3 className="text-xs font-semibold uppercase text-[var(--spider-text-dim)] mb-2 px-1">
                            Recent Chats
                        </h3>
                        <div className="space-y-1">
                            {recentChats.length > 0 ? (
                                recentChats.map((chat) => (
                                    <div key={chat.id} className="flex items-center group">
                                        <button 
                                            onClick={() => loadChatById(chat.id)} 
                                            className={`flex-grow text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--spider-light)] truncate transition-colors active:scale-95 ${
                                                activeChatId === chat.id 
                                                    ? 'bg-[var(--spider-light)] text-white font-medium' 
                                                    : 'text-[var(--spider-text)] hover:text-white'
                                            }`}
                                            disabled={isDeleting}
                                        >
                                            <div className="truncate">{chat.title}</div>
                                            <div className="text-xs text-[var(--spider-text-dim)] mt-1">
                                                {new Date(chat.timestamp).toLocaleDateString()} • {chat.mode}
                                            </div>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Delete this chat?')) {
                                                    deleteChat(chat.id);
                                                }
                                            }}
                                            className="ml-2 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity p-2 active:scale-95"
                                            title="Delete chat"
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? (
                                                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                '×'
                                            )}
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-[var(--spider-text-dim)] text-sm">
                                    No recent chats
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Chat Area */}
            <div className="flex flex-col flex-1 h-full min-h-0 w-full">
                {/* Mobile Header */}
                {isMobile && (
                    <div className="flex items-center justify-between p-3 bg-[var(--spider-med)] border-b border-[var(--spider-light)] flex-shrink-0">
                        <button 
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-white p-2 touch-manipulation active:scale-95"
                            aria-label="Open menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                        </button>
                        <span className="text-sm font-semibold text-[var(--spider-neon-blue)] truncate px-2">
                            {getModeText()}
                        </span>
                        <button 
                            onClick={handleNewChat}
                            className="text-white p-2 touch-manipulation active:scale-95"
                            aria-label="New chat"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                        </button>
                    </div>
                )}

                {/* Mobile Sidebar */}
                {isMobile && sidebarOpen && (
                    <div className="fixed inset-0 z-50">
                        <div 
                            className="fixed inset-0 bg-black bg-opacity-50"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <div className="fixed left-0 top-0 h-full w-64 bg-[var(--spider-med)] z-50 overflow-y-auto p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-white font-semibold">Chat History</h2>
                                <button 
                                    onClick={() => setSidebarOpen(false)}
                                    className="text-white hover:text-gray-300 text-2xl p-1"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <button 
                                onClick={handleNewChat} 
                                className="w-full bg-[var(--spider-neon-blue)] text-black text-sm font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition flex items-center space-x-2 justify-center mb-4"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                <span>New Chat</span>
                            </button>

                            <div className="space-y-1">
                                {recentChats.length > 0 ? (
                                    recentChats.map((chat) => (
                                        <button 
                                            key={chat.id}
                                            onClick={() => {
                                                loadChatById(chat.id);
                                                setSidebarOpen(false);
                                            }} 
                                            className={`w-full text-left px-3 py-3 text-sm rounded-lg hover:bg-[var(--spider-light)] truncate transition-colors ${
                                                activeChatId === chat.id 
                                                    ? 'bg-[var(--spider-light)] text-white font-medium' 
                                                    : 'text-[var(--spider-text)] hover:text-white'
                                            }`}
                                        >
                                            <div className="truncate">{chat.title}</div>
                                            <div className="text-xs text-[var(--spider-text-dim)] mt-1">
                                                {new Date(chat.timestamp).toLocaleDateString()}
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-[var(--spider-text-dim)] text-sm">
                                        No recent chats
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Project View */}
                {isProjectView ? (
                    <div className="flex-grow overflow-y-auto p-4">
                        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-1">
                                <ProjectFileTree 
                                    files={generatedFiles}
                                    activeIndex={activeFileIndex}
                                    onSelectFile={setActiveFileIndex}
                                />
                                
                                <div className="mt-4 bg-[var(--spider-dark)] rounded-lg border border-[var(--spider-light)] p-3">
                                    <h4 className="text-sm font-semibold text-white mb-2">Project Info</h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-[var(--spider-text-dim)]">Name:</span>
                                            <span className="text-white">{projectMetadata.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[var(--spider-text-dim)]">Type:</span>
                                            <span className="text-white">{projectMetadata.type}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[var(--spider-text-dim)]">Files:</span>
                                            <span className="text-white">{generatedFiles.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="lg:col-span-2">
                                {generatedFiles[activeFileIndex] ? (
                                    <FileViewer file={generatedFiles[activeFileIndex]} />
                                ) : (
                                    <div className="bg-[var(--spider-dark)] rounded-lg border border-[var(--spider-light)] p-8 text-center">
                                        <div className="text-4xl mb-4">📁</div>
                                        <h3 className="text-lg font-semibold text-white mb-2">Select a File</h3>
                                        <p className="text-[var(--spider-text-dim)]">
                                            Choose a file from the sidebar to view its contents
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto p-2 sm:p-4 space-y-4 pb-28 sm:pb-4">
                        {chatHistory.map((msg, index) => (
                            <ChatBubble key={`${msg.ts}_${index}`} message={msg} />
                        ))}
                        
                        {/* Streaming Message */}
                        {(streamingMessage || isStreaming) && (
                            <div className="flex justify-start mb-4 px-2">
                                <div className="bg-[var(--spider-med)] text-white p-4 rounded-2xl max-w-[95%] shadow-md border border-[var(--spider-light)]">
                                    <pre className="whitespace-pre-wrap font-sans text-sm break-words leading-relaxed">
                                        {streamedContent || streamingMessage?.content || ''}
                                    </pre>
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-[var(--spider-neon-blue)] rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-[var(--spider-neon-blue)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-2 h-2 bg-[var(--spider-neon-blue)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                            <span className="text-xs text-[var(--spider-text-dim)]">
                                                {isStreaming ? 'AI is generating...' : 'AI is typing...'}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={handleStopGeneration}
                                            className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            Stop
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Continue Button */}
                        {showContinueButton && !isLoading && (
                            <div className="flex justify-start mb-4 px-2">
                                <div className="bg-[var(--spider-dark)] p-3 rounded-lg border border-[var(--spider-light)]">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-sm text-[var(--spider-text-dim)]">
                                            {isFullCodeMode 
                                                ? 'Project generation seems incomplete. Continue?' 
                                                : 'Response seems incomplete. Continue generation?'}
                                        </div>
                                        <button 
                                            onClick={handleContinueGeneration}
                                            className="bg-[var(--spider-neon-blue)] text-black text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition"
                                        >
                                            Continue
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={chatEndRef} />
                    </div>
                )}

                {/* Hidden file inputs */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept=".txt,.md,.js,.html,.css,.json,.py" 
                />
                <input 
                    type="file" 
                    ref={imageInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*" 
                />

                {/* Input Area */}
                <div className={`bg-[var(--spider-med)] border-t border-[var(--spider-light)] flex-shrink-0 w-full ${
                    isMobile ? 'fixed bottom-0 left-0 right-0 p-3' : 'p-4'
                }`}>
                    <div className="max-w-5xl mx-auto">
                        {!isMobile && (
                            <div className="flex justify-between items-center mb-3">
                                <span className="flex items-center text-sm text-[var(--spider-neon-blue)] font-semibold">
                                    {getModeText()}
                                    {isFullCodeMode && (
                                        <span className="ml-2 text-xs px-2 py-0.5 bg-[var(--spider-neon-blue)] text-black rounded-full">
                                            FULL CODE
                                        </span>
                                    )}
                                </span>
                                {activeAIMode === 'image_gen' && (
                                    <select 
                                        value={aspectRatio} 
                                        onChange={(e) => setAspectRatio(e.target.value)} 
                                        className="bg-[var(--spider-light)] text-[var(--spider-text)] px-3 py-1.5 rounded-lg text-sm focus:outline-none"
                                    >
                                        <option value="1:1">1:1 Square</option>
                                        <option value="16:9">16:9 Landscape</option>
                                        <option value="9:16">9:16 Portrait</option>
                                        <option value="4:3">4:3 Standard</option>
                                    </select>
                                )}
                            </div>
                        )}

                        {(uploadedFile || uploadedImage) && (
                            <div className="mb-3 text-xs text-green-400 p-3 bg-[var(--spider-dark)] rounded-lg flex justify-between items-center border border-green-800">
                                <span className="truncate flex items-center space-x-2">
                                    {uploadedFile ? (
                                        <>
                                            <span>📄</span>
                                            <span>{uploadedFile.name}</span>
                                        </>
                                    ) : uploadedImage ? (
                                        <>
                                            <span>🖼</span>
                                            <span>{uploadedImage.name}</span>
                                        </>
                                    ) : ''}
                                </span>
                                <button 
                                    onClick={() => { 
                                        setUploadedFile(null); 
                                        setUploadedImage(null); 
                                    }} 
                                    className="text-red-400 hover:text-red-300 ml-3 font-bold flex-shrink-0 p-1"
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        <div className="flex items-end w-full space-x-3">
                            <div className="flex-1 bg-[var(--spider-light)] rounded-xl p-3 min-h-[48px] border border-[var(--spider-light)]">
                                <textarea 
                                    ref={textareaRef}
                                    placeholder={
                                        isFullCodeMode ? "Describe your complete project..." :
                                        uploadedImage ? "Describe how to edit this image..." : 
                                        uploadedFile ? `Analyze "${uploadedFile.name}"...` : 
                                        "Message Spider AI... (Try: 'solve x² + 2x - 3 = 0' or 'write full code for a todo app')"
                                    } 
                                    className="w-full bg-transparent text-white focus:outline-none resize-none text-sm sm:text-base max-h-32 overflow-y-auto"
                                    value={message} 
                                    onChange={(e) => setMessage(e.target.value)} 
                                    onKeyDown={(e) => { 
                                        if (e.key === 'Enter' && !e.shiftKey) { 
                                            e.preventDefault(); 
                                            handleSendMessage(); 
                                        } 
                                    }} 
                                    rows={1}
                                    disabled={isLoading}
                                />
                            </div>

                            <PlusMenu 
                                setActiveAIMode={setActiveAIMode} 
                                fileInputRef={fileInputRef} 
                                imageInputRef={imageInputRef} 
                            />

                            <button 
                                onClick={handleSendMessage} 
                                className="bg-[var(--spider-neon-blue)] text-black font-semibold px-5 py-3 rounded-xl hover:opacity-90 transition duration-200 flex-shrink-0 h-12 flex items-center justify-center min-w-[52px] shadow-lg" 
                                disabled={(!message.trim() && !uploadedFile && !uploadedImage) || isLoading}
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {isMobile && <div className="h-24" />}
            </div>
        </div>
    );
};
// --- END Plus Menu Component ---
const SpiderVFXApp = () => { /* ... (Remains Placeholder) ... */ return (<div className="flex-grow h-full flex flex-col items-center justify-center bg-black text-white p-8 pattern-vfx-grid overflow-y-auto"><div className="bg-black bg-opacity-80 p-10 rounded-lg text-center shadow-xl"><h1 className="text-4xl font-bold mb-4 text-[var(--spider-neon-blue)]">Spider VFX</h1><p className="text-lg text-gray-400 mb-8">Coming Soon!</p><div className="animate-pulse text-6xl">✨</div></div></div>);};

// --- NEW Component: Theme Settings Drawer ---
const ThemeSettingsDrawer = ({ currentTheme, onThemeChange }) => {
    // Theme names for display and the corresponding internal key
    const themes = [
        { key: 'red', name: 'Red (Default)', color: '#00bfff' },
        { key: 'romantic', name: 'Romantic', color: '#ff63b8' },
        { key: 'teal', name: 'Teal (Selected)', color: '#00ffff' },
        { key: 'sky_blue', name: 'Sky Blue', color: '#64b5f6' },
        { key: 'black', name: 'Black (High Contrast)', color: '#00ff00' },
    ];

    return (
        <div className="space-y-4 pt-4 border-t border-[var(--spider-light)]">
            <h3 className="text-xl font-semibold text-white">App Theme</h3>
            <div className="grid grid-cols-2 gap-4">
                {themes.map((theme) => (
                    <button
                        key={theme.key}
                        onClick={() => onThemeChange(theme.key)}
                        className={`p-3 rounded-lg flex items-center space-x-3 transition duration-150 ease-in-out border-2 ${
                            currentTheme === theme.key 
                                ? 'border-[var(--spider-neon-blue)] shadow-[var(--shadow-neon-blue)]' 
                                : 'border-transparent hover:border-[var(--spider-text-dim)]'
                        } bg-[var(--spider-med)] text-[var(--spider-text)]`}
                    >
                        {/* Color Swatch */}
                        <div 
                            className="w-4 h-4 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: theme.color, boxShadow: `0 0 5px ${theme.color}` }}
                        ></div>
                        <span className="text-sm truncate">{theme.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const SettingsApp = ({ currentUser, onLogout, isLoggedIn, onLoginClick, currentTheme, onThemeChange, appScale, onScaleChange }) => {
     return (
     <div className="flex-grow h-full flex flex-col items-center bg-gray-900 text-white p-8 overflow-y-auto">
         <h1 className="text-4xl font-bold mb-8 text-[var(--spider-neon-blue)]">Settings</h1>
         <div className="w-full max-w-md bg-[var(--spider-med)] rounded-lg shadow-lg p-6 space-y-6">
            <div className="border-b border-[var(--spider-light)] pb-4">
                <h3 className="text-xl font-semibold text-white mb-3">Account</h3>
                {isLoggedIn ? (
                    <>
                        <p className="text-sm text-[var(--spider-text-dim)] mb-3">Logged in as: {currentUser?.email || 'Unknown'}</p>
                        <button className="w-full mb-2 bg-[var(--spider-light)] text-[var(--spider-text)] text-sm font-semibold py-2.5 rounded-md hover:bg-opacity-80 transition duration-200 disabled:opacity-50" disabled>Manage Account</button>
                        <button onClick={onLogout} className="w-full bg-red-600 text-white text-sm font-semibold py-2.5 rounded-md hover:bg-red-700 transition duration-200">Logout</button>
                    </>
                ) : (
                    <>
                        <p className="text-sm text-yellow-400 mb-4">You are currently using the app anonymously. Log in to save your data and chat history persistently.</p>
                        <button onClick={onLoginClick} className="w-full bg-[var(--spider-neon-blue)] text-black text-sm font-semibold py-2.5 rounded-md hover:opacity-90 transition duration-200">Login / Sign Up</button>
                    </>
                )}
            </div>
            
            {/* Theme Switcher Integration */}
            <ThemeSettingsDrawer 
                currentTheme={currentTheme} 
                onThemeChange={onThemeChange} 
            />
            
            {/* New Scale Control */}
            <div className="border-b border-[var(--spider-light)] pb-4">
                <h3 className="text-xl font-semibold text-white mb-3">App Scale / Zoom</h3>
                <label className="text-sm block text-[var(--spider-text-dim)] mb-2">Scale Factor: <span className="text-white font-mono">{Math.round(appScale * 100)}%</span></label>
                <input
                    type="range"
                    min="0.8"
                    max="1.2"
                    step="0.05"
                    value={appScale}
                    onChange={(e) => onScaleChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[var(--spider-light)] rounded-lg appearance-none cursor-pointer range-lg"
                    style={{ '--spider-neon-blue': 'var(--spider-neon-blue)' }}
                />
                <p className="text-xs text-[var(--spider-text-dim)] mt-2">Adjusts the overall size of the UI elements.</p>
            </div>


            <div className="border-b border-[var(--spider-light)] pb-4"><h3 className="text-xl font-semibold text-white mb-3">Storage</h3><button className="w-full bg-[var(--spider-light)] text-[var(--spider-text)] text-sm font-semibold py-2.5 rounded-md hover:bg-opacity-80 flex items-center justify-center space-x-2 transition duration-200"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71,7.29l-6-6a1,1,0,0,0-1.41,0l-6,6a1,1,0,0,0,0,1.41L12,15.41l6.71-6.71A1,1,0,0,0,18.71,7.29ZM11.29,4.12l4.29,4.29H7Z"/><path d="M5.29,15.29l-1,1a1,1,0,0,0,0,1.41l6.29,6.29a1,1,0,0,0,1.41,0l6.29-6.29a1,1,0,0,0,0-1.41l-1-1L12,20.59Z"/></svg><span>Connect Google Drive (Placeholder)</span></button></div>
         </div>
    </div>
    );
};

// --- Modals (About, Example) ---
// ... (Modals remain the same) ...
// FIX: Added conditional return at the start of AboutModal to ensure it only renders when 'show' is true.
 const AboutModal = ({ show, onClose }) => { 
     if (!show) return null; // FIX APPLIED HERE
     const formattedText = formatPdfTextForLanding(pdfContent); 
     return (<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"><div className="bg-[var(--spider-med)] rounded-lg shadow-[var(--shadow-neon-blue)] w-full max-w-2xl max-h-[80vh] flex flex-col"><div className="flex justify-between items-center p-4 border-b border-[var(--spider-light)]"><h3 className="text-lg font-semibold text-white">About</h3><button onClick={onClose} className="text-[var(--spider-text-dim)] hover:text-white text-3xl leading-none">&times;</button></div><div className="p-6 text-[var(--spider-text)] overflow-y-auto text-sm">{formattedText}</div><div className="p-4 border-t border-[var(--spider-light)] text-right"><button onClick={onClose} className="bg-[var(--spider-neon-blue)] text-[var(--spider-dark)] text-sm font-semibold px-4 py-1.5 rounded-md hover:opacity-90">Close</button></div></div></div>);
};
const ExampleModal = ({ show, example, onClose }) => { /* ... */ if (!show || !example) return null; return (<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"><div className="bg-[var(--spider-dark)] border border-[var(--spider-light)] rounded-lg shadow-[var(--shadow-neon-blue)] w-full max-w-lg flex flex-col"><div className="flex justify-between items-center p-4 border-b border-[var(--spider-light)]"><h3 className="text-md font-semibold text-[var(--spider-neon-blue)]">{example.title} - Simulation</h3><button onClick={onClose} className="text-[var(--spider-text-dim)] hover:text-white text-3xl leading-none">&times;</button></div><div className="p-4 text-[var(--spider-text)] space-y-3"><div><p className="text-xs uppercase text-[var(--spider-text-dim)] mb-1">Code:</p><pre className="text-xs bg-black p-2 rounded whitespace-pre-wrap font-mono">{example.code}</pre></div><div><p className="text-xs uppercase text-[var(--spider-text-dim)] mb-1">Simulated Output:</p><pre className="text-xs bg-black p-2 rounded whitespace-pre-wrap font-mono text-green-400">{example.output}</pre></div></div><div className="p-3 border-t border-[var(--spider-light)] text-right"><button onClick={onClose} className="bg-[var(--spider-light)] text-[var(--spider-text)] text-xs font-semibold px-3 py-1 rounded-md hover:bg-opacity-80">Close</button></div></div></div>);};


// --- Right Sidebar Component ---
// ----- FIX 3: Removed onWsSend prop and the "Send File" button -----
const RightSidebar = ({ 
    isOpen, onClose, onNavigate, activePanel, isLoggedIn, onRun, onSave, activeFileId, showSaveAlert, 
    // NEW WS PROPS
    onWsConnect, 
    wsStatus 
}) => { 
    const activeClass = "bg-[var(--spider-light)] text-[var(--spider-neon-blue)]";
    const inactiveClass = "text-[var(--spider-text-dim)] hover:bg-[var(--spider-med)] hover:text-white";
    
    // Custom link class that highlights 'Settings' even if redirected to 'login'
    const linkClass = (panelName) => {
        const isActive = activePanel === panelName || (!isLoggedIn && panelName === 'settings' && activePanel === 'login');
        return `block w-full text-left px-4 py-3 text-sm font-medium rounded-md transition duration-150 ease-in-out ${isActive ? activeClass : inactiveClass}`;
    };

    return (
         <div 
             className={`fixed top-0 right-0 h-full bg-[var(--spider-dark)] w-64 shadow-2xl z-[90] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
         >
             <div className="p-4 h-full flex flex-col">
                 <div className="flex justify-between items-center mb-6">
                     <h2 className="text-lg font-semibold text-white">Navigation</h2>
                     <button onClick={onClose} className="text-[var(--spider-text-dim)] hover:text-white text-2xl">&times;</button>
                 </div>
                 
                 {/* Notebook Actions (only visible in Notebook view) */}
                 {activePanel === 'notebook' && (
                    <div className="pb-4 mb-4 border-b border-[var(--spider-light)] space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Notebook Actions</h3>
                        
                        {/* WebSocket Connect/Disconnect Button */}
                        <button 
                            onClick={() => { onWsConnect(); onClose(); }} 
                            className={`w-full text-sm font-semibold px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                                wsStatus === 'Connected' 
                                    ? 'bg-red-600 text-white hover:bg-red-700' 
                                    : wsStatus === 'Connecting' 
                                        ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                        >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-4H7V8h2V6h2v10zm4 0h-2V6h2v10z"/></svg>
                            {/* MODIFIED: Updated button text to be dynamic */}
                            {wsStatus === 'Connected' ? `Disconnect Engine` : wsStatus === 'Connecting' ? `Connecting...` : 'Connect Spy Engine ()'}
                        </button>
                        
                        {/* ----- FIX 3: Removed the "Send File Content via WS" button ----- */}
                        
                        <div className="pt-2 border-t border-[var(--spider-light)] space-y-2">
                            <button 
                                onClick={() => { onSave(); onClose(); }} 
                                className="w-full bg-[var(--spider-neon-blue)] text-[var(--spider-dark)] text-sm font-semibold px-3 py-2 rounded-md hover:opacity-90 relative flex items-center justify-center"
                                disabled={!activeFileId}
                            > 
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 6a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V6zM10 16a3 3 0 100-6 3 3 0 000 6z"></path></svg>
                                Save File
                                {showSaveAlert && (<span className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">✓</span>)}
                            </button>
                            <button 
                                onClick={() => { onRun(); onClose(); }} 
                                className="w-full bg-orange-500 text-white text-sm font-semibold px-3 py-2 rounded-md hover:bg-orange-600 flex items-center justify-center"
                                disabled={!activeFileId}
                            >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                                Run Engine
                            </button>
                        </div>
                    </div>
                 )}
                 
                 <nav className="flex-grow space-y-2">
                     <button onClick={() => { onNavigate('landing'); onClose(); }} className={linkClass('landing')}>Home (Quantum Compiler)</button>
                     <button onClick={() => { onNavigate('notebook'); onClose(); }} className={linkClass('notebook')}>Spider Notebook (IDE)</button>
                     <button onClick={() => { onNavigate('ai'); onClose(); }} className={linkClass('ai')}>Spider AI (Chat)</button>
                   <button onClick={() => { onNavigate('docs'); onClose(); }} className={linkClass('docs')}>Spy Documentation</button>
                     <button onClick={() => { onNavigate('vfx'); onClose(); }} className={linkClass('vfx')}>Spider VFX <span className="text-xs opacity-70">(Soon)</span></button>
                     {/* Settings/Profile link uses onNavigate, which handles the login redirect */}
                     <button onClick={() => { onNavigate('settings'); onClose(); }} className={linkClass('settings')}>
                         {isLoggedIn ? 'User Settings' : 'Login / Settings'}
                     </button>
                 </nav>
                 
                 <div className="mt-4 pt-4 border-t border-[var(--spider-light)]">
                    <p className="text-xs text-gray-500">System Status: <span className="text-green-400">ONLINE</span></p>
                 </div>
             </div>
         </div>
    );
};


// --- Main App Component (Handles Routing, Sidebar, Authentication) ---
export default function App() {
    // --- State Management ---
    const [openFiles, setOpenFiles] = useState([]);
    const [activeFileId, setActiveFileId] = useState(null); 
    const [fileContents, setFileContents] = useState(new Map()); 
    const [projectFiles, setProjectFiles] = useState([]); 
    // START on 'landing' so user can browse without login
    const [activePanel, setActivePanel] = useState('landing'); 
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTerminalTab, setActiveTerminalTab] = useState('terminal'); 
    const [aiQuery, setAiQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalText, setModalText] = useState("");
    const [terminalOutput, setTerminalOutput] = useState(initialTerminalOutput);
    const [showSaveAlert, setShowSaveAlert] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showExampleModal, setShowExampleModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false); // NEW
    const [currentExample, setCurrentExample] = useState(null);
    const fileInputRef = useRef(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); 
    
    // --- FIX 1: Added new ref for single file input ---
    const singleFileInputRef = useRef(null);

    // NEW WEBSOCKET STATE & REF
    const wsRef = useRef(null);
    // Initial status set to match the desktop screenshot for first load
    const [wsStatus, setWsStatus] = useState('Disconnected'); 

    // --- NEW THEME STATE (Default to 'teal' to match the new UI) ---
    const [currentTheme, setCurrentTheme] = useState('teal'); 
    
    // --- NEW SCALE STATE (Default to 1.0) ---
    const [appScale, setAppScale] = useState(1.0); 

    // --- NEW AI STATE ---
    const [activeAIMode, setActiveAIMode] = useState('chat');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [uploadedImage, setUploadedImage] = useState(null);
    
    // --- Theme Application Effect (NEW) ---
    useEffect(() => {
        const theme = themeMap[currentTheme];
        const root = document.documentElement;
        if (theme) {
            Object.entries(theme).forEach(([key, value]) => {
                root.style.setProperty(key, value);
            });
            // Update shadow color based on neon blue setting
            root.style.setProperty('--shadow-neon-blue', `0 0 15px 5px ${theme['--spider-neon-blue']}50`);
            root.style.setProperty('--shadow-neon-blue-sidebar', `-5px 0 20px 0px ${theme['--spider-neon-blue']}50`);
}
    }, [currentTheme]);

    // --- Scale Application Effect (NEW) ---
    useEffect(() => {
        // Apply scaling directly to the root HTML element's font size
        document.documentElement.style.fontSize = `${appScale * 100}%`;
    }, [appScale]);


    // --- Icon Components ---
    const FolderIcon = () => ( <svg className="w-4 h-4 mr-2 inline-block text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path></svg> );
     const FileIcon = () => ( <svg className="w-4 h-4 mr-2 inline-block text-[var(--spider-neon-blue)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> );
     const LockIcon = () => ( <svg className="w-3 h-3 ml-1.5 inline-block" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg> );
     const AiIcon = () => ( <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> );
     const VfxIcon = () => ( <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21a9 9 0 110-18 9 9 0 010 18z" opacity="0.3"></path></svg> );

    // --- Modal & API Call Logic ---
    const showLoader = () => setIsLoading(true);
    const hideLoader = () => setIsLoading(false);
    const showModal = (title, text) => { setModalTitle(title); setModalText(text); setIsModalOpen(true); };
    const hideModal = () => setIsModalOpen(false);
    
    // RENAMED AND UPDATED TO CONNECT TO FASTAPI
// 🔥 UPDATED: Spider AI Cloudflare Integration
// 🔥 SPIDER AI — Cloudflare GPT-120B + SDXL Integration (FINAL VERSION)
// 🔥 SPIDER AI — Cloudflare GPT-120B + SDXL Integration (FINAL VERSION)
// 🔥 UPDATED: Spider AI Cloudflare Integration
// 🔥 SPIDER AI — Cloudflare GPT-120B + SDXL Integration (FINAL VERSION)
const callFastAPI = useCallback(async (endpoint, payload = {}, mode = "chat", options = {}) => {
    
    // 1. Determine if we should force streaming
    // We stream for 'chat', 'analyze_file', 'stream', or if the prompt doesn't trigger image gen
    const isImageGen = mode === "image_gen" || (payload.prompt && /generate image|create image/i.test(payload.prompt));
    const shouldStream = !isImageGen;

    let fetchOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            ...payload,
            // Force stream flag to true for all text/chat requests 
            stream: shouldStream 
        }),
        signal: options.signal 
    };

    try {
        const res = await fetch("/ai", fetchOptions);

        // ---------------- 1. STREAMING HANDLER (CHAT & ANALYZE) ----------------
        // If it's not an image, we return the raw response for the UI stream reader [cite: 122]
        if (shouldStream) {
            return res; 
        }

        // ---------------- 2. IMAGE RESPONSE (PNG) ----------------
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("image/")) {
            const blob = await res.blob();

            const base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(",")[1]);
                reader.readAsDataURL(blob);
            });

            return {
                text: payload.prompt || "",
                base64_image: base64,
                model_used: "Lucid Origin" // Consistent with Backend [cite: 21, 101]
            };
        }

        // ---------------- 3. JSON RESPONSES (MEMORY OPS) ----------------
        if (contentType.includes("application/json")) {
            return await res.json();
        }

        // Fallback for plain text errors
        const rawText = await res.text();
        return { text: rawText };

    } catch (err) {
        // Prevent UI crash on network errors
        return { error: err.message };
    }
}, []);
    
    // --- WebSocket Handlers (NEW) ---
    // Helper function to append plain text to terminal output
    const appendToTerminal = (text, type = 'stdout') => {
        let coloredText = '';
        switch (type) {
            case 'stdout':
                // Standard output (plain text)
                coloredText = `<span class="text-white">${text}</span>`;
                break;
            case 'run_started':
                // Execution start message
                coloredText = `<span class="text-yellow-400">🚀 ${text}</span>`;
                break;
            case 'error':
                // Error message
                coloredText = `<span class="text-red-500">❌ ${text}</span>`;
                break;
            case 'connect_note':
                // System message (connection status)
                coloredText = `<span class="text-gray-500">System: ${text}</span>`;
                break;
            default:
                // Raw message fallback (should not happen often with this fix)
                coloredText = `<span class="text-gray-600">${text}</span>`;
                break;
        }

        // Add to the terminal output state
        setTerminalOutput(prev => [...prev, coloredText]);
    };


    // MODIFIED: Changed default URL to your secure domain
// MODIFIED: Changed default URL to your secure domain
    const handleWsConnect = (url = 'wss://spy.m4spider.com/') => { // <<< FIX HERE
        if (wsRef.current && wsStatus === 'Connected') {
            wsRef.current.close(1000, 'User initiated disconnect');
            return;
        }

        if (wsStatus === 'Connecting') {
            // Suppress: appendToTerminal(`WebSocket: Already attempting connection.`, 'connect_note');
            return;
        }

        setWsStatus('Connecting');
        appendToTerminal(`Spy Engine: Attempting connection to  connect ...`, 'connect_note');

        try {
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                setWsStatus('Connected');
                appendToTerminal(`Spy Engine: Connected `, 'stdout');
                // Automatically send a welcome message 
                ws.send(JSON.stringify({ type: "connect_note", message: "Hello, Spider Node Book!" }));
            };

            // ----------------------------------------------------------------------------------
            // >>>>>>>>>>>>>>>>>>>> CORE FIX IMPLEMENTATION <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
            // ----------------------------------------------------------------------------------
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Handle known message types
                    if (data.type === "stdout" && data.message) {
                        let message = data.message.trim();
                        
                        // 1. Regex to strip common Windows temporary paths (C:\Users\... and /D/home/Tools/...)
                        // This handles linker/compiler paths and Python tracebacks that contain a full path + extension.
                        const pathRegex = /(?:C:\\Users\\|D:\/home\/Tools\/|File\s+)[\w\s\\/.-]+\.(py|cpp|java|exe|ld\.exe|collect2\.exe|javac)/g;
                        
                        let isPathError = false;
                        let cleanMessage = message.replace(pathRegex, (match) => {
                             isPathError = true;
                             // For Python File tracebacks, keep the file name. For system tools, simplify.
                             if (match.startsWith("File ")) {
                                 const fileNameMatch = match.match(/["']?([^:"']+\.(py|cpp|java|spy))["']?/i);
                                 return `[File Error: ${fileNameMatch ? fileNameMatch[1] : 'Unknown File'}]`;
                             } else if (match.includes('ld.exe') || match.includes('collect2.exe') || match.includes('javac')) {
                                 // Replace full compiler paths with a simple compiler identifier
                                 return match.includes('javac') ? 'javac' : 'Linker/Compiler Error';
                             }
                             return 'File Path Omitted'; // Fallback for other direct path leaks
                        });
                        
                        // 2. Further simplify linker error messages to remove file references that still contain temp paths
                        // E.g., 'cannot open output file "C:\Users\...\temp_cpp_6bd73a12.exe": Invalid argument'
                        cleanMessage = cleanMessage.replace(/cannot open output file\s+["']?([^:"']+\.(exe))["']?:\s*/i, 'Linker Error: Cannot open output file: ');
                        
                        
                        // 3. Output the result
                        if (isPathError) {
                            appendToTerminal(cleanMessage, 'error');
                        } else {
                             // Regular stdout message
                            appendToTerminal(message);
                        }

                    } else if (data.type === "run_started") {
                        appendToTerminal("Running " + data.file, 'run_started');
                    } else if (data.type === "error") {
                        appendToTerminal("Execution Error: " + data.message, 'error');
                    } else if (data.type === "process_finished") {
                        // Suppress unhandled debug message type process_finished
                        console.debug("WS Debug Message:", data);
                    } 
                    else {
                        // For anything else, just log quietly (debug)
                        console.debug("WS Debug Message:", data);
                        // Optional: Append a colored notice for truly unhandled/debug messages
                        appendToTerminal(`[DEBUG] Unhandled message type: ${data.type || 'unknown'}`, 'connect_note');
                    }
                } catch (e) {
                    // Non-JSON fallback: log the entire raw message as an error/raw
                    appendToTerminal("Raw WS Message (Non-JSON): " + event.data, 'error');
                }
            };
            // ----------------------------------------------------------------------------------
            // >>>>>>>>>>>>>>>>>>>> END CORE FIX IMPLEMENTATION <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
            // ----------------------------------------------------------------------------------

            ws.onclose = (event) => {
                setWsStatus('Disconnected');
                appendToTerminal(`Spy Engine: Disconnected. Code: ${event.code}, Reason: ${event.reason || ''}`, 'error');
                wsRef.current = null;
            };

            ws.onerror = (error) => {
                setWsStatus('Error');
                appendToTerminal(`Spy Engine: Error! Check console for details.`, 'error');
                console.error("WebSocket Error:", error);
                wsRef.current?.close(); // Clean up on error
            };
        } catch (e) {
            setWsStatus('Error');
            appendToTerminal(`Spy Engine: Connection failed immediately. Invalid URL or protocol.`, 'error');
            console.error("WebSocket Initialization Error:", e);
        }
    };

    // This function is now only called by handleRunEngine
    const handleWsSend = () => {
        const content = fileContents.get(activeFileId);

        if (wsStatus !== 'Connected' || !wsRef.current || !activeFileId) {
             showModal("WebSocket Error", "Cannot send. Ensure you are connected and a file is open.");
             return;
        }
        
        if (typeof content === 'undefined' || content.trim() === "") {
             showModal("WebSocket Error", "Cannot send an empty file.");
             return;
        }

        try {
            wsRef.current.send(content);
            // Hiding the raw message here, only keeping the friendly status update.
            // appendToTerminal(`WebSocket: Sent ${activeFileId} (${content.length} bytes)`);
            setShowSaveAlert(true); // Reusing save alert for a moment
            setTimeout(() => setShowSaveAlert(false), 1500);
        } catch (e) {
            appendToTerminal(`WebSocket Send Failed: ${e.message}`, 'error');
            showModal("WS Send Error", e.message);
        }
    };
    // --- End WebSocket Handlers ---
    
    // --- File Handlers ---
     const handleOpenProject = () => { fileInputRef.current.click(); };
     // --- FIX 1: Added new handler to click the single file input ---
     const handleOpenFileClick = () => { singleFileInputRef.current.click(); };
     
     // ----- FIX 1: Modified handleFilesUploaded (for projects) -----
     const handleFilesUploaded = async (event) => { 
         const files = event.target.files; if (!files || files.length === 0) return; showLoader();
        const newProjectFiles = []; const newFileContents = new Map();
        for (const file of files) {
            try { 
                // Use webkitRelativePath if available (for directory upload), otherwise fall back to file.name
                const filePath = file.webkitRelativePath || file.name;
                const content = await file.text(); 
                newProjectFiles.push({ name: filePath, kind: 'file' }); 
                newFileContents.set(filePath, content); 
            } 
            catch (err) { console.error("Read file error:", file.name, err); }
        }
        newProjectFiles.sort((a, b) => a.name.localeCompare(b.name)); setProjectFiles(newProjectFiles); setFileContents(newFileContents);
        // Open the first 3 files, or fewer if less than 3 were uploaded
        const newOpenFileNames = newProjectFiles.map(f => f.name).slice(0, 3); 
        setOpenFiles(newOpenFileNames); 
        setActiveFileId(newOpenFileNames[0] || null); 
        hideLoader(); 
        event.target.value = null; // Clear input
     };
     // ----- END FIX 1 -----

    // --- FIX 1: Added new handler for single file uploads ---
    const handleSingleFilesUploaded = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        showLoader();
        
        const newProjectFiles = [...projectFiles];
        const newFileContents = new Map(fileContents);
        const newOpenFileNames = [...openFiles];
        let firstNewFile = null;

        for (const file of files) {
            try {
                const filePath = file.name; // Just use name for single files
                
                // Avoid duplicates in file list
                if (!newFileContents.has(filePath)) {
                    const content = await file.text();
                    newProjectFiles.push({ name: filePath, kind: 'file' });
                    newFileContents.set(filePath, content);
                }

                // Avoid duplicates in open tabs
                if (!newOpenFileNames.includes(filePath)) {
                    newOpenFileNames.push(filePath);
                }
                
                if (!firstNewFile) {
                    firstNewFile = filePath;
                }
            } catch (err) {
                console.error("Read file error:", file.name, err);
            }
        }
        
        newProjectFiles.sort((a, b) => a.name.localeCompare(b.name));
        setProjectFiles(newProjectFiles);
        setFileContents(newFileContents);
        setOpenFiles(newOpenFileNames);
        
        // Set active file to the first new file opened
        if (firstNewFile) {
            setActiveFileId(firstNewFile);
        }
        
        hideLoader();
        event.target.value = null; // Clear input
    };
    // ----- END FIX 1 -----


    // --- FIX 2: Updated handleNewProject to create a default file ---
  const handleNewProject = () => {
    const defaultFileName = 'main.spy';
    // Proper Spy multi-language format with code blocks
    const defaultFileContent = `\`\`\`python
print("Hello from Python in Spy!")
\`\`\`

\`\`\`java
public class Main {
    public static void main(String[] args) {
        System.out.println("Java is ready!");
}
}
\`\`\`

\`\`\`cpp
#include <iostream>
int main() {
    std::cout << "C++ says hi!" << std::endl;
    return 0;
}
\`\`\`
`;
        // 1. Set state to reflect the new project
        setProjectFiles([{ name: defaultFileName, kind: 'file' }]);
        setOpenFiles([defaultFileName]);
        setActiveFileId(defaultFileName);
        
        const newFileContents = new Map();
        newFileContents.set(defaultFileName, defaultFileContent);
        setFileContents(newFileContents);
        
        // 2. Update terminal
        setTerminalOutput([
            'New project created.',
            'Opened default file: main.spy'
        ]);
        setActivePanel('notebook');
    };
    // ----- END FIX 2 -----
     
     const handleFileClick = (file) => { 
         if (!file || file.kind !== 'file') return; const fileName = file.name; if (!fileContents.has(fileName)) { showModal("Error", "No content."); return; } if (!openFiles.includes(fileName)) { setOpenFiles([...openFiles, fileName]); } setActiveFileId(fileName);
     };
     const handleCloseTab = (e, fileNameToClose) => { 
         e.stopPropagation(); const newOpenFiles = openFiles.filter(f => f !== fileNameToClose); setOpenFiles(newOpenFiles); if (activeFileId === fileNameToClose) { setActiveFileId(newOpenFiles[0] || null); }
     };
     const handleCodeChange = (e) => { 
         if (!activeFileId) return; const newContents = new Map(fileContents); newContents.set(activeFileId, e.target.value); setFileContents(newContents);
     };
     const handleSave = () => { 
         if (!activeFileId) { showModal("Error", "No file to save."); return; } const content = fileContents.get(activeFileId); if (typeof content === 'undefined') { showModal("Error", "No content."); return; } try { const blob = new Blob([content],{type:'text/plain;charset=utf-8'}); const link=document.createElement('a'); link.href=URL.createObjectURL(blob); link.download=activeFileId; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href); setShowSaveAlert(true); setTimeout(() => setShowSaveAlert(false), 2000); } catch (err) { showModal("Error", `Save failed: ${err.message}`); }
     };

    // ----- FIX 2: Replaced handleRunEngine logic -----
     const handleRunEngine = () => { 
         const fileContent = getCurrentCode(); 
         if (!fileContent) return; // getCurrentCode shows its own modal

         if (wsStatus !== 'Connected' || !wsRef.current) {
             showModal("Engine Not Connected", "Please connect to your Spy Engine first. Use the 'Connect Spy Engine' button in the navigation menu.");
             appendToTerminal(`Run Engine: Failed. Spy Engine (WebSocket) is not connected.`, 'error');
             return;
         }

         // Use the existing WebSocket send logic
         try {
             wsRef.current.send(fileContent);
             // Add friendly terminal output, hiding the raw JSON message
             appendToTerminal(`Sending ${activeFileId} to Spy Engine...`, 'run_started');
             // Removed: appendToTerminal(`WS Message Sent: {"type":"run_file","fileName":"${activeFileId}", "size":${fileContent.length}}`, 'connect_note');
         } catch (e) {
             appendToTerminal(`WebSocket Send Failed: ${e.message}`, 'error');
             showModal("WS Send Error", e.message);
         }
     };
     // ----- END FIX 2 -----

     const getCurrentCode = () => { 
          if (!activeFileId) { showModal("No File", "Open file."); return null; } const code=fileContents.get(activeFileId); if (typeof code==='undefined'||code.trim()==="") { showModal("Empty File", "No code."); return null; } return code;
     };
     const handleGenerateCode = async () => { 
         if (!activeFileId) { showModal("No File", "Open file."); return; } if (!aiQuery) { showModal("Empty Prompt", "Enter prompt."); return; } const systemPrompt="Generate only raw code."; const generatedCode=await callFastAPI('/api/generate/text', { prompt: aiQuery }, 'chat'); 
         if (generatedCode && !generatedCode.error) { 
             const newContents=new Map(fileContents); 
             const oldContent=newContents.get(activeFileId)||""; 
             newContents.set(activeFileId, oldContent+"\n\n"+generatedCode.text); 
             setFileContents(newContents); 
             setAiQuery(""); 
         }
     };
     const handleExplainCode = async () => { 
         const code=getCurrentCode(); if (!code) return; const userQuery=`Explain:\n\`\`\`\n${code}\n\`\`\``; 
         const systemPrompt="Explain code."; 
         const explanation=await callFastAPI('/api/generate/text', { prompt: userQuery, system_instruction: systemPrompt }, 'chat'); 
         if (explanation && !explanation.error) { showModal("AI Explanation", explanation.text); }
     };
     const handleCritiqueCode = async () => { 
         const code=getCurrentCode(); if (!code) return; const userQuery=`Critique:\n\`\`\`\n${code}\n\`\`\``; 
         const systemPrompt="Critique code."; 
         const critique=await callFastAPI('/api/generate/text', { prompt: userQuery, system_instruction: systemPrompt }, 'chat'); 
         if (critique && !critique.error) { showModal("AI Critique", critique.text); }
     };
     const handleFixErrors = async () => { 
         const code=getCurrentCode(); if (!code) return; const userQuery=`Fix:\n\`\`\`\n${code}\n\`\`\``; 
         const systemPrompt="Fix errors, return only raw code."; 
         const fixedCode=await callFastAPI('/api/generate/text', { prompt: userQuery, system_instruction: systemPrompt }, 'chat'); 
         if (fixedCode && !fixedCode.error) { 
             const newContents=new Map(fileContents); 
             newContents.set(activeFileId, fixedCode.text); 
             setFileContents(newContents); 
         }
     };
    // --- End File Handlers ---

    // --- Auth Handlers (UPDATED) ---
    const handleLoginSuccess = (userData) => {
        setCurrentUser(userData);
        setIsLoggedIn(true);
        setActivePanel('settings'); // Redirect to settings after successful login/signup
        setShowPrivacyModal(true); 
        setOpenFiles([]); setActiveFileId(null); setFileContents(new Map()); setProjectFiles([]); // Reset project state
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setActivePanel('landing'); // Redirect to a functional, non-login page after logout
    };
    
    const handleLoginClick = () => {
        setActivePanel('login');
    };

    // --- New Navigation Wrapper (CRITICAL CHANGE) ---
    const navigateToPanel = useCallback((panelName) => {
        setIsSidebarOpen(false); // Close sidebar on navigation
        
        // If not logged in and trying to access settings/profile, redirect to login
        if (!isLoggedIn && (panelName === 'settings')) {
            setActivePanel('login');
        } else if (activePanel === 'login' && panelName === 'settings' && !isLoggedIn) {
             // Stay on login page if user tries to navigate to settings from login without succeeding
             return;
        } else {
            setActivePanel(panelName);
        }
    }, [isLoggedIn, activePanel]);

    // --- Handler for showing example modal ---
    const handleShowExample = (example) => {
        setCurrentExample(example);
        setShowExampleModal(true);
    };
    
    // --- Theme Handler ---
    const handleThemeChange = (themeKey) => {
        setCurrentTheme(themeKey);
    };

    // --- Scale Handler ---
    const handleScaleChange = (scaleValue) => {
        setAppScale(scaleValue);
    };


    // --- Render JSX (REFACTORED) ---
    return (
        <>
            {/* ... Hidden file input and Styles ... */}
             {/* --- FIX 1: Added a new hidden input for single file uploads --- */}
             <input type="file" multiple webkitdirectory="true" directory="true" ref={fileInputRef} onChange={handleFilesUploaded} className="hidden" accept=".spy,.py,.java,.cpp,.c,.h,.txt,.md,.js,.html,.css" />
             <input type="file" multiple ref={singleFileInputRef} onChange={handleSingleFilesUploaded} className="hidden" accept=".spy,.py,.java,.cpp,.c,.h,.txt,.md,.js,.html,.css" />
             
             <style>{`
                :root { 
                    /* Base Theme Variables from Teal (Matching User Screenshots) */
                    --spider-dark: #0a1d1d;
                    --spider-med: #113a3a;
                    --spider-light: #1e5f5f;
                    --spider-neon-blue: #00ffff;
                    --spider-glow: rgba(0, 255, 255, 0.5);
                    --spider-text: #e0ffff;
                    --spider-text-dim: #99cccc;
                    --shadow-neon-blue: 0 0 15px 5px rgba(0, 255, 255, 0.3); 
                    --shadow-neon-blue-sidebar: -5px 0 20px 0px rgba(0, 255, 255, 0.3);
                    
                    /* NEW Aesthetic Variables for Landing Page (using new defaults for teal) */
                    --primary-bg: var(--spider-dark);
                    --accent-teal: var(--spider-neon-blue);
                    --secondary-accent: #FF9900; 
                }
                
                /* Custom styles for futuristic glow effects (MAPPED TO THEME) */
                .terminal-glow {
                    box-shadow: 0 0 15px var(--accent-teal), 0 0 30px rgba(0, 255, 255, 0.3); 
                    border: 1px solid rgba(0, 255, 255, 0.5);
                    backdrop-filter: blur(5px);
                    background: rgba(1, 26, 36, 0.8);
                }

                .feature-card {
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                    background: rgba(1, 26, 36, 0.5);
                    border: 1px solid rgba(0, 255, 255, 0.2);
                }

                .feature-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 10px 30px rgba(0, 255, 255, 0.4);
                }

                .feature-card::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(0, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0) 70%);
                    opacity: 0;
                    transition: opacity 0.5s;
                }

                .feature-card:hover::before {
                    opacity: 1;
                }

                .logo-glow {
                    filter: drop-shadow(0 0 8px var(--accent-teal));
                }

                .arch-node {
                    background-color: rgba(0, 255, 255, 0.1);
                    border: 1px solid var(--accent-teal);
                    box-shadow: 0 0 10px var(--accent-teal);
                }
                .arch-line {
                    height: 2px;
                    background-color: var(--accent-teal);
                    box-shadow: 0 0 5px var(--accent-teal);
                }

                /* Existing styles */
                ::-webkit-scrollbar { width: 8px; height: 8px; } ::-webkit-scrollbar-track { background: var(--spider-med); } ::-webkit-scrollbar-thumb { background: var(--spider-light); border-radius: 4px; } ::-webkit-scrollbar-thumb:hover { background: #4f46e5; }
                input[type="file"] { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
                .pattern-spider-web { background-image: linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.9)), radial-gradient(circle, transparent 1px, rgba(150, 0, 0, 0.15) 1px); background-size: cover, 30px 30px; }
                .pattern-vfx-grid { background-image: linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.95)), linear-gradient(to right, rgba(0, 191, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 191, 255, 0.1) 1px, transparent 1px); background-size: cover, 50px 50px, 50px 50px; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                .animation-delay-300 { animation-delay: 300ms; }
                #code-editor { overflow: auto !important; }
                /* Custom animation for the menu */
                @keyframes fadeInUpOnce {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up-once {
                    animation: fadeInUpOnce 0.2s ease-out forwards;
                }
                
                /* NEW: Floating Orb (Menu Button) styles - MATCHING MOBILE SCREENSHOT */
                .nav-orb-toggle {
                    transition: all 0.3s ease;
                    background-color: var(--spider-neon-blue);
                    box-shadow: 0 0 15px var(--spider-neon-blue);
                    border: 2px solid var(--spider-dark); /* Ensure it stands out against the dark background */
                }
                .nav-orb-toggle:hover {
                    transform: scale(1.1);
                    opacity: 0.9;
                }
                .nav-orb-toggle svg {
                     color: var(--spider-dark);
                }
                /* Mobile Header styles to match the mobile screenshot */
                .mobile-header {
                    background-color: var(--spider-med);
                    border-bottom: 1px solid var(--spider-light);
                    height: 56px; /* Typical Android app bar height */
                }
            `}</style>

            {/* --- MAIN APPLICATION CONTAINER (Fullscreen + Scale) --- */}
            <div 
                className="flex flex-col min-h-screen w-screen overflow-hidden text-[var(--spider-text)] font-sans antialiased"
                style={{
                    backgroundColor: 'var(--spider-dark)',
                    // Removed dynamic width/height adjustment for true full-screen fluid layout
                }}
            >
                
                {/* --- UNIVERSAL MOBILE HEADER (To match Android status bar/address bar context) --- */}
                {/* We only render this when not on the landing or login page for a cleaner IDE feel */}
                {(activePanel !== 'landing' && activePanel !== 'login') && (
                    <div className="md:hidden mobile-header flex items-center justify-between px-4 flex-shrink-0">
                         <div className="flex items-center space-x-2">
                             {/* Mock Back Button / Folder Icon from Mobile Screenshot */}
                 <svg
  className="w-6 h-6 text-cyan-400"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="1.5"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  {/* Geometric Body (Faceted Processor Core) */}
  <polygon
    points="12 4, 15 7, 15 15, 12 18, 9 15, 9 7"
    fill="rgba(0, 255, 255, 0.15)"
    stroke="currentColor"
    strokeWidth="1.5"
  />
  <circle cx="12" cy="12" r="3.5" fill="currentColor" fillOpacity="0.1" />
  <path
    d="M12 4 L 12 18"
    stroke="currentColor"
    strokeWidth="1"
    strokeDasharray="2 2"
    opacity="0.7"
  />

  {/* Legs (Circuit Traces) */}
  {/* Top Left (L1, L2) */}
  <path d="M9 7 L 3 1 L 1 4" />
  <path d="M9 10 L 2 5 L 0 9" />
  {/* Top Right (R1, R2) */}
  <path d="M15 7 L 21 1 L 23 4" />
  <path d="M15 10 L 22 5 L 24 9" />

  {/* Bottom Left (L3, L4) */}
  <path d="M9 15 L 3 23 L 1 20" />
  <path d="M9 12 L 2 17 L 0 13" />
  {/* Bottom Right (R3, R4) */}
  <path d="M15 15 L 21 23 L 23 20" />
  <path d="M15 12 L 22 17 L 24 13" />

  {/* Connectors / Eyes (Small Dots) */}
  <circle cx="10.5" cy="5.5" r="0.5" fill="currentColor" />
  <circle cx="13.5" cy="5.5" r="0.5" fill="currentColor" />
</svg>

                            <span className="text-lg font-semibold text-white truncate">M4SPIDER</span>
                         </div>
                    </div>
                )}
                

                {/* --- NEW Floating Navigation Orb (Menu Button) - FIXED TOP RIGHT --- */}
                {/* Z-index is 90 to ensure it is always on top of the content and modals */}
                <div id="nav-orb-container" className="fixed z-[90]" style={{ top: '16px', right: '16px' }}> 
                    <button 
                        id="nav-orb-toggle" 
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-3 rounded-full nav-orb-toggle w-12 h-12 flex items-center justify-center"
                        title="Open Navigation Menu"
                    >
                        {/* Hamburger Icon */}
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                    </button>
                </div>
                {/* --- END Floating Navigation Orb --- */}

                {/* --- Content Area (Renders the Active Page) --- */}
                <div className="flex-grow h-full overflow-hidden relative"> 
                    {/* Landing Page (Default View) */}
                     <div className={`absolute inset-0 transition-opacity duration-300 ${activePanel === 'landing' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}> {activePanel === 'landing' && <LandingPage onNavigate={navigateToPanel} onShowExample={handleShowExample} />} </div>
                    
                    {/* Notebook App (Includes its own internal toolbar/action buttons) */}
                    <div className={`absolute inset-0 transition-opacity duration-300 ${activePanel === 'notebook' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}> 
                        {activePanel === 'notebook' && 
                            <SpiderNotebookApp 
                                 currentUser={currentUser} openFiles={openFiles} activeFileId={activeFileId} fileContents={fileContents} 
                                 projectFiles={projectFiles} terminalOutput={terminalOutput} activeTerminalTab={activeTerminalTab} 
                                 aiQuery={aiQuery} handleFileClick={handleFileClick} handleCloseTab={handleCloseTab} 
                                 handleCodeChange={handleCodeChange} handleSave={handleSave} handleRunEngine={handleRunEngine} 
                                 setAiQuery={setAiQuery} setActiveTerminalTab={setActiveTerminalTab} 
                                 showModal={showModal} LockIcon={LockIcon} FolderIcon={FolderIcon} FileIcon={FileIcon} 
                                 handleOpenProject={handleOpenProject} 
                                 handleOpenFileClick={handleOpenFileClick} // --- FIX 1: Pass new handler
                                 handleNewProject={handleNewProject}
                                 callFastAPI={callFastAPI} // Pass the API function
                                 // NEW WS PROPS
                                 wsStatus={wsStatus}
                            /> 
                        } 
                    </div>
                    
                    {/* AI App */}
                    <div className={`absolute inset-0 transition-opacity duration-300 ${activePanel === 'ai' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}> 
                        {activePanel === 'ai' && <SpiderAIApp 
                            currentUser={currentUser} 
                            showModal={showModal} 
                            callFastAPI={callFastAPI}
                            activeAIMode={activeAIMode}
                            setActiveAIMode={setActiveAIMode}
                            uploadedFile={uploadedFile}
                            setUploadedFile={setUploadedFile}
                            uploadedImage={uploadedImage}
                            setUploadedImage={setUploadedImage}
                        />} 
                    </div>
                    {/* --- ADD THIS NEW DOCS PANEL --- */}
               <div className={`absolute inset-0 transition-opacity duration-300 ${activePanel === 'docs' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}> 

    {/* CRITICAL FIX: When activePanel is 'docs', render a single wrapper 
      that enforces full width/height and enables vertical scrolling. 
    */}
    {activePanel === 'docs' && (
        <div className="w-full h-full overflow-y-auto">
            <SpyDocs />
        </div>
    )}

</div>
       
                    {/* VFX App */}
                    <div className={`absolute inset-0 transition-opacity duration-300 ${activePanel === 'vfx' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}> {activePanel === 'vfx' && <SpiderVFXApp />} </div>
                    
                    {/* Login Page (Triggered by settings/profile click when logged out) */}
                    <div className={`absolute inset-0 transition-opacity duration-300 ${activePanel === 'login' ? 'opacity-100 z-20' : 'opacity-0 z-0 pointer-events-none'}`}>
                        {activePanel === 'login' && <LoginPage onLoginSuccess={handleLoginSuccess} />}
                    </div>
                    
                    {/* Settings App (Accessible only when logged in, or via direct redirect from login) */}
                    <div className={`absolute inset-0 transition-opacity duration-300 ${activePanel === 'settings' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}> 
                        {activePanel === 'settings' && 
                            <SettingsApp 
                                currentUser={currentUser} 
                                onLogout={handleLogout} 
                                isLoggedIn={isLoggedIn} 
                                onLoginClick={handleLoginClick} 
                                currentTheme={currentTheme}
                                onThemeChange={handleThemeChange}
                                appScale={appScale} // Pass scale state
                                onScaleChange={handleScaleChange} // Pass scale handler
                            /> 
                        } 
                    </div>
                </div>

                {/* --- Right Sidebar Component (Now responsible for all navigation + core actions) --- */}
                {/* The Right Sidebar acts as the navigation menu triggered by the Floating Orb */}
                <RightSidebar 
                    isOpen={isSidebarOpen} 
                    onClose={() => setIsSidebarOpen(false)} 
                    onNavigate={navigateToPanel} 
                    activePanel={activePanel} 
                    isLoggedIn={isLoggedIn}
                    // Pass Notebook actions to the sidebar
                    onRun={handleRunEngine}
                    onSave={handleSave}
                    activeFileId={activeFileId}
                    showSaveAlert={showSaveAlert}
                    // NEW WS PROPS
                    onWsConnect={handleWsConnect} 
                    wsStatus={wsStatus}
                />
                {/* Increased z-index of overlay to 80, still below the orb (z-index 90) */}
                {isSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-[80]" onClick={() => setIsSidebarOpen(false)}></div>}

                {/* --- Modals (Keep below z-index 80/90) --- */}
                 {isLoading && ( <div id="loader-overlay" className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]"> <div className="w-16 h-16 border-4 border-[var(--spider-light)] border-t-[var(--spider-neon-blue)] rounded-full animate-spin"></div> <span className="ml-4 text-lg text-white">Loading...</span> </div> )}
                 {isModalOpen && !showAboutModal && !showExampleModal && !showPrivacyModal && ( <div id="ai-modal" className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"> <div className="bg-[var(--spider-med)] rounded-lg shadow-[var(--shadow-neon-blue)] w-full max-w-2xl max-h-[80vh] flex flex-col"> <div className="flex justify-between items-center p-4 border-b border-[var(--spider-light)]"><h3 className="text-lg font-semibold text-white">✨ {modalTitle}</h3><button id="modal-close-btn" onClick={hideModal} className="text-[var(--spider-text-dim)] hover:text-white text-3xl leading-none">&times;</button></div><div id="modal-content" className="p-6 text-[var(--spider-text)] overflow-y-auto space-y-4"><pre className="whitespace-pre-wrap font-sans text-sm">{modalText}</pre></div><div className="p-4 border-t border-[var(--spider-light)] text-right"><button id="modal-close-btn-bottom" onClick={hideModal} className="bg-[var(--spider-neon-blue)] text-[var(--spider-dark)] text-sm font-semibold px-4 py-1.5 rounded-md hover:opacity-90">Close</button></div></div></div> )}
                 <AboutModal show={showAboutModal} onClose={() => setShowAboutModal(false)} />
                 <ExampleModal show={showExampleModal} example={currentExample} onClose={() => setShowExampleModal(false)} />
                 <PrivacyModal show={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

            </div>
        </>
    );
}

