import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    // Get or create visitor count row
    let { data, error } = await supabase
      .from('visitors')
      .select('count')
      .eq('id', 1)
      .single();

    if (!data) {
      await supabase.from('visitors').insert({ id: 1, count: 1 });
      return res.json({ count: 1 });
    }

    const newCount = data.count + 1;
    await supabase.from('visitors').update({ count: newCount }).eq('id', 1);
    return res.json({ count: newCount });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
