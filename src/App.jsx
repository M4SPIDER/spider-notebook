import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  signOut,
} from 'firebase/auth';
import { LEGAL_ACCEPTANCE_KEY, LEGAL_ACCEPTANCE_DATE_KEY, LEGAL_PAGE_PATH, LEGAL_SECTIONS } from './legalContent';
import {
  Plus, Mic, MessageCircle, Maximize, FileUp, ImagePlus,
  Zap, Wand2, X, Send, Loader2, Copy, RotateCcw, Eye, Code, Square, Brain,
  Camera, Menu, ChevronLeft, MicOff, Download, FolderUp, FileText,
  ChevronDown, ChevronRight, WrapText, FileDiff, Paperclip, Image as ImageIcon,
  Search, Trash2, Settings, Edit3, Check, Moon, Sun, Volume2, VolumeX,
  Globe, Shield, Database, Bell, Palette, Type, MoreVertical, Pin,
  Star, Archive, Share2, MessageSquare, RefreshCw, ChevronUp, Filter,
  Calendar, Clock, Hash, AlertTriangle, User, HelpCircle, LogOut, Heart, ThumbsUp, ThumbsDown,
  Layers, FolderOpen, Sparkles, MoreHorizontal, Film
} from 'lucide-react';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CONSTANTS & HELPERS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const MAX_IMAGE_SIZE = 1024;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILES = 20;
const MAX_IMAGES_COLLAGE = 4;
const FEEDBACK_QUEUE_STORAGE_KEY = 'spider_feedback_queue_v1';
const FEEDBACK_SYNC_INTERVAL_MS = 30000;
const FREE_DAILY_VIDEO_LIMIT = 4;
const FREE_DAILY_VIDEO_LIMIT_STORAGE_KEY = 'spider_free_video_daily_limit_v1';
const VIDEO_ASPECT_OPTIONS = ['16:9', '9:16'];
const VIDEO_DURATION_OPTIONS = [8, 10];
const VIDEO_DURATION_OPTIONS_PRO = [8, 10, 20, 30, 40, 60];
const VIDEO_DURATION_OPTIONS_PRO_QUALITY = [8, 10];
const VIDEO_QUALITY_OPTIONS = [
  { value: 'fast', label: 'Fast' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'quality', label: 'Quality' }
];
const STARTER_TEMPLATES = [
  {
    title: 'Make Me Hero',
    prompt: 'Transform my uploaded photo into a cinematic superhero poster with a powerful suit, dramatic lighting, and iconic heroic energy.',
    accent: 'from-[#00E5FF]/25 to-[#0B2A2A]',
    border: 'border-[#00E5FF]/25',
    mode: 'image_edit'
  },
  {
    title: 'Add Powers',
    prompt: 'Edit my uploaded image and add glowing superpowers, energy effects, aura trails, and a legendary cinematic upgrade.',
    accent: 'from-[#FFD700]/25 to-[#2A220B]',
    border: 'border-[#FFD700]/25',
    mode: 'image_edit'
  },
  {
    title: 'Vibe Code',
    prompt: 'Build me a stylish modern landing page with a bold hero section, smooth animations, and a premium feel.',
    accent: 'from-[#7CE7FF]/25 to-[#10262A]',
    border: 'border-[#7CE7FF]/25',
    aiMode: 'pro'
  },
  {
    title: 'Create Video',
    prompt: 'A cinematic slow-motion hero entrance in a futuristic city, dramatic lighting, smoke, and intense camera movement.',
    accent: 'from-[#7CFFB2]/25 to-[#0D2418]',
    border: 'border-[#7CFFB2]/25',
    mode: 'video_gen'
  },
  {
    title: 'Create Image',
    prompt: 'Create a hyper-detailed portrait poster of me as a sci-fi warrior with glowing armor and neon city lights.',
    accent: 'from-[#FF8ACD]/25 to-[#2A1021]',
    border: 'border-[#FF8ACD]/25',
    mode: 'image_gen'
  }
];
const MESSAGE_FEEDBACK_OPTIONS = [
  { value: 'love', label: 'Love', Icon: Heart, activeClass: 'text-pink-300 bg-pink-500/15' },
  { value: 'like', label: 'Like', Icon: ThumbsUp, activeClass: 'text-[#7CE7FF] bg-[#00E5FF]/15' },
  { value: 'dislike', label: 'Dislike', Icon: ThumbsDown, activeClass: 'text-amber-300 bg-amber-500/15' }
];

const formatVideoDurationLabel = (seconds) => {
  if (seconds === 60) return '1min';
  return `${seconds}s`;
};
const getLocalDayStamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const readFreeDailyVideoUsage = () => {
  try {
    const raw = localStorage.getItem(FREE_DAILY_VIDEO_LIMIT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const today = getLocalDayStamp();
    if (!parsed || parsed.day !== today || !Number.isFinite(parsed.count)) {
      return { day: today, count: 0 };
    }
    return { day: today, count: Math.max(0, Math.floor(parsed.count)) };
  } catch {
    return { day: getLocalDayStamp(), count: 0 };
  }
};
const writeFreeDailyVideoUsage = (count) => {
  const safeCount = Math.max(0, Math.floor(Number(count) || 0));
  localStorage.setItem(FREE_DAILY_VIDEO_LIMIT_STORAGE_KEY, JSON.stringify({
    day: getLocalDayStamp(),
    count: safeCount,
  }));
  return safeCount;
};
const VIDEO_API_BASE = 'https://api.m4spider.com';
const AI_API_FALLBACK_BASE = 'https://api.m4spider.com';
const firebaseConfig = {
  apiKey: 'AIzaSyBS1aGZZ2RDx2RKji1jOO-7spiY5QzJjh8',
  authDomain: 'auth.m4spider.com',
  databaseURL: 'https://m4-spider-default-rtdb.firebaseio.com',
  projectId: 'm4-spider',
  storageBucket: 'm4-spider.firebasestorage.app',
  messagingSenderId: '154970150789',
  appId: '1:154970150789:web:60796710cacca377edd6ec',
  measurementId: 'G-TGTWRTF7EX',
};

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

const GoogleMark = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={className}
  >
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.65Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.72-4.96H1.27v3.09A12 12 0 0 0 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.37-2.28V6.63H1.27A12 12 0 0 0 0 12c0 1.93.46 3.76 1.27 5.37l4.01-3.09Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.77c1.76 0 3.34.6 4.58 1.77l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.63l4.01 3.09C6.22 6.88 8.87 4.77 12 4.77Z"
    />
  </svg>
);

const TEXT_FILE_EXTENSIONS = [
  'js','jsx','ts','tsx','py','java','c','cpp','h','hpp','css','scss','less',
  'html','htm','xml','svg','json','yaml','yml','toml','ini','cfg','conf',
  'env','md','mdx','txt','csv','sql','sh','bash','zsh','ps1','bat','cmd',
  'rb','php','go','rs','swift','kt','kts','dart','lua','r','pl','pm','ex',
  'exs','clj','scala','hs','elm','vue','svelte','astro','prisma','graphql',
  'gql','proto','tf','dockerfile','makefile','gitignore','editorconfig',
  'prettierrc','eslintrc','babelrc','lock','log','map'
];
const IMAGE_EXTENSIONS = ['jpg','jpeg','png','gif','webp','svg','bmp','ico'];

const getFileExtension = (name) => {
  if (!name) return '';
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};
const isTextFile = (name) => {
  const ext = getFileExtension(name);
  if (!ext) return ['dockerfile','makefile','readme','license','changelog'].includes(name.toLowerCase());
  return TEXT_FILE_EXTENSIONS.includes(ext);
};
const isImageFile = (name) => IMAGE_EXTENSIONS.includes(getFileExtension(name));
const isPDFFile = (name) => getFileExtension(name) === 'pdf';
const isZipFile = (name) => ['zip','tar','gz','tgz','7z','rar'].includes(getFileExtension(name));
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
const formatEta = (seconds) => {
  if (seconds == null) return 'Calculating...';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (!remaining) return `${minutes}m`;
  return `${minutes}m ${remaining}s`;
};
const formatClock = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
};
const formatEtaCompact = (videoJob) => {
  const etaSeconds = Number(videoJob?.eta_seconds);
  if (!Number.isFinite(etaSeconds) || etaSeconds < 0) return 'Calculating...';
  const startedAt = Number(videoJob?.started_at);
  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    return formatClock(etaSeconds);
  }
  const elapsed = Math.max(0, Math.floor(Date.now() / 1000 - startedAt));
  return `${formatClock(elapsed)}<${formatClock(etaSeconds)}`;
};
const getVideoQualityLabel = (job) => {
  const value = String(job?.quality_preset || '').toLowerCase().trim();
  const option = VIDEO_QUALITY_OPTIONS.find(item => item.value === value);
  if (option) return option.label;
  if (value.includes('free')) return 'Free';
  if (value.includes('fast')) return 'Fast';
  if (value.includes('balanced')) return 'Balanced';
  if (value.includes('quality')) return 'Quality';
  return 'Video';
};
const buildVideoPromptInput = ({ prompt, aspectRatio, durationSeconds, qualityPreset, sourceImage }) => {
  const cleanPrompt = String(prompt || '').trim();
  if (sourceImage) {
    return `${cleanPrompt} Use the uploaded image as the exact starting frame. Keep the same subject, identity, scene, and composition without adding unrelated details.`;
  }
  return cleanPrompt;
};
const shouldRetryImageEditWithCloud = (message = '') => {
  const text = String(message).toLowerCase();
  return [
    'kelvin',
    'flux 4b',
    'flux4b',
    'model unavailable',
    'not available',
    'backend unavailable',
    'service unavailable',
    'failed to load model',
    'no local model',
  ].some(token => text.includes(token));
};
const normalizeUserFacingError = (error) => {
  const text = String(error?.message || error || '').trim();
  const lower = text.toLowerCase();
  if (!text || lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network error')) {
    return 'Network issue. Please try again.';
  }
  if (
    lower.includes('24 hours') ||
    lower.includes('daily limit') ||
    lower.includes('hit the limit') ||
    lower.includes('context limit') ||
    lower.includes('context window') ||
    lower.includes('token limit') ||
    lower.includes('neuron')
  ) {
    return 'You have hit the limit. Try again after 24 hours.';
  }
  if (lower.includes('empty response')) {
    return 'No response received. Please try again.';
  }
  return text;
};
const fetchAiForMode = async (mode, path, options = {}) => {
  const normalizedMode = String(mode || 'chat').toLowerCase();
  if (normalizedMode === 'chat') {
    try {
      return await fetch(`${AI_API_FALLBACK_BASE}${path}`, options);
    } catch (error) {
      if (error?.message && String(error.message).toLowerCase().includes('failed to fetch')) {
        return await fetch(path, options);
      }
      throw error;
    }
  }
  return await fetch(path, options);
};
const getVideoSrc = (job) => {
  if (!job) return '';
  if (job.output_url) {
    const outputUrl = String(job.output_url).trim();
    if (!outputUrl) return '';
    if (/^https?:\/\//i.test(outputUrl)) return outputUrl;
    if (outputUrl.startsWith('/')) return `${VIDEO_API_BASE}${outputUrl}`;
    return `${VIDEO_API_BASE}/${outputUrl}`;
  }
  if (!job.output_path) return '';
  const normalized = String(job.output_path).replace(/\\/g, '/');
  const marker = '/video_outputs/';
  const idx = normalized.lastIndexOf(marker);
  if (idx >= 0) return `${VIDEO_API_BASE}${normalized.slice(idx)}`;
  if (normalized.match(/^[A-Za-z]:\//)) {
    return `/@fs/${encodeURI(normalized)}`;
  }
  return '';
};

const getVideoSources = (job) => {
  if (!job) return [];
  const outputUrls = Array.isArray(job.output_urls) && job.output_urls.length ? job.output_urls : [];
  const outputPaths = Array.isArray(job.output_paths) && job.output_paths.length ? job.output_paths : [];
  const sources = [];
  if (outputUrls.length) {
    outputUrls.forEach(url => {
      const src = getVideoSrc({ output_url: url });
      if (src) sources.push(src);
    });
  } else if (outputPaths.length) {
    outputPaths.forEach(path => {
      const src = getVideoSrc({ output_path: path });
      if (src) sources.push(src);
    });
  } else {
    const single = getVideoSrc(job);
    if (single) sources.push(single);
  }
  return [...new Set(sources)];
};

const normalizeVideoJob = (job) => {
  if (!job) return job;
  const hasOutput = Boolean(
    job.output_url ||
    job.output_path ||
    (Array.isArray(job.output_urls) && job.output_urls.length) ||
    (Array.isArray(job.output_paths) && job.output_paths.length)
  );
  if (!hasOutput) return job;
  return {
    ...job,
    status: 'completed',
    progress: 1,
    queue_position: 0,
    eta_seconds: 0,
    message: job.message && job.message !== 'Queued behind 0 job(s)' ? job.message : 'Video ready',
  };
};

const extractPDFText = async (arrayBuffer) => {
  try {
    if (!window.pdfjsLib) {
      await new Promise((resolve, reject) => {
        if (document.getElementById('pdfjs-script')) {
          const check = setInterval(() => { if (window.pdfjsLib) { clearInterval(check); resolve(); } }, 100);
          setTimeout(() => { clearInterval(check); reject(new Error('PDF.js timeout')); }, 10000);
          return;
        }
        const s = document.createElement('script');
        s.id = 'pdfjs-script';
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        s.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve();
        };
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += `\n--- Page ${i} ---\n` + content.items.map(item => item.str).join(' ');
    }
    return text.trim();
  } catch (e) {
    return '[PDF extraction failed: ' + e.message + ']';
  }
};

const extractZipFiles = async (arrayBuffer) => {
  try {
    if (!window.JSZip) {
      await new Promise((resolve, reject) => {
        if (document.getElementById('jszip-script')) {
          const check = setInterval(() => { if (window.JSZip) { clearInterval(check); resolve(); } }, 100);
          setTimeout(() => { clearInterval(check); reject(new Error('JSZip timeout')); }, 10000);
          return;
        }
        const s = document.createElement('script');
        s.id = 'jszip-script';
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    const zip = await window.JSZip.loadAsync(arrayBuffer);
    const files = [];
    const skipDirs = ['node_modules/','.git/','__pycache__/','.next/','dist/','build/','.venv/'];
    for (const [path, file] of Object.entries(zip.files)) {
      if (file.dir) continue;
      if (skipDirs.some(d => path.includes(d))) continue;
      const name = path.split('/').pop();
      if (isTextFile(name)) {
        try {
          const content = await file.async('string');
          if (content.length < 500000) files.push({ name: path, content, size: content.length });
        } catch {}
      } else if (isImageFile(name)) {
        try {
          const blob = await file.async('blob');
          const dataUrl = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
          files.push({ name: path, type: 'image', preview: dataUrl, size: blob.size });
        } catch {}
      }
    }
    return files;
  } catch (e) { return []; }
};

const createImageCollage = async (images) => {
  if (images.length === 0) return null;
  if (images.length === 1) return images[0].content;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const count = Math.min(images.length, MAX_IMAGES_COLLAGE);
  let cols = count <= 2 ? 2 : 2, rows = count <= 2 ? 1 : 2;
  const cellW = 512, cellH = 512;
  canvas.width = cols * cellW; canvas.height = rows * cellH;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < count; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    try {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = images[i].preview || `data:image/jpeg;base64,${images[i].content}`; });
      const x = col * cellW, y = row * cellH;
      const scale = Math.min(cellW / img.width, cellH / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img, x + (cellW - w) / 2, y + (cellH - h) / 2, w, h);
      ctx.strokeStyle = '#194A4A'; ctx.lineWidth = 2; ctx.strokeRect(x, y, cellW, cellH);
    } catch {}
  }
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
};

const parseDiffContent = (code) => {
  return code.split('\n').map((line, i) => {
    let type = 'normal', content = line;
    if (line.startsWith('+') && !line.startsWith('+++')) { type = 'added'; content = line.substring(1); }
    else if (line.startsWith('-') && !line.startsWith('---')) { type = 'removed'; content = line.substring(1); }
    else if (line.startsWith('@@')) { type = 'info'; }
    return { type, content, lineNum: i + 1 };
  });
};

const DEFAULT_SETTINGS = {
  theme: 'dark',
  fontSize: 'medium',
  sendWithEnter: true,
  showTimestamps: false,
  soundEnabled: false,
  streamingSpeed: 'normal',
  autoScroll: true,
  compactMode: false,
  codeLineNumbers: true,
  codeWordWrap: false,
  defaultMode: 'chat',
  saveHistory: true,
};

const GLOBAL_STYLES = `
  html, body, #root {
    background: #091E1E;
    min-height: 100%;
    height: 100%;
    overflow: hidden;
  }
  body {
    margin: 0;
    overscroll-behavior: none;
  }
  .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #194A4A; border-radius: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #529E98; }
  * { -webkit-user-drag: none; -webkit-tap-highlight-color: transparent; }
  .allow-select, p, h1, h2, h3, h4, span, div, input, textarea, .whitespace-pre-wrap, pre, code, td { user-select: text; -webkit-user-select: text; }
  button, .sidebar-btn, .nav-item { user-select: none; -webkit-user-select: none; }
  img { -webkit-user-drag: none; user-select: none; }
  .break-words { word-break: break-word; overflow-wrap: break-word; }
  pre { white-space: pre-wrap; overflow-x: auto; }
  @keyframes pulse-glow { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
  .streaming-cursor::after { content: '|'; animation: pulse-glow 1s infinite; color: #00E5FF; margin-left: 2px; }
  @keyframes pro-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  .pro-badge { background: linear-gradient(90deg, #00E5FF, #FFD700, #FF6B6B, #00E5FF); background-size: 200% auto; animation: pro-shimmer 3s linear infinite; -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  @keyframes thinking-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
  .thinking-pulse { animation: thinking-pulse 1.5s ease-in-out infinite; }
  @keyframes mic-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 50% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); } }
  .mic-active { animation: mic-pulse 1.5s ease-in-out infinite; }
  @keyframes lens-scan { 0% { top: 0; } 50% { top: calc(100% - 3px); } 100% { top: 0; } }
  .lens-scan-line { animation: lens-scan 2s ease-in-out infinite; }
  @keyframes drag-pulse { 0%, 100% { border-color: rgba(0,229,255,0.3); } 50% { border-color: rgba(0,229,255,0.8); } }
  .drag-active { animation: drag-pulse 1s ease-in-out infinite; }
  .mobile-sidebar-overlay { position: fixed; inset: 0; z-index: 40; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); transition: opacity 0.3s ease; }
  .mobile-sidebar { transition: transform 0.3s ease; }
  textarea.auto-expand { resize: none; overflow-y: auto; min-height: 24px; max-height: 180px; line-height: 1.5; scrollbar-width: thin; scrollbar-color: #194A4A transparent; }
  textarea.auto-expand::-webkit-scrollbar { width: 4px; }
  textarea.auto-expand::-webkit-scrollbar-track { background: transparent; }
  textarea.auto-expand::-webkit-scrollbar-thumb { background: #194A4A; border-radius: 4px; }
  @media (max-width: 767px) { .desktop-sidebar { display: none !important; } .mobile-header { display: flex !important; } }
  @media (min-width: 768px) { .mobile-header { display: none !important; } .mobile-sidebar-overlay { display: none !important; } .mobile-sidebar-container { display: none !important; } }
  .iphone-shell { position: fixed; inset: 0; height: var(--spider-app-height, 100dvh); min-height: var(--spider-app-height, 100dvh); min-height: -webkit-fill-available; background: #091E1E; overflow: hidden; }
  .iphone-main { min-height: 0; height: 100%; display: flex; flex-direction: column; padding-top: max(env(safe-area-inset-top), 0px); padding-bottom: max(env(safe-area-inset-bottom), 0px); }
  .iphone-mobile-header { padding-top: max(12px, env(safe-area-inset-top)); position: sticky; top: 0; background: #102B2B; }
  .iphone-input-bar { padding-bottom: max(12px, env(safe-area-inset-bottom)); background: #091E1E; margin-top: auto; }
  .iphone-sidebar { padding-top: max(env(safe-area-inset-top), 0px); padding-bottom: max(env(safe-area-inset-bottom), 0px); }
  .iphone-nozoom { font-size: 16px !important; }
  .iphone-scroll-lock { overscroll-behavior-y: contain; -webkit-overflow-scrolling: touch; }
  .android-shell { position: fixed; inset: 0; height: var(--spider-app-height, 100dvh); min-height: var(--spider-app-height, 100dvh); background: #091E1E; overflow: hidden; transform: translateY(var(--spider-app-offset-top, 0px)); -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
  .android-shell input, .android-shell textarea, .android-shell button, .android-shell div, .android-shell span, .android-shell p { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
  .android-main { min-height: 0; height: 100%; display: flex; flex-direction: column; overflow: hidden; }
  .android-mobile-header { position: sticky; top: 0; background: #102B2B; }
  .android-input-bar { position: sticky; bottom: 0; z-index: 30; background: #091E1E; padding-bottom: 8px; margin-top: 0; flex-shrink: 0; }
  .android-scroll-lock { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior-y: contain; -webkit-overflow-scrolling: touch; }
  .android-sidebar { padding-top: 0; padding-bottom: 0; }
  .composer-control-strip { flex-shrink: 0; }
  @media (max-width: 767px) {
    textarea.auto-expand { max-height: 120px; }
  }
  @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-slide-up { animation: slideUp 0.2s ease-out; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .animate-fade-in { animation: fadeIn 0.2s ease-out; }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  .animate-scale-in { animation: scaleIn 0.2s ease-out; }
  .sidebar-nav-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 16px; font-size: 14px; color: #d1d5db; border-radius: 10px; transition: all 0.15s; text-align: left; }
  .sidebar-nav-btn:hover { background: rgba(25, 64, 64, 0.6); color: white; }
  .sidebar-nav-btn.active { background: #194040; color: white; }
  .sidebar-bottom-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 16px; font-size: 14px; color: #9ca3af; border-radius: 10px; transition: all 0.15s; text-align: left; }
  .sidebar-bottom-btn:hover { background: rgba(25, 64, 64, 0.4); color: #d1d5db; }
  .settings-dialog { width: min(980px, calc(100vw - 32px)); height: min(720px, calc(100vh - 32px)); }
  @media (max-width: 767px) {
    .settings-dialog {
      width: 100vw;
      height: 100dvh;
      min-height: 100dvh;
      max-width: 100vw;
      max-height: 100dvh;
      border-radius: 0;
    }
  }
`;

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAIN COMPONENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export default function App() {

  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  const [selectedAIMode, setSelectedAIMode] = useState(() => {
    try {
      const saved = localStorage.getItem('spider_ai_settings');
      if (!saved) return DEFAULT_SETTINGS.defaultMode || 'chat';
      const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      return parsed.defaultMode || 'chat';
    } catch {
      return DEFAULT_SETTINGS.defaultMode || 'chat';
    }
  });
  const [activeAIMode, setActiveAIMode] = useState(null);
  const [forceMode, setForceMode] = useState(null);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [streamingMessage, setStreamingMessage] = useState(null);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [lastStreamId, setLastStreamId] = useState(null);
  const [abortController, setAbortController] = useState(null);

  const [collapsedBlocks, setCollapsedBlocks] = useState({});
  const [wordWrapBlocks, setWordWrapBlocks] = useState({});

  const [isFullCodeMode, setIsFullCodeMode] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [videoDuration, setVideoDuration] = useState(8);
  const [videoQuality, setVideoQuality] = useState('free');
  const [videoJobs, setVideoJobs] = useState({});
  const [videoBackendHealth, setVideoBackendHealth] = useState(null);
  const [openVideoPreviews, setOpenVideoPreviews] = useState({});
  const [brokenVideoPreviews, setBrokenVideoPreviews] = useState({});
  const visibleVideoDurations = selectedAIMode === 'pro'
    ? (videoQuality === 'quality' ? VIDEO_DURATION_OPTIONS_PRO_QUALITY : VIDEO_DURATION_OPTIONS_PRO)
    : VIDEO_DURATION_OPTIONS;
  const visibleVideoQualityOptions = selectedAIMode === 'pro' ? VIDEO_QUALITY_OPTIONS : [{ value: 'free', label: 'Free' }];

  const [modalInfo, setModalInfo] = useState(null);
  const [katexLoaded, setKatexLoaded] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIPhone, setIsIPhone] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [showLensModal, setShowLensModal] = useState(false);
  const [lensStream, setLensStream] = useState(null);
  const [lensCapturedImage, setLensCapturedImage] = useState(null);

  // Search & Settings & Chat Management
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('spider_ai_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [editingMessageContent, setEditingMessageContent] = useState('');
  const [chatContextMenu, setChatContextMenu] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [openMessageMenuIndex, setOpenMessageMenuIndex] = useState(null);
  const [pinnedChats, setPinnedChats] = useState(() => {
    try { return JSON.parse(localStorage.getItem('spider_pinned_chats') || '[]'); } catch { return []; }
  });
  const [settingsTab, setSettingsTab] = useState('general');
  const [searchFilter, setSearchFilter] = useState('all');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatRestoreReady, setChatRestoreReady] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authSnapshot, setAuthSnapshot] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('spider_auth_snapshot') || 'null');
    } catch {
      return null;
    }
  });
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [authScreen, setAuthScreen] = useState('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authIntent, setAuthIntent] = useState('');
  const [showLegalNotice, setShowLegalNotice] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const multiInputRef = useRef(null);
  const streamReaderRef = useRef(null);
  const accumulatedTokensRef = useRef('');
  const continueStreamIdRef = useRef(null);
  const fileContentBufferRef = useRef('');
  const typeTextIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const textareaRef = useRef(null);
  const isTabVisibleRef = useRef(true);
  const dropZoneRef = useRef(null);
  const pendingStreamRef = useRef(null);
  const searchInputRef = useRef(null);
  const editTextareaRef = useRef(null);

  const isFullCodeModeRef = useRef(isFullCodeMode);
  const selectedAIModeRef = useRef(selectedAIMode);
  const forceModeRef = useRef(forceMode);
  const currentChatIdRef = useRef(currentChatId);
  const chatHistoryRef = useRef(chatHistory);
  const lastStreamIdRef = useRef(lastStreamId);
  const uploadedFilesRef = useRef(uploadedFiles);
  const uploadedImagesRef = useRef(uploadedImages);
  const isLoadingRef = useRef(isLoading);
  const isStreamingRef = useRef(isStreaming);
  const isListeningRef = useRef(isListening);
  const messageRef = useRef(message);
  const abortControllerRef = useRef(abortController);
  const streamingMessageRef = useRef(streamingMessage);
  const settingsRef = useRef(settings);
  const chatsRef = useRef(chats);
  const videoJobsRef = useRef(videoJobs);
  const videoPollInFlightRef = useRef(false);
  const notifiedVideoJobsRef = useRef({});
  const feedbackSyncInFlightRef = useRef(false);

  useEffect(() => { isFullCodeModeRef.current = isFullCodeMode; }, [isFullCodeMode]);
  useEffect(() => { selectedAIModeRef.current = selectedAIMode; }, [selectedAIMode]);
  useEffect(() => { forceModeRef.current = forceMode; }, [forceMode]);
  useEffect(() => { currentChatIdRef.current = currentChatId; }, [currentChatId]);
  useEffect(() => { chatHistoryRef.current = chatHistory; }, [chatHistory]);
  useEffect(() => { lastStreamIdRef.current = lastStreamId; }, [lastStreamId]);
  useEffect(() => { uploadedFilesRef.current = uploadedFiles; }, [uploadedFiles]);
  useEffect(() => { uploadedImagesRef.current = uploadedImages; }, [uploadedImages]);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { isStreamingRef.current = isStreaming; }, [isStreaming]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { messageRef.current = message; }, [message]);
  useEffect(() => { abortControllerRef.current = abortController; }, [abortController]);
  useEffect(() => { streamingMessageRef.current = streamingMessage; }, [streamingMessage]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { chatsRef.current = chats; }, [chats]);
  useEffect(() => { videoJobsRef.current = videoJobs; }, [videoJobs]);

  const showModal = useCallback((title, text) => {
    setModalInfo({ title, text });
    setTimeout(() => setModalInfo(null), 4000);
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!settingsRef.current.soundEnabled) return;
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.03;
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.12);
    } catch {}
  }, []);

  const pushBrowserNotification = useCallback(async (title, body) => {
    if (!('Notification' in window)) return;
    try {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission === 'granted') {
        new Notification(title, { body, silent: !settingsRef.current.soundEnabled });
      }
    } catch {}
  }, []);

  const notifyGenerationComplete = useCallback((title, body) => {
    showModal(title, body);
    playNotificationSound();
    if (document.hidden) {
      pushBrowserNotification(title, body);
    }
  }, [playNotificationSound, pushBrowserNotification, showModal]);

  useEffect(() => {
    if (!visibleVideoDurations.includes(videoDuration)) {
      setVideoDuration(10);
    }
  }, [videoDuration, visibleVideoDurations]);

  useEffect(() => {
    if (selectedAIMode === 'pro') {
      if (videoQuality === 'free') setVideoQuality('balanced');
    } else if (videoQuality !== 'free') {
      setVideoQuality('free');
    }
  }, [selectedAIMode, videoQuality]);

  // Save settings & pins
  useEffect(() => { localStorage.setItem('spider_ai_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('spider_pinned_chats', JSON.stringify(pinnedChats)); }, [pinnedChats]);
  useEffect(() => {
    let unsubscribe = () => {};
    const initAuth = async () => {
      try {
        await setPersistence(firebaseAuth, browserLocalPersistence);
      } catch {}
      unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        setAuthUser(user);
        const snapshot = user ? {
          uid: user.uid,
          displayName: user.displayName || '',
          email: user.email || '',
        } : null;
        setAuthSnapshot(snapshot);
        try {
          if (snapshot) localStorage.setItem('spider_auth_snapshot', JSON.stringify(snapshot));
          else localStorage.removeItem('spider_auth_snapshot');
        } catch {}
        setAuthReady(true);
      });
    };
    initAuth();
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    try {
      const accepted = localStorage.getItem(LEGAL_ACCEPTANCE_KEY);
      if (!accepted) setShowLegalNotice(true);
    } catch {
      setShowLegalNotice(true);
    }
  }, []);

  const requiresAuthForMode = useCallback((aimode, forcedMode) => {
    return forcedMode === 'image_gen' || forcedMode === 'image_edit' || forcedMode === 'video_gen' || aimode === 'pro';
  }, []);

  const openAuthGate = useCallback((intent = 'Use creative tools') => {
    setAuthIntent(intent);
    setAuthError('');
    setAuthScreen('signin');
    setShowAuthGate(true);
    setShowUserMenu(false);
    setIsPlusMenuOpen(false);
  }, []);

  const ensureModeAccess = useCallback((aimode, forcedMode, intent) => {
    if (!requiresAuthForMode(aimode, forcedMode)) return true;
    if (!authReady) {
      showModal('Checking account', 'Please wait a moment.');
      return false;
    }
    if (authUser) return true;
    openAuthGate(intent);
    return false;
  }, [authReady, authUser, openAuthGate, requiresAuthForMode, showModal]);

  const handleGoogleSignIn = useCallback(async () => {
    setAuthBusy(true);
    setAuthError('');
    try {
      await signInWithPopup(firebaseAuth, googleProvider);
      setShowAuthGate(false);
      setShowLegalNotice(true);
      showModal('Welcome', 'Signed in with Google.');
    } catch (error) {
      const code = error?.code || '';
      const message = String(error?.message || '');
      const userCancelled =
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        message.toLowerCase().includes('popup closed') ||
        message.toLowerCase().includes('cancelled popup');
      if (!userCancelled) {
        setAuthError(message || 'Google sign-in failed.');
      } else {
        setAuthError('');
      }
    } finally {
      setAuthBusy(false);
    }
  }, [showModal]);

  const handleEmailAuth = useCallback(async () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Enter your email and password.');
      return;
    }
    setAuthBusy(true);
    setAuthError('');
    try {
      if (authScreen === 'signup') {
        await createUserWithEmailAndPassword(firebaseAuth, authEmail.trim(), authPassword);
        setShowLegalNotice(true);
        showModal('Account ready', 'Your M4 Spider account was created.');
      } else {
        await signInWithEmailAndPassword(firebaseAuth, authEmail.trim(), authPassword);
        setShowLegalNotice(true);
        showModal('Welcome back', 'Signed in to M4 Spider.');
      }
      setShowAuthGate(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (error) {
      setAuthError(error?.message || 'Authentication failed.');
    } finally {
      setAuthBusy(false);
    }
  }, [authEmail, authPassword, authScreen, showModal]);

  const handleAuthSignOut = useCallback(async () => {
    try {
      await signOut(firebaseAuth);
      setShowUserMenu(false);
      showModal('Signed out', 'You are back on free chat mode.');
    } catch (error) {
      showModal('Sign-out failed', error?.message || 'Please try again.');
    }
  }, [showModal]);

  const acceptLegalNotice = useCallback(() => {
    try {
      localStorage.setItem(LEGAL_ACCEPTANCE_KEY, 'yes');
      localStorage.setItem(LEGAL_ACCEPTANCE_DATE_KEY, new Date().toISOString());
    } catch {}
    setShowLegalNotice(false);
  }, []);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // UTILITIES
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const getPersistentUserId = useCallback(() => {
    let id = localStorage.getItem('spider_user_id');
    if (!id) { id = 'user_' + Date.now().toString(36) + Math.random().toString(36).substring(2); localStorage.setItem('spider_user_id', id); }
    return id;
  }, []);

  const getStoredFeedbackQueue = useCallback(() => {
    try {
      const raw = localStorage.getItem(FEEDBACK_QUEUE_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const setStoredFeedbackQueue = useCallback((queue) => {
    try {
      if (!Array.isArray(queue) || queue.length === 0) {
        localStorage.removeItem(FEEDBACK_QUEUE_STORAGE_KEY);
        return;
      }
      localStorage.setItem(FEEDBACK_QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch {}
  }, []);

  const appendPendingFeedback = useCallback((entry) => {
    const nextQueue = [...getStoredFeedbackQueue(), entry];
    setStoredFeedbackQueue(nextQueue);
    return nextQueue.length;
  }, [getStoredFeedbackQueue, setStoredFeedbackQueue]);

  const getFeedbackSyncEndpoints = useCallback(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : '';
    return [...new Set([
      origin ? `${origin}/api/feedback` : '',
      `${AI_API_FALLBACK_BASE}/feedback`,
      `${AI_API_FALLBACK_BASE}/api/feedback`
    ].filter(Boolean))];
  }, []);

  const flushPendingFeedback = useCallback(async (showSuccess = false) => {
    if (feedbackSyncInFlightRef.current) return false;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;

    const pendingQueue = getStoredFeedbackQueue();
    if (pendingQueue.length === 0) return true;

    feedbackSyncInFlightRef.current = true;
    try {
      let remainingQueue = [...pendingQueue];
      const endpoints = getFeedbackSyncEndpoints();

      for (const endpoint of endpoints) {
        if (remainingQueue.length === 0) break;

        const retryQueue = [];
        for (const entry of remainingQueue) {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(entry),
              keepalive: true,
            });
            if (!response.ok) {
              retryQueue.push(entry);
            }
          } catch {
            retryQueue.push(entry);
          }
        }

        remainingQueue = retryQueue;
      }

      setStoredFeedbackQueue(remainingQueue);

      if (showSuccess && pendingQueue.length > 0 && remainingQueue.length === 0) {
        showModal('Feedback synced', `Sent ${pendingQueue.length} feedback item${pendingQueue.length === 1 ? '' : 's'} to your server.`);
      }

      return remainingQueue.length === 0;
    } finally {
      feedbackSyncInFlightRef.current = false;
    }
  }, [getFeedbackSyncEndpoints, getStoredFeedbackQueue, setStoredFeedbackQueue, showModal]);

  const mergeVideoJob = useCallback((job) => {
    const normalizedJob = normalizeVideoJob(job);
    setBrokenVideoPreviews(prev => {
      if (!prev[normalizedJob.id]) return prev;
      const next = { ...prev };
      delete next[normalizedJob.id];
      return next;
    });
    setVideoJobs(prev => {
      const previousJob = prev[normalizedJob.id] || {};
      const nextJob = normalizeVideoJob({ ...(prev[normalizedJob.id] || {}), ...normalizedJob });
      const same = JSON.stringify(prev[normalizedJob.id] || {}) === JSON.stringify(nextJob);
      const priorNotifiedStatus = notifiedVideoJobsRef.current[normalizedJob.id];
      if (previousJob.status !== 'completed' && nextJob.status === 'completed' && priorNotifiedStatus !== 'completed') {
        notifiedVideoJobsRef.current[normalizedJob.id] = 'completed';
        setTimeout(() => notifyGenerationComplete('Video Ready', 'Your video generation finished.'), 0);
      } else if (previousJob.status !== 'failed' && nextJob.status === 'failed' && priorNotifiedStatus !== 'failed') {
        notifiedVideoJobsRef.current[normalizedJob.id] = 'failed';
        setTimeout(() => notifyGenerationComplete('Video Failed', nextJob.error || 'A video job failed.'), 0);
      } else if (nextJob.status !== 'completed' && nextJob.status !== 'failed') {
        delete notifiedVideoJobsRef.current[normalizedJob.id];
      }
      if (same) return prev;
      return { ...prev, [normalizedJob.id]: nextJob };
    });
  }, [notifyGenerationComplete]);

  useEffect(() => {
    const chatVideoJobs = (chatHistory || [])
      .filter(msg => msg?.type === 'video_job' && msg?.videoJobId)
      .map(msg => ({
        id: msg.videoJobId,
        ...(msg.videoJob || {}),
      }))
      .filter(job => job.id);

    if (chatVideoJobs.length === 0) return;

    setVideoJobs(prev => {
      let changed = false;
      const next = { ...prev };
      for (const job of chatVideoJobs) {
        const normalizedJob = normalizeVideoJob(job);
        const merged = normalizeVideoJob({ ...(next[normalizedJob.id] || {}), ...normalizedJob });
        if (JSON.stringify(next[normalizedJob.id] || {}) !== JSON.stringify(merged)) {
          next[normalizedJob.id] = merged;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [chatHistory]);

  useEffect(() => {
    if (!currentChatId || !chatHistory.length) return;
    setChatHistory(prev => {
      let changed = false;
      const next = prev.map(msg => {
        if (msg?.type !== 'video_job' || !msg?.videoJobId) return msg;
        const liveJob = videoJobs[msg.videoJobId];
        if (!liveJob) return msg;
        const mergedVideoJob = {
          ...(msg.videoJob || {}),
          ...liveJob,
          sourceImagePreview: liveJob.sourceImagePreview ?? msg.videoJob?.sourceImagePreview ?? null,
          sourceImageName: liveJob.sourceImageName ?? msg.videoJob?.sourceImageName ?? null,
        };
        if (JSON.stringify(msg.videoJob || {}) === JSON.stringify(mergedVideoJob)) return msg;
        changed = true;
        return { ...msg, videoJob: mergedVideoJob };
      });
      return changed ? next : prev;
    });
  }, [videoJobs, currentChatId, chatHistory.length]);

  const markVideoJobsBackendOffline = useCallback(() => {
    setVideoJobs(prev => {
      const next = { ...prev };
      Object.values(next).forEach((job) => {
        if (!job || !['queued', 'running', 'interrupted'].includes(job.status)) return;
        next[job.id] = {
          ...job,
          status: 'running',
          message: job.output_url || job.output_path
            ? 'Connection dropped, checking for finished output...'
            : 'Connection dropped, backend may still be generating. Reconnecting...',
          error: null,
        };
      });
      return next;
    });
  }, []);

  const submitVideoJob = useCallback(async (prompt, chatId, sourceImage = null) => {
    const cleanVideoPrompt = String(prompt || '').trim();
    if (selectedAIMode !== 'pro') {
      const usage = readFreeDailyVideoUsage();
      if (usage.count >= FREE_DAILY_VIDEO_LIMIT) {
        showModal('Daily limit reached', `Free plan allows ${FREE_DAILY_VIDEO_LIMIT} video generations per day.`);
        throw new Error('Free daily video generation limit reached');
      }
    }
    const response = await fetch(`${VIDEO_API_BASE}/api/video/jobs`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: cleanVideoPrompt,
        original_prompt: cleanVideoPrompt,
        aspect_ratio: aspectRatio,
        duration_seconds: videoDuration,
        quality_preset: videoQuality,
        user_preference_id: getPersistentUserId(),
        session_id: chatId,
        image: sourceImage?.content || null,
        image_base64: sourceImage?.content || null,
        source_image_name: sourceImage?.name || null,
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || data.error || 'Failed to queue video job');
    if (selectedAIMode !== 'pro') {
      const usage = readFreeDailyVideoUsage();
      writeFreeDailyVideoUsage(usage.count + 1);
    }
    mergeVideoJob(data);
    setChatHistory(prev => [...prev, {
      role: 'assistant',
      content: prompt,
      type: 'video_job',
      videoJobId: data.id,
      videoJob: {
        ...data,
        sourceImagePreview: sourceImage?.preview || null,
        sourceImageName: sourceImage?.name || null,
      },
      ts: Date.now()
    }]);
  }, [aspectRatio, videoDuration, videoQuality, getPersistentUserId, mergeVideoJob, selectedAIMode, showModal]);

  const stopVideoJob = useCallback(async (jobId) => {
    try {
      const response = await fetch(`${VIDEO_API_BASE}/api/video/jobs/${jobId}/cancel`, { method: 'POST', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.error || 'Failed to stop video job');
      mergeVideoJob(data);
    } catch (error) {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}`,
        type: 'text',
        ts: Date.now(),
        isError: true
      }]);
    }
  }, [mergeVideoJob]);

  useEffect(() => {
    const pollActiveVideoJobs = async () => {
      if (document.hidden || videoPollInFlightRef.current) return;
      const stateJobs = Object.values(videoJobsRef.current || {});
      const chatJobs = (chatHistoryRef.current || [])
        .filter(msg => msg?.type === 'video_job' && msg?.videoJobId)
        .map(msg => ({
          id: msg.videoJobId,
          ...(msg.videoJob || {}),
        }))
        .filter(job => job.id);

      const jobMap = {};
      [...chatJobs, ...stateJobs].forEach(job => {
        if (!job?.id) return;
        jobMap[job.id] = normalizeVideoJob({ ...(jobMap[job.id] || {}), ...job });
      });

      const activeJobs = Object.values(jobMap).filter(job => ['queued', 'running', 'interrupted'].includes(job.status));
      if (activeJobs.length === 0) return;
      videoPollInFlightRef.current = true;
      let hadBackendFailure = false;
      try {
        await Promise.all(activeJobs.map(async (job) => {
          try {
            const response = await fetch(`${VIDEO_API_BASE}/api/video/jobs/${job.id}?t=${Date.now()}`, {
              cache: 'no-store'
            });
            if (!response.ok) {
              if (response.status === 404) {
                mergeVideoJob({
                  ...job,
                  status: 'stale',
                  progress: 0,
                  queue_position: 0,
                  eta_seconds: 0,
                  message: 'Old job from a previous backend session.',
                  error: null,
                });
                return;
              }
              hadBackendFailure = true;
              return;
            }
            const data = await response.json();
            mergeVideoJob(data);
          } catch {
            hadBackendFailure = true;
          }
        }));
      } finally {
        videoPollInFlightRef.current = false;
      }
      if (hadBackendFailure) markVideoJobsBackendOffline();
    };

    const id = window.setInterval(() => {
      pollActiveVideoJobs();
    }, 3000);

    return () => window.clearInterval(id);
  }, [markVideoJobsBackendOffline, mergeVideoJob]);

  useEffect(() => {
    if (forceMode !== 'video_gen') return;
    let cancelled = false;
    const loadHealth = async () => {
      try {
        const response = await fetch(`${VIDEO_API_BASE}/api/video/health?t=${Date.now()}`, {
          cache: 'no-store'
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setVideoBackendHealth(data);
      } catch {
        if (!cancelled) setVideoBackendHealth({ ok: false, runner_configured: false, runner_url_configured: false });
      }
    };
    loadHealth();
    const id = window.setInterval(loadHealth, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [forceMode]);

  const copyToClipboard = useCallback((text) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => showModal('Copied', 'Copied to clipboard')).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch {}
        document.body.removeChild(ta);
      });
    }
  }, [showModal]);

  const handleMessageFeedback = useCallback((messageIndex, feedback) => {
    const currentMessage = chatHistoryRef.current?.[messageIndex];
    if (!currentMessage || currentMessage.role === 'user') return;

    const isRemoving = currentMessage.feedback === feedback;
    const feedbackEntryBase = {
      id: `fb_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      messageKey: `${currentChatIdRef.current || 'session'}:${currentMessage.ts || 'na'}:${messageIndex}`,
      chatId: currentChatIdRef.current || null,
      messageIndex,
      messageTs: currentMessage.ts || null,
      messageType: currentMessage.type || 'text',
      assistantMessage: String(currentMessage.content || '').slice(0, 12000),
      createdAt: new Date().toISOString(),
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      user: authUser ? {
        uid: authUser.uid,
        email: authUser.email || '',
        displayName: authUser.displayName || '',
      } : authSnapshot ? {
        uid: authSnapshot.uid || '',
        email: authSnapshot.email || '',
        displayName: authSnapshot.displayName || '',
      } : {
        anonymousId: getPersistentUserId(),
      }
    };

    if (feedback === 'dislike' && !isRemoving) {
      const feedbackNote = window.prompt('What problem did you face with this reply?', currentMessage.feedbackNote || '');
      if (feedbackNote === null) return;
      const cleanedNote = feedbackNote.trim();

      setChatHistory(prev => prev.map((msg, idx) => (
        idx !== messageIndex
          ? msg
          : {
              ...msg,
              feedback,
              feedbackNote: cleanedNote,
            }
      )));
      appendPendingFeedback({
        ...feedbackEntryBase,
        action: 'set',
        feedback,
        feedbackNote: cleanedNote,
      });
      flushPendingFeedback();
      showModal('Feedback saved', 'Stored locally and will sync when your API is reachable.');
      return;
    }

    const nextFeedback = isRemoving ? null : feedback;
    setChatHistory(prev => prev.map((msg, idx) => {
      if (idx !== messageIndex) return msg;
      return {
        ...msg,
        feedback: nextFeedback,
        feedbackNote: nextFeedback === 'dislike' ? (msg.feedbackNote || null) : null,
      };
    }));
    appendPendingFeedback({
      ...feedbackEntryBase,
      action: isRemoving ? 'remove' : 'set',
      feedback: nextFeedback,
      feedbackNote: null,
    });
    flushPendingFeedback();
    showModal('Feedback saved', 'Stored locally and will sync when your API is reachable.');
  }, [appendPendingFeedback, authSnapshot, authUser, flushPendingFeedback, getPersistentUserId, showModal]);

  const renderFeedbackButtons = useCallback((msg, index, compact = false, closeMenu = false) => (
    MESSAGE_FEEDBACK_OPTIONS.map(({ value, label, Icon, activeClass }) => {
      const isActive = msg.feedback === value;
      const baseClass = compact
        ? `sidebar-bottom-btn w-full ${isActive ? activeClass : ''}`
        : `sidebar-btn flex items-center gap-1 text-[11px] px-2 py-1 rounded-md ${isActive ? activeClass : 'text-[#529E98] hover:text-[#00E5FF] hover:bg-[#194A4A]/50'}`;

      return (
        <button
          key={`${index}-${value}`}
          onClick={() => {
            handleMessageFeedback(index, value);
            if (closeMenu) setOpenMessageMenuIndex(null);
          }}
          className={baseClass}
        >
          <Icon size={compact ? 14 : 11} />
          {label}
        </button>
      );
    })
  ), [handleMessageFeedback]);

  const downloadFile = useCallback((filename, content) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const parseCodeForFiles = useCallback((content) => {
    const files = [];
    const regex = /```(\w+)?\s*(?:\/\/|#|\/\*)\s*(?:file(?:name)?:\s*)?([^\n*]+)\n([\s\S]*?)```/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
      files.push({ language: match[1] || 'text', name: match[2].trim(), content: match[3].trim(), id: Date.now().toString(36) + Math.random().toString(36).substring(2) });
    }
    return files;
  }, []);

  const autoResizeTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const maxHeight = window.innerWidth < 768 ? 120 : 180;
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + 'px';
  }, []);

  useEffect(() => { autoResizeTextarea(); }, [message, autoResizeTextarea]);

  const formatTimestamp = useCallback((ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }, []);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // INDEXEDDB
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const updateChatInDB = useCallback((chatId, updatedMessages) => {
    const req = indexedDB.open('SpiderAIDB', 1);
    req.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(['chats'], 'readwrite');
      const store = tx.objectStore('chats');
      const getReq = store.get(chatId);
      getReq.onsuccess = () => {
        if (getReq.result) {
          const chat = getReq.result;
          chat.messages = updatedMessages;
          chat.lastUpdated = Date.now();
          if (updatedMessages.length === 1 && updatedMessages[0].role === 'user') {
            chat.title = (updatedMessages[0].content || '').substring(0, 40) + (updatedMessages[0].content?.length > 40 ? '...' : '');
            setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: chat.title, lastUpdated: Date.now() } : c));
          }
          store.put(chat);
        }
      };
    };
  }, []);

  const createNewChatInDB = useCallback((title) => {
    return new Promise((resolve) => {
      const req = indexedDB.open('SpiderAIDB', 1);
      req.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction(['chats'], 'readwrite');
        const store = tx.objectStore('chats');
        const newId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        const newChat = {
          id: newId,
          title: (title || 'New Chat').substring(0, 40),
          date: new Date().toLocaleDateString('en-US'),
          type: 'chat', timestamp: Date.now(), lastUpdated: Date.now(), messages: []
        };
        const addReq = store.add(newChat);
        addReq.onsuccess = () => { setChats(prev => [newChat, ...prev]); setCurrentChatId(newId); resolve(newId); };
      };
    });
  }, []);

  const deleteChatFromDB = useCallback((chatId) => {
    return new Promise((resolve) => {
      const req = indexedDB.open('SpiderAIDB', 1);
      req.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction(['chats'], 'readwrite');
        tx.objectStore('chats').delete(chatId);
        tx.oncomplete = () => {
          setChats(prev => prev.filter(c => c.id !== chatId));
          setPinnedChats(prev => prev.filter(id => id !== chatId));
          if (currentChatIdRef.current === chatId) {
            const remaining = chatsRef.current.filter(c => c.id !== chatId);
            if (remaining.length > 0) { setCurrentChatId(remaining[0].id); setChatHistory(remaining[0].messages || []); }
            else { setCurrentChatId(null); setChatHistory([]); }
          }
          resolve();
        };
      };
    });
  }, []);

  const deleteAllChatsFromDB = useCallback(() => {
    return new Promise((resolve) => {
      const req = indexedDB.open('SpiderAIDB', 1);
      req.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction(['chats'], 'readwrite');
        tx.objectStore('chats').clear();
        tx.oncomplete = () => {
          setChats([]); setCurrentChatId(null); setChatHistory([]); setPinnedChats([]); resolve();
        };
      };
    });
  }, []);

  const renameChatInDB = useCallback((chatId, newTitle) => {
    const req = indexedDB.open('SpiderAIDB', 1);
    req.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(['chats'], 'readwrite');
      const store = tx.objectStore('chats');
      const getReq = store.get(chatId);
      getReq.onsuccess = () => {
        if (getReq.result) {
          const chat = getReq.result;
          chat.title = newTitle;
          store.put(chat);
          setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
        }
      };
    };
  }, []);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SEARCH & FILTER
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const filteredChats = useMemo(() => {
    let result = chats;
    if (searchFilter !== 'all') {
      const now = Date.now();
      const map = { today: 86400000, week: 604800000, month: 2592000000 };
      const cutoff = now - (map[searchFilter] || 0);
      result = result.filter(c => (c.lastUpdated || c.timestamp) >= cutoff);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => {
        if (c.title?.toLowerCase().includes(query)) return true;
        if (c.messages?.some(m => m.content?.toLowerCase().includes(query))) return true;
        return false;
      });
    }
    return result.sort((a, b) => {
      const aPinned = pinnedChats.includes(a.id);
      const bPinned = pinnedChats.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return (b.lastUpdated || b.timestamp) - (a.lastUpdated || a.timestamp);
    });
  }, [chats, searchQuery, searchFilter, pinnedChats]);

  // Group chats by date
  const groupedChats = useMemo(() => {
    const groups = { pinned: [], today: [], yesterday: [], week: [], month: [], older: [] };
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 604800000;
    const monthStart = todayStart - 2592000000;

    filteredChats.forEach(chat => {
      if (pinnedChats.includes(chat.id)) { groups.pinned.push(chat); return; }
      const ts = chat.lastUpdated || chat.timestamp;
      if (ts >= todayStart) groups.today.push(chat);
      else if (ts >= yesterdayStart) groups.yesterday.push(chat);
      else if (ts >= weekStart) groups.week.push(chat);
      else if (ts >= monthStart) groups.month.push(chat);
      else groups.older.push(chat);
    });
    return groups;
  }, [filteredChats, pinnedChats]);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // EFFECTS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  useEffect(() => {
    const handler = () => {
      const visible = !document.hidden;
      setIsTabVisible(visible);
      isTabVisibleRef.current = visible;
      if (!visible) {
        if (typeTextIntervalRef.current) { clearInterval(typeTextIntervalRef.current); typeTextIntervalRef.current = null; }
        if (recognitionRef.current && isListeningRef.current) recognitionRef.current.stop();
      } else if (pendingStreamRef.current) {
        const { content, callback } = pendingStreamRef.current;
        pendingStreamRef.current = null;
        setStreamingMessage(prev => ({ ...(prev || {}), role: 'assistant', type: 'text', content, isStreaming: false, isThinking: false }));
        if (callback) callback();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  useEffect(() => {
    const check = () => {
      const ua = window.navigator.userAgent || '';
      const platform = window.navigator.platform || '';
      const touchPoints = window.navigator.maxTouchPoints || 0;
      const iPhoneLike = /iPhone/i.test(ua) || (/Mac/i.test(platform) && touchPoints > 1);
      const androidLike = /Android/i.test(ua);
      setIsMobile(window.innerWidth < 768);
      setIsIPhone(iPhoneLike);
      setIsAndroid(androidLike);
    };
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isIPhone && !isAndroid) return undefined;
    const updateViewportHeight = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height || window.innerHeight;
      const offsetTop = viewport?.offsetTop || 0;

      document.documentElement.style.setProperty('--spider-app-height', `${Math.round(height)}px`);
      document.documentElement.style.setProperty('--spider-app-offset-top', `${Math.round(offsetTop)}px`);
    };
    const scheduleViewportUpdate = () => {
      updateViewportHeight();
      if (isAndroid) {
        window.requestAnimationFrame(() => {
          updateViewportHeight();
        });
      }
    };

    scheduleViewportUpdate();
    window.visualViewport?.addEventListener('resize', scheduleViewportUpdate);
    window.visualViewport?.addEventListener('scroll', scheduleViewportUpdate);
    window.addEventListener('orientationchange', scheduleViewportUpdate);
    window.addEventListener('resize', scheduleViewportUpdate);

    const handleFocusIn = () => {
      if (!isAndroid) return;
      window.setTimeout(() => {
        scheduleViewportUpdate();
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      }, 120);
    };

    const handleFocusOut = () => {
      if (!isAndroid) return;
      window.setTimeout(scheduleViewportUpdate, 120);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    return () => {
      window.visualViewport?.removeEventListener('resize', scheduleViewportUpdate);
      window.visualViewport?.removeEventListener('scroll', scheduleViewportUpdate);
      window.removeEventListener('orientationchange', scheduleViewportUpdate);
      window.removeEventListener('resize', scheduleViewportUpdate);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      document.documentElement.style.removeProperty('--spider-app-height');
      document.documentElement.style.removeProperty('--spider-app-offset-top');
    };
  }, [isAndroid, isIPhone]);

  useEffect(() => {
    let mounted = true, interval;
    if (!document.getElementById('katex-css')) {
      const link = document.createElement('link'); link.id = 'katex-css'; link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      document.head.appendChild(link);
    }
    const check = () => { if (window.katex && mounted) { setKatexLoaded(true); if (interval) clearInterval(interval); } };
    if (window.katex) check();
    else if (!document.getElementById('katex-js')) {
      const s = document.createElement('script'); s.id = 'katex-js';
      s.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
      s.onload = check; document.head.appendChild(s); interval = setInterval(check, 100);
    } else interval = setInterval(check, 100);
    return () => { mounted = false; if (interval) clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (settings.saveHistory === false) {
      setChats([]);
      setCurrentChatId(null);
      setChatRestoreReady(true);
      return;
    }
    setChatRestoreReady(false);
    const req = indexedDB.open('SpiderAIDB', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('chats')) db.createObjectStore('chats', { keyPath: 'id' });
    };
    req.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(['chats'], 'readonly');
      const getAll = tx.objectStore('chats').getAll();
      getAll.onsuccess = () => {
        const fetched = getAll.result.sort((a, b) => (b.lastUpdated || b.timestamp) - (a.lastUpdated || a.timestamp));
        setChats(fetched);
        if (fetched.length > 0) {
          setCurrentChatId(fetched[0].id);
          setChatHistory(fetched[0].messages || []);
        } else {
          setCurrentChatId(null);
          setChatHistory([]);
        }
        setChatRestoreReady(true);
      };
    };
    req.onerror = () => {
      setChatRestoreReady(true);
    };
  }, [settings.saveHistory]);

  useEffect(() => {
    if (!currentChatId) return;
    setChats(prev => prev.map(chat => (
      chat.id === currentChatId
        ? { ...chat, messages: chatHistory, lastUpdated: Date.now() }
        : chat
    )));
    if (settings.saveHistory === false) return;
    if (chatHistory.length > 0) updateChatInDB(currentChatId, chatHistory);
  }, [chatHistory, currentChatId, updateChatInDB, settings.saveHistory]);

  const scrollToBottom = useCallback(() => {
    if (settingsRef.current.autoScroll !== false) messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  useEffect(() => { if (!isStreaming) scrollToBottom(); }, [chatHistory, isStreaming, scrollToBottom]);
  useEffect(() => { if (streamingMessage) scrollToBottom(); }, [streamedContent, streamingMessage, scrollToBottom]);
  useEffect(() => { return () => { if (typeTextIntervalRef.current) clearInterval(typeTextIntervalRef.current); }; }, []);
  useEffect(() => { return () => { if (lensStream) lensStream.getTracks().forEach(t => t.stop()); }; }, [lensStream]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault(); setIsSearchOpen(prev => !prev);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === ',') { e.preventDefault(); setShowSettings(prev => !prev); }
      if (e.key === 'Escape') {
        if (showSettings) setShowSettings(false);
        else if (isSearchOpen) { setIsSearchOpen(false); setSearchQuery(''); }
        else if (chatContextMenu) setChatContextMenu(null);
        else if (confirmDelete) setConfirmDelete(null);
        else if (showUserMenu) setShowUserMenu(false);
        else if (editingMessageIndex !== null) { setEditingMessageIndex(null); setEditingMessageContent(''); }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); handleNewChat(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showSettings, isSearchOpen, chatContextMenu, confirmDelete, editingMessageIndex, showUserMenu]);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SPEECH / LENS / FILE PROCESSING (same as before, abbreviated)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      setMicSupported(true);
      const recognition = new SR();
      recognition.continuous = false; recognition.interimResults = true; recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        let final = '', interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t; else interim += t;
        }
        if (final) setMessage(prev => (prev.replace(/\s*\[mic\].*$/, '').trim() + ' ' + final).trim());
        else if (interim) setMessage(prev => prev.replace(/\s*\[mic\].*$/, '').trim() + ' [mic] ' + interim);
      };
      recognition.onend = () => { setIsListening(false); setMessage(prev => prev.replace(/\s*\[mic\].*$/, '').trim()); };
      recognition.onerror = (e) => { setIsListening(false); };
      recognitionRef.current = recognition;
    }
  }, [showModal]);

  const handleMicToggle = useCallback(() => {
    if (!micSupported) { showModal('Not Supported', 'Speech recognition not supported.'); return; }
    if (isListeningRef.current) { recognitionRef.current?.stop(); setIsListening(false); }
    else { try { recognitionRef.current?.start(); setIsListening(true); } catch { showModal('Mic Error', 'Could not start microphone.'); } }
  }, [micSupported, showModal]);

  const openLens = useCallback(async () => {
    setShowLensModal(true); setLensCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
      setLensStream(stream);
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); } }, 100);
    } catch { showModal('Camera Error', 'Could not access camera.'); setShowLensModal(false); }
  }, [showModal]);

  const closeLens = useCallback(() => {
    if (lensStream) { lensStream.getTracks().forEach(t => t.stop()); setLensStream(null); }
    setShowLensModal(false); setLensCapturedImage(null);
  }, [lensStream]);

  const captureLensPhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    setLensCapturedImage(c.toDataURL('image/jpeg', 0.85));
    if (lensStream) { lensStream.getTracks().forEach(t => t.stop()); setLensStream(null); }
  }, [lensStream]);

  const useLensCapturedImage = useCallback(() => {
    if (!lensCapturedImage) return;
    const raw = lensCapturedImage.split(',')[1];
    setUploadedImages(prev => [...prev, { name: 'camera_capture.jpg', content: raw, preview: lensCapturedImage, size: raw.length }]);
    setMessage(prev => prev || 'Analyze this image: ');
    closeLens();
  }, [lensCapturedImage, closeLens]);

  const retakeLensPhoto = useCallback(async () => {
    setLensCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
      setLensStream(stream);
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); } }, 100);
    } catch { showModal('Camera Error', 'Could not restart camera.'); }
  }, [showModal]);

  const processFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    const total = uploadedFilesRef.current.length + uploadedImagesRef.current.length + files.length;
    if (total > MAX_FILES) { showModal('Too Many Files', `Maximum ${MAX_FILES} files.`); return; }
    setUploadProgress('Processing files...');
    const newFiles = [], newImages = [];
    for (const file of files) {
      try {
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) { showModal('Too Large', `${file.name} exceeds ${MAX_FILE_SIZE_MB}MB.`); continue; }
        if (file.type.startsWith('image/') || isImageFile(file.name)) {
          const dataUrl = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(file); });
          const resized = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let w = img.width, h = img.height;
              if (w > MAX_IMAGE_SIZE || h > MAX_IMAGE_SIZE) { if (w > h) { h *= MAX_IMAGE_SIZE / w; w = MAX_IMAGE_SIZE; } else { w *= MAX_IMAGE_SIZE / h; h = MAX_IMAGE_SIZE; } }
              canvas.width = w; canvas.height = h; canvas.getContext('2d').drawImage(img, 0, 0, w, h);
              const result = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85);
              resolve({ preview: result, content: result.split(',')[1] });
            };
            img.src = dataUrl;
          });
          newImages.push({ name: file.name, content: resized.content, preview: resized.preview, size: file.size });
        } else if (isPDFFile(file.name)) {
          setUploadProgress(`Extracting PDF: ${file.name}...`);
          const text = await extractPDFText(await file.arrayBuffer());
          newFiles.push({ name: file.name, content: text, size: file.size, type: 'pdf' });
        } else if (isZipFile(file.name)) {
          setUploadProgress(`Extracting ZIP: ${file.name}...`);
          const extracted = await extractZipFiles(await file.arrayBuffer());
          for (const ef of extracted) {
            if (ef.type === 'image') newImages.push({ name: ef.name, content: ef.preview.split(',')[1], preview: ef.preview, size: ef.size });
            else newFiles.push({ name: ef.name, content: ef.content, size: ef.size, type: 'text' });
          }
        } else if (isTextFile(file.name)) {
          const text = await file.text();
          newFiles.push({ name: file.name, content: text, size: file.size, type: 'text' });
        } else {
          try {
            const text = await file.text();
            if (text.length > 0 && text.length < 500000) newFiles.push({ name: file.name, content: text, size: file.size, type: 'unknown' });
          } catch {}
        }
      } catch {}
    }
    if (newImages.length > 0) setUploadedImages(prev => [...prev, ...newImages]);
    if (newFiles.length > 0) setUploadedFiles(prev => [...prev, ...newFiles]);
    setUploadProgress(null);
    if (newFiles.length + newImages.length > 0) showModal('Files Added', `Added ${newImages.length + newFiles.length} file(s)`);
  }, [showModal]);

  const processFolder = useCallback(async (fileList) => {
    const files = Array.from(fileList);
    const skipDirs = ['node_modules','.git','__pycache__','.next','dist','build','.venv','.idea','.vscode'];
    await processFiles(files.filter(f => !skipDirs.some(d => (f.webkitRelativePath || f.name).includes(d + '/'))));
  }, [processFiles]);

  useEffect(() => {
    const handler = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files = [];
      for (const item of items) { if (item.kind === 'file') { const f = item.getAsFile(); if (f) files.push(f); } }
      if (files.length > 0) { e.preventDefault(); await processFiles(files); }
    };
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, [processFiles]);

  const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const handleDrop = useCallback(async (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer?.files?.length > 0) await processFiles(e.dataTransfer.files); }, [processFiles]);

  const removeUploadedFile = useCallback((i) => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i)), []);
  const removeUploadedImage = useCallback((i) => setUploadedImages(prev => prev.filter((_, idx) => idx !== i)), []);
  const clearAllUploads = useCallback(() => { setUploadedFiles([]); setUploadedImages([]); }, []);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // STREAM RESPONSE HANDLER
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const handleStreamResponse = useCallback(async (response, isContinue = false, initialContent = '') => {
    if (!response.body) return;
    const reader = response.body.getReader();
    streamReaderRef.current = reader;
    const decoder = new TextDecoder();
    let buffer = '';
    accumulatedTokensRef.current = initialContent;
    setStreamedContent(initialContent);
    let messageAddedToHistory = false;
    let lastUpdateTime = 0;
    const throttleMap = { slow: 220, normal: 120, fast: 40 };
    const THROTTLE_MS = throttleMap[settingsRef.current.streamingSpeed] || 120;

    const processLine = (line) => {
      const tl = line.trim();
      if (!tl) return;
      if (tl.startsWith('data:')) {
        const ds = tl.slice(5).trim();
        if (ds === '[DONE]') return;
        try {
          const p = JSON.parse(ds);
          const nt = p.text || p.response || p.token || '';
          if (nt) {
            accumulatedTokensRef.current += nt;
            setStreamedContent(accumulatedTokensRef.current);
            const now = Date.now();
            if (now - lastUpdateTime > THROTTLE_MS && isTabVisibleRef.current) {
              setStreamingMessage(prev => ({ ...(prev || {}), role: 'assistant', type: 'text', ts: Date.now(), isStreaming: true, content: accumulatedTokensRef.current }));
              lastUpdateTime = now;
            }
          }
          if (p.stream_id) { setLastStreamId(p.stream_id); continueStreamIdRef.current = p.stream_id; }
        } catch {
          accumulatedTokensRef.current += ds;
          setStreamedContent(accumulatedTokensRef.current);
          const now = Date.now();
          if (now - lastUpdateTime > THROTTLE_MS && isTabVisibleRef.current) {
            setStreamingMessage(prev => ({ ...(prev || {}), role: 'assistant', type: 'text', ts: Date.now(), isStreaming: true, content: accumulatedTokensRef.current }));
            lastUpdateTime = now;
          }
        }
      } else if (tl.startsWith('{')) {
        try {
          const p = JSON.parse(tl);
          const nt = p.text || p.content || p.delta || p.token || p.response || '';
          if (nt) {
            accumulatedTokensRef.current += nt;
            setStreamedContent(accumulatedTokensRef.current);
            const now = Date.now();
            if (now - lastUpdateTime > THROTTLE_MS && isTabVisibleRef.current) {
              setStreamingMessage(prev => ({ ...(prev || {}), role: 'assistant', type: 'text', ts: Date.now(), isStreaming: true, content: accumulatedTokensRef.current }));
              lastUpdateTime = now;
            }
          }
          if (p.stream_id) { setLastStreamId(p.stream_id); continueStreamIdRef.current = p.stream_id; }
        } catch {}
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.trim()) processLine(buffer);
          if (!messageAddedToHistory && accumulatedTokensRef.current) {
            const fc = accumulatedTokensRef.current.trim();
            const lc = fc.slice(-1);
            const cbc = (fc.match(/```/g) || []).length;
            if (cbc % 2 !== 0 || (fc.length > 50 && !['.','!','?','}',']','`','"',"'",';','>'].includes(lc))) setShowContinueButton(true);
            const pf = parseCodeForFiles(fc);
            setChatHistory(prev => {
              const filtered = prev.filter(msg => !(msg.isStreaming && msg.role === 'assistant'));
              return [...filtered, { role: 'assistant', content: fc, type: 'text', ts: Date.now(), files: pf.length > 0 ? pf : undefined }];
            });
            if (pf.length > 0) setGeneratedFiles(pf);
            messageAddedToHistory = true;
            setStreamingMessage(null);
          }
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) processLine(line);
      }
    } catch (error) { if (error.name !== 'AbortError') console.error("Stream Error:", error); }
    finally { reader.releaseLock(); streamReaderRef.current = null; }
  }, [parseCodeForFiles]);

  const handleContinueGeneration = useCallback(async () => {
    const streamId = lastStreamIdRef.current || continueStreamIdRef.current;
    if (!streamId) return;
    setIsLoading(true); setIsStreaming(true); setShowContinueButton(false);
    const history = chatHistoryRef.current;
    const lastMsg = history[history.length - 1];
    const previousContent = lastMsg?.role === 'assistant' ? lastMsg.content : '';
    if (lastMsg?.role === 'assistant') setChatHistory(prev => prev.slice(0, -1));
    setStreamingMessage({ role: 'assistant', content: previousContent, type: 'text', ts: Date.now(), isStreaming: true, isContinue: true });
    const controller = new AbortController();
    setAbortController(controller);
    try {
      const continueMode = selectedAIModeRef.current || 'chat';
      const response = await fetchAiForMode(continueMode, '/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'continue', mode: continueMode, stream: true, stream_id: streamId, user_preference_id: getPersistentUserId(), session_id: currentChatIdRef.current }), signal: controller.signal });
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('text/event-stream') || ct.includes('stream')) await handleStreamResponse(response, true, previousContent);
      else { const text = await response.text(); setChatHistory(prev => [...prev, { role: 'assistant', content: previousContent + text, type: 'text', ts: Date.now() }]); }
    } catch (error) { if (error.name !== 'AbortError') { if (lastMsg?.role === 'assistant') setChatHistory(prev => [...prev, { ...lastMsg, isPartial: true }]); setShowContinueButton(true); showModal('Error', 'Failed to continue.'); } }
    finally { setIsLoading(false); setIsStreaming(false); setStreamingMessage(null); setAbortController(null); }
  }, [getPersistentUserId, handleStreamResponse, showModal]);

  const handleStopGeneration = useCallback(() => {
    abortControllerRef.current?.abort(); setAbortController(null);
    streamReaderRef.current?.cancel().catch(() => {});
    if (streamingMessageRef.current && accumulatedTokensRef.current) {
      setChatHistory(prev => { const f = prev.filter(m => !(m.isStreaming && m.role === 'assistant')); return [...f, { role: 'assistant', content: accumulatedTokensRef.current.trim(), type: 'text', ts: Date.now(), isPartial: true }]; });
    }
    setIsStreaming(false); setIsLoading(false); setStreamingMessage(null); setShowContinueButton(true);
  }, []);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SEND MESSAGE
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const handleSendMessage = useCallback(async () => {
    const cleanMsg = messageRef.current.replace(/\s*\[mic\].*$/, '').trim();
    const curFiles = uploadedFilesRef.current;
    const curImages = uploadedImagesRef.current;
    if (!cleanMsg && curFiles.length === 0 && curImages.length === 0) return;
    if (isLoadingRef.current || isStreamingRef.current) return;
    if (isListeningRef.current) { recognitionRef.current?.stop(); setIsListening(false); }
    let chatId = currentChatIdRef.current;
    if (!chatId) {
      if (settingsRef.current.saveHistory === false) {
        chatId = `temp_${Date.now().toString(36)}`;
      } else {
        chatId = await createNewChatInDB(cleanMsg || 'New Chat');
      }
    }
    if (isMobile) setIsMobileSidebarOpen(false);
    setIsLoading(true);
    const controller = new AbortController(); setAbortController(controller);
    const hasImages = curImages.length > 0, hasFiles = curFiles.length > 0;
    let modeToSend = 'chat';
    const fm = forceModeRef.current, sm = selectedAIModeRef.current;
    if (fm) modeToSend = fm; else if (sm === 'pro') modeToSend = 'pro'; else if (sm === 'reasoning') modeToSend = 'reasoning';
    if (!ensureModeAccess(
      sm,
      fm,
      modeToSend === 'pro'
        ? 'Use Spider AI Pro'
        : modeToSend === 'video_gen'
          ? 'Create videos'
          : modeToSend === 'image_edit'
            ? 'Edit images'
            : modeToSend === 'image_gen'
              ? 'Create images'
              : 'Use M4 Spider tools'
    )) {
      setIsLoading(false);
      setAbortController(null);
      return;
    }
    let imageBase64 = null;
    if (hasImages) imageBase64 = curImages.length === 1 ? curImages[0].content : await createImageCollage(curImages);
    let fileContent = null, fileNames = null;
    if (hasFiles) { fileNames = curFiles.map(f => f.name).join(', '); fileContent = curFiles.map(f => `=== FILE: ${f.name} ===\n${f.content}\n=== END: ${f.name} ===`).join('\n\n'); }
    let enhancedPrompt = cleanMsg;
    if (hasImages && curImages.length > 1) { enhancedPrompt += `\n\n[${curImages.length} images attached]`; curImages.forEach((img, i) => { enhancedPrompt += `\n- Image ${i + 1}: ${img.name}`; }); }
    const userMessage = { role: 'user', content: cleanMsg, ts: Date.now(), images: hasImages ? curImages.map(i => ({ name: i.name, preview: i.preview })) : undefined, files: hasFiles ? curFiles.map(f => ({ name: f.name, size: f.size, type: f.type })) : undefined, aiMode: sm, forceMode: fm };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage(''); if (textareaRef.current) textareaRef.current.style.height = 'auto';
    accumulatedTokensRef.current = ''; setStreamedContent(''); setShowContinueButton(false); setLastStreamId(null); fileContentBufferRef.current = '';
    setUploadedFiles([]); setUploadedImages([]); setForceMode(null); setActiveAIMode(null);
    if (modeToSend === 'video_gen') {
      try {
        await submitVideoJob(enhancedPrompt, chatId, curImages[0] || null);
      } catch (error) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${normalizeUserFacingError(error)}`, type: 'text', ts: Date.now(), isError: true }]);
      } finally {
        setIsLoading(false); setIsStreaming(false); setStreamingMessage(null); setAbortController(null); setIsFullCodeMode(false);
      }
      return;
    }
    setStreamingMessage({ role: 'assistant', content: '', type: 'text', ts: Date.now(), isStreaming: true, isThinking: true });
    const basePayload = {
      prompt: enhancedPrompt,
      mode: modeToSend,
      image: imageBase64,
      file_content: fileContent,
      filename: fileNames,
      stream: true,
      user_preference_id: getPersistentUserId(),
      session_id: chatId,
      aspect_ratio: aspectRatio,
      image_model_preference: modeToSend === 'image_edit' ? 'flux-kelvin-4b' : undefined,
      image_model_fallback: modeToSend === 'image_edit' ? 'cloudflare-flux-9b' : undefined,
      allow_cloud_fallback: modeToSend === 'image_edit',
      llm_model_preference: sm === 'pro' ? undefined : 'ministral-3.8b',
      vision_model_hint: hasImages ? 'ministral-3.8b-vision' : undefined,
    };
    try {
      let response = await fetchAiForMode(modeToSend, '/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(basePayload), signal: controller.signal });
      if (!response.ok && modeToSend === 'image_edit') {
        const retryText = await response.clone().text();
        if (shouldRetryImageEditWithCloud(retryText)) {
          response = await fetchAiForMode(modeToSend, '/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...basePayload,
              force_cloudflare_flux_fallback: true,
              image_model_preference: 'cloudflare-flux-9b',
            }),
            signal: controller.signal
          });
        }
      }
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('image/')) {
        const blob = await response.blob();
        const base64 = await new Promise(r => { const fr = new FileReader(); fr.onloadend = () => r(fr.result.split(',')[1]); fr.readAsDataURL(blob); });
        setChatHistory(prev => [...prev, { role: 'assistant', content: cleanMsg, type: 'image', base64_image: base64, ts: Date.now(), is_generated: true }]);
        notifyGenerationComplete('Image Ready', 'Your image generation finished.');
      } else if (contentType.includes('text/event-stream') || contentType.includes('stream')) { setIsStreaming(true); await handleStreamResponse(response); }
      else if (contentType.includes('application/json')) {
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        if (data.base64_image || data.image) {
          setChatHistory(prev => [...prev, { role: 'assistant', content: cleanMsg, type: 'image', base64_image: data.base64_image || data.image, ts: Date.now(), is_generated: true }]);
          notifyGenerationComplete('Image Ready', 'Your image generation finished.');
        }
        else setChatHistory(prev => [...prev, { role: 'assistant', content: data.text || data.content || data.response || JSON.stringify(data), type: 'text', ts: Date.now() }]);
      } else {
        if (!response.ok) throw new Error(await response.text() || 'Request failed');
        const text = await response.text();
        if (!text.trim()) throw new Error('Empty response');
        setChatHistory(prev => [...prev, { role: 'assistant', content: text, type: 'text', ts: Date.now() }]);
      }
    } catch (error) { if (error.name !== 'AbortError') setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${normalizeUserFacingError(error)}`, type: 'text', ts: Date.now(), isError: true }]); }
    finally { setIsLoading(false); setIsStreaming(false); setStreamingMessage(null); setAbortController(null); setIsFullCodeMode(false); }
  }, [isMobile, aspectRatio, createNewChatInDB, ensureModeAccess, getPersistentUserId, handleStreamResponse, submitVideoJob]);

  // EDIT & REGENERATE
  const handleEditMessage = useCallback((index) => {
    const msg = chatHistoryRef.current[index];
    if (msg?.role === 'user') { setEditingMessageIndex(index); setEditingMessageContent(msg.content); setTimeout(() => editTextareaRef.current?.focus(), 50); }
  }, []);

  const handleSaveEdit = useCallback(async (index) => {
    const nc = editingMessageContent.trim();
    if (!nc) return;
    setChatHistory(prev => { const u = prev.slice(0, index); u.push({ ...prev[index], content: nc, ts: Date.now(), edited: true }); return u; });
    setEditingMessageIndex(null); setEditingMessageContent('');
    setMessage(nc);
    setTimeout(() => handleSendMessage(), 100);
  }, [editingMessageContent, handleSendMessage]);

  const handleCancelEdit = useCallback(() => { setEditingMessageIndex(null); setEditingMessageContent(''); }, []);

  const handleRegenerateResponse = useCallback(async (index) => {
    const history = chatHistoryRef.current;
    let ui = index - 1;
    while (ui >= 0 && history[ui].role !== 'user') ui--;
    if (ui < 0) return;
    setChatHistory(prev => prev.slice(0, index));
    setMessage(history[ui].content);
    setTimeout(() => handleSendMessage(), 100);
  }, [handleSendMessage]);

  const handleDeleteMessage = useCallback((index) => {
    setConfirmDelete({ type: 'message', messageIndex: index });
    setOpenMessageMenuIndex(null);
  }, []);

  const confirmDeleteMessage = useCallback((index) => {
    setChatHistory(prev => {
      const u = [...prev];
      if (u[index]?.role === 'user' && u[index + 1]?.role === 'assistant') u.splice(index, 2);
      else u.splice(index, 1);
      return u;
    });
    setConfirmDelete(null);
    showModal('Deleted', 'Message removed.');
  }, [showModal]);

  // CHAT MANAGEMENT
  const handleDeleteChat = useCallback(async (chatId) => { await deleteChatFromDB(chatId); setConfirmDelete(null); setChatContextMenu(null); showModal('Deleted', 'Chat deleted.'); }, [deleteChatFromDB, showModal]);
  const handleDeleteAllChats = useCallback(async () => { await deleteAllChatsFromDB(); setConfirmDelete(null); showModal('Cleared', 'All chats deleted.'); }, [deleteAllChatsFromDB, showModal]);
  const handlePinChat = useCallback((chatId) => { setPinnedChats(prev => prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]); setChatContextMenu(null); }, []);
  const handleRenameChat = useCallback((chatId) => {
    const chat = chatsRef.current.find(c => c.id === chatId);
    if (!chat) return;
    const nt = prompt('Enter new name:', chat.title || '');
    if (nt?.trim()) { renameChatInDB(chatId, nt.trim().substring(0, 50)); showModal('Renamed', 'Chat renamed.'); }
    setChatContextMenu(null);
  }, [renameChatInDB, showModal]);
  const handleExportChat = useCallback((chatId) => {
    const chat = chatsRef.current.find(c => c.id === chatId);
    if (!chat) return;
    const content = (chat.messages || []).map(m => `[${m.role === 'user' ? 'You' : 'Spider AI'}]\n${m.content}\n`).join('\n---\n\n');
    downloadFile(`${chat.title || 'chat'}.txt`, `# ${chat.title}\n\n${content}`);
    setChatContextMenu(null); showModal('Exported', 'Chat exported.');
  }, [downloadFile, showModal]);

  const handleFileInputChange = useCallback(async (e) => { if (e.target.files?.length > 0) await processFiles(e.target.files); e.target.value = null; }, [processFiles]);
  const handleFolderInputChange = useCallback(async (e) => { if (e.target.files?.length > 0) await processFolder(e.target.files); e.target.value = null; }, [processFolder]);

  useEffect(() => {
    flushPendingFeedback();

    const syncNow = () => { flushPendingFeedback(true); };
    const intervalId = window.setInterval(() => { flushPendingFeedback(); }, FEEDBACK_SYNC_INTERVAL_MS);
    window.addEventListener('online', syncNow);
    document.addEventListener('visibilitychange', syncNow);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('online', syncNow);
      document.removeEventListener('visibilitychange', syncNow);
    };
  }, [flushPendingFeedback]);

  const handleNewChat = useCallback(async () => {
    if (settingsRef.current.saveHistory !== false) {
      await createNewChatInDB(`Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } else {
      setCurrentChatId(null);
    }
    setSelectedAIMode(settingsRef.current.defaultMode || 'chat');
    setChatHistory([]); setShowContinueButton(false); setStreamingMessage(null);
    setUploadedFiles([]); setUploadedImages([]); setForceMode(null); setActiveAIMode(null);
    setLastStreamId(null); setGeneratedFiles([]); setIsFullCodeMode(false);
    accumulatedTokensRef.current = ''; setStreamedContent('');
    if (isMobile) setIsMobileSidebarOpen(false);
  }, [createNewChatInDB, isMobile]);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'defaultMode') {
      setSelectedAIMode(value || 'chat');
      setForceMode(null);
    }
  }, []);
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setSelectedAIMode(DEFAULT_SETTINGS.defaultMode || 'chat');
    setForceMode(null);
    setWordWrapBlocks({});
    showModal('Reset', 'Settings reset to defaults.');
  }, [showModal]);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // CODE BLOCK RENDERING
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const highlightCode = useCallback((code) => {
    let h = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\t/g, '  ');
    const tokens = {}; let ti = 0; const P = '___TKN_';
    const s = (m, c, it = false) => { const t = `${P}${ti++}___`; tokens[t] = `<span style="color:${c};${it ? 'font-style:italic;' : ''}">${m}</span>`; return t; };
    h = h.replace(/(`[\s\S]*?`|"[^"]*"|'[^']*')/g, m => s(m, '#CE9178'));
    h = h.replace(/(\/\/.*|#.*)/g, m => s(m, '#6A9955', true));
    h = h.replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|await|async|def|in|try|except|with|as|new|this|print|switch|case|break|continue|throw|catch|finally|yield|static|extends|implements|interface|type|enum|namespace|module|declare|readonly|abstract|override|super|typeof|instanceof|void|delete|default)\b/g, m => s(m, '#569CD6'));
    h = h.replace(/\b(true|false|null|undefined|None|True|False|NaN|Infinity)\b/g, m => s(m, '#569CD6'));
    h = h.replace(/\b(\d+\.?\d*)\b/g, m => s(m, '#B5CEA8'));
    h = h.replace(/\b([a-zA-Z_]\w*)(?=\()/g, m => s(m, '#DCDCAA'));
    for (let i = ti - 1; i >= 0; i--) { const k = `${P}${i}___`; h = h.split(k).join(tokens[k]); }
    return h;
  }, []);

  const renderCodeBlock = useCallback((code, lang, blockId) => {
    const isCollapsed = collapsedBlocks[blockId];
    const hasWordWrap = Object.prototype.hasOwnProperty.call(wordWrapBlocks, blockId)
      ? wordWrapBlocks[blockId]
      : settings.codeWordWrap;
    const useAndroidSafeLayout = isAndroid;
    const shouldWrapCode = useAndroidSafeLayout ? true : hasWordWrap;
    const lines = code.split('\n');

    return (
      <div key={blockId} className="my-1.5 rounded-xl overflow-hidden border border-[#194A4A] bg-[#040C0C] w-full shadow-lg min-w-0 max-w-full">
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-[#0A1A1A] border-b border-[#194A4A] min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setCollapsedBlocks(prev => ({ ...prev, [blockId]: !prev[blockId] }))} className="text-[#529E98] hover:text-[#00E5FF] transition-colors">
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
            <Code size={14} className="text-[#00E5FF]" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#00E5FF] truncate">{lang || 'code'}</span>
            <span className="text-[10px] text-[#529E98] shrink-0">{lines.length} lines</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!useAndroidSafeLayout && (
              <button onClick={() => setWordWrapBlocks(prev => ({ ...prev, [blockId]: !hasWordWrap }))} className={`p-1 rounded ${hasWordWrap ? 'text-[#00E5FF]' : 'text-[#529E98]'} hover:text-[#00E5FF]`}><WrapText size={12} /></button>
            )}
            <button onClick={() => downloadFile(`code.${lang || 'txt'}`, code.trim())} className="text-[#529E98] hover:text-[#00E5FF] p-1 rounded"><Download size={12} /></button>
            <button onClick={() => copyToClipboard(code.trim())} className="text-[#529E98] hover:text-[#00E5FF] flex items-center gap-1.5 text-xs font-medium"><Copy size={14} /> Copy</button>
          </div>
        </div>
        {!isCollapsed && (
          useAndroidSafeLayout ? (
            <div className="w-full min-w-0">
              {lines.map((line, i) => (
                <div key={i} className="flex w-full min-w-0 items-start hover:bg-[#0A1A1A]/50">
                  {settings.codeLineNumbers && (
                    <div className="px-3 py-0 text-right text-[#3A5A5A] text-[11px] select-none w-[45px] shrink-0 border-r border-[#194A4A]/30 bg-[#040C0C]">
                      {i + 1}
                    </div>
                  )}
                  <div
                    className={`px-4 py-0 text-[#D4D4D4] min-w-0 flex-1 overflow-hidden ${shouldWrapCode ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}
                    dangerouslySetInnerHTML={{ __html: highlightCode(line) }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-[14px] leading-relaxed font-mono border-collapse">
                <tbody>{lines.map((line, i) => (
                  <tr key={i} className="hover:bg-[#0A1A1A]/50">
                    {settings.codeLineNumbers && <td className="px-3 py-0 text-right text-[#3A5A5A] text-[11px] select-none w-[45px] border-r border-[#194A4A]/30 sticky left-0 bg-[#040C0C]">{i + 1}</td>}
                    <td className={`px-4 py-0 text-[#D4D4D4] ${shouldWrapCode ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`} dangerouslySetInnerHTML={{ __html: highlightCode(line) }} />
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )
        )}
      </div>
    );
  }, [collapsedBlocks, wordWrapBlocks, copyToClipboard, downloadFile, highlightCode, isAndroid, settings.codeLineNumbers, settings.codeWordWrap]);

  const renderMessage = useCallback((text, msgIndex = 0) => {
    if (!text) return null;
    const lines = text.split('\n');
    const rawBlocks = [];
    let isCodeBlock = false, currentLang = '', currentContent = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('```')) {
        if (!isCodeBlock) {
          if (currentContent.length > 0) { rawBlocks.push({ type: 'text', content: currentContent.join('\n') }); currentContent = []; }
          isCodeBlock = true; currentLang = trimmed.substring(3).trim();
        } else {
          rawBlocks.push({ type: 'code', lang: currentLang, content: currentContent.join('\n') }); currentContent = []; isCodeBlock = false; currentLang = '';
        }
      } else currentContent.push(line);
    }
    if (currentContent.length > 0) rawBlocks.push({ type: isCodeBlock ? 'code' : 'text', lang: currentLang, content: currentContent.join('\n') });

    const mergedBlocks = [];
    for (const block of rawBlocks) {
      if (block.type === 'text' && !block.content.trim()) continue;
      const lb = mergedBlocks[mergedBlocks.length - 1];
      if (block.type === 'code' && lb?.type === 'code' && lb.lang === block.lang) lb.content += '\n' + block.content;
      else mergedBlocks.push(block);
    }

    let cbc = 0;
    return mergedBlocks.map((block, index) => {
      if (block.type === 'code') return renderCodeBlock(block.content, block.lang, `${msgIndex}_${cbc++}`);
      const tc = block.content.trim();
      if (!tc) return null;

      const mt = {}; let mi = 0;
      let processed = tc.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g, (match) => {
        const math = match.replace(/^\$\$|\$\$$/g, '').replace(/^\\\[|\\\]$/g, '').trim();
        const token = `___MB_${mi}___`;
        let rendered = `<div class="font-serif text-[#00E5FF] text-center my-4">${math}</div>`;
        if (katexLoaded && window.katex) { try { rendered = `<div class="my-5 overflow-x-auto text-center">${window.katex.renderToString(math, { displayMode: true, throwOnError: true })}</div>`; } catch (e) { rendered = `<div class="text-red-400 text-center my-2 text-sm">[Math Error]</div>`; } }
        mt[token] = rendered; mi++; return token;
      });
      processed = processed.replace(/(\$[^$\n]+\$|\\\([^()]+\\\))/g, (match) => {
        const math = match.replace(/^\$|\$$/g, '').replace(/^\\\(|\\\)$/g, '').trim();
        const token = `___MI_${mi}___`;
        let rendered = `<span class="font-serif italic text-[#00E5FF]">${math}</span>`;
        if (katexLoaded && window.katex) { try { rendered = `<span class="inline-block px-1">${window.katex.renderToString(math, { displayMode: false, throwOnError: true })}</span>`; } catch {} }
        mt[token] = rendered; mi++; return token;
      });

      let html = processed.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="text-gray-300 italic">$1</em>')
        .replace(/`([^`\n]+)`/g, '<code class="bg-[#194A4A]/50 text-[#00E5FF] px-1.5 py-0.5 rounded-md font-mono text-[13px] break-words">$1</code>')
        .replace(/^ {0,3}###\s+(.*)$/gm, '<h3 class="text-lg font-bold text-[#00E5FF] mt-5 mb-2">$1</h3>')
        .replace(/^ {0,3}##\s+(.*)$/gm, '<h2 class="text-xl font-bold text-white mt-6 mb-3 border-b border-[#194A4A] pb-2">$1</h2>')
        .replace(/^ {0,3}#\s+(.*)$/gm, '<h1 class="text-2xl font-bold text-[#00E5FF] mt-6 mb-4">$1</h1>');

      for (let i = 0; i < mi; i++) { html = html.replace(`___MB_${i}___`, mt[`___MB_${i}___`] || '').replace(`___MI_${i}___`, mt[`___MI_${i}___`] || ''); }
      return <div key={index} className="whitespace-pre-wrap break-words leading-relaxed w-full min-w-0 max-w-full" dangerouslySetInnerHTML={{ __html: html }} />;
    }).filter(Boolean);
  }, [katexLoaded, renderCodeBlock]);

  const getImageSrc = useCallback((data) => {
    if (!data) return '';
    if (data.startsWith('http') || data.startsWith('data:')) return data;
    return `data:image/png;base64,${data}`;
  }, []);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // MEMOIZED VALUES
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const modeInfo = useMemo(() => {
    if (forceMode === 'image_gen') return { icon: <Wand2 size={16} />, text: 'Image Generation', color: 'text-[#FFD700]' };
    if (forceMode === 'image_edit') return { icon: <Wand2 size={16} />, text: 'Image Edit', color: 'text-[#FF6B6B]' };
    if (forceMode === 'video_gen') return { icon: <Film size={16} />, text: `Video ${aspectRatio}`, color: 'text-[#7CE7FF]' };
    if (selectedAIMode === 'pro') return { icon: <Zap size={16} className="fill-[#FFD700] text-[#FFD700]" />, text: 'Pro Mode', color: 'text-[#FFD700]', isPro: true };
    if (selectedAIMode === 'reasoning') return { icon: <Brain size={16} />, text: 'Reasoning', color: 'text-[#00E5FF]' };
    if (uploadedImages.length > 0) return { icon: <Eye size={16} />, text: `${uploadedImages.length} image(s)`, color: 'text-[#00E5FF]' };
    if (uploadedFiles.length > 0) return { icon: <FileUp size={16} />, text: `${uploadedFiles.length} file(s)`, color: 'text-[#00E5FF]' };
    return { icon: <MessageCircle size={16} className="fill-[#00E5FF]" />, text: 'Chat', color: 'text-[#00E5FF]' };
  }, [aspectRatio, forceMode, selectedAIMode, uploadedImages.length, uploadedFiles.length]);

  const visibleAuthUser = authUser || authSnapshot;
  const visibleUserName = visibleAuthUser?.displayName || visibleAuthUser?.email || (authReady ? 'Spider User' : 'Loading account...');
  const visibleUserPlan = visibleAuthUser ? 'M4 Spider account' : (authReady ? 'Guest chat mode' : 'Restoring session...');
  const visibleUserInitial = visibleAuthUser?.displayName?.[0]?.toUpperCase() || visibleAuthUser?.email?.[0]?.toUpperCase() || (authReady ? 'S' : '.');

  const handleChatSelect = useCallback((chat) => {
    const latestChat = chatsRef.current.find(c => c.id === chat.id) || chat;
    setCurrentChatId(latestChat.id);
    setChatHistory(latestChat.messages || []);
    setShowContinueButton(false);
    setStreamingMessage(null);
    setForceMode(null);
    setActiveAIMode(null);
  }, []);
  const handleChatSelectMobile = useCallback((chat) => { handleChatSelect(chat); setIsMobileSidebarOpen(false); }, [handleChatSelect]);

  const handleKeyDown = useCallback((e) => {
    if (settings.sendWithEnter && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
    else if (!settings.sendWithEnter && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSendMessage(); }
  }, [handleSendMessage, settings.sendWithEnter]);

  const hasUploads = uploadedFiles.length > 0 || uploadedImages.length > 0;
  const totalUploads = uploadedFiles.length + uploadedImages.length;
  const canSend = !isLoading && (message.trim() || uploadedFiles.length > 0 || uploadedImages.length > 0);

  const placeholderText = useMemo(() => {
    if (isListening) return 'Listening...';
    if (forceMode === 'image_gen') return 'Describe the image...';
    if (forceMode === 'video_gen') return 'Describe the video shot, camera movement, and mood...';
    if (selectedAIMode === 'pro') return 'Message Spider AI Pro...';
    return `Message Spider AI...`;
  }, [isListening, forceMode, selectedAIMode]);

  const applyStarterTemplate = useCallback((template) => {
    setMessage(template.prompt);
    if (template.aiMode === 'pro') {
      setSelectedAIMode('pro');
    } else {
      setSelectedAIMode(prev => prev === 'pro' ? 'chat' : prev);
    }
    if (template.mode === 'image_gen') {
      setForceMode('image_gen');
    } else if (template.mode === 'image_edit') {
      setForceMode('image_edit');
    } else if (template.mode === 'video_gen') {
      setForceMode('video_gen');
    } else {
      setForceMode(null);
    }
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, [setSelectedAIMode, setForceMode]);

  const inputWrapperClass = useMemo(() => {
    const base = 'flex-1 rounded-xl flex items-end px-3 md:px-4 py-2 border transition-colors min-w-0';
    if (selectedAIMode === 'pro') return `${base} bg-[#1A2A1A] border-[#FFD700]/20 focus-within:border-[#FFD700]/50`;
    if (forceMode) return `${base} bg-[#1A1A2A] border-[#FF6B6B]/20 focus-within:border-[#FF6B6B]/50`;
    return `${base} bg-[#133838] border-transparent focus-within:border-[#194A4A]`;
  }, [selectedAIMode, forceMode]);

  const fontSizeClass = useMemo(() => {
    const map = { small: 'text-[13px]', medium: 'text-[14px] md:text-[15px]', large: 'text-[16px] md:text-[17px]' };
    return map[settings.fontSize] || map.medium;
  }, [settings.fontSize]);
  const composerFontSizeClass = useMemo(() => {
    const map = { small: 'text-[13px]', medium: 'text-sm', large: 'text-[16px]' };
    return map[settings.fontSize] || map.medium;
  }, [settings.fontSize]);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SIDEBAR CHAT GROUP RENDERER
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const renderChatGroup = (label, chatsArr, onSelect, icon) => {
    if (chatsArr.length === 0) return null;
    return (
      <div className="mb-3">
        <h3 className="text-[11px] text-[#529E98] font-semibold tracking-wider mb-1.5 px-2 nav-item flex items-center gap-1.5 uppercase">
          {icon} {label}
        </h3>
        {chatsArr.map(chat => {
          const isPinned = pinnedChats.includes(chat.id);
          const isActive = currentChatId === chat.id;
          return (
            <div key={chat.id} className="relative group">
              <div onClick={() => onSelect(chat)}
                onContextMenu={(e) => { e.preventDefault(); setChatContextMenu({ chatId: chat.id, x: e.clientX, y: e.clientY }); }}
                className={`nav-item cursor-pointer rounded-lg px-3 py-2 mx-1 transition-all flex items-center gap-2 ${isActive ? 'bg-[#194040]' : 'hover:bg-[#194040]/50'}`}>
                {isPinned && <Pin size={10} className="text-[#FFD700] shrink-0" />}
                <span className={`text-sm truncate flex-1 ${isActive ? 'text-white font-medium' : 'text-gray-300'}`}>{chat.title}</span>
                <button onClick={(e) => { e.stopPropagation(); setChatContextMenu({ chatId: chat.id, x: e.clientX, y: e.clientY }); }}
                  className="sidebar-btn opacity-0 group-hover:opacity-100 text-[#529E98] hover:text-white p-0.5 rounded transition-opacity shrink-0">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SIDEBAR CONTENT (ChatGPT style layout)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const renderSidebarContent = (onChatSelect, closeSidebar) => (
    <div className="flex flex-col h-full">
      {/* === TOP NAV SECTION (like ChatGPT) === */}
      <div className="p-3 space-y-0.5">
        {/* New Chat */}
        <button onClick={handleNewChat}
          className="sidebar-nav-btn font-medium">
          <Plus size={18} className="text-[#529E98]" /> New chat
        </button>

        {/* Search chats */}
        <button onClick={() => { setIsSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100); }}
          className="sidebar-nav-btn">
          <Search size={18} className="text-[#529E98]" /> Search chats
          <span className="ml-auto text-[10px] text-[#529E98] bg-[#194040] px-1.5 py-0.5 rounded hidden md:inline">Cmd+K</span>
        </button>

        {/* Spider Lens */}
        <button onClick={openLens} className="sidebar-nav-btn">
          <Camera size={18} className="text-[#529E98]" /> Spider Lens
        </button>

        {/* Projects (Upload Folder) */}
        <button onClick={() => folderInputRef.current?.click()} className="sidebar-nav-btn">
          <FolderOpen size={18} className="text-[#529E98]" /> Projects
        </button>
      </div>

      <div className="h-px bg-[#194040] mx-3" />

      {/* === SEARCH BAR (shown when search is open) === */}
      {isSearchOpen && (
        <div className="p-3 pb-1">
          <div className="flex items-center gap-2 bg-[#091E1E] border border-[#194A4A] rounded-lg px-3 py-2 focus-within:border-[#00E5FF]/50 transition-colors">
            <Search size={14} className="text-[#529E98] shrink-0" />
            <input ref={searchInputRef} type="text" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="bg-transparent text-sm text-white placeholder-[#529E98] outline-none w-full" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="sidebar-btn text-[#529E98] hover:text-white shrink-0"><X size={12} /></button>}
            <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="sidebar-btn text-[#529E98] hover:text-white shrink-0"><X size={14} /></button>
          </div>
          {searchQuery && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {[{ id: 'all', label: 'All' }, { id: 'today', label: 'Today' }, { id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }].map(f => (
                <button key={f.id} onClick={() => setSearchFilter(f.id)}
                  className={`sidebar-btn px-2 py-1 rounded text-[10px] font-medium transition-all ${searchFilter === f.id ? 'bg-[#00E5FF] text-black' : 'bg-[#194A4A] text-[#529E98] hover:text-white'}`}>
                  {f.label}
                </button>
              ))}
              <span className="text-[10px] text-[#529E98] self-center ml-1">{filteredChats.length} results</span>
            </div>
          )}
        </div>
      )}

      {/* === CHAT LIST === */}
      <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
        {renderChatGroup('Pinned', groupedChats.pinned, onChatSelect, <Pin size={10} className="text-[#FFD700]" />)}
        {renderChatGroup('Today', groupedChats.today, onChatSelect, null)}
        {renderChatGroup('Yesterday', groupedChats.yesterday, onChatSelect, null)}
        {renderChatGroup('Previous 7 Days', groupedChats.week, onChatSelect, null)}
        {renderChatGroup('Previous 30 Days', groupedChats.month, onChatSelect, null)}
        {renderChatGroup('Older', groupedChats.older, onChatSelect, null)}

        {chatRestoreReady && chats.length === 0 && (
          <div className="text-sm text-[#529E98] italic px-4 py-8 text-center">
            No chats yet. Start a conversation!
          </div>
        )}
      </div>

      {/* === BOTTOM SECTION (like ChatGPT: user, settings, etc.) === */}
      <div className="border-t border-[#194040] p-2 space-y-0.5">
        {/* User Profile Button */}
        <div className="relative">
          <button onClick={() => setShowUserMenu(prev => !prev)}
            className="sidebar-bottom-btn w-full">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#194A4A] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {visibleUserInitial}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm text-gray-200 font-medium truncate">{visibleUserName}</div>
              <div className="text-[10px] text-[#529E98]">{visibleUserPlan}</div>
            </div>
            <MoreHorizontal size={16} className="text-[#529E98] shrink-0" />
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-[55]" onClick={() => setShowUserMenu(false)} />
              <div className="absolute bottom-full left-2 right-2 mb-1 bg-[#0B2A2A] border border-[#194A4A] rounded-xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[60] py-1 animate-slide-up">
                <button onClick={() => { setShowSettings(true); setShowUserMenu(false); }}
                  className="sidebar-bottom-btn w-full">
                  <Settings size={16} className="text-[#529E98]" /> Settings
                  <span className="ml-auto text-[10px] text-[#529E98] bg-[#194040] px-1.5 py-0.5 rounded hidden md:inline">Cmd+,</span>
                </button>

                <button onClick={() => { setShowSettings(true); setSettingsTab('help'); setShowUserMenu(false); }} className="sidebar-bottom-btn w-full">
                  <HelpCircle size={16} className="text-[#529E98]" /> Help & FAQ
                  <ChevronRight size={14} className="ml-auto text-[#529E98]" />
                </button>

                <button onClick={() => {
                  if (authUser) handleAuthSignOut();
                  else openAuthGate('Unlock image, video, and Pro tools');
                }} className="sidebar-bottom-btn w-full">
                  {authUser ? <LogOut size={16} className="text-[#529E98]" /> : <User size={16} className="text-[#529E98]" />}
                  {authUser ? 'Sign out' : 'Sign in'}
                </button>

                <div className="h-px bg-[#194040] mx-2 my-1" />

                <button onClick={() => { setConfirmDelete({ type: 'all' }); setShowUserMenu(false); }}
                  className="sidebar-bottom-btn w-full text-red-400 hover:text-red-300">
                  <Trash2 size={16} /> Clear all chats
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SETTINGS MODAL (ChatGPT style - centered overlay with left tabs)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const renderSettings = () => {
    if (!showSettings) return null;

    const tabs = [
      { id: 'general', label: 'General', icon: <Settings size={16} /> },
      { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
      { id: 'chat', label: 'Chat', icon: <MessageSquare size={16} /> },
      { id: 'data', label: 'Data controls', icon: <Database size={16} /> },
      { id: 'help', label: 'Help & FAQ', icon: <HelpCircle size={16} /> },
    ];

    const SettingToggle = ({ label, desc, value, onChange }) => (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4 border-b border-[#194040]/50 last:border-0">
        <div className="pr-0 sm:pr-4">
          <div className="text-sm font-medium text-gray-200">{label}</div>
          {desc && <div className="text-xs text-[#529E98] mt-0.5">{desc}</div>}
        </div>
        <button onClick={() => onChange(!value)}
          className={`sidebar-btn w-11 h-6 rounded-full transition-all relative shrink-0 self-start sm:self-center ${value ? 'bg-[#00E5FF]' : 'bg-[#194A4A]'}`}>
          <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-all ${value ? 'left-5' : 'left-0.5'}`} />
        </button>
      </div>
    );

    const SettingSelect = ({ label, desc, value, options, onChange }) => (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4 border-b border-[#194040]/50 last:border-0">
        <div className="pr-0 sm:pr-4">
          <div className="text-sm font-medium text-gray-200">{label}</div>
          {desc && <div className="text-xs text-[#529E98] mt-0.5">{desc}</div>}
        </div>
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="bg-[#133838] border border-[#194A4A] text-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00E5FF]/50 cursor-pointer min-w-[170px] max-w-full">
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>
    );

    const FaqItem = ({ title, body }) => (
      <div className="rounded-2xl border border-[#194040] bg-[#091E1E] p-4">
        <div className="text-sm font-semibold text-white mb-2">{title}</div>
        <p className="text-xs leading-6 text-[#7AB7B3] whitespace-pre-line">{body}</p>
      </div>
    );

    return (
      <div className="fixed inset-0 z-[95] flex items-start md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 overflow-hidden" onClick={() => setShowSettings(false)}>
        <div className="settings-dialog bg-[#0F2B2B] border-0 md:border border-[#194A4A] rounded-none md:rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-scale-in overflow-hidden grid grid-rows-[auto_1fr] md:grid-rows-1 md:grid-cols-[220px_minmax(0,1fr)] pt-[max(env(safe-area-inset-top),0px)]"
          onClick={(e) => e.stopPropagation()}>

          {/* Left Tab Navigation */}
          <div className="border-b md:border-b-0 md:border-r border-[#194040] bg-[#0A2222] min-h-0">
            <div className="hidden md:flex items-center justify-between px-4 py-4 border-b border-[#194040]">
                <h2 className="text-base font-bold text-white">Settings</h2>
                <button onClick={() => setShowSettings(false)} className="sidebar-btn text-[#529E98] hover:text-white p-1 rounded-lg hover:bg-[#194040]">
                  <X size={18} />
                </button>
              </div>
            <div className="hidden md:flex md:flex-col overflow-x-auto md:overflow-x-visible p-2 md:p-3 gap-1">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setSettingsTab(tab.id)}
                  className={`sidebar-btn flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap md:w-full text-left ${
                    settingsTab === tab.id ? 'bg-[#194040] text-white' : 'text-[#9ca3af] hover:bg-[#194040]/50 hover:text-gray-200'
                  }`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Content */}
          <div className="min-w-0 min-h-0 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-[#194040] bg-[#102B2B]/60 shrink-0">
              <div>
                <h2 className="text-base md:text-lg font-bold text-white">Settings</h2>
                <p className="text-xs text-[#529E98] mt-0.5 capitalize">{settingsTab === 'data' ? 'Data controls' : settingsTab === 'help' ? 'Help & FAQ' : settingsTab}</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="sidebar-btn text-[#529E98] hover:text-white p-1.5 rounded-lg hover:bg-[#194040]"><X size={18} /></button>
            </div>

            <div className="md:hidden px-4 py-3 border-b border-[#194040] bg-[#0D2525] shrink-0">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#529E98] mb-2">Section</label>
              <select
                value={settingsTab}
                onChange={(e) => setSettingsTab(e.target.value)}
                className="w-full bg-[#133838] border border-[#194A4A] text-gray-200 text-sm rounded-xl px-3 py-3 outline-none focus:border-[#00E5FF]/50"
              >
                {tabs.map(tab => (
                  <option key={tab.id} value={tab.id}>{tab.label}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 md:px-6 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] custom-scrollbar">
              {settingsTab === 'general' && (
                <div>
                  <SettingToggle label="Send with Enter" desc="Press Enter to send, Shift+Enter for new line" value={settings.sendWithEnter} onChange={(v) => updateSetting('sendWithEnter', v)} />
                  <SettingToggle label="Auto-scroll" desc="Automatically scroll to new messages" value={settings.autoScroll} onChange={(v) => updateSetting('autoScroll', v)} />
                  <SettingToggle label="Sound effects" desc="Play sounds for notifications" value={settings.soundEnabled} onChange={(v) => updateSetting('soundEnabled', v)} />
                  <SettingToggle label="Show timestamps" desc="Display time for each message" value={settings.showTimestamps} onChange={(v) => updateSetting('showTimestamps', v)} />
                  <SettingSelect label="Default AI Mode" value={settings.defaultMode} onChange={(v) => updateSetting('defaultMode', v)}
                    options={[{ value: 'chat', label: 'Chat' }, { value: 'pro', label: 'Pro' }, { value: 'reasoning', label: 'Reasoning' }]} />
                </div>
              )}

              {settingsTab === 'appearance' && (
                <div>
                  <SettingSelect label="Font size" value={settings.fontSize} onChange={(v) => updateSetting('fontSize', v)}
                    options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]} />
                  <SettingToggle label="Compact mode" desc="Reduce spacing between messages" value={settings.compactMode} onChange={(v) => updateSetting('compactMode', v)} />
                  <SettingToggle label="Code line numbers" desc="Show line numbers in code blocks" value={settings.codeLineNumbers} onChange={(v) => updateSetting('codeLineNumbers', v)} />
                  <SettingToggle label="Code word wrap" desc="Wrap long lines in code blocks" value={settings.codeWordWrap} onChange={(v) => updateSetting('codeWordWrap', v)} />
                </div>
              )}

              {settingsTab === 'chat' && (
                <div>
                  <SettingSelect label="Streaming speed" value={settings.streamingSpeed} onChange={(v) => updateSetting('streamingSpeed', v)}
                    options={[{ value: 'slow', label: 'Slow' }, { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Fast' }]} />

                  <div className="py-4 border-b border-[#194040]/50">
                    <div className="text-sm font-medium text-gray-200 mb-3">Chat statistics</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-[#091E1E] rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-[#00E5FF]">{chats.length}</div>
                        <div className="text-xs text-[#529E98] mt-1">Total Chats</div>
                      </div>
                      <div className="bg-[#091E1E] rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-[#00E5FF]">{chats.reduce((s, c) => s + (c.messages?.length || 0), 0)}</div>
                        <div className="text-xs text-[#529E98] mt-1">Total Messages</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'data' && (
                <div>
                  <SettingToggle label="Save chat history" desc="Store conversations locally in your browser" value={settings.saveHistory} onChange={(v) => updateSetting('saveHistory', v)} />

                  <div className="py-4 border-b border-[#194040]/50">
                    <div className="text-sm font-medium text-gray-200 mb-1">Export all chats</div>
                    <div className="text-xs text-[#529E98] mb-3">Download all your conversations as a text file</div>
                    <button onClick={() => {
                      const all = chats.map(c => { const msgs = (c.messages || []).map(m => `[${m.role === 'user' ? 'You' : 'AI'}] ${m.content}`).join('\n\n'); return `=== ${c.title} ===\n${msgs}`; }).join('\n\n' + '='.repeat(50) + '\n\n');
                      downloadFile('spider_ai_chats.txt', all); showModal('Exported', 'All chats exported.');
                    }} className="sidebar-btn flex items-center gap-2 px-4 py-2 bg-[#194A4A] text-[#00E5FF] rounded-lg hover:bg-[#00E5FF] hover:text-black transition-colors text-sm font-medium">
                      <Download size={14} /> Export
                    </button>
                  </div>

                  <div className="py-4">
                    <div className="text-sm font-medium text-red-400 mb-1 flex items-center gap-2"><AlertTriangle size={14} /> Danger zone</div>
                    <div className="text-xs text-red-300/60 mb-3">These actions cannot be undone</div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setConfirmDelete({ type: 'all' })}
                        className="sidebar-btn flex items-center gap-2 px-4 py-2 bg-red-500/15 text-red-400 rounded-lg hover:bg-red-500/25 transition-colors text-sm font-medium border border-red-500/20">
                        <Trash2 size={14} /> Delete all chats
                      </button>
                      <button onClick={resetSettings}
                        className="sidebar-btn flex items-center gap-2 px-4 py-2 bg-red-500/15 text-red-400 rounded-lg hover:bg-red-500/25 transition-colors text-sm font-medium border border-red-500/20">
                        <RefreshCw size={14} /> Reset settings
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'help' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#194040] bg-gradient-to-br from-[#102B2B] to-[#091E1E] p-5">
                    <div className="flex items-center gap-2 text-[#00E5FF] mb-2">
                      <HelpCircle size={16} />
                      <span className="text-sm font-semibold">Spider AI Help Center</span>
                    </div>
                    <p className="text-sm leading-6 text-[#7AB7B3]">
                      This section explains how Spider AI works today from a user-facing point of view without exposing private implementation details.
                    </p>
                    <a
                      href={LEGAL_PAGE_PATH}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#194A4A] bg-[#133838] px-3 py-2 text-xs font-semibold text-[#00E5FF] hover:bg-[#194A4A]"
                    >
                      <Shield size={14} />
                      Privacy, Terms & Licenses page
                    </a>
                  </div>

                  <FaqItem
                    title="Why is video generation slow?"
                    body={`Video jobs are slow mainly because video generation is one of the heaviest features in the app.\n\nA single request can involve:\n- prompt preparation\n- generation warmup\n- multi-frame rendering\n- optional finishing or export\n\nSo the main delay is generation work itself, not just the chat UI.`}
                  />

                  <FaqItem
                    title="Is my data safe?"
                    body={`Mostly yes, with a few clear boundaries.\n\nCurrent app behavior:\n- chats and settings can be stored locally in your browser for continuity\n- sign-in uses a hosted authentication provider\n- prompts and generation requests may be processed by connected AI services so results can be produced\n\nThat means some data stays on your device for convenience, while generation requests still go to the services used by the app.`}
                  />

                  <FaqItem
                    title="From where is this app running?"
                    body={`Spider AI runs as a web app connected to AI services for chat, image, and video features.\n\nDepending on deployment, generation can use cloud services, local runtimes, or a hybrid setup managed by the app owner.\n\nFrom a user point of view, Spider AI is a web-based AI product connected to the services needed to produce results.`}
                  />

                  <FaqItem
                    title="What is the difference between Fast, Balanced, and Quality?"
                    body={`Fast\n- optimized for speed\n- lighter output path\n- best for quick previews and testing ideas\n\nBalanced\n- middle ground between speed and visual detail\n- better polish than Fast\n- good default for everyday use\n\nQuality\n- prioritizes cleaner final output\n- can take longer than the other modes\n- best when output quality matters more than turnaround time\n\nSo the difference is generation budget and finishing behavior, not just a renamed button.`}
                  />

                  <FaqItem
                    title="Why do prompt understanding and quality sometimes vary?"
                    body={`The current video model is powerful but still variable. The same prompt can look realistic once, then softer or more stylized on another run because of seed variance, prompt phrasing, duration, and model instability.\n\nBest results usually come from:\n- Shorter, clearer prompts\n- Fewer mixed ideas in one scene\n- Shorter durations for the cleanest clips\n- Using Balanced or Quality when you need more detail`}
                  />

                  <FaqItem
                    title="Why do some tools ask me to log in?"
                    body={`Free chat stays open without login.\n\nYour current UI only gates these tools behind sign-in:\n- Spider AI Pro\n- Create Image\n- Edit Image\n- Create Video\n\nThat is there to reduce spam and protect the heavier generation endpoints.`}
                  />

                  <FaqItem
                    title="How to get the best video prompts"
                    body={`The current video pipeline responds best to direct visual prompts instead of very long story paragraphs.\n\nBest format:\n- subject\n- action\n- environment\n- camera style\n- lighting or mood\n\nGood example:\nIron Man and Doctor Doom fighting in a destroyed science lab, realistic live action, cinematic sparks, handheld camera, dramatic blue-orange lighting, aggressive movement.\n\nWhat usually hurts results:\n- too many story beats in one prompt\n- long dialogue-heavy paragraphs\n- mixing many camera changes at once\n- asking for a very long scene in one shot`}
                  />

                  <FaqItem
                    title="Why Pro exists"
                    body={`Spider AI Pro exists to protect heavier AI features and keep the free chat experience lighter.\n\nWhy it exists:\n- to reduce spam on expensive generation features\n- to separate heavier requests from casual chat use\n- to keep free chat open without forcing every user into sign-in first\n\nSo Pro is part of the app's access and protection model, not just a visual badge.`}
                  />

                  <FaqItem
                    title="Troubleshooting failed generations"
                    body={`If image or video generation fails, these are the most likely reasons in the current app:\n\nVideo issues\n- video system not ready\n- backend disconnected\n- missing model files or redownload in progress\n- long jobs still queued behind another active job\n\nImage issues\n- model fallback path unavailable\n- temporary backend issue\n- prompt or image-edit model unavailable\n\nQuick things to try:\n- retry with a shorter prompt\n- switch to Fast first to test the pipeline\n- refresh and submit again after the backend reconnects\n- check if the video system says connected\n- sign in again if a gated tool stops unexpectedly\n\nIf a job reaches completed status but media does not open, it is usually a returned file path or preview issue rather than the whole generation failing.`}
                  />
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    );
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // JSX
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const rootShellClass = isIPhone
    ? 'iphone-shell'
    : isAndroid
      ? 'android-shell'
      : 'h-screen';
  const platformMainClass = isIPhone ? 'iphone-main' : isAndroid ? 'android-main' : '';
  const platformHeaderClass = isIPhone ? 'iphone-mobile-header' : isAndroid ? 'android-mobile-header' : '';
  const platformInputClass = isIPhone ? 'iphone-input-bar' : isAndroid ? 'android-input-bar' : '';
  const platformSidebarClass = isIPhone ? 'iphone-sidebar' : isAndroid ? 'android-sidebar' : '';
  const platformScrollClass = isIPhone ? 'iphone-scroll-lock' : isAndroid ? 'android-scroll-lock' : '';
  const starterGridClass = 'grid grid-cols-2 gap-2 md:grid-cols-2 xl:grid-cols-3 md:gap-3 text-left';
const starterCardClass = 'px-3 py-3 md:px-5 md:py-5 min-h-[148px] sm:min-h-[160px] md:min-h-[184px]';
const starterTitleClass = 'text-[13px] md:text-[15px]';
const starterBadgeClass = 'text-[9px] md:text-[10px]';
const showStarterPromptText = true;

  return (
    <div className={`flex w-full bg-[#091E1E] text-white font-sans overflow-hidden ${rootShellClass}`}
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} ref={dropZoneRef}>
      <style>{GLOBAL_STYLES}</style>

      {/* DRAG OVERLAY */}
      {isDragging && (
        <div className="fixed inset-0 z-[80] bg-[#091E1E]/90 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="border-4 border-dashed border-[#00E5FF] rounded-3xl p-16 drag-active">
            <FileUp size={64} className="text-[#00E5FF] mx-auto mb-4" />
            <p className="text-2xl font-bold text-[#00E5FF] text-center">Drop files here</p>
          </div>
        </div>
      )}

      {/* TOAST MODAL */}
      {modalInfo && (
        <div className="fixed top-6 right-6 z-[100] bg-[#0B2A2A] border border-[#194A4A] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-4 max-w-sm animate-slide-up">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-bold text-[#00E5FF]">{modalInfo.title}</h4>
            <button onClick={() => setModalInfo(null)} className="text-[#529E98] hover:text-white"><X size={14} /></button>
          </div>
          <p className="text-xs text-gray-300">{modalInfo.text}</p>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0B2A2A] border border-red-500/30 rounded-2xl w-full max-w-sm shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-scale-in p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-red-400" /></div>
            <h3 className="text-lg font-bold text-white mb-2">
              {confirmDelete.type === 'all' ? 'Delete All Chats?' : confirmDelete.type === 'message' ? 'Delete Message?' : 'Delete Chat?'}
            </h3>
            <p className="text-sm text-[#529E98] mb-6">
              {confirmDelete.type === 'all'
                ? `This will permanently delete all ${chats.length} chats.`
                : confirmDelete.type === 'message'
                  ? 'This message will be permanently deleted.'
                  : 'This chat will be permanently deleted.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="sidebar-btn flex-1 px-4 py-2.5 bg-[#194A4A] text-white rounded-xl font-medium hover:bg-[#1A5A5A]">Cancel</button>
              <button onClick={() => {
                if (confirmDelete.type === 'all') handleDeleteAllChats();
                else if (confirmDelete.type === 'message') confirmDeleteMessage(confirmDelete.messageIndex);
                else handleDeleteChat(confirmDelete.chatId);
              }}
                className="sidebar-btn flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showLegalNotice && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-[#194A4A] bg-[#0B2A2A] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden max-h-[min(88vh,720px)] flex flex-col">
            <div className="border-b border-[#194A4A] bg-gradient-to-r from-[#102B2B] via-[#0B2A2A] to-[#102B2B] px-4 py-4 md:px-6 md:py-5 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#194A4A] bg-[#091E1E] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7CE7FF]">
                    Privacy / Terms / Licenses
                  </div>
                  <h3 className="text-lg font-bold text-white md:text-xl">Before you continue</h3>
                  <p className="mt-1 text-xs leading-6 text-[#7AB7B3] md:text-sm">
                    By continuing to use Spider AI, you acknowledge the current privacy notice, terms, and model/framework licensing summary available in Settings.
                  </p>
                </div>
                <button onClick={() => setShowLegalNotice(false)} className="sidebar-btn rounded-lg p-2 text-[#529E98] hover:bg-[#194040] hover:text-white">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto px-4 py-4 md:space-y-4 md:px-6 md:py-6">
              <div className="rounded-2xl border border-[#194040] bg-[#091E1E] p-4">
                <div className="text-sm font-semibold text-white mb-2">Privacy</div>
                <ul className="space-y-1 text-[11px] leading-5 text-[#7AB7B3] md:space-y-1.5 md:text-xs md:leading-6">
                  {LEGAL_SECTIONS.privacy.slice(0, 3).map((item) => <li key={item}>- {item}</li>)}
                </ul>
              </div>

              <div className="rounded-2xl border border-[#194040] bg-[#091E1E] p-4">
                <div className="text-sm font-semibold text-white mb-2">Terms</div>
                <ul className="space-y-1 text-[11px] leading-5 text-[#7AB7B3] md:space-y-1.5 md:text-xs md:leading-6">
                  {LEGAL_SECTIONS.terms.slice(0, 3).map((item) => <li key={item}>- {item}</li>)}
                </ul>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row pt-1">
                <button
                  onClick={() => {
                    window.location.href = LEGAL_PAGE_PATH;
                  }}
                  className="sidebar-btn flex-1 rounded-2xl border border-[#194A4A] bg-[#133838] px-4 py-3 text-sm font-semibold text-[#00E5FF] hover:bg-[#194A4A]"
                >
                  Open legal page
                </button>
                <button
                  onClick={acceptLegalNotice}
                  className="sidebar-btn flex-1 rounded-2xl bg-[#00E5FF] px-4 py-3 text-sm font-bold text-black hover:bg-[#00CCE6]"
                >
                  Accept and continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAuthGate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#194A4A] bg-[#0B2A2A] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="border-b border-[#194A4A] bg-gradient-to-r from-[#102B2B] via-[#0B2A2A] to-[#102B2B] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#194A4A] bg-[#091E1E] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7CE7FF]">
                    M4 Spider
                  </div>
                  <h3 className="text-xl font-bold text-white">Sign in to continue</h3>
                  <p className="mt-1 text-sm text-[#7AB7B3]">
                    {authIntent || 'Unlock image generation, editing, video, and Pro tools without blocking free chat.'}
                  </p>
                </div>
                <button onClick={() => setShowAuthGate(false)} className="sidebar-btn rounded-lg p-2 text-[#529E98] hover:bg-[#194040] hover:text-white">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={authBusy}
                className="sidebar-btn flex w-full items-center justify-center gap-3 rounded-2xl border border-[#194A4A] bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-[#EAFBFF] disabled:opacity-60"
              >
                {authBusy ? <Loader2 size={16} className="animate-spin" /> : <GoogleMark size={18} />}
                Continue with Google
              </button>

              <div className="flex items-center gap-3 text-xs text-[#529E98]">
                <div className="h-px flex-1 bg-[#194040]" />
                <span>M4 Spider login</span>
                <div className="h-px flex-1 bg-[#194040]" />
              </div>

              <div className="flex rounded-xl bg-[#091E1E] p-1">
                <button
                  onClick={() => { setAuthScreen('signin'); setAuthError(''); }}
                  className={`sidebar-btn flex-1 rounded-lg px-3 py-2 text-sm font-medium ${authScreen === 'signin' ? 'bg-[#00E5FF] text-black' : 'text-[#7AB7B3]'}`}
                >
                  Login
                </button>
                <button
                  onClick={() => { setAuthScreen('signup'); setAuthError(''); }}
                  className={`sidebar-btn flex-1 rounded-lg px-3 py-2 text-sm font-medium ${authScreen === 'signup' ? 'bg-[#00E5FF] text-black' : 'text-[#7AB7B3]'}`}
                >
                  Create account
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="you@m4spider.com"
                  className={`w-full rounded-2xl border border-[#194A4A] bg-[#091E1E] px-4 py-3 text-white outline-none focus:border-[#00E5FF] ${isIPhone ? 'iphone-nozoom' : ''}`}
                />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Password"
                  className={`w-full rounded-2xl border border-[#194A4A] bg-[#091E1E] px-4 py-3 text-white outline-none focus:border-[#00E5FF] ${isIPhone ? 'iphone-nozoom' : ''}`}
                />
              </div>

              {authError && (
                <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {authError}
                </div>
              )}

              <button
                onClick={handleEmailAuth}
                disabled={authBusy}
                className="sidebar-btn flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00E5FF] px-4 py-3 text-sm font-bold text-black hover:bg-[#00CCE6] disabled:opacity-60"
              >
                {authBusy ? <Loader2 size={16} className="animate-spin" /> : null}
                {authScreen === 'signup' ? 'Create M4 Spider account' : 'Continue with M4 Spider'}
              </button>

              <p className="text-center text-xs leading-relaxed text-[#529E98]">
                Free chat stays open. Login is only required for image generation, image editing, video creation, and Spider AI Pro.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CHAT CONTEXT MENU */}
      {chatContextMenu && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setChatContextMenu(null)} />
          <div className="fixed z-[65] bg-[#0B2A2A] border border-[#194A4A] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden animate-scale-in py-1 w-48"
            style={{ top: Math.min(chatContextMenu.y, window.innerHeight - 250), left: Math.min(chatContextMenu.x, window.innerWidth - 200) }}>
            <button onClick={() => handlePinChat(chatContextMenu.chatId)} className="sidebar-bottom-btn w-full"><Pin size={14} className={pinnedChats.includes(chatContextMenu.chatId) ? 'text-[#FFD700]' : ''} /> {pinnedChats.includes(chatContextMenu.chatId) ? 'Unpin' : 'Pin'}</button>
            <button onClick={() => handleRenameChat(chatContextMenu.chatId)} className="sidebar-bottom-btn w-full"><Edit3 size={14} /> Rename</button>
            <button onClick={() => handleExportChat(chatContextMenu.chatId)} className="sidebar-bottom-btn w-full"><Download size={14} /> Export</button>
            <div className="h-px bg-[#194040] mx-2 my-1" />
            <button onClick={() => { setConfirmDelete({ type: 'single', chatId: chatContextMenu.chatId }); setChatContextMenu(null); }} className="sidebar-bottom-btn w-full text-red-400"><Trash2 size={14} /> Delete</button>
          </div>
        </>
      )}

      {/* SETTINGS */}
      {renderSettings()}

      {/* LENS MODAL */}
      {showLensModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0B2A2A] border border-[#194A4A] rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#194A4A] bg-[#102B2B]">
              <div className="flex items-center gap-2 text-[#00E5FF]"><Camera size={18} /><span className="font-semibold text-sm">Spider Lens</span></div>
              <button onClick={closeLens} className="sidebar-btn text-red-400 hover:text-red-300 p-1.5 rounded-lg"><X size={18} /></button>
            </div>
            <div className="relative bg-black aspect-video w-full overflow-hidden">
              {!lensCapturedImage ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute inset-0 pointer-events-none"><div className="lens-scan-line absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent opacity-60" /></div>
                </>
              ) : <img src={lensCapturedImage} alt="Captured" className="w-full h-full object-cover" />}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="px-5 py-4 flex items-center justify-center gap-4 bg-[#102B2B]">
              {!lensCapturedImage ? (
                <button onClick={captureLensPhoto} className="sidebar-btn w-16 h-16 rounded-full bg-[#00E5FF] hover:bg-[#00CCE6] flex items-center justify-center"><div className="w-12 h-12 rounded-full border-4 border-black/30" /></button>
              ) : (
                <>
                  <button onClick={retakeLensPhoto} className="sidebar-btn flex items-center gap-2 px-5 py-2.5 bg-[#133838] border border-[#194A4A] rounded-xl text-[#00E5FF] text-sm font-medium"><RotateCcw size={16} /> Retake</button>
                  <button onClick={useLensCapturedImage} className="sidebar-btn flex items-center gap-2 px-5 py-2.5 bg-[#00E5FF] rounded-xl text-black text-sm font-bold"><Eye size={16} /> Analyze</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FILE PREVIEW */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 md:p-6">
          <div className="bg-[#0B2A2A] border border-[#194A4A] rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-[#194A4A] bg-[#102B2B] rounded-t-2xl">
              <h3 className="font-semibold text-[#00E5FF] flex items-center gap-2 truncate text-sm"><FileUp size={18} /> {previewFile.name}</h3>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => downloadFile(previewFile.name, previewFile.content)} className="sidebar-btn flex items-center gap-2 text-sm bg-[#194A4A] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-black px-3 py-2 rounded-lg"><Download size={16} /></button>
                <button onClick={() => copyToClipboard(previewFile.content)} className="sidebar-btn flex items-center gap-2 text-sm bg-[#194A4A] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-black px-3 py-2 rounded-lg"><Copy size={16} /></button>
                <button onClick={() => setPreviewFile(null)} className="sidebar-btn text-red-400 hover:text-red-300 p-2 rounded-lg"><X size={20} /></button>
              </div>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto flex-1 font-mono text-sm text-gray-200 whitespace-pre-wrap bg-[#081717] rounded-b-2xl custom-scrollbar break-words">{previewFile.content}</div>
          </div>
        </div>
      )}

      {/* GLOBAL PLUS MENU */}
      {isPlusMenuOpen && (
        <>
          <div className="fixed inset-0 z-[70] bg-black/35 backdrop-blur-[2px]" onClick={() => setIsPlusMenuOpen(false)} />
          {isMobile ? (
            <div className={`fixed left-3 right-3 z-[75] rounded-2xl border border-[#194040] bg-[#0B2A2A] shadow-[0_18px_60px_rgba(0,0,0,0.55)] py-2 animate-slide-up ${isIPhone ? 'bottom-[calc(84px+env(safe-area-inset-bottom))]' : isAndroid ? 'bottom-[86px]' : 'bottom-[84px]'}`}>
              <button onClick={() => {
                if (selectedAIMode === 'pro') {
                  setSelectedAIMode('chat');
                  setIsPlusMenuOpen(false);
                  return;
                }
                if (!ensureModeAccess('pro', null, 'Use Spider AI Pro')) return;
                setSelectedAIMode('pro');
                setForceMode(null);
                setIsPlusMenuOpen(false);
              }} className={`sidebar-nav-btn px-4 py-3 text-sm ${selectedAIMode === 'pro' ? 'text-[#FFD700]' : 'text-[#00E5FF]'}`}>
                <Zap size={16} className={selectedAIMode === 'pro' ? 'fill-[#FFD700] text-[#FFD700]' : 'fill-[#00E5FF]'} /> {selectedAIMode === 'pro' ? 'Pro Mode ON' : 'Spider AI Pro'}
              </button>
              <button onClick={() => { setSelectedAIMode('chat'); setForceMode(null); setIsPlusMenuOpen(false); }} className="sidebar-nav-btn px-4 py-3 text-sm"><MessageCircle size={16} className="text-[#529E98]" /> Chat Mode</button>
              <button onClick={() => { setSelectedAIMode('reasoning'); setIsPlusMenuOpen(false); }} className={`sidebar-nav-btn px-4 py-3 text-sm ${selectedAIMode === 'reasoning' ? 'text-[#00E5FF]' : ''}`}><Brain size={16} className="text-[#529E98]" /> {selectedAIMode === 'reasoning' ? 'Active: ' : ''}Reasoning</button>
              <div className="h-px bg-[#194040] my-1 mx-2" />
              <button onClick={() => {
                if (forceMode === 'image_gen') {
                  setForceMode(null);
                  setIsPlusMenuOpen(false);
                  return;
                }
                if (!ensureModeAccess(selectedAIMode, 'image_gen', 'Create images')) return;
                setForceMode('image_gen');
                setIsPlusMenuOpen(false);
              }} className={`sidebar-nav-btn px-4 py-3 text-sm ${forceMode === 'image_gen' ? 'text-[#FFD700]' : ''}`}><Wand2 size={16} className="text-[#529E98]" /> {forceMode === 'image_gen' ? 'Active: ' : ''}Create Image</button>
              <button onClick={() => {
                if (forceMode === 'image_edit') {
                  setForceMode(null);
                  setIsPlusMenuOpen(false);
                  return;
                }
                if (!ensureModeAccess(selectedAIMode, 'image_edit', 'Edit images')) return;
                setForceMode('image_edit');
                setIsPlusMenuOpen(false);
              }} className={`sidebar-nav-btn px-4 py-3 text-sm ${forceMode === 'image_edit' ? 'text-[#FF6B6B]' : ''}`}><ImageIcon size={16} className="text-[#529E98]" /> {forceMode === 'image_edit' ? 'Active: ' : ''}Edit Image</button>
              <button onClick={() => {
                if (forceMode === 'video_gen') {
                  setForceMode(null);
                  setIsPlusMenuOpen(false);
                  return;
                }
                if (!ensureModeAccess(selectedAIMode, 'video_gen', 'Create videos')) return;
                setForceMode('video_gen');
                setIsPlusMenuOpen(false);
              }} className={`sidebar-nav-btn px-4 py-3 text-sm ${forceMode === 'video_gen' ? 'text-[#7CE7FF]' : ''}`}><Film size={16} className="text-[#529E98]" /> {forceMode === 'video_gen' ? 'Active: ' : ''}Create Video</button>
              <div className="h-px bg-[#194040] my-1 mx-2" />
              <button onClick={() => { multiInputRef.current?.click(); setIsPlusMenuOpen(false); }} className="sidebar-nav-btn px-4 py-3 text-sm"><Paperclip size={16} className="text-[#529E98]" /> Upload Files</button>
              <button onClick={() => { folderInputRef.current?.click(); setIsPlusMenuOpen(false); }} className="sidebar-nav-btn px-4 py-3 text-sm"><FolderUp size={16} className="text-[#529E98]" /> Upload Folder</button>
            </div>
          ) : (
            <div className="fixed bottom-[96px] right-[max(24px,calc((100vw-1024px)/2+24px))] z-[75] w-60 rounded-xl border border-[#194040] bg-[#0B2A2A] shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-2 animate-slide-up">
              <button onClick={() => {
                if (selectedAIMode === 'pro') {
                  setSelectedAIMode('chat');
                  setIsPlusMenuOpen(false);
                  return;
                }
                if (!ensureModeAccess('pro', null, 'Use Spider AI Pro')) return;
                setSelectedAIMode('pro');
                setForceMode(null);
                setIsPlusMenuOpen(false);
              }} className={`sidebar-nav-btn px-4 py-2.5 text-sm ${selectedAIMode === 'pro' ? 'text-[#FFD700]' : 'text-[#00E5FF]'}`}>
                <Zap size={16} className={selectedAIMode === 'pro' ? 'fill-[#FFD700] text-[#FFD700]' : 'fill-[#00E5FF]'} /> {selectedAIMode === 'pro' ? 'Pro Mode ON' : 'Spider AI Pro'}
              </button>
              <button onClick={() => { setSelectedAIMode('chat'); setForceMode(null); setIsPlusMenuOpen(false); }} className="sidebar-nav-btn px-4 py-2.5 text-sm"><MessageCircle size={16} className="text-[#529E98]" /> Chat Mode</button>
              <button onClick={() => { setSelectedAIMode('reasoning'); setIsPlusMenuOpen(false); }} className={`sidebar-nav-btn px-4 py-2.5 text-sm ${selectedAIMode === 'reasoning' ? 'text-[#00E5FF]' : ''}`}><Brain size={16} className="text-[#529E98]" /> {selectedAIMode === 'reasoning' ? 'Active: ' : ''}Reasoning</button>
              <div className="h-px bg-[#194040] my-1 mx-2" />
              <button onClick={() => {
                if (forceMode === 'image_gen') {
                  setForceMode(null);
                  setIsPlusMenuOpen(false);
                  return;
                }
                if (!ensureModeAccess(selectedAIMode, 'image_gen', 'Create images')) return;
                setForceMode('image_gen');
                setIsPlusMenuOpen(false);
              }} className={`sidebar-nav-btn px-4 py-2.5 text-sm ${forceMode === 'image_gen' ? 'text-[#FFD700]' : ''}`}><Wand2 size={16} className="text-[#529E98]" /> {forceMode === 'image_gen' ? 'Active: ' : ''}Create Image</button>
              <button onClick={() => {
                if (forceMode === 'image_edit') {
                  setForceMode(null);
                  setIsPlusMenuOpen(false);
                  return;
                }
                if (!ensureModeAccess(selectedAIMode, 'image_edit', 'Edit images')) return;
                setForceMode('image_edit');
                setIsPlusMenuOpen(false);
              }} className={`sidebar-nav-btn px-4 py-2.5 text-sm ${forceMode === 'image_edit' ? 'text-[#FF6B6B]' : ''}`}><ImageIcon size={16} className="text-[#529E98]" /> {forceMode === 'image_edit' ? 'Active: ' : ''}Edit Image</button>
              <button onClick={() => {
                if (forceMode === 'video_gen') {
                  setForceMode(null);
                  setIsPlusMenuOpen(false);
                  return;
                }
                if (!ensureModeAccess(selectedAIMode, 'video_gen', 'Create videos')) return;
                setForceMode('video_gen');
                setIsPlusMenuOpen(false);
              }} className={`sidebar-nav-btn px-4 py-2.5 text-sm ${forceMode === 'video_gen' ? 'text-[#7CE7FF]' : ''}`}><Film size={16} className="text-[#529E98]" /> {forceMode === 'video_gen' ? 'Active: ' : ''}Create Video</button>
              <div className="h-px bg-[#194040] my-1 mx-2" />
              <button onClick={() => { multiInputRef.current?.click(); setIsPlusMenuOpen(false); }} className="sidebar-nav-btn px-4 py-2.5 text-sm"><Paperclip size={16} className="text-[#529E98]" /> Upload Files</button>
              <button onClick={() => { folderInputRef.current?.click(); setIsPlusMenuOpen(false); }} className="sidebar-nav-btn px-4 py-2.5 text-sm"><FolderUp size={16} className="text-[#529E98]" /> Upload Folder</button>
            </div>
          )}
        </>
      )}

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobileSidebarOpen && <div className="mobile-sidebar-overlay" onClick={() => setIsMobileSidebarOpen(false)} />}

      {/* MOBILE SIDEBAR */}
      <div className={`mobile-sidebar-container fixed inset-y-0 left-0 z-50 w-[280px] mobile-sidebar ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${platformSidebarClass}`}>
        <div className="h-full bg-[#102B2B] flex flex-col border-r border-[#194040] shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
          {renderSidebarContent(handleChatSelectMobile, () => setIsMobileSidebarOpen(false))}
        </div>
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className="desktop-sidebar w-[260px] shrink-0 bg-[#0F2424] flex flex-col border-r border-[#194040]">
        {renderSidebarContent(handleChatSelect)}
      </div>

      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col h-full relative min-w-0 bg-[#091E1E] ${platformMainClass}`}>

        {/* MOBILE HEADER */}
        <div className={`mobile-header hidden flex-none items-center justify-between px-4 py-3 bg-[#102B2B] border-b border-[#194040] z-30 ${platformHeaderClass}`}>
          <button onClick={() => setIsMobileSidebarOpen(true)} className="sidebar-btn p-2 text-[#529E98] hover:text-[#00E5FF] rounded-lg hover:bg-[#194040]"><Menu size={22} /></button>
          <div className="flex items-center gap-2">
            <span className="text-[#00E5FF] font-bold text-base">Spider AI</span>
            {selectedAIMode === 'pro' && <span className="pro-badge text-xs font-extrabold">PRO</span>}
          </div>
          <button onClick={handleNewChat} className="sidebar-btn p-2 text-[#529E98] hover:text-[#00E5FF] rounded-lg hover:bg-[#194040]"><Plus size={22} /></button>
        </div>

        {selectedAIMode === 'pro' && (
          <div className="flex-none bg-gradient-to-r from-[#FFD700]/10 via-[#00E5FF]/10 to-[#FF6B6B]/10 border-b border-[#FFD700]/20 px-6 py-2 flex items-center justify-center gap-2">
            <Zap size={14} className="fill-[#FFD700] text-[#FFD700]" />
            <span className="text-xs font-bold pro-badge">SPIDER AI PRO</span>
          </div>
        )}

        {/* MESSAGES */}
        <div className={`flex-1 overflow-y-auto scroll-smooth w-full custom-scrollbar allow-select relative ${platformScrollClass}`} onClick={() => { if (chatContextMenu) setChatContextMenu(null); if (openMessageMenuIndex !== null) setOpenMessageMenuIndex(null); }}>
          <div className={`w-full max-w-4xl mx-auto px-4 md:px-6 pt-6 md:pt-10 pb-6 flex flex-col ${settings.compactMode ? 'gap-2 md:gap-3' : 'gap-4 md:gap-6'}`}>

            {chatRestoreReady && chatHistory.length === 0 && !streamingMessage && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00E5FF]/20 to-[#194A4A]/20 flex items-center justify-center mb-4 border border-[#194A4A]">
                  <Sparkles size={28} className="text-[#00E5FF]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">What can I help with?</h2>
                <p className="text-sm text-[#529E98] max-w-md">Start typing, paste images with Ctrl+V, drag & drop files, or use the + menu for more tools.</p>
                <div className="w-full max-w-xl md:max-w-3xl mt-8">
                  <div className="flex items-center justify-between gap-3 mb-3 px-1">
                    <span className="text-xs md:text-sm font-semibold uppercase tracking-[0.24em] text-[#7CE7FF]">Try a starter</span>
                    <span className="text-[11px] md:text-xs text-[#529E98]">Tap once to auto-fill</span>
                  </div>
                  <div className={starterGridClass}>
                    {STARTER_TEMPLATES.map((template, templateIndex) => (
                      <button
                        key={template.title}
                        onClick={() => applyStarterTemplate(template)}
                        className={`group relative overflow-hidden rounded-2xl border ${template.border} bg-gradient-to-br ${template.accent} ${starterCardClass} shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-[#00E5FF]/40 hover:shadow-[0_14px_36px_rgba(0,229,255,0.12)] animate-[pulse_4.2s_ease-in-out_infinite] h-full w-full min-w-0`}
                        style={{ animationDelay: `${templateIndex * 0.45}s` }}
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_45%)] opacity-70" />
                        <div className="relative flex h-full flex-col gap-2 md:gap-3">
                          <div className="flex flex-col items-start gap-1.5 md:gap-2">
                            <span className={`${starterTitleClass} font-semibold text-white break-words max-w-full leading-snug`}>
                              {template.title}
                            </span>
                            <span className={`max-w-full rounded-full border border-white/10 bg-white/5 px-2 py-0.5 uppercase tracking-[0.14em] text-[#B5F8FF] whitespace-normal break-words ${starterBadgeClass}`}>
                              Prompt
                            </span>
                          </div>
                          <p className={`${showStarterPromptText ? 'block' : 'hidden'} text-[11px] sm:text-[11.5px] md:text-sm leading-relaxed text-[#CDEEEE] flex-1 break-words overflow-hidden line-clamp-4 sm:line-clamp-5`}>
                            {template.prompt}
                          </p>
                          <span className="text-[10px] md:text-[11px] font-medium text-[#9EF5FF] group-hover:text-white transition-colors mt-auto">
                            Tap to insert
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!chatRestoreReady && !streamingMessage && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-full border border-[#194A4A] bg-[#102B2B] flex items-center justify-center mb-4">
                  <Loader2 size={24} className="animate-spin text-[#00E5FF]" />
                </div>
                <p className="text-sm text-[#529E98]">Restoring your chats...</p>
              </div>
            )}

            {chatHistory.map((msg, index) => {
              const isUser = msg.role === 'user';
              const hasContent = msg.content?.trim().length > 0;
              const isImage = msg.type === 'image' && msg.base64_image;
              const isVideoJob = msg.type === 'video_job' && msg.videoJob;
              const isError = msg.isError;
              const isEditing = editingMessageIndex === index;
              const videoJob = isVideoJob ? (videoJobs[msg.videoJobId] || msg.videoJob) : null;
              const videoSrc = isVideoJob ? getVideoSrc(videoJob) : '';
              const videoSources = isVideoJob ? getVideoSources(videoJob) : [];

              return (
                <div key={index} className={`flex flex-col max-w-[95%] md:max-w-[85%] min-w-0 ${isUser ? 'self-end items-end' : 'self-start items-start'}`}>
                  {isUser && (msg.images || msg.files) && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {msg.images?.map((img, i) => <img key={i} src={img.preview} alt={img.name} className="max-w-[80px] md:max-w-[100px] rounded-lg border border-[#194A4A]" />)}
                      {msg.files?.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 bg-[#091E1E] border border-[#194A4A] px-3 py-2 rounded-lg">
                          <FileUp size={14} className="text-[#529E98]" /><span className="text-xs text-gray-300 truncate max-w-[120px]">{f.name}</span><span className="text-[10px] text-[#529E98]">{formatFileSize(f.size)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {settings.showTimestamps && msg.ts && (
                    <div className={`text-[10px] text-[#529E98] mb-1 ${isUser ? 'mr-1' : 'ml-1'}`}>
                      {formatTimestamp(msg.ts)}{msg.edited && <span className="ml-1 text-[#FFD700]">(edited)</span>}
                    </div>
                  )}

                  {hasContent && (
                    <div className="relative group">
                      {isEditing ? (
                        <div className="bg-[#133838] border-2 border-[#00E5FF] rounded-2xl p-3 min-w-[250px]">
                          <textarea ref={editTextareaRef} value={editingMessageContent} onChange={(e) => setEditingMessageContent(e.target.value)}
                            className={`w-full bg-transparent text-white outline-none resize-none min-h-[60px] ${composerFontSizeClass} ${isIPhone ? 'iphone-nozoom' : ''}`} rows={3} />
                          <div className="flex justify-end gap-2 mt-2">
                            <button onClick={handleCancelEdit} className="sidebar-btn px-3 py-1.5 text-xs text-[#529E98] hover:text-white bg-[#194A4A] rounded-lg">Cancel</button>
                            <button onClick={() => handleSaveEdit(index)} className="sidebar-btn px-3 py-1.5 text-xs text-black bg-[#00E5FF] rounded-lg font-bold hover:bg-[#00CCE6] flex items-center gap-1"><Check size={12} /> Save & Send</button>
                          </div>
                        </div>
                      ) : (
                        <div className={`px-4 md:px-5 py-3 md:py-3.5 rounded-2xl ${fontSizeClass} leading-relaxed shadow-sm min-w-0 max-w-full ${
                          isUser ? 'bg-[#133838] text-white border border-[#194A4A] rounded-br-sm'
                            : isError ? 'bg-[#2A1010] text-red-300 border border-red-500/30 rounded-bl-sm'
                              : 'bg-[#0B2A2A] text-gray-200 border border-[#173A3A] rounded-bl-sm'
                        }`}>
                          <div className="w-full overflow-hidden flex flex-col gap-3 min-w-0 max-w-full break-words">{renderMessage(msg.content, index)}</div>
                          {msg.isPartial && <div className="mt-2 text-[11px] text-yellow-500/70 italic">Response interrupted</div>}

                          <div className={`relative mt-1.5 ${isUser ? 'text-right' : 'text-left'}`}>
                            {isMobile ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMessageMenuIndex(prev => prev === index ? null : index);
                                  }}
                                  className="sidebar-btn rounded-md px-2 py-1 text-[#529E98] hover:bg-[#194A4A]/50 hover:text-white"
                                >
                                  <MoreHorizontal size={14} />
                                </button>
                                {openMessageMenuIndex === index && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className={`absolute z-20 mt-2 flex min-w-[150px] flex-col rounded-xl border border-[#194A4A] bg-[#0B2A2A] p-1 shadow-[0_10px_30px_rgba(0,0,0,0.45)] ${isUser ? 'right-0' : 'left-0'}`}
                                  >
                                    {isUser && (
                                      <>
                                        <button onClick={() => { handleEditMessage(index); setOpenMessageMenuIndex(null); }} className="sidebar-bottom-btn w-full"><Edit3 size={14} /> Edit</button>
                                        <button onClick={() => { setMessage(msg.content); setOpenMessageMenuIndex(null); }} className="sidebar-bottom-btn w-full"><RotateCcw size={14} /> Reuse</button>
                                      </>
                                    )}
                                    {!isUser && <button onClick={() => { handleRegenerateResponse(index); setOpenMessageMenuIndex(null); }} className="sidebar-bottom-btn w-full"><RefreshCw size={14} /> Regenerate</button>}
                                    {!isUser && renderFeedbackButtons(msg, index, true, true)}
                                    <button onClick={() => { copyToClipboard(msg.content); setOpenMessageMenuIndex(null); }} className="sidebar-bottom-btn w-full"><Copy size={14} /> Copy</button>
                                    <button onClick={() => handleDeleteMessage(index)} className="sidebar-bottom-btn w-full text-red-400 hover:text-red-300"><Trash2 size={14} /> Delete</button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className={`flex gap-1 transition-opacity opacity-0 group-hover:opacity-100 ${isUser ? 'justify-end' : 'justify-start'} flex-wrap`}>
                                {isUser && (
                                  <>
                                    <button onClick={() => handleEditMessage(index)} className="sidebar-btn flex items-center gap-1 text-[11px] text-[#529E98] hover:text-[#00E5FF] px-2 py-1 rounded-md hover:bg-[#194A4A]/50"><Edit3 size={11} /> Edit</button>
                                    <button onClick={() => setMessage(msg.content)} className="sidebar-btn flex items-center gap-1 text-[11px] text-[#529E98] hover:text-[#00E5FF] px-2 py-1 rounded-md hover:bg-[#194A4A]/50"><RotateCcw size={11} /> Reuse</button>
                                  </>
                                )}
                                {!isUser && <button onClick={() => handleRegenerateResponse(index)} className="sidebar-btn flex items-center gap-1 text-[11px] text-[#529E98] hover:text-[#00E5FF] px-2 py-1 rounded-md hover:bg-[#194A4A]/50"><RefreshCw size={11} /> Regenerate</button>}
                                {!isUser && renderFeedbackButtons(msg, index)}
                                <button onClick={() => copyToClipboard(msg.content)} className="sidebar-btn flex items-center gap-1 text-[11px] text-[#529E98] hover:text-[#00E5FF] px-2 py-1 rounded-md hover:bg-[#194A4A]/50"><Copy size={11} /> Copy</button>
                                <button onClick={() => handleDeleteMessage(index)} className="sidebar-btn flex items-center gap-1 text-[11px] text-[#529E98] hover:text-red-400 px-2 py-1 rounded-md hover:bg-red-500/10"><Trash2 size={11} /></button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {isImage && <img src={getImageSrc(msg.base64_image)} alt="Generated" className="max-w-full md:max-w-[400px] rounded-xl border border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.15)] mt-1" />}
                  {isVideoJob && (
                    <div className="mt-2 w-full min-w-[280px] max-w-[560px] rounded-2xl border border-[#194A4A] bg-[#081818] p-4 shadow-[0_0_20px_rgba(0,229,255,0.08)]">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="text-sm font-semibold text-white flex items-center gap-2">
                            <Film size={15} className="text-[#00E5FF]" />
                            Video Generation
                          </div>
                          <div className="text-xs text-[#529E98] mt-1">
                            {videoJob.aspect_ratio} | {formatVideoDurationLabel(videoJob.duration_seconds)} | {getVideoQualityLabel(videoJob)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {['queued', 'running', 'cancelling', 'interrupted'].includes(String(videoJob.status || '').toLowerCase()) && (
                            <button
                              onClick={() => stopVideoJob(videoJob.id)}
                              className="sidebar-btn inline-flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25"
                            >
                              <Square size={12} /> Stop
                            </button>
                          )}
                          <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            videoJob.status === 'completed' ? 'bg-emerald-500/15 text-emerald-300' :
                            videoJob.status === 'failed' ? 'bg-red-500/15 text-red-300' :
                            'bg-[#00E5FF]/10 text-[#7CE7FF]'
                          }`}>
                            {videoJob.status}
                          </div>
                        </div>
                      </div>
                      <div className="w-full h-3 rounded-full bg-[#0B1C1C] border border-[#184444] overflow-hidden mb-2 shadow-[inset_0_0_0_1px_rgba(0,229,255,0.08)]">
                        <div
                          className="h-full bg-gradient-to-r from-[#00E5FF] via-[#36F3FF] to-[#9BF8FF] transition-all duration-500 shadow-[0_0_14px_rgba(0,229,255,0.45)]"
                          style={{ width: `${Math.max(8, (videoJob.progress || 0) * 100)}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#529E98] mb-3">
                        <span>ETA: {formatEtaCompact(videoJob)}</span>
                        <span>Queue: {videoJob.queue_position || 0}</span>
                        <span>{Math.round((videoJob.progress || 0) * 100)}%</span>
                      </div>
                      <div className="text-sm text-gray-200 mb-3">{videoJob.message || 'Waiting for worker...'}</div>
                      {videoJob?.sourceImagePreview && (
                        <div className="mb-3 rounded-xl border border-[#194A4A] bg-[#0B1E1E] p-2">
                          <div className="text-[11px] font-semibold text-[#7CE7FF] mb-2">Image-to-video source</div>
                          <div className="flex items-center gap-3">
                            <img
                              src={videoJob.sourceImagePreview}
                              alt={videoJob.sourceImageName || 'Source image'}
                              className="h-16 w-16 rounded-lg object-cover border border-[#194A4A]"
                            />
                            <div className="min-w-0">
                              <div className="text-xs text-white truncate">{videoJob.sourceImageName || 'Uploaded image'}</div>
                              <div className="text-[11px] text-[#529E98]">Using uploaded image as video starting frame</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {videoSources.length > 0 && (
                        <div className="space-y-2">
                          {brokenVideoPreviews[videoJob.id] ? (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-3 text-xs text-red-300">
                              Video file is missing or was deleted. Preview disabled to keep the app stable.
                            </div>
                          ) : !openVideoPreviews[videoJob.id] ? (
                            <button
                              onClick={() => setOpenVideoPreviews(prev => ({ ...prev, [videoJob.id]: true }))}
                              className="sidebar-btn inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-[#133838] text-[#7CE7FF] border border-[#194A4A] hover:bg-[#194A4A]"
                            >
                              <Eye size={13} /> Load preview
                            </button>
                          ) : (
                            <div className="space-y-3">
                              {videoSources.map((src, clipIndex) => (
                                <div key={`${videoJob.id}-${clipIndex}`} className="space-y-2">
                                  {videoSources.length > 1 && (
                                    <div className="text-[11px] font-semibold text-[#7CE7FF]">Generated clip {clipIndex + 1}</div>
                                  )}
                                  <video
                                    controls
                                    preload="metadata"
                                    className="w-full rounded-xl border border-[#194A4A] bg-black"
                                    src={src}
                                    onError={() => {
                                      setBrokenVideoPreviews(prev => ({ ...prev, [videoJob.id]: true }));
                                      setOpenVideoPreviews(prev => ({ ...prev, [videoJob.id]: false }));
                                    }}
                                  />
                                  <a href={src} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs text-[#00E5FF] hover:text-white">
                                    <Download size={13} /> Open clip {clipIndex + 1}
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {videoJob.error && <div className="text-xs text-red-300 mt-2">{videoJob.error}</div>}
                    </div>
                  )}
                  {msg.files?.length > 0 && !isUser && (
                    <div className="mt-2 w-full">
                      <div className="text-xs text-[#00E5FF] font-semibold mb-1 flex items-center gap-1"><Code size={12} /> Generated {msg.files.length} file(s)</div>
                      <div className="flex flex-wrap gap-1">
                        {msg.files.map((f, fi) => <button key={fi} onClick={() => setPreviewFile({ name: f.name, content: f.content })} className="sidebar-btn text-[10px] bg-[#133838] border border-[#194A4A] px-2 py-1 rounded text-gray-300 hover:text-[#00E5FF]">{f.name}</button>)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {streamingMessage && (
              <div className="flex flex-col max-w-[95%] md:max-w-[85%] min-w-0 self-start items-start">
                <div className={`px-4 md:px-5 py-3 md:py-3.5 rounded-2xl ${fontSizeClass} leading-relaxed shadow-sm min-w-0 max-w-full bg-[#0B2A2A] text-gray-200 border border-[#173A3A] rounded-bl-sm`}>
                  {streamingMessage.isThinking && !streamedContent ? (
                    <div className="flex items-center gap-3 thinking-pulse"><Loader2 size={16} className="animate-spin text-[#00E5FF]" /><span className="text-sm text-[#529E98]">Thinking...</span></div>
                  ) : (
                    <div className="w-full overflow-hidden flex flex-col gap-3 min-w-0 max-w-full break-words streaming-cursor">{renderMessage(streamingMessage.content || '')}</div>
                  )}
                </div>
              </div>
            )}

            {isLoading && !streamingMessage && (
              <div className="bg-[#0B2A2A] text-[#529E98] px-5 py-4 rounded-2xl border border-[#173A3A] self-start rounded-bl-sm flex items-center gap-3">
                <Loader2 size={18} className="animate-spin text-[#00E5FF]" /><span className="text-sm font-medium">Processing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT SECTION */}
        <div className={`flex-none w-full bg-[#091E1E] p-3 md:p-6 pb-4 md:pb-8 border-t border-[#194040] z-20 relative ${platformInputClass}`}>
          <div className="max-w-4xl mx-auto flex flex-col gap-2 relative w-full min-w-0">

            {uploadProgress && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#133838] border border-[#194A4A] rounded-lg text-xs text-[#00E5FF]"><Loader2 size={14} className="animate-spin" /> {uploadProgress}</div>
            )}

            <div className={`composer-control-strip flex items-center gap-2 text-xs md:text-sm font-semibold mb-1 ml-1 nav-item shrink-0 ${modeInfo.color}`}>
              {modeInfo.icon}
              {modeInfo.isPro ? <span className="pro-badge">{modeInfo.text}</span> : modeInfo.text}
              {isListening && <span className="flex items-center gap-1 text-red-400 text-xs ml-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />Listening...</span>}
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileInputChange} className="hidden" />
            <input type="file" accept="image/*" ref={imageInputRef} onChange={handleFileInputChange} className="hidden" multiple />
            <input type="file" ref={folderInputRef} onChange={handleFolderInputChange} className="hidden" webkitdirectory="" multiple />
            <input type="file" ref={multiInputRef} onChange={handleFileInputChange} className="hidden" multiple accept="*/*" />

            <div className="flex flex-col gap-2 w-full relative z-20 min-w-0">
              {forceMode === 'video_gen' && (
                <div className="composer-control-strip flex flex-wrap items-center gap-2 rounded-xl border border-[#194A4A] bg-[#0E2424] px-3 py-2 text-xs text-[#529E98]">
                  <span className="text-[#7CE7FF] font-semibold">Veo-style video</span>
                  {selectedAIMode === 'pro' && videoQuality !== 'free' ? (
                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="bg-[#133838] text-white rounded-lg px-2 py-1 outline-none border border-[#194A4A]">
                      {VIDEO_ASPECT_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : (
                    <span className="bg-[#133838] text-white rounded-lg px-2 py-1 border border-[#194A4A]">480p</span>
                  )}
                  <select value={videoDuration} onChange={(e) => setVideoDuration(Number(e.target.value))} className="bg-[#133838] text-white rounded-lg px-2 py-1 outline-none border border-[#194A4A]">
                    {visibleVideoDurations.map(option => <option key={option} value={option}>{formatVideoDurationLabel(option)}</option>)}
                  </select>
                  <select value={videoQuality} onChange={(e) => setVideoQuality(e.target.value)} className="bg-[#133838] text-white rounded-lg px-2 py-1 outline-none border border-[#194A4A]">
                    {visibleVideoQualityOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <span className={`ml-auto text-[11px] ${videoBackendHealth?.runner_configured || videoBackendHealth?.runner_url_configured ? 'text-emerald-300' : 'text-yellow-300'}`}>
                    {videoBackendHealth?.runner_configured || videoBackendHealth?.runner_url_configured
                      ? 'Video system connected'
                      : 'Video system not connected yet'}
                  </span>
                  {uploadedImages.length > 0 && (
                    <div className="flex w-full items-center gap-3 rounded-xl border border-[#194A4A] bg-[#0B1C1C] px-2.5 py-2">
                      <img
                        src={uploadedImages[0].preview}
                        alt={uploadedImages[0].name}
                        className="h-12 w-12 rounded-lg object-cover border border-[#194A4A]"
                      />
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-[#7CE7FF]">Image-to-video source ready</div>
                        <div className="text-[11px] text-[#529E98] truncate">
                          {uploadedImages[0].name}{uploadedImages.length > 1 ? ` + ${uploadedImages.length - 1} more image(s)` : ''}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {hasUploads && (
                <div className="flex flex-col gap-2 self-start ml-2 mb-1">
                  {uploadedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-end">
                      {uploadedImages.map((img, i) => (
                        <div key={i} className="relative group">
                          <img src={img.preview} alt={img.name} className="h-14 w-14 object-cover rounded-lg border-2 border-[#194A4A]" />
                          <button onClick={() => removeUploadedImage(i)} className="sidebar-btn absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600 shadow-md"><X size={10} strokeWidth={3} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {uploadedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {uploadedFiles.map((f, i) => (
                        <div key={i} className="relative group flex items-center gap-1.5 bg-[#133838] px-2.5 py-1.5 rounded-lg border border-[#194A4A]">
                          <FileText size={12} className="text-[#529E98] shrink-0" />
                          <button onClick={() => setPreviewFile(f)} className="text-[11px] text-gray-200 hover:text-[#00E5FF] truncate max-w-[120px]">{f.name}</button>
                          <button onClick={() => removeUploadedFile(i)} className="sidebar-btn text-red-400 hover:text-red-300 ml-0.5 opacity-60 group-hover:opacity-100"><X size={10} strokeWidth={3} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {totalUploads > 2 && <button onClick={clearAllUploads} className="sidebar-btn self-start text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-red-500/10"><X size={10} /> Clear all ({totalUploads})</button>}
                </div>
              )}

              <div className="flex items-end gap-1.5 md:gap-2.5 w-full min-w-0">
                <div className={inputWrapperClass}>
                  <textarea ref={textareaRef} value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown}
                    disabled={isStreaming || isLoading} rows={1}
                    className={`auto-expand bg-transparent w-full outline-none text-white placeholder-[#529E98] min-w-0 disabled:opacity-50 py-0.5 ${composerFontSizeClass} ${isIPhone ? 'iphone-nozoom' : ''}`}
                    placeholder={placeholderText} />
                  <button onClick={openLens} className="sidebar-btn text-[#529E98] hover:text-[#00E5FF] ml-1 md:ml-2 shrink-0 mb-0.5"><Camera size={16} /></button>
                  <button onClick={() => multiInputRef.current?.click()} className="sidebar-btn text-[#529E98] hover:text-[#00E5FF] ml-1 shrink-0 mb-0.5"><Paperclip size={16} /></button>
                </div>

                <button onClick={handleMicToggle}
                  className={`sidebar-btn w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white mic-active hover:bg-red-600' : 'bg-[#133838] text-[#529E98] hover:text-[#00E5FF] hover:bg-[#194A4A]'}`}>
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <button onClick={() => setIsPlusMenuOpen(p => !p)}
                  className={`sidebar-btn w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-all relative z-30 ${isPlusMenuOpen ? 'bg-[#194A4A] text-[#00E5FF]' : 'bg-[#133838] text-[#529E98] hover:text-[#00E5FF] hover:bg-[#194A4A]'}`}>
                  <Plus size={20} className={`transition-transform duration-300 ${isPlusMenuOpen ? 'rotate-45 scale-110' : ''}`} />
                </button>

                {isStreaming ? (
                  <button onClick={handleStopGeneration} className="sidebar-btn bg-red-500 w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:bg-red-600">
                    <Square size={16} fill="white" />
                  </button>
                ) : (
                  <button onClick={handleSendMessage} disabled={!canSend}
                    className={`sidebar-btn w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                      selectedAIMode === 'pro' ? 'bg-[#FFD700] hover:bg-[#E6C200]' : 'bg-[#00E5FF] hover:bg-[#00CCE6]'
                    }`}>
                    {isLoading ? <Loader2 size={18} className="animate-spin text-black" /> : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 22h16" /><path d="M12 2v20" /><path d="M12 2l-8 14h16z" className="fill-black" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
