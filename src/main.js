import { debouncedSearch, searchImmediately, getPopularSuggestions, getByCategory } from './search.js';
import { renderTracks, renderLoading } from './ui.js';

// Referencias DOM (ajusta según tus selectores actuales)
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const categoryButtons = document.querySelectorAll('.category-btn');
const clearSearchBtn = document.getElementById('clear-search');

let currentCategory = 'all';

// 1. Inicializar con sugerencias populares (ahora asíncrono: top10 diario)
async function init() {
  let popular = [];
  try {
    popular = await getPopularSuggestions();
  } catch (e) {
    popular = getPopularSuggestions();
  }
  renderTracks(popular, searchResults, { emptyMessage: 'No hay sugerencias disponibles' });
}

// 2. Evento de búsqueda con debounce
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    
    // Mostrar/ocultar botón de limpiar
    if (clearSearchBtn) {
      clearSearchBtn.style.display = query ? 'block' : 'none';
    }
    
    // Mostrar loading
    renderLoading(searchResults, 6);
    
    // Búsqueda debounced
    debouncedSearch(query, currentCategory, (results) => {
      renderTracks(results, searchResults, { 
        emptyMessage: query ? `No se encontraron resultados para "${query}"` : 'No hay resultados'
      });
    });
  });
}

// 3. Filtros por categoría
if (categoryButtons && categoryButtons.length > 0) {
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Actualizar estado activo
      categoryButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentCategory = btn.dataset.category || 'all';
      
      // Búsqueda inmediata (no necesita debounce para botones)
      const query = searchInput ? searchInput.value : '';
      const results = searchImmediately(query, currentCategory);
      
      renderTracks(results, searchResults, {
        emptyMessage: `No hay contenido en ${currentCategory}`
      });
    });
  });
}

// 4. Limpiar búsqueda
if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    
    const popular = getPopularSuggestions();
    renderTracks(popular, searchResults);
  });
}

// 5. Escuchar evento de reproducción
document.addEventListener('playTrack', (e) => {
  const { id } = e.detail || {};
  // Integra con tu reproductor actual de YouTube
  if (typeof loadYouTubeVideo === 'function') {
    loadYouTubeVideo(id);
  } else {
    // Dispara otro evento por si el reproductor lo escucha
    const evt = new CustomEvent('loadVideo', { detail: { id } });
    document.dispatchEvent(evt);
  }
});

// Inicializar
init();
