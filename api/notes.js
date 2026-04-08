import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('sticky_notes')
      .select('*')
      .order('created_at', { ascending: true });

    return res.json({ notes: data || [] });
  }

  if (req.method === 'POST') {
    const { nickname, message, drawing, position_x, position_y, color } = req.body;

    const { data, error } = await supabase
      .from('sticky_notes')
      .insert({ nickname, message, drawing, position_x, position_y, color })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ note: data });
  }

  if (req.method === 'PATCH') {
    const { id, position_x, position_y } = req.body;
    const adminToken = req.headers['x-admin-token'];

    if (adminToken !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('sticky_notes')
      .update({ position_x, position_y })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ note: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    const adminToken = req.headers['x-admin-token'];

    if (adminToken !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await supabase.from('sticky_notes').delete().eq('id', id);
    return res.json({ status: 'deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
