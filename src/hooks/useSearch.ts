import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';

interface SearchFilters {
  query: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  sortBy: 'price-asc' | 'price-desc' | 'name' | 'newest';
}

export const useSearch = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'all',
    minPrice: 0,
    maxPrice: 10000,
    sortBy: 'newest'
  });

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(filters.query, 300);
  const debouncedMinPrice = useDebounce(filters.minPrice, 500);
  const debouncedMaxPrice = useDebounce(filters.maxPrice, 500);

  const searchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: debouncedQuery,
        category: filters.category,
        minPrice: debouncedMinPrice.toString(),
        maxPrice: debouncedMaxPrice.toString(),
        sort: filters.sortBy
      });

      const response = await fetch(`/api/products/search?${params}`);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data.products);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filters.category, debouncedMinPrice, debouncedMaxPrice, filters.sortBy]);

  useEffect(() => {
    searchProducts();
  }, [searchProducts]);

  return { filters, setFilters, results, loading, error };
};
