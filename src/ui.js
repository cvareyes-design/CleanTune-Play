/**
 * Renderiza una lista de tracks en el contenedor
 * @param {Array} tracks - Lista de tracks a renderizar
 * @param {HTMLElement} container - Elemento donde renderizar
 * @param {Object} options - Opciones de renderizado
 */
export function renderTracks(tracks, container, options = {}) {
  const { emptyMessage = 'No se encontraron resultados', showCategory = true } = options;
  
  if (!container) {
    console.error('renderTracks: container no encontrado');
    return;
  }
  
  // Limpiar contenedor
  container.innerHTML = '';
  
  // Estado vacío
  if (tracks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>${escapeHtml(emptyMessage)}</h3>
        <p>Intenta con otros términos o categorías</p>
      </div>
    `;
    return;
  }
  
  // Grid de resultados
  const grid = document.createElement('div');
  grid.className = 'tracks-grid';
  
  tracks.forEach(track => {
    const card = createTrackCard(track, showCategory);
    grid.appendChild(card);
  });
  
  container.appendChild(grid);
}

/**
 * Crea una tarjeta de track
 */
function createTrackCard(track, showCategory) {
  const card = document.createElement('div');
  card.className = 'track-card';
  card.dataset.id = track.id;
  
  card.innerHTML = `
    <div class="track-thumbnail">
      <img src="${track.thumbnail}" alt="${escapeHtml(track.title)}" loading="lazy">
      ${track.isLive ? '<span class="live-badge">🔴 EN VIVO</span>' : ''}
      <button class="play-button" data-id="${track.id}" aria-label="Reproducir ${escapeHtml(track.title)}">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
    </div>
    <div class="track-info">
      <h3 class="track-title">${escapeHtml(track.title)}</h3>
      <p class="track-artist">${escapeHtml(track.artist)}</p>
      <div class="track-meta">
        ${showCategory ? `<span class="track-category">${track.category}</span>` : ''}
        <span class="track-duration">${track.duration}</span>
      </div>
    </div>
  `;
  
  // Evento de reproducción
  const playBtn = card.querySelector('.play-button');
  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playTrack(track.id);
  });
  
  // Click en toda la card también reproduce
  card.addEventListener('click', () => {
    playTrack(track.id);
  });
  
  return card;
}

/**
 * Renderiza estado de carga (skeleton)
 */
export function renderLoading(container, count = 6) {
  if (!container) {
    console.error('renderLoading: container no encontrado');
    return;
  }
  
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'tracks-grid';
  
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'track-skeleton';
    skeleton.innerHTML = `
      <div class="skeleton-thumbnail"></div>
      <div class="skeleton-text skeleton-title"></div>
      <div class="skeleton-text skeleton-artist"></div>
    `;
    grid.appendChild(skeleton);
  }
  
  container.appendChild(grid);
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Reproduce un track (integra con tu reproductor actual)
 */
function playTrack(id) {
  // Dispara evento personalizado para que main.js lo maneje
  const event = new CustomEvent('playTrack', { detail: { id } });
  document.dispatchEvent(event);
}
