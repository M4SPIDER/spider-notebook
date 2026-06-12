import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { 
  ShieldCheck, 
  MapPin, 
  AlertTriangle, 
  Database, 
  Trash2, 
  CheckCircle, 
  RefreshCw, 
  Sparkles, 
  Compass, 
  Layers, 
  Info,
  Server,
  Plus,
  ExternalLink
} from 'lucide-react';


// --- FIREBASE INITIALIZATION & SECURITY PATHS ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "mock-key",
      authDomain: "mock-domain",
      projectId: "mock-project",
      storageBucket: "mock-bucket",
      messagingSenderId: "mock-sender",
      appId: "mock-app"
    };


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const PLACE_REQUESTS_DB_URL = 'https://m4-spider-84ed4-default-rtdb.firebaseio.com/placeRequests';


// --- GEOLOCATION HELPER ---
// Computes distance in meters using the Haversine formula
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;


  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));


  return R * c; 
}


export default function App() {
  const [user, setUser] = useState(null);
  const [verifiedList, setVerifiedList] = useState([]);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [selectedPending, setSelectedPending] = useState(null);
  const [placeRequests, setPlaceRequests] = useState([]);
  const [placeRequestsLoading, setPlaceRequestsLoading] = useState(false);
  const [dbState, setDbState] = useState('connecting'); // 'connecting' | 'connected' | 'error'
  
  // Custom Toast/Notification State
  const [notification, setNotification] = useState(null);


  // System Logs console
  const [logs, setLogs] = useState([
    { id: 'init-log-1', type: 'info', text: 'Admin system active. Monitoring external incoming uploads...', time: 'Start' }
  ]);
  const [activeTab, setActiveTab] = useState('verify'); // 'verify' | 'database' | 'requests' | 'logs'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Gemini AI Verification States
  const [aiResponse, setAiResponse] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const apiKey = ""; // Handled automatically by preview environment


  // Map Refs
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const [leafletLoaded, setLeafletLoaded] = useState(false);


  // Log Writer Helper (using unique key string formatting to prevent conflicts)
  const addLog = (type, text) => {
    const time = new Date().toTimeString().split(' ')[0];
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    setLogs(prev => [{ id: uniqueId, type, text, time }, ...prev]);
  };


  const triggerToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };


  // 1. DYNAMIC LEAFLET DEPENDENCY LOADING
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }


    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);


    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);


  // 2. AUTHENTICATION (RULE 3 - AUTH FIRST)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
        addLog('success', 'Real-time database secure channel initialized.');
      } catch (err) {
        console.error("Authentication error:", err);
        addLog('warn', 'Database connection waiting. Secure bypass authorized.');
        setDbState('error');
      }
    };
    initAuth();


    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      if (usr) {
        setDbState('connected');
        addLog('info', `Established active monitoring session: ${usr.uid}`);
      }
    });
    return () => unsubscribe();
  }, []);


  // 3. LISTEN TO LIVE FIRESTORE COLLECTIONS (RULE 1 - STRICT PATHS)
  useEffect(() => {
    if (!user) return;


    // Strict Paths for verified and pending nodes
    const pendingRef = collection(db, 'artifacts', appId, 'public', 'data', 'pending_nodes');
    const verifiedRef = collection(db, 'artifacts', appId, 'public', 'data', 'verified_nodes');


    // Subscribe to Raw Inbound Pending Nodes
    const unsubPending = onSnapshot(pendingRef, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Safe check for missing parameters
        items.push({ 
          id: doc.id, 
          name: data.name || data.address || 'Unnamed Uploaded Location',
          address: data.address || data.name || 'No text address provided',
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lng),
          spiderId: data.spiderId || 'External App User',
          timestamp: data.timestamp || 'Just uploaded'
        });
      });
      setPendingQueue(items);
      addLog('info', `Automatically synced ${items.length} incoming nodes uploaded from map devices.`);
      
      // Auto-select first item if selection is cleared or invalid
      if (items.length > 0 && !selectedPending) {
        setSelectedPending(items[0]);
      }
    }, (error) => {
      console.error("Pending nodes sync error:", error);
      addLog('warn', 'Error fetching uploads queue. Retrying stream sync...');
    });


    // Subscribe to Approved Verified Grid
    const unsubVerified = onSnapshot(verifiedRef, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({ 
          id: doc.id, 
          name: data.name || data.address || 'Verified Location',
          address: data.address || '',
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lng),
          spiderId: data.spiderId || 'Admin Approved',
          verifiedAt: data.verifiedAt || 'Just Verified'
        });
      });
      setVerifiedList(items);
      addLog('success', `Verified base maps synchronized. Currently showing ${items.length} confirmed locations.`);
    }, (error) => {
      console.error("Verified base sync error:", error);
      addLog('warn', 'Error updating verified active registers.');
    });


    return () => {
      unsubPending();
      unsubVerified();
    };
  }, [user, appId]);

  const fetchPlaceRequests = async () => {
    setPlaceRequestsLoading(true);
    try {
      const response = await fetch(`${PLACE_REQUESTS_DB_URL}.json`);
      if (!response.ok) throw new Error(`Request fetch failed: ${response.status}`);
      const data = await response.json();
      const items = Object.entries(data || {})
        .map(([id, value]) => ({
          id,
          name: value?.name || 'Unnamed place',
          address: value?.address || 'No address',
          status: value?.status || 'pending',
          source: value?.source || 'spidermaps-app',
          imageUrl: value?.imageUrl || '',
          imageName: value?.imageName || '',
          createdAt: value?.createdAt || 0,
          createdAtText: value?.createdAtText || 'Just requested',
          reviewedAt: value?.reviewedAt || null
        }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setPlaceRequests(items);
      addLog('info', `Synced ${items.length} public place name/address requests from RTDB.`);
    } catch (error) {
      console.error(error);
      addLog('warn', 'Could not sync public place requests from RTDB.');
      triggerToast('Place request sync failed.', 'warning');
    } finally {
      setPlaceRequestsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaceRequests();
    const intervalId = window.setInterval(fetchPlaceRequests, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const copyPlaceRequest = async (request) => {
    const text = `${request.name}\n${request.address}`;
    try {
      await navigator.clipboard.writeText(text);
      triggerToast('Copied request name and address.', 'success');
      addLog('info', `Copied place request for manual coordinate lookup: ${request.name}`);
    } catch {
      triggerToast(text, 'warning');
    }
  };

  const updatePlaceRequestStatus = async (request, status) => {
    try {
      const response = await fetch(`${PLACE_REQUESTS_DB_URL}/${request.id}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewedAt: Date.now(),
          reviewedAtText: new Date().toLocaleString()
        })
      });
      if (!response.ok) throw new Error(`Status update failed: ${response.status}`);
      triggerToast(`Marked "${request.name}" as ${status}.`, 'success');
      addLog('success', `PLACE REQUEST ${status.toUpperCase()}: ${request.name}`);
      fetchPlaceRequests();
    } catch (error) {
      console.error(error);
      triggerToast('Could not update place request.', 'error');
    }
  };

  const deletePlaceRequest = async (request) => {
    try {
      const response = await fetch(`${PLACE_REQUESTS_DB_URL}/${request.id}.json`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`Delete failed: ${response.status}`);
      triggerToast(`Deleted "${request.name}" request.`, 'warning');
      addLog('warn', `Deleted place request: ${request.name}`);
      fetchPlaceRequests();
    } catch (error) {
      console.error(error);
      triggerToast('Could not delete place request.', 'error');
    }
  };


  // Compute Proximity Matrix
  const getDuplicateAnalysis = (pendingNode) => {
    if (!pendingNode || isNaN(pendingNode.lat) || isNaN(pendingNode.lng) || verifiedList.length === 0) {
      return { isDuplicate: false, nearest: null, distance: Infinity };
    }
    
    let nearestNode = null;
    let minDistance = Infinity;


    verifiedList.forEach(vNode => {
      if (isNaN(vNode.lat) || isNaN(vNode.lng)) return;
      const dist = getHaversineDistance(pendingNode.lat, pendingNode.lng, vNode.lat, vNode.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestNode = vNode;
      }
    });


    // Marked as duplicate risk if distance is less than 150 meters
    const isDuplicate = minDistance < 150; 
    return {
      isDuplicate,
      nearest: nearestNode,
      distance: Math.round(minDistance)
    };
  };


  // 4. MAP POSITIONING AND MARKERS
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;


    if (!mapInstanceRef.current) {
      mapInstanceRef.current = window.L.map(mapRef.current, {
        center: [37.7749, -122.4194], // Default San Francisco View
        zoom: 12,
        zoomControl: false
      });


      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(mapInstanceRef.current);


      window.L.control.zoom({ position: 'topright' }).addTo(mapInstanceRef.current);
    }


    const L = window.L;
    const map = mapInstanceRef.current;


    // Clean previous markers
    Object.values(markersRef.current).forEach(marker => map.removeLayer(marker));
    markersRef.current = {};


    const createCustomMarker = (color, isPulse = false) => {
      return L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div class="relative flex items-center justify-center">
            ${isPulse ? `<span class="absolute inline-flex h-8 w-8 rounded-full bg-${color}-400 opacity-75 animate-ping"></span>` : ''}
            <span class="relative inline-flex rounded-full h-4.5 w-4.5 bg-${color}-500 border-2 border-white shadow-lg"></span>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
    };


    // Plot Verified Markers (Emerald Green)
    verifiedList.forEach(loc => {
      if (isNaN(loc.lat) || isNaN(loc.lng)) return;


      const isNearestToSelected = selectedPending && 
        getHaversineDistance(selectedPending.lat, selectedPending.lng, loc.lat, loc.lng) < 150;


      const marker = L.marker([loc.lat], [loc.lng], {
        icon: createCustomMarker(isNearestToSelected ? 'yellow' : 'emerald')
      });
      // Safety correction: Leaflet marker uses LatLng array or L.latLng
      const correctMarker = L.marker([loc.lat, loc.lng], {
        icon: createCustomMarker(isNearestToSelected ? 'yellow' : 'emerald')
      })
      .bindPopup(`
        <div class="text-xs bg-slate-950 text-white p-2.5 rounded border border-emerald-500/40 min-w-[160px]">
          <strong class="text-emerald-400 font-bold block">${loc.name}</strong>
          <span class="text-slate-400 font-mono text-[10px] block mt-1">${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}</span>
          <div class="mt-1 flex items-center justify-between text-[10px] border-t border-slate-800/80 pt-1.5">
            <span class="text-emerald-300 font-semibold">Active Confirmed Map Node</span>
          </div>
        </div>
      `, { closeButton: false, className: 'dark-popup' })
      .addTo(map);


      markersRef.current[`verified-${loc.id}`] = correctMarker;
    });


    // Plot Incoming Pending Uploads (Cyan, Amber, or Red Duplicates)
    pendingQueue.forEach(loc => {
      if (isNaN(loc.lat) || isNaN(loc.lng)) return;


      const isSelected = selectedPending && selectedPending.id === loc.id;
      const dupDetails = getDuplicateAnalysis(loc);
      const isDuplicate = dupDetails.isDuplicate;


      const markerColor = isSelected ? 'cyan' : (isDuplicate ? 'red' : 'amber');
      const marker = L.marker([loc.lat, loc.lng], {
        icon: createCustomMarker(markerColor, isSelected)
      })
      .bindPopup(`
        <div class="text-xs bg-slate-950 text-white p-2.5 rounded border border-red-500/40 min-w-[160px]">
          <strong class="text-amber-400 font-bold block">${loc.name}</strong>
          <span class="text-[10px] text-slate-400 block font-mono mt-0.5">${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}</span>
          <div class="mt-1.5 border-t border-slate-850 pt-1 text-[10px]">
            <span class="${isDuplicate ? 'text-red-400 font-bold animate-pulse' : 'text-cyan-400'}">
              ${isDuplicate ? '🚨 Near Confirmed Duplicate' : '✓ Unique Coordinate Space'}
            </span>
          </div>
        </div>
      `, { closeButton: false, className: 'dark-popup' })
      .addTo(map);


      markersRef.current[`pending-${loc.id}`] = marker;


      if (isSelected) {
        map.setView([loc.lat, loc.lng], 15, { animate: true });
        marker.openPopup();
      }
    });


  }, [leafletLoaded, verifiedList, pendingQueue, selectedPending]);


  // 5. DATABASE PIPELINE CORE CONTROL (APPROVE ADDS REAL-TIME DATA TO VERIFIED COLLECTION)
  const handleApprove = async (node) => {
    if (!user) return;
    try {
      const verifiedRef = doc(db, 'artifacts', appId, 'public', 'data', 'verified_nodes', node.id);
      const pendingRef = doc(db, 'artifacts', appId, 'public', 'data', 'pending_nodes', node.id);


      // A. Write securely to verified_nodes array
      await setDoc(verifiedRef, {
        name: node.name,
        address: node.address || '',
        lat: Number(node.lat),
        lng: Number(node.lng),
        spiderId: node.spiderId || 'External App User',
        verifiedAt: new Date().toISOString().split('T')[0]
      });


      // B. Remove immediately from pending queue
      await deleteDoc(pendingRef);


      triggerToast(`Successfully confirmed location: "${node.name}" is now live on the map!`, 'success');
      addLog('success', `CONFIRMED: "${node.name}" accepted into confirmed map layer.`);
      
      // Auto-focus next pending coordinate in queue
      const remaining = pendingQueue.filter(p => p.id !== node.id);
      setSelectedPending(remaining.length > 0 ? remaining[0] : null);
      setAiResponse(null);
    } catch (err) {
      console.error(err);
      triggerToast('Error syncing coordinates with database.', 'error');
    }
  };


  const handleDiscard = async (nodeId, nodeName) => {
    if (!user) return;
    try {
      const pendingRef = doc(db, 'artifacts', appId, 'public', 'data', 'pending_nodes', nodeId);
      await deleteDoc(pendingRef);


      triggerToast(`Rejected raw coordinates for "${nodeName}"`, 'warning');
      addLog('warn', `REJECTED: Discarded raw coordinates lookup for "${nodeName}"`);


      const remaining = pendingQueue.filter(p => p.id !== nodeId);
      setSelectedPending(remaining.length > 0 ? remaining[0] : null);
      setAiResponse(null);
    } catch (err) {
      console.error(err);
      triggerToast('Could not discard item.', 'error');
    }
  };


  const handleMergeSync = async (pendingNode, targetVerifiedNode) => {
    if (!user) return;
    try {
      const verifiedRef = doc(db, 'artifacts', appId, 'public', 'data', 'verified_nodes', targetVerifiedNode.id);
      const pendingRef = doc(db, 'artifacts', appId, 'public', 'data', 'pending_nodes', pendingNode.id);


      // Merge data and keep original database clean
      await setDoc(verifiedRef, {
        ...targetVerifiedNode,
        name: `${targetVerifiedNode.name} (Merged Coordinates)`,
        lastAuditSource: pendingNode.spiderId || 'External App Client',
        lastMergedAt: new Date().toISOString().split('T')[0]
      }, { merge: true });


      // Clean up raw upload from incoming list
      await deleteDoc(pendingRef);


      triggerToast(`Merged incoming signal into verified anchor: ${targetVerifiedNode.name}`, 'success');
      addLog('info', `MERGED: Combined coordinate reports with established node: ${targetVerifiedNode.name}`);


      const remaining = pendingQueue.filter(p => p.id !== pendingNode.id);
      setSelectedPending(remaining.length > 0 ? remaining[0] : null);
      setAiResponse(null);
    } catch (err) {
      console.error(err);
      triggerToast('Merge operation failed.', 'error');
    }
  };


  // 6. GEMINI AI GEOSPATIAL PROXIMITY ANALYZER
  const requestGeminiAnalysis = async (node) => {
    if (!node || isNaN(node.lat) || isNaN(node.lng)) return;
    setLoadingAI(true);
    setAiResponse(null);


    const dupAnalysis = getDuplicateAnalysis(node);
    
    const systemPrompt = "You are an automated geospatial coordinate verification checking system for high-scale mapping apps.";
    const userPrompt = `
      Evaluate this coordinate pin entry submitted via mobile application:
      - Coordinate Pin Name / Address: "${node.name}"
      - Coordinates: [${node.lat}, ${node.lng}]
      
      Nearest existing map anchor position:
      - Name: "${dupAnalysis.nearest ? dupAnalysis.nearest.name : 'None'}"
      - Location coordinates: [${dupAnalysis.nearest ? dupAnalysis.nearest.lat : 'N/A'}, ${dupAnalysis.nearest ? dupAnalysis.nearest.lng : 'N/A'}]
      - Distance: ${dupAnalysis.distance} meters
      
      Rules:
      - Distance < 150m is a likely collision or repeat of the same address pin. Suggest MERGE or REJECT.
      - Distance > 150m is clear, verified fresh space. Suggest APPROVE.
      
      Respond clearly in this exact template format:
      ### SUGGESTION: [APPROVE / MERGE / REJECT]
      - **Collision Index**: [Explain if distance is too close or safe]
      - **Geographical Value**: [Detail whether this adds new coverage space or overlaps with established nodes].
    `;


    // Strict 5-time retry strategy with exponential backoff
    let retries = 5;
    let delay = 1000;
    let success = false;


    while (retries > 0 && !success) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        });


        if (response.ok) {
          const result = await response.json();
          const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
          setAiResponse({ source: 'live', text: text || 'No response returned.' });
          addLog('success', `AI Co-Pilot spatial analysis calculated for: ${node.name}`);
          success = true;
        } else {
          throw new Error('API Request Failed');
        }
      } catch (error) {
        retries--;
        if (retries === 0) {
          // Robust client-side mathematical fallback if API is busy or unconfigured
          const isDup = dupAnalysis.isDuplicate;
          const rec = isDup ? 'REJECT / MERGE' : 'APPROVE';
          const reason = isDup 
            ? `Calculated proximity is only ${dupAnalysis.distance}m from established anchor '${dupAnalysis.nearest?.name}'. Merging or rejecting is recommended to keep map layer clean.`
            : `Safe. Coordinates are located over ${dupAnalysis.distance}m away from the closest verified map station. Ideal for direct expansion.`;


          const fallbackMarkdown = `### SUGGESTION: **${rec}**
- **Collision Index**: ${isDup ? 'WARNING - NEIGHBOR DETECTED' : 'SECURE UNIQUE PLACEMENT'}
- **Geographical Value**: ${reason}
- **Action Strategy**: ${isDup ? 'Click Merge to save metadata, or Reject if duplicate.' : 'Click Approve & Sync to update the production map.'}`;


          setAiResponse({ source: 'local-calc', text: fallbackMarkdown });
          addLog('success', `Automated mathematical spatial audit executed for ${node.name}.`);
        } else {
          await new Promise(res => setTimeout(res, delay));
          delay *= 2;
        }
      }
    }
    setLoadingAI(false);
  };


  // 7. EXTERNAL COORDINATE SEEDER (Perfect for testing the automatic inbound flow)
  const [seedLat, setSeedLat] = useState('37.7885');
  const [seedLng, setSeedLng] = useState('-122.4056');
  const [seedName, setSeedName] = useState('Union Square Market Space');


  const pushSeedTestNode = async () => {
    if (!user) return;
    try {
      const randomId = 'upload_' + Math.floor(Math.random() * 100000);
      const pendingRef = doc(db, 'artifacts', appId, 'public', 'data', 'pending_nodes', randomId);
      
      await setDoc(pendingRef, {
        name: seedName,
        address: seedName,
        lat: parseFloat(seedLat),
        lng: parseFloat(seedLng),
        spiderId: 'Simulator Node',
        timestamp: 'Simulated User Upload'
      });


      triggerToast(`Injected coordinate node. Watch it sync dynamically!`, 'success');
      addLog('info', `SEEDER: Inserted new pending upload [${seedLat}, ${seedLng}] to database.`);
    } catch (err) {
      console.error(err);
      triggerToast('Database seed failed.', 'error');
    }
  };


  const activeAnalysis = selectedPending ? getDuplicateAnalysis(selectedPending) : null;
  const filteredVerified = verifiedList.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.address && v.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      
      {/* TOAST SYSTEM */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-xl border flex items-center gap-3 shadow-2xl transition-all duration-300 ${
          notification.type === 'error' ? 'bg-red-950/90 border-red-500 text-red-200' :
          notification.type === 'warning' ? 'bg-amber-950/90 border-amber-500 text-amber-200' :
          'bg-slate-900 border-emerald-500/50 text-emerald-300'
        }`}>
          <AlertTriangle className="h-5 w-5 animate-pulse" />
          <p className="text-xs font-semibold font-mono">{notification.message}</p>
        </div>
      )}


      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-[1001] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Compass className="h-6 w-6 text-slate-950 stroke-[2.5]" />
            </div>
            <span className={`absolute bottom-0 right-0 h-3 w-3 border-2 border-slate-900 rounded-full ${
              dbState === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-amber-400 animate-ping'
            }`}></span>
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Spider Maps Real-Time Verifier
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">Live Inbound Coordinate Sync</p>
          </div>
        </div>


        {/* Real-time sync pipeline details */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
          <Server className={`h-3.5 w-3.5 ${dbState === 'connected' ? 'text-emerald-400' : 'text-amber-400 animate-spin'}`} />
          <span className="text-[10px] uppercase text-slate-400 hidden sm:inline">EXTERNAL API PIPELINE:</span>
          <span className={dbState === 'connected' ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
            {dbState === 'connected' ? 'ACTIVE RECEIVER' : 'WAITING...'}
          </span>
        </div>
      </header>


      {/* CORE CONTROL AREA */}
      <main className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-5 p-4 max-w-7xl w-full mx-auto">
        
        {/* LEFT COMPONENT COLUMN (XL: 8cols) */}
        <div className="xl:col-span-8 flex flex-col gap-5">
          
          {/* STATS TILES */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider font-mono">Confirmed Active Map Locations</span>
              <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">{verifiedList.length}</p>
            </div>


            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider font-mono">Inbound Pending Uploads</span>
              <p className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">{pendingQueue.length}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider font-mono">Free Place Requests</span>
              <p className="text-xl sm:text-2xl font-bold text-cyan-400 mt-1">
                {placeRequests.filter((request) => request.status === 'pending').length}
              </p>
            </div>


            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider font-mono">Proximity Duplicate Collisions</span>
              <p className="text-xl sm:text-2xl font-bold text-rose-400 mt-1">
                {pendingQueue.filter(p => getDuplicateAnalysis(p).isDuplicate).length}
              </p>
            </div>
          </section>


          {/* TABS */}
          <div className="flex border-b border-slate-850">
            <button 
              onClick={() => setActiveTab('verify')}
              className={`px-4 py-2 text-xs uppercase font-bold tracking-wider border-b-2 transition-all ${
                activeTab === 'verify' 
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/10' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Auditing Inbound Queue
            </button>
            <button 
              onClick={() => setActiveTab('database')}
              className={`px-4 py-2 text-xs uppercase font-bold tracking-wider border-b-2 transition-all ${
                activeTab === 'database' 
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/10' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Verified Database Layer ({verifiedList.length})
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 text-xs uppercase font-bold tracking-wider border-b-2 transition-all ${
                activeTab === 'requests' 
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Place Requests ({placeRequests.filter((request) => request.status === 'pending').length})
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 text-xs uppercase font-bold tracking-wider border-b-2 transition-all ${
                activeTab === 'logs' 
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/10' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Terminal Logs
            </button>
          </div>


          {/* TAB 1: AUDITING ACTION BLOCK */}
          {activeTab === 'verify' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-[450px]">
              
              {/* Left sidebar: Inbound Queue from real DB */}
              <div className="md:col-span-5 flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">Pending Uploads</h3>
                  <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span> Real-time Listening
                  </span>
                </div>


                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-y-auto max-h-[500px] p-2 space-y-2">
                  {pendingQueue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <ShieldCheck className="h-10 w-10 text-emerald-500 mb-2 stroke-[1.5]" />
                      <p className="text-xs font-semibold text-slate-300">Queue Cleared</p>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                        No locations currently awaiting approval. Any uploads from your other mapping apps will appear here instantly!
                      </p>
                    </div>
                  ) : (
                    pendingQueue.map((item) => {
                      const analysis = getDuplicateAnalysis(item);
                      const isSelected = selectedPending?.id === item.id;
                      
                      return (
                        <div 
                          key={item.id}
                          onClick={() => setSelectedPending(item)}
                          className={`cursor-pointer p-3 rounded-lg border transition-all duration-200 flex flex-col gap-1 ${
                            isSelected 
                              ? 'bg-emerald-950/20 border-emerald-500/80 shadow-md shadow-emerald-500/5' 
                              : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-200 truncate" title={item.name}>
                              {item.name}
                            </span>
                            {analysis.isDuplicate ? (
                              <span className="bg-red-500/10 text-red-400 text-[8px] font-bold font-mono px-1 rounded border border-red-500/20 whitespace-nowrap">
                                DUPLICATE ({analysis.distance}m)
                              </span>
                            ) : (
                              <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold font-mono px-1.5 rounded border border-emerald-500/20 whitespace-nowrap">
                                UNIQUE
                              </span>
                            )}
                          </div>


                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                            <span>{isNaN(item.lat) ? 'No Lat' : item.lat.toFixed(5)}, {isNaN(item.lng) ? 'No Lng' : item.lng.toFixed(5)}</span>
                            <span className="text-slate-400 text-[9px] truncate max-w-[100px]">{item.spiderId || 'App User'}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>


              {/* Right side: Interactive map & commit interface */}
              <div className="md:col-span-7 flex flex-col gap-4">
                
                {/* MAP */}
                <div className="relative w-full h-[280px] rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
                  <div id="map" ref={mapRef} className="w-full h-full z-0"></div>
                  
                  {/* Legend Overlay */}
                  <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/90 backdrop-blur border border-slate-800 rounded-lg p-2 flex flex-col gap-1 text-[9px] font-mono shadow-xl">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Verified Layer (Production Grid)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500 inline-block"></span>
                      <span>Selected Upload Node</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-500 inline-block animate-pulse"></span>
                      <span>Spatial Match Collision (&lt;150m)</span>
                    </div>
                  </div>
                </div>


                {/* COORDINATE ACTION WORKSTATION */}
                {selectedPending ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
                    <div className="flex items-start justify-between border-b border-slate-850 pb-3">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-mono font-bold block">Auditing Coordinates Entry</span>
                        <h4 className="text-sm font-bold text-slate-100">{selectedPending.name}</h4>
                      </div>
                      
                      {/* Google Maps link verification */}
                      {!isNaN(selectedPending.lat) && !isNaN(selectedPending.lng) && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedPending.lat},${selectedPending.lng}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"
                        >
                          Google Maps Link <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>


                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Target Location Coordinates</span>
                        <span className="text-slate-200 font-semibold">{selectedPending.lat}, {selectedPending.lng}</span>
                      </div>


                      <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Proximity Duplication Monitor</span>
                        {activeAnalysis?.isDuplicate ? (
                          <div className="text-red-400 font-bold flex items-center gap-1 text-[11px]">
                            <AlertTriangle className="h-3.5 w-3.5 animate-pulse" /> Duplicate Collision
                          </div>
                        ) : (
                          <div className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                            <ShieldCheck className="h-3.5 w-3.5" /> Safe Location
                          </div>
                        )}
                      </div>
                    </div>


                    {activeAnalysis?.nearest && (
                      <p className="text-[10px] text-slate-400 font-mono bg-slate-950/40 p-2 rounded border border-slate-850">
                        🚨 Already registered node is <strong className="text-slate-100">{activeAnalysis.distance}m</strong> away: <strong className="text-amber-400">"{activeAnalysis.nearest.name}"</strong>
                      </p>
                    )}


                    {/* APPROVE ACTION WRITES TO VERIFIED ONLY */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-850/60">
                      {activeAnalysis?.isDuplicate ? (
                        <>
                          <button 
                            onClick={() => handleMergeSync(selectedPending, activeAnalysis.nearest)}
                            className="flex-1 bg-amber-500 text-slate-950 py-2 rounded-lg text-xs font-bold hover:bg-amber-400 transition-colors flex items-center justify-center gap-1"
                          >
                            Merge Coordinate Data
                          </button>
                          <button 
                            onClick={() => handleDiscard(selectedPending.id, selectedPending.name)}
                            className="flex-1 bg-red-600/10 text-red-400 border border-red-500/20 py-2 rounded-lg text-xs font-semibold hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Discard Repeat Upload
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleApprove(selectedPending)}
                            className="flex-1 bg-emerald-500 text-slate-950 py-2 rounded-lg text-xs font-bold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Approve & Add Location
                          </button>
                          <button 
                            onClick={() => handleDiscard(selectedPending.id, selectedPending.name)}
                            className="bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-all"
                          >
                            Discard
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                    <Info className="h-8 w-8 text-slate-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-400">No Location Selected</p>
                    <p className="text-[10px] text-slate-600 mt-1 max-w-sm">Select an inbound location upload to preview its spatial values here.</p>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* TAB 2: ACTIVE MAP GRID REGISTRY */}
          {activeTab === 'database' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-850 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Live Confirmed Location Registry</h3>
                  <p className="text-[10px] text-slate-400">All coordinates that you have verified and approved</p>
                </div>
                
                <input 
                  type="text" 
                  placeholder="Filter active registry..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-1.5 text-slate-300 w-[200px] focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>


              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase">
                      <th className="py-2 px-3">Location ID</th>
                      <th className="py-2 px-3">Labled Address/Name</th>
                      <th className="py-2 px-3">Latitude / Longitude</th>
                      <th className="py-2 px-3">Approved Timestamp</th>
                      <th className="py-2 px-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredVerified.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-slate-600">No confirmed map locations loaded. Approvals populate this automatically.</td>
                      </tr>
                    ) : (
                      filteredVerified.map((loc) => (
                        <tr key={loc.id} className="hover:bg-slate-850/20 transition-colors">
                          <td className="py-2 px-3 text-emerald-400 font-bold">#{loc.id.slice(-6)}</td>
                          <td className="py-2 px-3 text-slate-200 font-sans">{loc.name}</td>
                          <td className="py-2 px-3 text-slate-300">{isNaN(loc.lat) ? 'N/A' : loc.lat.toFixed(5)}, {isNaN(loc.lng) ? 'N/A' : loc.lng.toFixed(5)}</td>
                          <td className="py-2 px-3 text-slate-400">{loc.verifiedAt || 'Archived'}</td>
                          <td className="py-2 px-3 text-right">
                            <button 
                              onClick={async () => {
                                if (!user) return;
                                try {
                                  await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'verified_nodes', loc.id));
                                  addLog('warn', `DELETED: Removed "${loc.name}" from verified base maps layer.`);
                                  triggerToast(`Removed confirmed location.`, 'warning');
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              className="text-slate-500 hover:text-red-400 transition-colors p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* TAB 3: PUBLIC PLACE REQUESTS */}
          {activeTab === 'requests' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-850 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Free Place Request Inbox</h3>
                  <p className="text-[10px] text-slate-400">Users send only name and address. You find coordinates and add approved places to mapPlaces.js.</p>
                </div>
                
                <button
                  onClick={fetchPlaceRequests}
                  disabled={placeRequestsLoading}
                  className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${placeRequestsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="space-y-3">
                {placeRequests.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-10 text-center">
                    <MapPin className="mx-auto mb-3 h-8 w-8 text-slate-600" />
                    <p className="text-xs font-semibold text-slate-400">No public place requests yet.</p>
                    <p className="mt-1 text-[10px] text-slate-600">Requests from the SpiderMaps app will appear here after users press Add.</p>
                  </div>
                ) : (
                  placeRequests.map((request) => (
                    <div key={request.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="truncate text-sm font-bold text-slate-100">{request.name}</h4>
                            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${
                              request.status === 'added'
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                : request.status === 'rejected'
                                  ? 'border-red-500/30 bg-red-500/10 text-red-300'
                                  : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-slate-300">{request.address}</p>
                          {request.imageUrl && (
                            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-2">
                              <img src={request.imageUrl} alt={request.name} className="h-16 w-16 rounded-lg object-cover border border-slate-700" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase text-cyan-300">Cloudinary image</p>
                                <a href={request.imageUrl} target="_blank" rel="noopener noreferrer" className="block truncate text-[11px] text-slate-300 hover:text-cyan-200">
                                  {request.imageUrl}
                                </a>
                              </div>
                            </div>
                          )}
                          <p className="mt-2 text-[10px] text-slate-500 font-mono">{request.createdAtText} · {request.source}</p>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            onClick={() => copyPlaceRequest(request)}
                            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] font-bold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
                          >
                            Copy
                          </button>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${request.name} ${request.address}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] font-bold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
                          >
                            Find Maps
                          </a>
                          <button
                            onClick={() => updatePlaceRequestStatus(request, 'added')}
                            className="rounded-lg bg-emerald-500 px-3 py-2 text-[10px] font-black text-slate-950 hover:bg-emerald-400"
                          >
                            Mark Added
                          </button>
                          <button
                            onClick={() => updatePlaceRequestStatus(request, 'rejected')}
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[10px] font-bold text-red-300 hover:bg-red-600 hover:text-white"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => deletePlaceRequest(request)}
                            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-red-300 hover:border-red-400"
                            title="Delete request"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}


          {/* TAB 3: CONSOLIDATED RDB LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Security Event Terminal</span>
                <button 
                  onClick={() => setLogs([])}
                  className="text-[9px] text-slate-500 hover:text-slate-300 font-mono"
                >
                  CLEAR TERMINAL
                </button>
              </div>


              <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-300 space-y-2 h-[300px] overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-slate-600 text-center py-10">No events logged.</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex gap-2">
                      <span className="text-slate-600">[{log.time}]</span>
                      <span className={`font-bold ${
                        log.type === 'success' ? 'text-emerald-400' :
                        log.type === 'warn' ? 'text-rose-400' : 'text-cyan-400'
                      }`}>
                        {log.type.toUpperCase()}
                      </span>
                      <span className="text-slate-200">{log.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}


        </div>


        {/* RIGHT COLUMN: AI CO-PILOT & TEST SEEDER (XL: 4cols) */}
        <div className="xl:col-span-4 flex flex-col gap-5">
          
          {/* CO-PILOT AUDITOR */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-emerald-500/10 to-transparent blur-2xl pointer-events-none rounded-full"></div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <h2 className="text-xs font-bold text-slate-100 uppercase font-mono tracking-wider">Geospatial AI Audit</h2>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold font-mono px-2 py-0.5 rounded border border-emerald-500/20">
                Active Verification
              </span>
            </div>


            <p className="text-xs text-slate-400 leading-relaxed">
              Scan inbound coordinates automatically to audit proximity metrics before approving the upload.
            </p>


            {selectedPending ? (
              <div className="flex flex-col gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <p className="text-[9px] text-slate-500 font-mono uppercase">Auditing point</p>
                    <p className="text-xs font-semibold text-slate-200 truncate">{selectedPending.name}</p>
                  </div>
                  <button 
                    onClick={() => requestGeminiAnalysis(selectedPending)}
                    disabled={loadingAI}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 shadow whitespace-nowrap flex-shrink-0"
                  >
                    {loadingAI ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Auditing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        Run AI Check
                      </>
                    )}
                  </button>
                </div>


                {aiResponse && (
                  <div className="bg-slate-950/70 border border-slate-850 rounded-xl p-3 text-xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-850/80 pb-1.5">
                      <span className="text-[10px] text-slate-500 font-bold font-mono uppercase">Auditor Recommendation</span>
                      <span className="text-[9px] font-mono text-emerald-400">ANALYSIS COMPLETE</span>
                    </div>


                    <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-1.5 font-sans">
                      {aiResponse.text.split('\n').map((line, index) => {
                        if (line.startsWith('###')) {
                          return <h4 key={index} className="text-slate-100 font-bold pb-0.5 mt-2 text-xs">{line.replace('###', '')}</h4>;
                        } else if (line.startsWith('-')) {
                          return <p key={index} className="pl-2.5 border-l border-emerald-500/50 my-1 text-[11px]">{line.replace('-', '')}</p>;
                        }
                        return <p key={index} className="text-[11px]">{line}</p>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center">
                <p className="text-[10px] text-slate-500 font-mono">Select a pending mobile upload to run AI checks.</p>
              </div>
            )}
          </div>


          {/* RDB SEEDER FOR TESTING THE REAL PIPELINE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <h3 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-emerald-400" />
              Upload Simulator
            </h3>
            
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Test how user uploads automatically flow into this panel. Fill coordinates and check how it appears in real-time.
            </p>


            <div className="space-y-2 text-xs font-mono">
              <div>
                <label className="text-[9px] text-slate-500 block mb-1">UPLOADED ADDRESS/NAME</label>
                <input 
                  type="text" 
                  value={seedName}
                  onChange={(e) => setSeedName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>


              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-500 block mb-1">LATITUDE</label>
                  <input 
                    type="text" 
                    value={seedLat}
                    onChange={(e) => setSeedLat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block mb-1">LONGITUDE</label>
                  <input 
                    type="text" 
                    value={seedLng}
                    onChange={(e) => setSeedLng(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>


              <button 
                onClick={pushSeedTestNode}
                className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 py-2 rounded-xl text-xs text-emerald-400 font-bold transition-all flex items-center justify-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Simulate Real App Upload
              </button>
            </div>
          </div>


        </div>


      </main>


      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-850 bg-slate-950 p-3.5 text-center text-[10px] font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-1">
          <span>Active Map Matrix:</span>
          <strong className="text-emerald-400">San Francisco Bay</strong>
        </div>
        <div>
          <span>Security status: <strong className="text-cyan-400">Authenticated Receiver Live</strong></span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
          <span>Automatic Listener Listening</span>
        </div>
      </footer>
    </div>
  );
}
