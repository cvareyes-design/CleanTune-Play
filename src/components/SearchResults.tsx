import { MusicTrack } from '../hooks/useMusicSearch';
import { Play, Radio } from 'lucide-react';

interface SearchResultsProps {
  tracks: MusicTrack[];
  loading: boolean;
  error: string | null;
  query: string;
  onClear: () => void;
}

export const SearchResults = ({ tracks, loading, error, query, onClear }: SearchResultsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-800 rounded-lg h-32" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        <p>{error}</p>
        <button onClick={onClear} className="mt-4 text-green-500 hover:underline">
          Intentar de nuevo
        </button>
      </div>
    );
  }

  if (query && tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No se encontraron resultados para "{query}"</p>
        <button onClick={onClear} className="mt-4 px-6 py-2 bg-green-600 rounded-full hover:bg-green-700">
          Limpiar búsqueda
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {tracks.map((track) => (
        <div key={track.id} className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors group">
          <div className="relative">
            <img src={track.thumbnail} alt={track.title} className="w-full h-48 object-cover" />
            {track.isLive && (
              <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Radio className="h-3 w-3" /> EN VIVO
              </span>
            )}
            <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
              <Play className="h-12 w-12 text-white fill-white" />
            </button>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-white truncate">{track.title}</h3>
            <p className="text-gray-400 text-sm">{track.artist}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
