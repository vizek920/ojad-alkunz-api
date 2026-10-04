const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../supabase');
const { requireAdmin } = require('../middleware/auth');

// GET /api/sessions — list all sessions (admin)
router.get('/', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_teams (*)
    `)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/sessions/:id — get full session state (public, used by big screen)
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_teams (*),
      session_stages (*)
    `)
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Session not found' });
  res.json(data);
});

// POST /api/sessions — create a new game session (admin)
router.post('/', requireAdmin, async (req, res) => {
  const { event_name, team1_name, team2_name, total_stages = 15 } = req.body;

  if (!event_name || !team1_name || !team2_name) {
    return res.status(400).json({
      error: 'Missing: event_name, team1_name, team2_name'
    });
  }

  const sessionId = uuidv4();

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      id: sessionId,
      event_name,
      total_stages,
      current_stage: 1,
      current_turn: 'team1', // team1 starts
      status: 'waiting'      // waiting | active | finished
    })
    .select()
    .single();

  if (sessionError) return res.status(500).json({ error: sessionError.message });

  // Create both teams
  const teams = [
    { session_id: sessionId, team_key: 'team1', name: team1_name, score: 0, lives: 2 },
    { session_id: sessionId, team_key: 'team2', name: team2_name, score: 0, lives: 2 }
  ];

  const { error: teamsError } = await supabase
    .from('session_teams')
    .insert(teams);

  if (teamsError) return res.status(500).json({ error: teamsError.message });

  // Initialize all stages
  const stages = Array.from({ length: total_stages }, (_, i) => ({
    session_id: sessionId,
    stage_number: i + 1,
    status: i === 0 ? 'active' : 'pending',
    team1_stage_score: 0,
    team2_stage_score: 0,
    team1_lives: 2,
    team2_lives: 2,
    team1_used_double: false,
    team2_used_double: false,
    winner: null,
    treasure_icon: null,
    treasure_name: null,
    treasure_desc: null
  }));

  const { error: stagesError } = await supabase
    .from('session_stages')
    .insert(stages);

  if (stagesError) return res.status(500).json({ error: stagesError.message });

  res.status(201).json({ session_id: sessionId, event_name });
});

// PATCH /api/sessions/:id/state — update game state (admin)
// Used by admin panel to push live state changes
router.patch('/:id/state', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    current_stage,
    current_turn,
    status,
    current_question_id,
    show_question,
    show_answer,
    timer_seconds
  } = req.body;

  const updates = {};
  if (current_stage !== undefined) updates.current_stage = current_stage;
  if (current_turn !== undefined) updates.current_turn = current_turn;
  if (status !== undefined) updates.status = status;
  if (current_question_id !== undefined) updates.current_question_id = current_question_id;
  if (show_question !== undefined) updates.show_question = show_question;
  if (show_answer !== undefined) updates.show_answer = show_answer;
  if (timer_seconds !== undefined) updates.timer_seconds = timer_seconds;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/sessions/:id/stage — update a specific stage (admin)
router.patch('/:id/stage/:stage', requireAdmin, async (req, res) => {
  const { id, stage } = req.params;
  const updates = req.body;

  const { data, error } = await supabase
    .from('session_stages')
    .update(updates)
    .eq('session_id', id)
    .eq('stage_number', Number(stage))
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/sessions/:id/team/:teamKey — update team score/lives (admin)
router.patch('/:id/team/:teamKey', requireAdmin, async (req, res) => {
  const { id, teamKey } = req.params;
  const updates = req.body;

  const { data, error } = await supabase
    .from('session_teams')
    .update(updates)
    .eq('session_id', id)
    .eq('team_key', teamKey)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/sessions/:id — delete session (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  // Cascades via FK to session_teams and session_stages
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
