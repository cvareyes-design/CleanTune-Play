const { query, validationResult } = require('express-validator');

exports.validateSearch = [
  query('q').optional().trim().isLength({ max: 100 }).escape(),
  query('category').optional().trim().isLength({ max: 50 }),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros de búsqueda inválidos',
        errors: errors.array()
      });
    }
    next();
  }
];
