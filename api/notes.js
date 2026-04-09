const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/sticky_notes?select=*&order=created_at.asc`, { headers });
    const data = await r.json();
    return res.json({ notes: data || [] });
  }

  if (req.method === "POST") {
    const { nickname, message, drawing, position_x, position_y, color } = req.body;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/sticky_notes`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify({ nickname, message, drawing, position_x, position_y, color })
    });
    const data = await r.json();
    if (!data || data.error) return res.status(500).json({ error: data?.message || "Insert failed" });
    return res.json({ note: data[0] });
  }

  if (req.method === "PATCH") {
    const adminToken = req.headers["x-admin-token"];
    if (adminToken !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
    const { id, position_x, position_y } = req.body;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/sticky_notes?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify({ position_x, position_y })
    });
    const data = await r.json();
    return res.json({ note: data[0] });
  }

  if (req.method === "DELETE") {
    const adminToken = req.headers["x-admin-token"];
    if (adminToken !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
    const { id } = req.body;
    await fetch(`${SUPABASE_URL}/rest/v1/sticky_notes?id=eq.${id}`, {
      method: "DELETE",
      headers
    });
    return res.json({ status: "deleted" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
