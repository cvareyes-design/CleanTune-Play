import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

export const useUrlFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const getFilters = useCallback(
    () => ({
      query: searchParams.get('q') || '',
      category: searchParams.get('category') || 'all',
      minPrice: Number(searchParams.get('minPrice')) || 0,
      maxPrice: Number(searchParams.get('maxPrice')) || 10000,
      sortBy: (searchParams.get('sort') as any) || 'newest',
      page: Number(searchParams.get('page')) || 1,
    }),
    [searchParams]
  );

  const setFilters = useCallback(
    (filters: any) => {
      const params = new URLSearchParams();
      if (filters.query) params.set('q', filters.query);
      if (filters.category !== 'all') params.set('category', filters.category);
      if (filters.minPrice > 0) params.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice < 10000) params.set('maxPrice', filters.maxPrice.toString());
      if (filters.sortBy !== 'newest') params.set('sort', filters.sortBy);
      if (filters.page > 1) params.set('page', filters.page.toString());

      setSearchParams(params);
    },
    [setSearchParams]
  );

  return { getFilters, setFilters };
};
