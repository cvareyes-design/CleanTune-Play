import { debounce } from './debounce.js';

// Catálogo local de sugerencias (las que ya muestras en la app)
const CATALOG = [
  {
    id: 'jfKfPfyJRdk',
    title: 'Lofi Girl - Chill Lofi Hip Hop Radio to Study/Relax',
    artist: 'Lofi Girl',
    category: 'Lofi / Relax',
    isLive: true,
    thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/mqdefault.jpg',
    duration: 'En vivo'
  },
  {
    id: '5qap5aO4i9A',
    title: 'Beats to Study/Relax to - ChilledCow Live Radio',
    artist: 'ChilledCow',
    category: 'Lofi / Relax',
    isLive: true,
    thumbnail: 'https://img.youtube.com/vi/5qap5aO4i9A/mqdefault.jpg',
    duration: '3:00:10'
  },
  {
    id: 'WPni755-Krg',
    title: 'Deep Focus Ambient - Música para Trabajar y Programar',
    artist: 'Ambient Station',
    category: 'Lofi / Relax',
    isLive: false,
    thumbnail: 'https://img.youtube.com/vi/WPni755-Krg/mqdefault.jpg',
    duration: '8:00:00'
  },
  {
    id: 'sF80I_VG5mQ',
    title: 'Bosque Lluvioso Relajante - Sonidos para dormir',
    artist: 'Nature Meditations',
    category: 'Lofi / Relax',
    isLive: false,
    thumbnail: 'https://img.youtube.com/vi/sF80I_VG5mQ/mqdefault.jpg',
    duration: '1:45:00'
  },
  {
    id: 'n61ULEU7t0M',
    title: 'Dua Lipa & Top Pop Hits Live Megamix Electro 2026',
    artist: 'Pop Party Station',
    category: 'Pop / Electro',
    isLive: true,
    thumbnail: 'https://img.youtube.com/vi/n61ULEU7t0M/mqdefault.jpg',
    duration: '2:15:30'
  },
  {
    id: 'gL-WVqP8d0Y',
    title: 'Daft Punk Ultimate Mix - Electronic Classics',
    artist: 'Electro Heaven',
    category: 'Pop / Electro',
    isLive: false,
    thumbnail: 'https://img.youtube.com/vi/gL-WVqP8d0Y/mqdefault.jpg',
    duration: '2:04:15'
  },
  {
    id: '1G4isv_Fylg',
    title: 'Coldplay - Live in Buenos Aires (Full Album Show)',
    artist: 'Coldplay Concerts',
    category: 'Retro / Clásico',
    isLive: false,
    thumbnail: 'https://img.youtube.com/vi/1G4isv_Fylg/mqdefault.jpg',
    duration: '1:30:00'
  },
  {
    id: 'IC5LN8x8f5U',
    title: "Retro 80's Synthwave & Pop Classics Mix",
    artist: 'Synth Rider',
    category: 'Retro / Clásico',
    isLive: false,
    thumbnail: 'https://img.youtube.com/vi/IC5LN8x8f5U/mqdefault.jpg',
    duration: '58:40'
  },
  {
    id: 'tAGnKpE4NCI',
    title: 'Heavy Rock & Metal Workout Anthem Motivation',
    artist: 'Adrenaline Beats',
    category: 'Energía / Gym',
    isLive: false,
    thumbnail: 'https://img.youtube.com/vi/tAGnKpE4NCI/mqdefault.jpg',
    duration: '1:12:45'
  },
  {
    id: 'kXYiU_JCYtU',
    title: 'Reggaeton Retro Classics & Urban Hits Mix',
    artist: 'DJ Latino Flow',
    category: 'Urbano / Latino',
    isLive: false,
    thumbnail: 'https://img.youtube.com/vi/kXYiU_JCYtU/mqdefault.jpg',
    duration: '1:30:00'
  }
];

/**
 * Filtra el catálogo según query y categoría
 */
export function filterTracks(query, category = 'all') {
  const normalizedQuery = (query || '').toLowerCase().trim();

  return CATALOG.filter(track => {
    // Filtro por categoría
    if (category !== 'all' && track.category !== category) {
      return false;
    }

    // Filtro por búsqueda (título, artista, categoría)
    if (!normalizedQuery) return true;

    const searchFields = [
      track.title.toLowerCase(),
      track.artist.toLowerCase(),
      track.category.toLowerCase()
    ];

    return searchFields.some(field => field.includes(normalizedQuery));
  });
}

/**
 * Búsqueda con debounce (para el input)
 */
export const debouncedSearch = debounce((query, category, onResults) => {
  const results = filterTracks(query, category);
  if (typeof onResults === 'function') onResults(results);
}, 300);

/**
 * Búsqueda inmediata (para filtros de categoría)
 */
export function searchImmediately(query, category = 'all') {
  return filterTracks(query, category);
}

/**
 * Obtiene sugerencias populares (para mostrar al inicio)
 */
export async function getPopularSuggestions() {
  // Cache key with date to refresh daily
  try {
    const today = new Date().toISOString().slice(0, 10);
    const cachedDate = localStorage.getItem('yt_top10_date');
    const cachedData = localStorage.getItem('yt_top10_list');

    if (cachedDate === today && cachedData) {
      try {
        return JSON.parse(cachedData);
      } catch (e) {
        // fallthrough to fetch
      }
    }

    const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!API_KEY) throw new Error('No API key');

    const region = (navigator.language || 'US').split('-')[1] || 'US';
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&videoCategoryId=10&maxResults=10&regionCode=${encodeURIComponent(region)}&key=${encodeURIComponent(API_KEY)}`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`YouTube error ${resp.status}`);

    const data = await resp.json();
    if (!Array.isArray(data.items) || data.items.length === 0) throw new Error('No items');

    const list = data.items.map(item => ({
      id: item.id,
      title: item.snippet?.title || 'Unknown',
      artist: item.snippet?.channelTitle || 'YouTube Music',
      category: 'Top 10',
      isLive: item.snippet?.liveBroadcastContent === 'live',
      thumbnail: item.snippet?.thumbnails?.mqdefault?.url || item.snippet?.thumbnails?.default?.url || `https://img.youtube.com/vi/${item.id}/mqdefault.jpg`,
      duration: ''
    }));

    try {
      localStorage.setItem('yt_top10_date', today);
      localStorage.setItem('yt_top10_list', JSON.stringify(list));
    } catch (e) {}

    return list;
  } catch (e) {
    // Fallback to existing local catalog (live items)
    return CATALOG.filter(track => track.isLive).slice(0, 10);
  }
}

/**
 * Obtiene tracks por categoría
 */
export function getByCategory(category) {
  if (category === 'all') return CATALOG;
  return CATALOG.filter(track => track.category === category);
}

// Exportar catálogo para referencia
export { CATALOG };
