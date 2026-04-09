const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`
};

export default async function handler(req, res) {
  try {
    // Get current count
    const getRes = await fetch(`${SUPABASE_URL}/rest/v1/visitors?id=eq.1&select=count`, { headers });
    const getData = await getRes.json();

    if (!getData || !getData.length) {
      // Row doesn't exist yet, create it
      await fetch(`${SUPABASE_URL}/rest/v1/visitors`, {
        method: "POST",
        headers: { ...headers, "Prefer": "return=representation" },
        body: JSON.stringify({ id: 1, count: 1 })
      });
      return res.json({ count: 1 });
    }

    const newCount = getData[0].count + 1;
    await fetch(`${SUPABASE_URL}/rest/v1/visitors?id=eq.1`, {
      method: "PATCH",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify({ count: newCount })
    });

    return res.json({ count: newCount });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
