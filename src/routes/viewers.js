// ojad-alkunz-api / src/routes/viewers.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router({ mergeParams: true }); // inherits :id from sessions

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── POST /api/sessions/:id/viewers ──────────────────────────────────────────
// Viewer joins — registers presence
router.post('/', async (req, res) => {
  try {
    const { viewer_id } = req.body;
    const sessionId = req.params.id;

    if (!viewer_id) return res.status(400).json({ error: 'viewer_id مطلوب' });

    // Check session exists and is active
    const { data: session } = await supabase
      .from('sessions')
      .select('id, status, max_viewers')
      .eq('id', sessionId)
      .single();

    if (!session) return res.status(404).json({ error: 'الجلسة غير موجودة' });
    if (session.status !== 'active') return res.status(410).json({ error: 'الجلسة منتهية' });

    // Check viewer limit
    const { count } = await supabase
      .from('session_viewers')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .gt('last_seen', new Date(Date.now() - 60000).toISOString());

    if (count >= (session.max_viewers || 50)) {
      return res.status(429).json({ error: 'وصلت الجلسة للحد الأقصى من المشاهدين' });
    }

    // Upsert viewer (insert or refresh last_seen)
    const { error } = await supabase
      .from('session_viewers')
      .upsert(
        { session_id: sessionId, viewer_id, last_seen: new Date().toISOString() },
        { onConflict: 'session_id,viewer_id' }
      );

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/sessions/:id/viewers/:viewerId/ping ────────────────────────────
// Keep viewer alive (call every 30s)
router.post('/:viewerId/ping', async (req, res) => {
  try {
    const { id: sessionId, viewerId } = req.params;

    const { error } = await supabase
      .from('session_viewers')
      .update({ last_seen: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('viewer_id', viewerId);

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/sessions/:id/viewers/count ─────────────────────────────────────
// Get active viewer count (last 60s)
router.get('/count', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('session_viewer_counts')
      .select('viewer_count')
      .eq('session_id', req.params.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.json({ viewer_count: data?.viewer_count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/sessions/:id/viewers/:viewerId ───────────────────────────────
// Viewer leaves
router.delete('/:viewerId', async (req, res) => {
  try {
    const { id: sessionId, viewerId } = req.params;

    const { error } = await supabase
      .from('session_viewers')
      .delete()
      .eq('session_id', sessionId)
      .eq('viewer_id', viewerId);

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
