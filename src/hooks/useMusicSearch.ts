import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
  category: string;
  isLive: boolean;
}

export const useMusicSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  const searchTracks = useCallback(async () => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Opción 1: Si tienes backend propio
      // const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      
      // Opción 2: Si usas YouTube Data API directamente (necesitas API_KEY)
      const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(debouncedQuery + ' music')}&type=video&key=${API_KEY}`
      );

      if (!response.ok) throw new Error('Error en la búsqueda');

      const data = await response.json();
      
      const tracks: MusicTrack[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        duration: 'LIVE', // Necesitas otra llamada para duración
        thumbnail: item.snippet.thumbnails.medium.url,
        category: 'Búsqueda',
        isLive: item.snippet.liveBroadcastContent === 'live'
      }));

      setResults(tracks);
    } catch (err) {
      setError('No se pudieron cargar los resultados');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    searchTracks();
  }, [searchTracks]);

  return { query, setQuery, results, loading, error };
};
