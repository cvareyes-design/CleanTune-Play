const express = require('express');
const path = require('path');
const { searchLimiter } = require('./middleware/rateLimiter.cjs');
const { validateSearch } = require('./middleware/validateSearch.cjs');
const { CATALOG } = require('./data/catalog.cjs');

const app = express();
app.use(express.json());

// API: products search
app.get('/api/products/search', searchLimiter, validateSearch, (req, res) => {
  try {
    const q = (req.query.q || '').toString().toLowerCase().trim();
    const category = (req.query.category || 'all').toString();
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 50);

    let results = CATALOG.filter((track) => {
      if (category !== 'all' && track.category !== category) return false;
      if (!q) return true;
      const haystack = `${track.title} ${track.artist} ${track.category}`.toLowerCase();
      return haystack.includes(q);
    });

    const total = results.length;
    const start = (page - 1) * limit;
    results = results.slice(start, start + limit);

    return res.json({ success: true, total, page, limit, products: results });
  } catch (err) {
    console.error('Search error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Serve static build
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on ${port}`));
