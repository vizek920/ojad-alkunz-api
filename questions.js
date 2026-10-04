const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { requireAdmin } = require('../middleware/auth');

// GET /api/questions — list questions with optional filters
// ?category_id=&difficulty=&type=&stage=&limit=&offset=
router.get('/', async (req, res) => {
  const { category_id, difficulty, type, stage, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('questions')
    .select(`
      *,
      categories (id, name_ar, name_en, icon)
    `)
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (category_id) query = query.eq('category_id', category_id);
  if (difficulty) query = query.eq('difficulty', difficulty);
  if (type) query = query.eq('type', type);
  if (stage) query = query.eq('stage', Number(stage));

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json({ data, count });
});

// GET /api/questions/for-stage/:stage — get questions assigned to a stage
// Returns up to 10 random questions for that stage
router.get('/for-stage/:stage', async (req, res) => {
  const { stage } = req.params;
  const { count = 10 } = req.query;

  const { data, error } = await supabase
    .from('questions')
    .select(`
      *,
      categories (id, name_ar, name_en, icon)
    `)
    .eq('stage', Number(stage))
    .limit(Number(count) * 3); // fetch more, shuffle below

  if (error) return res.status(500).json({ error: error.message });

  // Shuffle and return requested count
  const shuffled = data.sort(() => Math.random() - 0.5).slice(0, Number(count));
  res.json(shuffled);
});

// GET /api/questions/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('questions')
    .select(`*, categories (id, name_ar, name_en, icon)`)
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Question not found' });
  res.json(data);
});

// POST /api/questions — create question (admin)
router.post('/', requireAdmin, async (req, res) => {
  const {
    text,
    type,           // 'mcq' | 'tf'
    options,        // array of strings (for mcq)
    correct_answer, // string
    difficulty,     // 'easy' | 'medium' | 'hard'
    points,         // 1 | 2 | 3
    category_id,
    stage,          // 1-15 (optional assignment)
    hint
  } = req.body;

  if (!text || !type || !correct_answer || !difficulty) {
    return res.status(400).json({
      error: 'Missing required fields: text, type, correct_answer, difficulty'
    });
  }

  if (type === 'mcq' && (!options || options.length < 2)) {
    return res.status(400).json({ error: 'MCQ questions require at least 2 options' });
  }

  const { data, error } = await supabase
    .from('questions')
    .insert({
      text, type, options, correct_answer,
      difficulty, points: points || difficultyToPoints(difficulty),
      category_id, stage, hint
    })
    .select(`*, categories (id, name_ar, name_en, icon)`)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// POST /api/questions/bulk — bulk insert questions (admin)
router.post('/bulk', requireAdmin, async (req, res) => {
  const { questions } = req.body;

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'questions array is required' });
  }

  const rows = questions.map(q => ({
    text: q.text,
    type: q.type || 'mcq',
    options: q.options || null,
    correct_answer: q.correct_answer,
    difficulty: q.difficulty || 'medium',
    points: q.points || difficultyToPoints(q.difficulty || 'medium'),
    category_id: q.category_id || null,
    stage: q.stage || null,
    hint: q.hint || null
  }));

  const { data, error } = await supabase
    .from('questions')
    .insert(rows)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ inserted: data.length, data });
});

// PUT /api/questions/:id — update question (admin)
router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  delete updates.id; // don't allow id override

  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', id)
    .select(`*, categories (id, name_ar, name_en, icon)`)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Question not found' });
  res.json(data);
});

// DELETE /api/questions/:id — delete question (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

function difficultyToPoints(difficulty) {
  return { easy: 1, medium: 2, hard: 3 }[difficulty] || 1;
}

module.exports = router;
