import { SearchX, Package } from 'lucide-react';

interface EmptyStateProps {
  query?: string;
  onClearFilters: () => void;
}

export const EmptyState = ({ query, onClearFilters }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="bg-muted rounded-full p-6 mb-4">
      {query ? (
        <SearchX className="h-12 w-12 text-muted-foreground" />
      ) : (
        <Package className="h-12 w-12 text-muted-foreground" />
      )}
    </div>
    <h3 className="text-lg font-semibold mb-2">
      {query ? 'No se encontraron resultados' : 'No hay productos disponibles'}
    </h3>
    <p className="text-muted-foreground mb-6 max-w-sm">
      {query
        ? `No encontramos productos que coincidan con "${query}". Intenta con otros términos.`
        : 'Vuelve más tarde para ver nuevos productos.'}
    </p>
    {query && (
      <button
        onClick={onClearFilters}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
      >
        Limpiar búsqueda
      </button>
    )}
  </div>
);
