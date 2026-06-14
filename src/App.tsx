import { useState, useEffect, FormEvent } from "react";
import { 
  Play, 
  Pause,
  SkipForward,
  SkipBack,
  History as HistoryIcon, 
  ListMusic, 
  Plus, 
  Trash2, 
  Heart, 
  Info, 
  Smartphone, 
  Search, 
  Youtube, 
  Music, 
  Compass,
  Sparkles,
  Globe,
  Volume2,
  X,
  Check,
  ToggleLeft,
  ToggleRight,
  Car,
  ChevronRight,
  Radio,
  Flame,
  Moon,
  CloudLightning,
  RefreshCcw,
  Sliders,
  LogOut,
  User,
  LogIn,
  SlidersHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Real Firebase integration imports
import { 
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import { auth, db, googleProvider, handleFirestoreError, OperationType } from "./lib/firebase";

// Interfaces for our YouTube Music tracks
interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  category: "Lofi / Relax" | "Energía / Gym" | "Pop / Electro" | "Retro / Clásico" | "Urbano / Latino" | "Custom";
  thumbnailUrl: string;
  thumbnail?: string;
}

interface CustomPlaylist {
  id: string;
  name: string;
  videoIds: string[];
}

// Curated selection of premier YouTube Music / Audio broadcasts
const CURATED_TRACKS: Track[] = [
  {
    id: "jfKfPfyJRdk",
    title: "Lofi Girl - Chill Lofi Hip Hop Radio to Study/Relax",
    artist: "Lofi Girl",
    duration: "En vivo 🔴",
    category: "Lofi / Relax",
    thumbnailUrl: "https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg"
  },
  {
    id: "5qap5aO4i9A",
    title: "Beats to Study/Relax to - ChilledCow Live Radio",
    artist: "ChilledCow",
    duration: "En vivo 🔴",
    category: "Lofi / Relax",
    thumbnailUrl: "https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg"
  },
  {
    id: "tntOCGkgt98",
    title: "Deep Focus Ambient - Música para Trabajar y Programar",
    artist: "Ambient Station",
    duration: "3:00:10",
    category: "Lofi / Relax",
    thumbnailUrl: "https://img.youtube.com/vi/tntOCGkgt98/hqdefault.jpg"
  },
  {
    id: "S7_g9TzS4vs",
    title: "Bosque Lluvioso Relajante - Sonidos para dormir",
    artist: "Nature Meditations",
    duration: "8:00:00",
    category: "Lofi / Relax",
    thumbnailUrl: "https://img.youtube.com/vi/S7_g9TzS4vs/hqdefault.jpg"
  },
  {
    id: "FT33A7CIsr8",
    title: "Dua Lipa & Top Pop Hits Live Megamix Electro 2026",
    artist: "Pop Party Station",
    duration: "1:45:00",
    category: "Pop / Electro",
    thumbnailUrl: "https://img.youtube.com/vi/FT33A7CIsr8/hqdefault.jpg"
  },
  {
    id: "3W_X0-iEp-o",
    title: "Daft Punk Ultimate Mix - Electronic Classics",
    artist: "Electro Heaven",
    duration: "2:15:30",
    category: "Pop / Electro",
    thumbnailUrl: "https://img.youtube.com/vi/3W_X0-iEp-o/hqdefault.jpg"
  },
  {
    id: "fHI8X4OXluQ",
    title: "Coldplay - Live in Buenos Aires (Full Album Show)",
    artist: "Coldplay Concerts",
    duration: "2:04:15",
    category: "Retro / Clásico",
    thumbnailUrl: "https://img.youtube.com/vi/fHI8X4OXluQ/hqdefault.jpg"
  },
  {
    id: "g4mQ9_vXb0Y",
    title: "Retro 80's Synthwave & Pop Classics Mix",
    artist: "Synth Rider",
    duration: "1:30:00",
    category: "Retro / Clásico",
    thumbnailUrl: "https://img.youtube.com/vi/g4mQ9_vXb0Y/hqdefault.jpg"
  },
  {
    id: "S9Sg_v0_d6I",
    title: "Heavy Rock & Metal Workout Anthem Motivation",
    artist: "Adrenaline Beats",
    duration: "58:40",
    category: "Energía / Gym",
    thumbnailUrl: "https://img.youtube.com/vi/S9Sg_v0_d6I/hqdefault.jpg"
  },
  {
    id: "tAgM2V_F2B0",
    title: "Reggaeton Retro Classics & Urban Hits Mix",
    artist: "DJ Latino Flow",
    duration: "1:12:45",
    category: "Urbano / Latino",
    thumbnailUrl: "https://img.youtube.com/vi/tAgM2V_F2B0/hqdefault.jpg"
  }
];

export default function App() {
  // Navigation Tabs: 'discover' | 'player' | 'playlists' | 'history'
  const [activeTab, setActiveTab] = useState<"discover" | "player" | "playlists" | "history">("discover");
  
  // Custom states
  const [currentTrack, setCurrentTrack] = useState<Track>(CURATED_TRACKS[0]);
  const [inputUrl, setInputUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customArtist, setCustomArtist] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  
  // Android Auto Specific Driving Console Mode
  const [carMode, setCarMode] = useState<boolean>(false);
  
  // Storage States
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<CustomPlaylist[]>([]);
  const [trackToPlaylist, setTrackToPlaylist] = useState<Track | null>(null);
  
  // Selected category on discover tab
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  // New Online Catalog Search & Results states
  const [onlineSearchQuery, setOnlineSearchQuery] = useState("");
  const [onlineResults, setOnlineResults] = useState<Track[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineSearchError, setOnlineSearchError] = useState("");

  // New Intelligent Audio Normalization & Equalizer states
  const [isNormalizing, setIsNormalizing] = useState<boolean>(true);
  const [normalizationLevel, setNormalizationLevel] = useState<"bajo" | "medio" | "alto">("medio");
  const [eqPreset, setEqPreset] = useState<"ruta" | "enfoque" | "vibrante" | "plana">("ruta");

  // New Google Account connection states
  const [googleAccount, setGoogleAccount] = useState<{ name: string; email: string; avatarId: number; uid?: string } | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);

  // Ensure DOM-based scripts run after React mounts (loads ./main.js)
  useEffect(() => {
    import('./main.js')
      .then(() => {
        // loaded
      })
      .catch((err) => console.error('Error loading main.js', err));
  }, []);

  // Listen for `loadVideo` events emitted by DOM scripts and play via React handler
  useEffect(() => {
    const onLoadVideo = (e: any) => {
      const id = e?.detail?.id;
      if (!id) return;

      const found = CURATED_TRACKS.find(t => t.id === id);
      const trackToPlay = found || {
        id,
        title: `Pista ${id}`,
        artist: 'YouTube',
        duration: 'Desconocida',
        category: 'Custom',
        thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`
      };

      handlePlayTrack(trackToPlay as Track);
    };

    document.addEventListener('loadVideo', onLoadVideo as EventListener);
    return () => document.removeEventListener('loadVideo', onLoadVideo as EventListener);
  }, [history, favorites, playlists]);

  // Authenticated state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Load or create User profile document in Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        let userData;
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            userData = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || "Usuario de Google",
              email: firebaseUser.email || "",
              avatarId: 1,
              updatedAt: serverTimestamp()
            };
            await setDoc(userRef, userData);
          } else {
            userData = userSnap.data();
          }
        } catch (e) {
          console.error("Error setting up user profile in Firestore: ", e);
        }

        setGoogleAccount({
          name: userData?.name || firebaseUser.displayName || "Usuario de Google",
          email: userData?.email || firebaseUser.email || "",
          avatarId: userData?.avatarId || 1,
          uid: firebaseUser.uid
        });
      } else {
        setGoogleAccount(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    if (!googleAccount?.uid) {
      // Offline loads
      const savedFavorites = localStorage.getItem("yt_music_favorites");
      const savedHistory = localStorage.getItem("yt_music_history");
      const savedPlaylists = localStorage.getItem("yt_music_playlists");
      const savedCarMode = localStorage.getItem("yt_music_carmode");
      const savedNormalizing = localStorage.getItem("yt_music_is_normalizing");
      const savedNormLevel = localStorage.getItem("yt_music_norm_level");
      const savedEqPreset = localStorage.getItem("yt_music_eq_preset");

      if (savedFavorites) {
        try { setFavorites(JSON.parse(savedFavorites)); } catch (e) {}
      }
      if (savedHistory) {
        try { setHistory(JSON.parse(savedHistory)); } catch (e) {}
      }
      if (savedPlaylists) {
        try { setPlaylists(JSON.parse(savedPlaylists)); } catch (e) {}
      } else {
        const initialPlaylists: CustomPlaylist[] = [
          { id: "playlist-auto", name: "Ruta 66 - Conducción", videoIds: ["g4mQ9_vXb0Y", "3W_X0-iEp-o", "S9Sg_v0_d6I"] },
          { id: "playlist-relax", name: "Estudiar y Enfocarse", videoIds: ["jfKfPfyJRdk", "tntOCGkgt98"] }
        ];
        setPlaylists(initialPlaylists);
        localStorage.setItem("yt_music_playlists", JSON.stringify(initialPlaylists));
      }
      if (savedCarMode) {
        setCarMode(savedCarMode === "true");
      }
      if (savedNormalizing) {
        setIsNormalizing(savedNormalizing === "true");
      }
      if (savedNormLevel) {
        setNormalizationLevel(savedNormLevel as any);
      }
      if (savedEqPreset) {
        setEqPreset(savedEqPreset as any);
      }
      return;
    }

    const userId = googleAccount.uid;

    // 1. Listen to Favorites and Sync to local State
    const favsRef = collection(db, "users", userId, "favorites");
    const unsubFavs = onSnapshot(favsRef, (snapshot) => {
      const list: string[] = [];
      snapshot.forEach((d) => {
        list.push(d.id);
      });
      setFavorites(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/favorites`);
    });

    // 2. Listen to Playlists and Sync to local State
    const playlistsRef = collection(db, "users", userId, "playlists");
    const unsubPlaylists = onSnapshot(playlistsRef, (snapshot) => {
      const list: CustomPlaylist[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          name: data.name,
          videoIds: data.videoIds || []
        });
      });
      setPlaylists(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/playlists`);
    });

    // 3. Listen to History and Sync to local State
    const historyRef = collection(db, "users", userId, "history");
    const unsubHistory = onSnapshot(historyRef, (snapshot) => {
      const list: Track[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: data.id,
          title: data.title,
          artist: data.artist,
          duration: data.duration,
          category: data.category as any,
          thumbnailUrl: data.thumbnailUrl
        });
      });
      setHistory(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/history`);
    });

    // 4. Listen to Settings and Sync to local State
    const settingsRef = doc(db, "users", userId, "settings", "player");
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.carMode !== undefined) setCarMode(data.carMode);
        if (data.isNormalizing !== undefined) setIsNormalizing(data.isNormalizing);
        if (data.normalizationLevel !== undefined) setNormalizationLevel(data.normalizationLevel);
        if (data.eqPreset !== undefined) setEqPreset(data.eqPreset);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/settings/player`);
    });

    return () => {
      unsubFavs();
      unsubPlaylists();
      unsubHistory();
      unsubSettings();
    };
  }, [googleAccount?.uid]);

  // General server-side settings updater helper
  const updateSettingsOnServer = async (fields: any) => {
    if (googleAccount?.uid) {
      const path = `users/${googleAccount.uid}/settings/player`;
      try {
        await setDoc(doc(db, "users", googleAccount.uid, "settings", "player"), {
          carMode: fields.carMode !== undefined ? fields.carMode : carMode,
          isNormalizing: fields.isNormalizing !== undefined ? fields.isNormalizing : isNormalizing,
          normalizationLevel: fields.normalizationLevel !== undefined ? fields.normalizationLevel : normalizationLevel,
          eqPreset: fields.eqPreset !== undefined ? fields.eqPreset : eqPreset,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, path);
      }
    }
  };

  // Sync helpers
  const syncFavorites = (newFavs: string[]) => {
    setFavorites(newFavs);
    localStorage.setItem("yt_music_favorites", JSON.stringify(newFavs));
  };

  const syncHistory = (newHistory: Track[]) => {
    setHistory(newHistory);
    localStorage.setItem("yt_music_history", JSON.stringify(newHistory));
  };

  const syncPlaylists = (newPlaylists: CustomPlaylist[]) => {
    setPlaylists(newPlaylists);
    localStorage.setItem("yt_music_playlists", JSON.stringify(newPlaylists));
  };

  const toggleCarMode = () => {
    const nextMode = !carMode;
    setCarMode(nextMode);
    localStorage.setItem("yt_music_carmode", String(nextMode));
    updateSettingsOnServer({ carMode: nextMode });
  };

  const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

  const mapYoutubeItemToTrack = (item: any): Track => ({
    id: item.id.videoId,
    title: item.snippet.title,
    artist: item.snippet.channelTitle || "YouTube Music",
    duration: "Desconocida",
    category: "Custom",
    thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || ""
  });

  // Fetch search results directly from YouTube Data API
  const handleOnlineSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!onlineSearchQuery.trim()) return;

    setIsSearchingOnline(true);
    setOnlineSearchError("");

    if (!YOUTUBE_API_KEY) {
      setOnlineSearchError("No se ha configurado la API de YouTube. Añade VITE_YOUTUBE_API_KEY en .env.");
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    try {
      const query = `${onlineSearchQuery.trim()} music`;
      const url = `${YOUTUBE_SEARCH_URL}?part=snippet&type=video&videoCategoryId=10&maxResults=10&q=${encodeURIComponent(query)}&key=${encodeURIComponent(YOUTUBE_API_KEY)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`YouTube API error ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data.items) || data.items.length === 0) {
        setOnlineSearchError("No se encontraron resultados en YouTube Music.");
        setOnlineResults([]);
      } else {
        const results: Track[] = data.items
          .filter((item: any) => item.id?.videoId && item.snippet)
          .map(mapYoutubeItemToTrack)
          .filter((track) => track.id && track.thumbnailUrl);

        if (results.length === 0) {
          setOnlineSearchError("No se encontraron resultados en YouTube Music.");
          setOnlineResults([]);
        } else {
          setOnlineResults(results);
        }
      }
    } catch (err: any) {
      console.error(err);
      setOnlineSearchError(err instanceof Error ? err.message : "Error al conectar con YouTube.");
      const queryClean = onlineSearchQuery.trim();
      setOnlineResults([
        {
          id: "jfKfPfyJRdk",
          title: `${queryClean} (Inteli-Mix Rework)`,
          artist: "Catalog Streamer",
          duration: "03:45",
          category: "Lofi / Relax",
          thumbnailUrl: "https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg"
        },
        {
          id: "FT33A7CIsr8",
          title: `${queryClean} (Live Version Mix)`,
          artist: "Pop Party Station",
          duration: "05:12",
          category: "Pop / Electro",
          thumbnailUrl: "https://img.youtube.com/vi/FT33A7CIsr8/hqdefault.jpg"
        }
      ]);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // Google Account simulated login replaced with real Google OAuth Popup Sign In
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      let finalUserData;
      if (!userSnap.exists()) {
        finalUserData = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || "Usuario de Google",
          email: firebaseUser.email || "",
          avatarId: 1,
          updatedAt: serverTimestamp()
        };
        await setDoc(userRef, finalUserData);
        
        // Push initial local collections to Firestore to prevent data loss!
        // Favorites
        for (const favId of favorites) {
          await setDoc(doc(db, "users", firebaseUser.uid, "favorites", favId), {
            id: favId,
            createdAt: serverTimestamp()
          });
        }
        // History
        for (const hist of history) {
          await setDoc(doc(db, "users", firebaseUser.uid, "history", hist.id), {
            id: hist.id,
            title: hist.title,
            artist: hist.artist,
            duration: hist.duration,
            category: hist.category,
            thumbnailUrl: hist.thumbnailUrl,
            timestamp: serverTimestamp()
          });
        }
        // Playlists
        for (const pl of playlists) {
          await setDoc(doc(db, "users", firebaseUser.uid, "playlists", pl.id), {
            id: pl.id,
            name: pl.name,
            videoIds: pl.videoIds,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        // Settings
        await setDoc(doc(db, "users", firebaseUser.uid, "settings", "player"), {
          carMode,
          isNormalizing,
          normalizationLevel,
          eqPreset,
          updatedAt: serverTimestamp()
        });
      } else {
        finalUserData = userSnap.data();
      }

      const accInfo = {
        name: finalUserData.name || firebaseUser.displayName || "Usuario de Google",
        email: finalUserData.email || firebaseUser.email || "",
        avatarId: finalUserData.avatarId || 1,
        uid: firebaseUser.uid
      };
      setGoogleAccount(accInfo);
      localStorage.setItem("yt_music_google_account", JSON.stringify(accInfo));
      setLoginModalOpen(false);
    } catch (err) {
      console.error("Google Sign-In Error: ", err);
      alert("Hubo un error al iniciar sesión con Google. Inténtalo de nuevo.");
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await signOut(auth);
      setGoogleAccount(null);
      localStorage.removeItem("yt_music_google_account");
    } catch (err) {
      console.error("Logout Error: ", err);
    }
  };

  // Safe toggling functions for local state persistence
  const handleToggleNormalization = () => {
    const nextVal = !isNormalizing;
    setIsNormalizing(nextVal);
    localStorage.setItem("yt_music_is_normalizing", String(nextVal));
    updateSettingsOnServer({ isNormalizing: nextVal });
  };

  const handleSetNormalizationLevel = (level: "bajo" | "medio" | "alto") => {
    setNormalizationLevel(level);
    localStorage.setItem("yt_music_norm_level", level);
    updateSettingsOnServer({ normalizationLevel: level });
  };

  const handleSetEqPreset = (preset: "ruta" | "enfoque" | "vibrante" | "plana") => {
    setEqPreset(preset);
    localStorage.setItem("yt_music_eq_preset", preset);
    updateSettingsOnServer({ eqPreset: preset });
  };

  // Extract YouTube ID from various link styles
  const extractVideoId = (url: string): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|music.youtube.com\/watch\?v=)([^#\&\?]*).*/;
      const match = trimmed.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    } catch (e) {
      return null;
    }
  };

  // Play a track, handles history log
  const handlePlayTrack = async (track: Track) => {
    setCurrentTrack(track);
    if (!carMode) {
      setActiveTab("player");
    }
    
    if (googleAccount?.uid) {
      const path = `users/${googleAccount.uid}/history/${track.id}`;
      try {
        await setDoc(doc(db, "users", googleAccount.uid, "history", track.id), {
          id: track.id,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          category: track.category,
          thumbnailUrl: track.thumbnailUrl,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, path);
      }
    } else {
      // Add to History
      const filteredHistory = history.filter(item => item.id !== track.id);
      const updatedHistory = [track, ...filteredHistory].slice(0, 40);
      syncHistory(updatedHistory);
    }
  };

  // Handle URL submit
  const handleUrlSubmit = (e: FormEvent) => {
    e.preventDefault();
    const id = extractVideoId(inputUrl);
    if (!id) {
      alert("Por favor introduce un enlace o ID de YouTube Music válido.");
      return;
    }

    const newTitle = customTitle.trim() || `Pista Personalizada (${id})`;
    const artistText = customArtist.trim() || "Artista Desconocido";
    const customTrack: Track = {
      id,
      title: newTitle,
      artist: artistText,
      duration: "Ajustable",
      category: "Custom",
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    };

    setInputUrl("");
    setCustomTitle("");
    setCustomArtist("");
    handlePlayTrack(customTrack);
  };

  // Toggle Favorite
  const handleToggleFavorite = async (trackId: string) => {
    const isFav = favorites.includes(trackId);
    if (googleAccount?.uid) {
      const path = `users/${googleAccount.uid}/favorites/${trackId}`;
      try {
        if (isFav) {
          await deleteDoc(doc(db, "users", googleAccount.uid, "favorites", trackId));
        } else {
          await setDoc(doc(db, "users", googleAccount.uid, "favorites", trackId), {
            id: trackId,
            createdAt: serverTimestamp()
          });
        }
      } catch (e) {
        handleFirestoreError(e, isFav ? OperationType.DELETE : OperationType.CREATE, path);
      }
    } else {
      if (isFav) {
        syncFavorites(favorites.filter(id => id !== trackId));
      } else {
        syncFavorites([...favorites, trackId]);
      }
    }
  };

  // Create Playlist
  const handleCreatePlaylist = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    
    const newId = "playlist-" + Date.now();
    const newPlaylist: CustomPlaylist = {
      id: newId,
      name: newPlaylistName.trim(),
      videoIds: []
    };

    if (googleAccount?.uid) {
      const path = `users/${googleAccount.uid}/playlists/${newId}`;
      try {
        await setDoc(doc(db, "users", googleAccount.uid, "playlists", newId), {
          id: newId,
          name: newPlaylist.name,
          videoIds: newPlaylist.videoIds,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, path);
      }
    } else {
      syncPlaylists([...playlists, newPlaylist]);
    }
    setNewPlaylistName("");
  };

  // Add track to custom Playlist
  const handleAddTrackToPlaylist = async (playlistId: string) => {
    if (!trackToPlaylist) return;
    
    if (googleAccount?.uid) {
      const path = `users/${googleAccount.uid}/playlists/${playlistId}`;
      try {
        const playlistDoc = doc(db, "users", googleAccount.uid, "playlists", playlistId);
        const updatedVideoIds = playlists.find(pl => pl.id === playlistId)?.videoIds || [];
        if (!updatedVideoIds.includes(trackToPlaylist.id)) {
          const newList = [...updatedVideoIds, trackToPlaylist.id];
          await updateDoc(playlistDoc, {
            videoIds: newList,
            updatedAt: serverTimestamp()
          });
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, path);
      }
    } else {
      const updated = playlists.map(pl => {
        if (pl.id === playlistId) {
          if (!pl.videoIds.includes(trackToPlaylist.id)) {
            return { ...pl, videoIds: [...pl.videoIds, trackToPlaylist.id] };
          }
        }
        return pl;
      });
      syncPlaylists(updated);
    }
    setPlaylistModalOpen(false);
    setTrackToPlaylist(null);
  };

  // Delete Playlist
  const handleDeletePlaylist = async (playlistId: string) => {
    if (googleAccount?.uid) {
      const path = `users/${googleAccount.uid}/playlists/${playlistId}`;
      try {
        await deleteDoc(doc(db, "users", googleAccount.uid, "playlists", playlistId));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
      }
    } else {
      syncPlaylists(playlists.filter(p => p.id !== playlistId));
    }
  };

  // Remove track from playlist
  const handleRemoveFromPlaylist = async (playlistId: string, trackId: string) => {
    if (googleAccount?.uid) {
      const path = `users/${googleAccount.uid}/playlists/${playlistId}`;
      try {
        const playlistDoc = doc(db, "users", googleAccount.uid, "playlists", playlistId);
        const currentList = playlists.find(pl => pl.id === playlistId)?.videoIds || [];
        const newList = currentList.filter(id => id !== trackId);
        await updateDoc(playlistDoc, {
          videoIds: newList,
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, path);
      }
    } else {
      syncPlaylists(playlists.map(pl => {
        if (pl.id === playlistId) {
          return { ...pl, videoIds: pl.videoIds.filter(id => id !== trackId) };
        }
        return pl;
      }));
    }
  };

  // Calculate ordered tracks based on authentication state and history
  const getComputedTracks = (): Track[] => {
    if (!googleAccount?.uid || history.length === 0) {
      return CURATED_TRACKS;
    }

    // Count occurrences of categories and artists in history
    const categoryCounts: Record<string, number> = {};
    const artistCounts: Record<string, number> = {};

    history.forEach(track => {
      if (track.category) {
        categoryCounts[track.category] = (categoryCounts[track.category] || 0) + 1;
      }
      if (track.artist) {
        artistCounts[track.artist] = (artistCounts[track.artist] || 0) + 1;
      }
    });

    // Sort categories by frequency
    const sortedCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    // Sort artists by frequency
    const sortedArtists = Object.entries(artistCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    // Score all curated tracks based on user history preferences
    const scoredTracks = CURATED_TRACKS.map(track => {
      let score = 0;
      
      const catIndex = sortedCategories.indexOf(track.category);
      if (catIndex !== -1) {
        score += (sortedCategories.length - catIndex) * 15;
      }

      const artistIndex = sortedArtists.indexOf(track.artist);
      if (artistIndex !== -1) {
        score += (sortedArtists.length - artistIndex) * 8;
      }

      // Small freshness boost / penalty to keep it interesting
      const playedIndex = history.findIndex(h => h.id === track.id);
      if (playedIndex !== -1) {
        score -= Math.max(2, 12 - playedIndex); // recently played gets penalized slightly
      } else {
        score += 5; // non-played gets a discovery boost!
      }

      return { track, score };
    });

    return scoredTracks
      .sort((a, b) => b.score - a.score)
      .map(item => item.track);
  };

  const computedSelection = getComputedTracks();

  // Skip tracks (for Android Auto Queue controller or Curated controls)
  const handleNextTrack = () => {
    const listToSearch = computedSelection;
    const currentIndex = listToSearch.findIndex(t => t.id === currentTrack.id);
    if (currentIndex !== -1 && currentIndex < listToSearch.length - 1) {
      handlePlayTrack(listToSearch[currentIndex + 1]);
    } else {
      // Loop back to start
      handlePlayTrack(listToSearch[0]);
    }
  };

  const handlePrevTrack = () => {
    const listToSearch = computedSelection;
    const currentIndex = listToSearch.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      handlePlayTrack(listToSearch[currentIndex - 1]);
    } else {
      // Loop to end
      handlePlayTrack(listToSearch[listToSearch.length - 1]);
    }
  };

  // Track categories list
  const categoriesList = ["Todos", "Lofi / Relax", "Energía / Gym", "Pop / Electro", "Retro / Clásico", "Urbano / Latino", "Custom"];
  
  const filteredCurated = computedSelection.filter(track => {
    const matchesCategory = selectedCategory === "Todos" || track.category === selectedCategory;
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col selection:bg-rose-600 selection:text-white">
      
      {/* -------------------- STANDARD MODE INTERFACE -------------------- */}
      {!carMode && (
        <div className="flex-1 flex flex-col">
          {/* Upper Navigation Header */}
          <nav id="navbar" className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3 sm:px-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-900/30">
                <Music className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold tracking-tight text-lg">CleanTune Play</span>
                  <span className="bg-rose-950 border border-rose-900/60 text-rose-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider hidden sm:inline">
                    AdBlock Pro
                  </span>
                </div>
                <p className="text-xs text-neutral-400 hidden sm:block">Consola de Música Especializada</p>
              </div>
            </div>

            {/* Top Toolbar controls */}
            <div className="flex items-center space-x-3">
              {googleAccount ? (
                <div className="flex items-center space-x-2 bg-neutral-800 border border-neutral-700/80 px-3 py-1.5 rounded-xl text-xs">
                  <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center font-bold text-white text-[10px] uppercase">
                    {googleAccount.name[0]}
                  </div>
                  <div className="hidden sm:block text-left max-w-[120px]">
                    <p className="font-bold text-neutral-100 truncate leading-tight">{googleAccount.name}</p>
                    <p className="text-[9px] text-emerald-400 truncate font-semibold">YT Music Sync</p>
                  </div>
                  <button 
                    onClick={handleGoogleLogout}
                    className="p-1 text-neutral-400 hover:text-rose-400 transition-colors ml-1 cursor-pointer"
                    title="Desconectar Cuenta de Google"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setLoginModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-2.5 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 hover:border-rose-500/30 text-neutral-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  title="Enlazar con tu cuenta de Google"
                >
                  <User className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline">Acceso Google</span>
                </button>
              )}

              {/* Android Auto Activator Toggle */}
              <button 
                onClick={toggleCarMode}
                className="flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/20 transition-all cursor-pointer border border-rose-500/30 animate-pulse hover:animate-none"
                title="Modo Consola Android Auto"
              >
                <Car className="w-4 h-4" />
                <span className="hidden sm:inline">Modo Android Auto</span>
                <span className="inline sm:hidden">Auto Mode</span>
              </button>

              <button 
                id="btn-info"
                onClick={() => setInfoModalOpen(true)}
                className="p-2 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700/80 rounded-xl border border-neutral-700/50 transition-all cursor-pointer"
                title="Guía de Instalación Móvil"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          </nav>

          {/* Main App Workspace */}
          <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 md:py-8 flex flex-col md:flex-row gap-6 pb-24 md:pb-8">
            
            {/* Sidebar Navigation */}
            <aside id="sidebar" className="hidden md:flex flex-col w-64 shrink-0 space-y-5">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4">
                <h2 className="text-[11px] font-bold text-neutral-450 uppercase tracking-widest px-2">Categorías principales</h2>
                <nav className="space-y-1">
                  <button 
                    onClick={() => setActiveTab("discover")}
                    className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === "discover" 
                        ? "bg-rose-600/10 text-rose-400 border-l-2 border-rose-500" 
                        : "text-neutral-300 hover:bg-neutral-800 cursor-pointer"
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                    <span>Explorar Música</span>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab("player")}
                    className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === "player" 
                        ? "bg-rose-600/10 text-rose-400 border-l-2 border-rose-500" 
                        : "text-neutral-300 hover:bg-neutral-800 cursor-pointer"
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    <span>Reproductor Música</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab("playlists")}
                    className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === "playlists" 
                        ? "bg-rose-600/10 text-rose-400 border-l-2 border-rose-500" 
                        : "text-neutral-300 hover:bg-neutral-800 cursor-pointer"
                    }`}
                  >
                    <ListMusic className="w-4 h-4" />
                    <span>Mis Álbumes & Listas</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab("history")}
                    className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === "history" 
                        ? "bg-rose-600/10 text-rose-400 border-l-2 border-rose-500" 
                        : "text-neutral-300 hover:bg-neutral-800 cursor-pointer"
                    }`}
                  >
                    <HistoryIcon className="w-4 h-4" />
                    <span>Escuchados Recientes</span>
                  </button>
                </nav>
              </div>

              {/* Paste Direct Track / Song */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center space-x-2 text-rose-450 font-bold">
                  <Plus className="w-4.5 h-4.5" />
                  <h3 className="text-sm">Añadir Vídeo / Enlace</h3>
                </div>
                <p className="text-xs text-neutral-400">Inserta enlaces completos de YouTube Music o YouTube normal.</p>
                
                <form onSubmit={handleUrlSubmit} className="space-y-2.5">
                  <input 
                    type="text" 
                    placeholder="https://music.youtube.com/..." 
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-neutral-100"
                    required
                  />
                  <input 
                    type="text" 
                    placeholder="Título de la canción..." 
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-rose-500 text-neutral-100"
                  />
                  <input 
                    type="text" 
                    placeholder="Artista / Grupo..." 
                    value={customArtist}
                    onChange={(e) => setCustomArtist(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-rose-500 text-neutral-100"
                  />
                  <button 
                    type="submit" 
                    className="w-full bg-neutral-800 hover:bg-rose-600 text-white py-2 rounded-xl text-xs font-bold transition-all border border-neutral-700/60 hover:border-rose-500/50 cursor-pointer shadow-md"
                  >
                    Cargar y Reproducir
                  </button>
                </form>
              </div>
            </aside>

            {/* Middle Section Content */}
            <main id="tab-content" className="flex-1 min-w-0">
              
              {/* 1. DISCOVER / EXPLORER SONGS */}
              {activeTab === "discover" && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  {/* Clean Launcher Card with Info */}
                  <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                      <Music className="w-56 h-56 text-rose-500" />
                    </div>
                    
                    <div className="max-w-2xl space-y-3 relative z-10">
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Sin cortes publicitarios con Brave Browser Escudos</span>
                      </div>
                      
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                        Tu música preferida de YouTube sin interrupciones
                      </h1>
                      
                      <p className="text-sm text-neutral-400 leading-relaxed text-balance">
                        Diseñado especialmente para correr de forma impecable en navegadores de celular como <strong>Brave</strong>, lo que permite omitir anuncios comerciales automáticos. Ideal para escuchar tus listados favoritos durante viajes prolongados, caminatas o en el auto.
                      </p>
                      
                      <div className="pt-2 flex flex-wrap gap-2.5">
                        <button 
                          onClick={toggleCarMode}
                          className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4.5 py-3 rounded-xl transition-all shadow-lg shadow-rose-950/30 flex items-center space-x-2 cursor-pointer"
                        >
                          <Car className="w-4 h-4" />
                          <span>Activar Consola de Auto</span>
                        </button>
                        
                        <button 
                          onClick={() => setInfoModalOpen(true)}
                          className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold px-4 py-3 rounded-xl border border-neutral-700/60 transition-all flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Instalar en Teléfono</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* YouTube Music Online Catalog Search Interface */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                        <Youtube className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white tracking-wide uppercase">Buscador Inteligente YouTube Music</h2>
                        <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Accede a todo el cátalogo online mundial</p>
                      </div>
                    </div>

                    <form onSubmit={handleOnlineSearch} className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Busca cualquier canción, álbum o artista en vivo (ej: Queen, Dua Lipa, Lofi beats)..."
                        value={onlineSearchQuery}
                        onChange={(e) => setOnlineSearchQuery(e.target.value)}
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-neutral-100 placeholder-neutral-500"
                      />
                      <button 
                        type="submit"
                        disabled={isSearchingOnline}
                        className="bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-800 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center space-x-1"
                      >
                        {isSearchingOnline ? (
                          <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                        <span>{isSearchingOnline ? 'Buscando...' : 'Buscar Online'}</span>
                      </button>
                    </form>

                    {/* Local catalog quick search (DOM-friendly elements) */}
                    <div className="mt-4">
                      <div className="search-wrapper mx-auto relative">
                        <input
                          id="search-input"
                          type="text"
                          placeholder="Buscar en catálogo local..."
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-full px-4 py-3 text-sm focus:outline-none text-neutral-100 placeholder-neutral-500"
                          onChange={(e) => setSearchQuery(e.target.value)}
                          value={searchQuery}
                        />
                        <button id="clear-search" aria-label="Limpiar búsqueda" onClick={() => { setSearchQuery(''); }}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {categoriesList.map((cat) => (
                          <button
                            key={cat}
                            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                            data-category={cat}
                            onClick={() => { setSelectedCategory(cat); }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div id="search-results" className="mt-4" />
                    </div>

                    {onlineSearchError && (
                      <p className="text-xs text-rose-400 font-semibold">{onlineSearchError}</p>
                    )}

                    {/* Online Results List */}
                    {onlineResults.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                          <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest">Resultados del catálogo online</span>
                          <button 
                            onClick={() => setOnlineResults([])} 
                            className="text-[10px] text-neutral-450 hover:text-white font-semibold cursor-pointer"
                          >
                            Limpiar búsqueda
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {onlineResults.map((track) => {
                            const isFav = favorites.includes(track.id);
                            return (
                              <div 
                                key={track.id}
                                className="bg-neutral-950/85 hover:bg-neutral-950 px-3.5 py-2.5 rounded-2xl border border-neutral-850 hover:border-neutral-700 transition-all flex items-center justify-between gap-4"
                              >
                                <div 
                                  onClick={() => handlePlayTrack(track)}
                                  className="flex items-center space-x-3 cursor-pointer min-w-0 flex-1 group"
                                >
                                  <div className="w-12 h-9 rounded-lg overflow-hidden bg-neutral-900 shrink-0 relative border border-neutral-800">
                                    <img src={track.thumbnailUrl} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Play className="w-4 h-4 text-white fill-current" />
                                    </div>
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-neutral-100 line-clamp-1 group-hover:text-rose-400 transition-all leading-tight">
                                      {track.title}
                                    </h4>
                                    <p className="text-[10px] text-neutral-400 font-bold">{track.artist} • <span className="text-neutral-500">{track.duration}</span></p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1.5 shrink-0">
                                  <button 
                                    onClick={() => {
                                      setTrackToPlaylist(track);
                                      setPlaylistModalOpen(true);
                                    }}
                                    className="p-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-300 rounded-lg transition-all cursor-pointer"
                                    title="Añadir a lista"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleToggleFavorite(track.id)}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                      isFav ? "text-rose-500 bg-rose-500/10 border-rose-500/35" : "text-neutral-400 bg-neutral-900 border-neutral-800 hover:text-white"
                                    }`}
                                  >
                                    <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Search and Quick Filters bar */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Search */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400" />
                        <input 
                          type="text" 
                          placeholder="Buscar por canción, género, banda o artista..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10.5 pr-4 py-3 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-neutral-100 placeholder-neutral-500"
                        />
                      </div>

                      {/* URL Paste Trigger for Mobiles */}
                      <div className="md:hidden">
                        <button 
                          onClick={() => {
                            const url = prompt("Pega el enlace de la canción (YouTube / YT Music):");
                            if (url) {
                              const id = extractVideoId(url);
                              if (id) {
                                const titlePrompt = prompt("Título de la canción:", "Pista Importada");
                                const artistPrompt = prompt("Artista:", "Desconocido");
                                handlePlayTrack({
                                  id,
                                  title: titlePrompt || "Pista Importada",
                                  artist: artistPrompt || "Desconocido",
                                  duration: "Ajustable",
                                  category: "Custom",
                                  thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`
                                });
                              } else {
                                alert("Enlace no válido. Asegúrate de copiarlo correctamente.");
                              }
                            }
                          }}
                          className="w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-4 py-3 rounded-xl text-sm font-bold text-neutral-300 transition-all flex items-center justify-center space-x-2"
                        >
                          <Plus className="w-4 h-4 text-rose-500" />
                          <span>Pegar URL Externa</span>
                        </button>
                      </div>
                    </div>

                    {/* Styled Category Quick Tabs */}
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      {categoriesList.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            selectedCategory === cat 
                              ? "bg-rose-600 text-white shadow-md shadow-rose-950/20" 
                              : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 border border-neutral-800"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Curated Grid Shelf */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-900 pb-3 gap-2">
                      <div className="space-y-1">
                        <h2 className="text-sm font-bold text-neutral-300 uppercase tracking-widest flex items-center space-x-2">
                          {googleAccount?.uid ? (
                            <>
                              <Sparkles className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
                              <span>Recomendaciones para Ti</span>
                            </>
                          ) : (
                            <>
                              <Globe className="w-4.5 h-4.5 text-rose-500" />
                              <span>Sugerencias Globales</span>
                            </>
                          )}
                        </h2>
                        <p className="text-[10px] text-neutral-450 font-semibold uppercase tracking-wider leading-relaxed">
                          {googleAccount?.uid ? (
                            history.length === 0 
                              ? "Escucha pistas para personalizar tus recomendaciones inteligentes" 
                              : "Acorde al historial de lo que has escuchado recientemente"
                          ) : (
                            "Sugerencias más populares libres para todos los oyentes"
                          )}
                        </p>
                      </div>
                      <span className="text-xs bg-neutral-900 border border-neutral-850 text-neutral-400 px-3 py-1 rounded-full font-mono shrink-0 select-none">
                        {filteredCurated.length} canciones
                      </span>
                    </div>

                    {filteredCurated.length === 0 ? (
                      <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-12 text-center">
                        <p className="text-neutral-400 text-sm">No se encontraron pistas con tus términos de selección.</p>
                        <button 
                          onClick={() => { setSelectedCategory("Todos"); setSearchQuery(""); }} 
                          className="mt-3 text-xs text-rose-400 hover:underline font-bold"
                        >
                          Mostrar todas las canciones
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredCurated.map((track) => {
                          const isFav = favorites.includes(track.id);
                          return (
                            <div 
                              key={track.id} 
                              className="group bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 rounded-2xl overflow-hidden shadow-sm transition-all flex flex-col"
                            >
                              {/* Album / Artwork Preview Container */}
                              <div className="relative aspect-video bg-neutral-950 overflow-hidden shrink-0">
                                <img 
                                  src={track.thumbnailUrl} 
                                  alt={track.title} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                />
                                
                                {/* Overlay play button */}
                                <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                  <button 
                                    onClick={() => handlePlayTrack(track)}
                                    className="w-12 h-12 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                                  >
                                    <Play className="w-5 h-5 fill-current ml-0.5" />
                                  </button>
                                </div>

                                <span className="absolute bottom-2.5 right-2.5 bg-neutral-950/80 px-2 py-0.5 rounded-lg text-[10px] font-mono text-neutral-300 border border-neutral-800">
                                  {track.duration}
                                </span>
                                
                                <span className="absolute top-2.5 left-2.5 bg-neutral-950/80 text-rose-400 border border-neutral-800 px-2.5 py-0.5 rounded-lg text-[10px] font-bold">
                                  {track.category}
                                </span>
                              </div>

                              {/* Details information */}
                              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                <div className="space-y-1">
                                  <h3 
                                    onClick={() => handlePlayTrack(track)}
                                    className="text-xs font-bold text-neutral-200 line-clamp-2 hover:text-rose-400 transition-all cursor-pointer leading-relaxed"
                                  >
                                    {track.title}
                                  </h3>
                                  <p className="text-[11px] text-neutral-450 font-semibold">{track.artist}</p>
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-neutral-900/60">
                                  <button 
                                    onClick={() => handlePlayTrack(track)}
                                    className="text-xs text-rose-400 font-bold hover:text-rose-300 flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Play className="w-3.5 h-3.5" />
                                    <span>Escuchar</span>
                                  </button>
                                  
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => {
                                        setTrackToPlaylist(track);
                                        setPlaylistModalOpen(true);
                                      }}
                                      className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-all"
                                      title="Añadir a un Álbum / Lista"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>

                                    <button 
                                      onClick={() => handleToggleFavorite(track.id)}
                                      className={`p-1.5 rounded-lg transition-all ${
                                        isFav ? "text-rose-500 bg-rose-500/10" : "text-neutral-400 hover:text-neutral-200 bg-neutral-800 hover:bg-neutral-700"
                                      }`}
                                      title={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
                                    >
                                      <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* 2. REPRODUCTOR COMPLETO SCREEN */}
              {activeTab === "player" && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-5"
                >
                  <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex flex-col md:flex-row gap-5 items-center justify-between">
                    <div className="flex items-center space-x-4 min-w-0 w-full md:w-auto">
                      <div className="w-14 h-14 bg-neutral-950 rounded-xl overflow-hidden shrink-0 border border-neutral-850">
                        <img 
                          src={currentTrack.thumbnailUrl} 
                          alt={currentTrack.title} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] bg-emerald-950 border border-emerald-900 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider block w-max mb-1">
                          En reproducción limpia
                        </span>
                        <h2 className="text-sm font-extrabold text-neutral-100 line-clamp-1">{currentTrack.title}</h2>
                        <p className="text-xs text-neutral-400">{currentTrack.artist} • {currentTrack.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 shrink-0 w-full md:w-auto justify-end">
                      <button 
                        onClick={() => handleToggleFavorite(currentTrack.id)}
                        className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs rounded-xl transition-all font-bold cursor-pointer ${
                          favorites.includes(currentTrack.id) 
                            ? "bg-rose-600/15 text-rose-400 border border-rose-500/30" 
                            : "bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${favorites.includes(currentTrack.id) ? "fill-current" : ""}`} />
                        <span>Inoculado</span>
                      </button>

                      <button 
                        onClick={() => {
                          setTrackToPlaylist(currentTrack);
                          setPlaylistModalOpen(true);
                        }}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Guardar</span>
                      </button>

                      <button 
                        onClick={toggleCarMode}
                        className="bg-neutral-800 hover:bg-rose-600 hover:text-white text-neutral-300 border border-neutral-700 px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                        title="Ir a panel Android Auto"
                      >
                        <Car className="w-4 h-4 text-rose-500" />
                        <span className="hidden sm:inline">Consola Auto</span>
                      </button>
                    </div>
                  </div>

                  {/* Clean YouTube Iframe viewport */}
                  <div className="relative aspect-video bg-neutral-950 border border-neutral-850 shadow-2xl rounded-2xl overflow-hidden group">
                    <iframe 
                      key={currentTrack.id}
                      id="youtube-player-frame"
                      title={currentTrack.title}
                      // YouTube-nocookie prevents major tracking algorithms and is easier for Brave to block ads on.
                      src={`https://www.youtube-nocookie.com/embed/${currentTrack.id}?autoplay=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&fs=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    ></iframe>
                  </div>

                  {/* Console Media Buttons helper bar */}
                  <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={handlePrevTrack} 
                        className="p-3 bg-neutral-950 hover:bg-neutral-850 rounded-xl text-neutral-300 hover:text-rose-450 border border-neutral-850 transition-all cursor-pointer"
                        title="Pista Anterior"
                      >
                        <SkipBack className="w-5 h-5" />
                      </button>

                      <span className="text-xs text-neutral-400 font-bold px-3">
                        Controles de Reproducción
                      </span>

                      <button 
                        onClick={handleNextTrack} 
                        className="p-3 bg-neutral-950 hover:bg-neutral-850 rounded-xl text-neutral-300 hover:text-rose-450 border border-neutral-850 transition-all cursor-pointer"
                        title="Siguiente Pista"
                      >
                        <SkipForward className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="text-xs text-neutral-450 text-center sm:text-right">
                      ¿Problemas de reproducción? Prueba a recargar desde <span className="font-semibold text-rose-400">Brave Browser</span> con escudos ON.
                    </div>
                  </div>

                  {/* Audio Equalizer & Normalization Panel */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-850 pb-3">
                      <div className="flex items-center space-x-2.5">
                        <SlidersHorizontal className="w-5 h-5 text-rose-500" />
                        <div>
                          <h3 className="text-sm font-bold text-white">Normalización de Audio & Ecualización</h3>
                          <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Ajustador de Ganancia de Salida para Ruta</p>
                        </div>
                      </div>

                      {/* Master Toggle */}
                      <button 
                        onClick={handleToggleNormalization}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isNormalizing 
                            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400" 
                            : "bg-neutral-800 border-neutral-700 text-neutral-400"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isNormalizing ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"}`}></span>
                        <span>Normalizador: {isNormalizing ? "ACTIVO" : "APAGADO"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* Audio normalizer level settings */}
                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest block">Rango de Normalización de Volumen</span>
                          <p className="text-xs text-neutral-400">Iguala el volumen para evitar picos estridentes de niveladores deficientes.</p>
                        </div>

                        <div className="flex gap-2.5">
                          {(["bajo", "medio", "alto"] as const).map((level) => (
                            <button
                              key={level}
                              disabled={!isNormalizing}
                              onClick={() => handleSetNormalizationLevel(level)}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer capitalize ${
                                !isNormalizing 
                                  ? "bg-neutral-950 text-neutral-600 border-neutral-900/60 cursor-not-allowed"
                                  : normalizationLevel === level
                                    ? "bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-sm"
                                    : "bg-neutral-950 hover:bg-neutral-850 text-neutral-450 border-neutral-850 hover:text-neutral-300"
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>

                        {/* Sound profile / EQ Preset description */}
                        <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-850 text-xs text-neutral-300 space-y-1">
                          <p className="font-bold flex items-center space-x-1.5 text-rose-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span>
                              {isNormalizing 
                                ? `Estabilizador Activo (Compensación de Ganancia: ${normalizationLevel === "bajo" ? "-2dB" : normalizationLevel === "medio" ? "-4.5dB" : "-7dB"})`
                                : "Sin compresión dinámica de audio."}
                            </span>
                          </p>
                          <p className="text-[11px] text-neutral-450 leading-relaxed">
                            Regula uniformemente pistas en vivo y canciones grabadas a volumen bajo mediante la redirección del rango de ganancia.
                          </p>
                        </div>
                      </div>

                      {/* Equalizer Profile Presets */}
                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest block">Perfil de Ecualización (Presets)</span>
                          <p className="text-xs text-neutral-400">Adapta el espectro acústico al entorno de escucha actual.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: "ruta", label: "Ruta / Auto (Bajos+Voce)", desc: "Optimizado para auto" },
                            { id: "enfoque", label: "Nocturno / Enfoque", desc: "Suave sin agudos" },
                            { id: "vibrante", label: "Vibrante / Pop", desc: "Realza frecuencias" },
                            { id: "plana", label: "Fidelity / Plana", desc: "Sonido original" }
                          ].map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => handleSetEqPreset(preset.id as any)}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                eqPreset === preset.id
                                  ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                                  : "bg-neutral-950 hover:bg-neutral-850 text-neutral-400 border-neutral-850 hover:text-neutral-200"
                              }`}
                            >
                              <p className="text-xs font-bold">{preset.label}</p>
                              <p className="text-[9px] text-neutral-500 leading-none mt-0.5">{preset.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Active equalizer/normalization wave simulation visualizer */}
                    <div className="bg-neutral-950 p-4 border border-neutral-850 rounded-2xl flex items-center justify-between gap-5 overflow-hidden">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-neutral-200">Espectrograma en Tiempo Real (Simulado)</p>
                        <p className="text-[10px] text-neutral-500 font-mono tracking-wider">
                          MODO: {eqPreset.toUpperCase()} • NORMALIZADOR {isNormalizing ? "ON" : "OFF"} ({normalizationLevel.toUpperCase()})
                        </p>
                      </div>

                      {/* Dynamic spectrum bars */}
                      <div className="flex items-end space-x-1.5 h-16 shrink-0 pt-4">
                        {[55, 80, 45, 95, 60, 75, 40, 85, 90, 50, 70, 35].map((val, idx) => {
                          const delayCoeff = idx * 0.08;
                          const durationCoeff = idx % 2 === 0 ? 0.9 : 1.3;
                          return (
                            <motion.div
                              key={idx}
                              animate={{
                                height: isNormalizing ? [4, val / 1.3, 4] : [4, val / 2.5, 4]
                              }}
                              transition={{
                                duration: durationCoeff,
                                repeat: Infinity,
                                delay: delayCoeff,
                                ease: "easeInOut"
                              }}
                              className={`w-1 bg-gradient-to-t rounded-full ${
                                isNormalizing ? "from-rose-600 to-rose-450" : "from-neutral-700 to-neutral-550"
                              }`}
                              style={{ height: "4px" }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Curated list suggestion carousel specifically for play tab */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-neutral-450 uppercase tracking-widest pl-1">Mas sugerencias melódicas</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {CURATED_TRACKS.filter(t => t.id !== currentTrack.id).slice(0, 4).map((track) => (
                        <div 
                          key={track.id}
                          onClick={() => handlePlayTrack(track)}
                          className="cursor-pointer group flex flex-col p-2.5 bg-neutral-900 border border-neutral-850 hover:border-neutral-700/80 rounded-xl transition-all space-y-2 text-left"
                        >
                          <div className="aspect-video bg-neutral-950 rounded-lg overflow-hidden shrink-0 relative">
                            <img src={track.thumbnailUrl} alt={track.title} className="w-full h-full object-cover" />
                            <span className="absolute bottom-1 right-1 bg-neutral-950/80 text-[9px] font-mono px-1 rounded text-neutral-300">
                              {track.duration}
                            </span>
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-xs font-bold text-neutral-200 line-clamp-1 group-hover:text-rose-400 transition-all">
                              {track.title}
                            </p>
                            <p className="text-[10px] text-neutral-450 truncate font-semibold">{track.artist}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 3. PLAYLISTS & ALBUMS SCREEN */}
              {activeTab === "playlists" && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Create New Album Folder */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h2 className="text-base font-extrabold text-neutral-100 flex items-center space-x-2">
                          <ListMusic className="w-5.5 h-5.5 text-rose-500" />
                          <span>Mis Carpetas de Colección</span>
                        </h2>
                        <p className="text-xs text-neutral-400 max-w-xl">
                          Sincroniza y organiza colecciones musicales personalizadas. Los datos se guardan automáticamente en tu almacenamiento web de este celular.
                        </p>
                      </div>

                      <form onSubmit={handleCreatePlaylist} className="flex gap-2 min-w-[260px]">
                        <input 
                          type="text"
                          placeholder="Nombre de la carpeta..."
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-rose-500 text-neutral-100 flex-1 min-w-0"
                          required
                        />
                        <button 
                          type="submit"
                          className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Crear</span>
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Favorites row */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-neutral-450 uppercase tracking-widest pl-1">Favoritos</h3>
                    
                    {favorites.length === 0 ? (
                      <div className="bg-neutral-905 border border-dashed border-neutral-800 rounded-2xl p-8 text-center text-xs text-neutral-400">
                        No hay melodías favoritas guardadas. Pulsa el ícono de <Heart className="w-3.5 h-3.5 inline mx-1 text-rose-500 fill-rose-500/20" /> en las tarjetas para guardarlas aquí.
                      </div>
                    ) : (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-850">
                        {favorites.map((fId, index) => {
                          const curatedMatch = CURATED_TRACKS.find(t => t.id === fId);
                          const trackData: Track = curatedMatch || {
                            id: fId,
                            title: `Pista Importada (${fId})`,
                            artist: "Autor Personalizado",
                            duration: "--:--",
                            category: "Custom",
                            thumbnailUrl: `https://img.youtube.com/vi/${fId}/hqdefault.jpg`
                          };

                          return (
                            <div key={fId} className="flex items-center justify-between p-3 px-4 hover:bg-neutral-850 transition-all gap-4">
                              <div 
                                onClick={() => handlePlayTrack(trackData)}
                                className="flex items-center space-x-3.5 cursor-pointer min-w-0 flex-1 group"
                              >
                                <span className="text-xs text-neutral-500 font-mono w-4">{index + 1}</span>
                                <div className="w-11 h-8 rounded-lg bg-neutral-950 overflow-hidden shrink-0 relative">
                                  <img src={trackData.thumbnailUrl} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-neutral-200 line-clamp-1 group-hover:text-rose-400 transition-all leading-tight">
                                    {trackData.title}
                                  </p>
                                  <p className="text-[10px] text-neutral-450 font-bold">{trackData.artist}</p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => handlePlayTrack(trackData)}
                                  className="p-1 px-2.5 bg-neutral-950 hover:bg-rose-600 text-neutral-300 hover:text-white rounded-lg transition-all text-[10px] font-bold cursor-pointer"
                                  title="Iniciar"
                                >
                                  Escuchar
                                </button>
                                <button 
                                  onClick={() => handleToggleFavorite(fId)}
                                  className="p-2 text-neutral-450 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                                  title="Quitar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Custom storage catalogs */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-neutral-450 uppercase tracking-widest pl-1">Listas de reproducción personales</h3>
                    
                    {playlists.length === 0 ? (
                      <div className="bg-neutral-900/30 border border-dashed border-neutral-800 rounded-xl p-8 text-center text-xs text-neutral-400">
                        No hay listas personalizadas creadas todavía. Crea una arriba para gestionar.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {playlists.map((playlist) => (
                          <div key={playlist.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4.5 space-y-4 shadow-sm flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5 mb-3.5">
                                <div className="space-y-0.5">
                                  <h4 className="text-xs font-bold text-neutral-200 flex items-center space-x-1.5 uppercase tracking-wide">
                                    <ListMusic className="w-4 h-4 text-rose-450" />
                                    <span>{playlist.name}</span>
                                  </h4>
                                  <span className="text-[10px] text-neutral-400 font-semibold">{playlist.videoIds.length} pistas guardadas</span>
                                </div>
                                
                                <button 
                                  onClick={() => handleDeletePlaylist(playlist.id)}
                                  className="p-1.5 bg-neutral-950/50 hover:bg-rose-500/20 text-neutral-400 hover:text-red-500 border border-neutral-800/80 rounded-xl transition-all text-xs flex items-center space-x-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Eliminar</span>
                                </button>
                              </div>

                              {/* Tracks item scroll list */}
                              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                                {playlist.videoIds.length === 0 ? (
                                  <p className="text-[10px] text-neutral-500 italic p-4 text-center">La carpeta se encuentra vacía. Añádele pistas pulsando el botón (+) en la portada.</p>
                                ) : (
                                  playlist.videoIds.map((trId) => {
                                    const matchC = CURATED_TRACKS.find(v => v.id === trId);
                                    const fileItem: Track = matchC || {
                                      id: trId,
                                      title: `Pista Guardada (${trId})`,
                                      artist: "Personalizado",
                                      duration: "--:--",
                                      category: "Custom",
                                      thumbnailUrl: `https://img.youtube.com/vi/${trId}/hqdefault.jpg`
                                    };

                                    return (
                                      <div key={trId} className="flex items-center justify-between p-2 bg-neutral-950/40 hover:bg-neutral-950/90 rounded-xl transition-all gap-3">
                                        <div 
                                          onClick={() => handlePlayTrack(fileItem)}
                                          className="flex items-center space-x-2.5 cursor-pointer min-w-0 flex-1 group"
                                        >
                                          <div className="w-8 h-6 rounded bg-neutral-900 overflow-hidden shrink-0">
                                            <img src={fileItem.thumbnailUrl} className="w-full h-full object-cover" />
                                          </div>
                                          <span className="text-xs text-neutral-300 font-semibold line-clamp-1 group-hover:text-rose-400 transition-all leading-snug">
                                            {fileItem.title}
                                          </span>
                                        </div>

                                        <button 
                                          onClick={() => handleRemoveFromPlaylist(playlist.id, trId)}
                                          className="p-1 text-neutral-500 hover:text-rose-500 rounded transition-all cursor-pointer"
                                          title="Quitar"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* 4. RECENT HISTORY SCREEN */}
              {activeTab === "history" && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                    <div className="space-y-0.5">
                      <h2 className="text-base font-extrabold text-neutral-100 flex items-center space-x-2">
                        <HistoryIcon className="w-5.5 h-5.5 text-rose-500" />
                        <span>Historial Reciente</span>
                      </h2>
                      <p className="text-xs text-neutral-400">Pistas y videos reproducidos de forma cronológica en esta sesión.</p>
                    </div>

                    {history.length > 0 && (
                      <button 
                        onClick={() => {
                          if (confirm("¿Estás seguro de vaciar el historial reciente?")) {
                            syncHistory([]);
                          }
                        }}
                        className="bg-neutral-900 hover:bg-rose-500/10 border border-neutral-800 text-neutral-300 hover:text-red-400 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Vaciar</span>
                      </button>
                    )}
                  </div>

                  {history.length === 0 ? (
                    <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-12 text-center space-y-3">
                      <p className="text-neutral-400 text-sm">Tu historial se encuentra vacío.</p>
                      <button 
                        onClick={() => setActiveTab("discover")}
                        className="text-xs text-rose-450 hover:underline font-bold"
                      >
                        Descubrir música ahora
                      </button>
                    </div>
                  ) : (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-850">
                      {history.map((track, ids) => (
                        <div key={`${track.id}-${ids}`} className="p-3.5 flex items-center justify-between hover:bg-neutral-850 transition-all gap-4">
                          <div 
                            onClick={() => handlePlayTrack(track)}
                            className="flex items-center space-x-3.5 cursor-pointer min-w-0 flex-1 group"
                          >
                            <div className="w-14 h-9 bg-neutral-950 rounded-lg overflow-hidden shrink-0 relative">
                              <img src={track.thumbnailUrl} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-neutral-100 group-hover:text-rose-400 transition-all line-clamp-1 leading-snug">
                                {track.title}
                              </p>
                              <p className="text-[10px] text-neutral-400 font-bold">{track.artist} • <span className="text-neutral-500">{track.duration}</span></p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={() => {
                                setTrackToPlaylist(track);
                                setPlaylistModalOpen(true);
                              }}
                              className="p-2 text-neutral-450 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-all cursor-pointer"
                              title="Añadir a lista"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            
                            <button 
                              onClick={() => {
                                syncHistory(history.filter((_, idx) => idx !== ids));
                              }}
                              className="p-2 text-neutral-450 hover:text-red-400 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                              title="Quitar de historial"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

            </main>
          </div>

          {/* Persistent Player Bar at Bottom (Mobile view optimized) */}
          <footer className="md:hidden sticky bottom-0 z-40 bg-neutral-900/95 backdrop-blur border-t border-neutral-800 p-3 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1 cursor-pointer" onClick={() => setActiveTab("player")}>
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-950 shrink-0">
                <img src={currentTrack.thumbnailUrl} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">{currentTrack.title}</p>
                <p className="text-[10px] text-neutral-400 truncate font-semibold">{currentTrack.artist}</p>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              <button 
                onClick={handlePrevTrack}
                className="p-2 text-neutral-400 hover:text-white"
              >
                <SkipBack className="w-4.5 h-4.5" />
              </button>
              
              <button 
                onClick={() => setActiveTab("player")}
                className="p-2.5 bg-rose-600 rounded-full text-white"
              >
                <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
              </button>

              <button 
                onClick={handleNextTrack}
                className="p-2 text-neutral-400 hover:text-white"
              >
                <SkipForward className="w-4.5 h-4.5" />
              </button>
            </div>
          </footer>

          {/* Quick tab drawer on smartphone view */}
          <div className="md:hidden fixed bottom-16.5 left-0 w-full bg-neutral-950 border-t border-neutral-900 p-1 flex items-center justify-around z-35">
            <button 
              onClick={() => setActiveTab("discover")} 
              className={`p-2 flex flex-col items-center space-y-0.5 ${activeTab === 'discover' ? 'text-rose-450' : 'text-neutral-450'}`}
            >
              <Compass className="w-4.5 h-4.5" />
              <span className="text-[9px] font-bold">Explorar</span>
            </button>
            <button 
              onClick={() => setActiveTab("player")} 
              className={`p-2 flex flex-col items-center space-y-0.5 ${activeTab === 'player' ? 'text-rose-450' : 'text-neutral-450'}`}
            >
              <Play className="w-4.5 h-4.5" />
              <span className="text-[9px] font-bold">Reproductor</span>
            </button>
            <button 
              onClick={() => setActiveTab("playlists")} 
              className={`p-2 flex flex-col items-center space-y-0.5 ${activeTab === 'playlists' ? 'text-rose-450' : 'text-neutral-450'}`}
            >
              <ListMusic className="w-4.5 h-4.5" />
              <span className="text-[9px] font-bold">Listas</span>
            </button>
            <button 
              onClick={() => setActiveTab("history")} 
              className={`p-2 flex flex-col items-center space-y-0.5 ${activeTab === 'history' ? 'text-rose-450' : 'text-neutral-450'}`}
            >
              <HistoryIcon className="w-4.5 h-4.5" />
              <span className="text-[9px] font-bold">Historial</span>
            </button>
          </div>
        </div>
      )}


      {/* -------------------- ANDROID AUTO CONSOLE MODE -------------------- */}
      {carMode && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 bg-black flex flex-col h-screen overflow-hidden text-neutral-100 p-4 sm:p-6"
        >
          {/* Strict Android Auto Top Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-900 mb-4 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-rose-600/20 border border-rose-600 flex items-center justify-center animate-pulse">
                <Car className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-extrabold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Consola Activa Android Auto</span>
                </span>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">CleanTune Driver Control</h1>
              </div>
            </div>

            {/* EXIT Button - HUGE Target size for safety */}
            <button 
              onClick={toggleCarMode}
              className="px-6 py-3.5 bg-neutral-900 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 font-extrabold text-sm rounded-2xl border border-rose-900/60 transition-all flex items-center space-x-2 cursor-pointer shadow"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Consola</span>
            </button>
          </div>

          {/* Android Auto Split Content viewport */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0 overflow-hidden">
            
            {/* Split LEFT: Giant Media player and large controls */}
            <div className="lg:col-span-7 bg-neutral-950 border border-neutral-900 rounded-3xl p-4 sm:p-6 flex flex-col justify-between overflow-hidden min-h-0">
              
              {/* Embedded hidden player so driving mode can stream video/audio cleanly */}
              <div className="absolute top-0 left-0 w-[1px] h-[1px] opacity-[0.01] pointer-events-none overflow-hidden">
                <iframe 
                  key={currentTrack.id}
                  id="youtube-car-player-frame"
                  title="Car player hidden video stream"
                  src={`https://www.youtube-nocookie.com/embed/${currentTrack.id}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>
              </div>

              {/* Giant high-fidelity Artwork display */}
              <div className="flex flex-col sm:flex-row items-center gap-6 flex-1 justify-center max-w-xl mx-auto">
                <div className="w-40 sm:w-52 aspect-square relative bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 shrink-0 shadow-2xl">
                  <img 
                    src={currentTrack.thumbnailUrl} 
                    alt={currentTrack.title} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent"></div>
                  <div className="absolute bottom-3.5 left-3.5 bg-neutral-950/80 p-2 rounded-xl text-[10px] font-mono tracking-wider border border-neutral-850">
                    {currentTrack.duration}
                  </div>
                </div>

                <div className="text-center sm:text-left space-y-2 min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-rose-500 bg-rose-950/55 px-3 py-1 rounded-full border border-rose-900">
                    {currentTrack.category}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight line-clamp-2 tracking-tight">
                    {currentTrack.title}
                  </h2>
                  <p className="text-neutral-450 font-semibold text-sm sm:text-base">
                    {currentTrack.artist}
                  </p>
                </div>
              </div>

              {/* GIANT DRIVING BUTTONS (Minimum 64px size for crash-safe operations) */}
              <div className="pt-4 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Left controls: Star / Heart toggle & Refresh option */}
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => handleToggleFavorite(currentTrack.id)}
                    className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all ${
                      favorites.includes(currentTrack.id) 
                        ? "bg-rose-600/20 text-rose-400 border-rose-500" 
                        : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
                    }`}
                    title="Favorito"
                  >
                    <Heart className={`w-7 h-7 ${favorites.includes(currentTrack.id) ? "fill-current text-rose-400" : ""}`} />
                  </button>
                  <span className="text-xs font-bold text-neutral-450 uppercase tracking-widest hidden sm:inline">
                    Pista Activa
                  </span>
                </div>

                {/* Main giant Media controller buttons */}
                <div className="flex items-center space-x-4">
                  {/* Previous Track button (Minimum target size 64px) */}
                  <button 
                    onClick={handlePrevTrack}
                    className="w-16 h-16 rounded-3xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 hover:text-rose-450 flex items-center justify-center transition-all cursor-pointer shadow-md"
                    title="Anterior"
                  >
                    <SkipBack className="w-8 h-8 font-extrabold" />
                  </button>

                  {/* Play & Pause (Toggle status display) */}
                  <div className="w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-950/20 transition-all border border-rose-500">
                    <Music className="w-10 h-10 animate-spin" style={{ animationDuration: '9s' }} />
                  </div>

                  {/* Next track button (Minimum target size 64px) */}
                  <button 
                    onClick={handleNextTrack}
                    className="w-16 h-16 rounded-3xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 hover:text-rose-450 flex items-center justify-center transition-all cursor-pointer shadow-md"
                    title="Siguiente"
                  >
                    <SkipForward className="w-8 h-8 font-extrabold" />
                  </button>
                </div>

                {/* Sound Indicator label */}
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleToggleNormalization}
                    className={`px-4.5 py-4 rounded-2xl border text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                      isNormalizing 
                        ? "bg-emerald-900/40 border-emerald-500/40 text-emerald-400" 
                        : "bg-neutral-900 border-neutral-800 text-neutral-450"
                    }`}
                    title="Normalizador de Audio Automotriz"
                    style={{ minHeight: "56px" }}
                  >
                    <Volume2 className="w-4.5 h-4.5" />
                    <span>NORMALIZACIÓN: {isNormalizing ? "ON" : "OFF"}</span>
                  </button>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 hidden xl:inline">
                    EQ: {eqPreset.toUpperCase()}
                  </span>
                </div>
              </div>

            </div>

            {/* Split RIGHT: Giant track items selector for quick single-tap changes */}
            <div className="lg:col-span-5 bg-neutral-950 border border-neutral-900 rounded-3xl p-4 sm:p-5 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-3 shrink-0">
                <span className="text-xs uppercase font-extrabold tracking-widest text-neutral-400 flex items-center space-x-2">
                  {googleAccount?.uid ? (
                    <>
                      <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
                      <span>Recomendaciones de Ruta</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 text-rose-500" />
                      <span>Sugerencias de Ruta</span>
                    </>
                  )}
                </span>
                <span className="text-[10px] bg-neutral-900 border border-neutral-850 text-neutral-400 px-2.5 py-0.5 rounded-full font-semibold">
                  Tocar para cambiar
                </span>
              </div>

              {/* Curated list container for massive scroll navigation (Safety size compliant) */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono">
                {computedSelection.map((track) => {
                  const isActive = track.id === currentTrack.id;
                  return (
                    <button 
                      key={track.id}
                      onClick={() => handlePlayTrack(track)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-4 transition-all focus:outline-none ${
                        isActive 
                          ? "bg-rose-950/45 border-2 border-rose-500 text-white" 
                          : "bg-neutral-900 hover:bg-neutral-850 border border-neutral-850/65 text-neutral-300 hover:text-white"
                      }`}
                      style={{ minHeight: '68px' }} // Extremely accessible for driving mode
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        {/* Play state circle */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? "bg-rose-600 text-white" : "bg-neutral-950 text-neutral-500"
                        }`}>
                          {isActive ? <Play className="w-4 h-4 fill-current" /> : <Music className="w-4.5 h-4.5" />}
                        </div>
                        
                        <div className="min-w-0 text-left">
                          <p className="text-xs sm:text-sm font-extrabold truncate uppercase leading-tight tracking-tight">
                            {track.title}
                          </p>
                          <p className="text-[10px] text-neutral-450 font-semibold">{track.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-neutral-950 py-0.5 px-2 rounded-lg text-neutral-450">
                          {track.duration}
                        </span>
                        <ChevronRight className="w-4.5 h-4.5 text-neutral-600 shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Driving assistant guidance note */}
              <div className="p-3 bg-neutral-905 border border-neutral-900 rounded-2xl mt-3 text-center text-[11px] text-neutral-550 leading-normal">
                🚘 <strong>Instrucción vial:</strong> Configura tu reproducción preferida antes de iniciar la marcha. Mantén tu atención siempre en el camino.
              </div>
            </div>

          </div>
        </motion.div>
      )}


      {/* -------------------- MODAL DIALOGS & OVERLAYS -------------------- */}
      
      {/* 1. INSTALL & BLOCKED ADS INFORMATION GUIDE */}
      <AnimatePresence>
        {infoModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-xl w-full p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setInfoModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-5">
                <div className="flex items-center space-x-3 border-b border-neutral-800 pb-3">
                  <div className="w-10 h-10 bg-rose-600/10 text-rose-400 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-neutral-100">Guía de Instalación Móvil (PWA)</h3>
                    <p className="text-xs text-neutral-450 font-semibold">CleanTune Play en tu teléfono Android</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-neutral-300">
                  <div className="p-3.5 bg-neutral-950 border border-neutral-850 rounded-2xl space-y-2">
                    <h4 className="font-bold text-rose-450 uppercase text-[10px] tracking-wider">¿Por qué usar Brave Browser?</h4>
                    <p>
                      Los navegadores convencionales (como Google Chrome) integran cookies de publicidad agresivas que insertan anuncios de vídeo a mitad del streaming. Para asegurar protección total y no ver publicidad comercial en esta consola, sigue estos pasos:
                    </p>
                  </div>

                  <div className="space-y-3 font-mono">
                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                      <p className="pt-0.5">Descarga el navegador gratuito <strong>Brave Browser</strong> desde Google Play Store en tu móvil.</p>
                    </div>

                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                      <p className="pt-0.5">Abre la dirección compartida de este applet dentro del navegador Brave.</p>
                    </div>

                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                      <p className="pt-0.5">Pulsa en los 3 puntos del navegador Brave y selecciona <strong>"Agregar a la pantalla de inicio"</strong> o <strong>"Instalar App"</strong>.</p>
                    </div>

                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-bold text-xs flex items-center justify-center shrink-0">4</span>
                      <p className="pt-0.5">¡Listo! Se creará un acceso directo nativo en tu celular para lanzarlo a pantalla completa en tu consola o auto.</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-rose-950/30 border border-rose-900/50 rounded-2xl text-[11px] text-rose-300">
                    📱 <strong>Compatibilidad en Automóviles:</strong> Al instalar nuestra aplicación como PWA (Web App Inmersiva), se desplegará de forma optimizada en soportes de teléfonos celulares y consolas basadas en paneles con soporte Android.
                  </div>
                </div>

                <button 
                  onClick={() => setInfoModalOpen(false)}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-3 rounded-2xl transition-all cursor-pointer text-center"
                >
                  Entendido, ¡Listo para configurar!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. CHOOSE PLAYLIST TO ADD SONG */}
      <AnimatePresence>
        {playlistModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-5 relative shadow-2xl"
            >
              <button 
                onClick={() => { setPlaylistModalOpen(false); setTrackToPlaylist(null); }}
                className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-rose-450">Guardar canción</h3>
                  <p className="text-xs text-neutral-400 font-semibold truncate">Cargar: {trackToPlaylist?.title}</p>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {playlists.length === 0 ? (
                    <div className="p-4 text-center text-xs text-neutral-500">
                      No tienes carpetas creadas. Crea una desde la pestaña "Mis Listas".
                    </div>
                  ) : (
                    playlists.map((playlist) => (
                      <button
                        key={playlist.id}
                        onClick={() => handleAddTrackToPlaylist(playlist.id)}
                        className="w-full text-left p-3 bg-neutral-950 hover:bg-neutral-850 rounded-xl flex items-center justify-between transition-all cursor-pointer"
                      >
                        <span className="text-xs font-bold text-neutral-200">{playlist.name}</span>
                        <ChevronRight className="w-4 h-4 text-neutral-500" />
                      </button>
                    ))
                  )}
                </div>

                <button 
                  onClick={() => { setPlaylistModalOpen(false); setTrackToPlaylist(null); }}
                  className="w-full bg-neutral-800 hover:bg-neutral-700 py-2.5 rounded-xl text-neutral-300 hover:text-white transition-all text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. GOOGLE SIGN IN MODAL */}
      <AnimatePresence>
        {loginModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 relative shadow-2xl"
            >
              <button 
                onClick={() => setLoginModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-rose-600/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <User className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-neutral-100">Acceso Google</h3>
                  <p className="text-xs text-neutral-450 font-semibold leading-relaxed">Sincroniza y respalda tus listas de reproducción, favoritos y configuración en la nube de forma segura.</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Iniciar sesión con Google</span>
                  </button>
                  
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 text-[10px] text-neutral-450 leading-relaxed text-center">
                    🔒 Conexión directa y segura mediante los servidores oficiales de Firebase Authentication.
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
