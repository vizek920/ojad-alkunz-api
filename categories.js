const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { requireAdmin } = require('../middleware/auth');

// GET /api/categories — list all categories
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name_ar');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/categories — create category (admin)
router.post('/', requireAdmin, async (req, res) => {
  const { name_ar, name_en, icon } = req.body;

  if (!name_ar) {
    return res.status(400).json({ error: 'name_ar is required' });
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({ name_ar, name_en, icon })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/categories/:id — update category (admin)
router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name_ar, name_en, icon } = req.body;

  const { data, error } = await supabase
    .from('categories')
    .update({ name_ar, name_en, icon })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Category not found' });
  res.json(data);
});

// DELETE /api/categories/:id — delete category (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
