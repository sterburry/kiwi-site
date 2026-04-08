export default async function handler(req, res) {
  try {
    let token = req.cookies.youtube_access_token;
    const refreshToken = req.cookies.youtube_refresh_token;

    if (!token) {
      if (!refreshToken) {
        return res.status(401).json({ error: "Not connected" });
      }

      const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.YOUTUBE_CLIENT_ID,
          client_secret: process.env.YOUTUBE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: "refresh_token"
        })
      });

      const refreshData = await refreshRes.json();
      if (!refreshData.access_token) {
        return res.status(401).json({ error: "Token refresh failed" });
      }

      token = refreshData.access_token;
      res.setHeader("Set-Cookie",
        `youtube_access_token=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=3600`
      );
    }

    const { playlistItemId } = req.query;
    if (!playlistItemId) {
      return res.status(400).json({ error: "Missing playlistItemId" });
    }

    const deleteRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?id=${playlistItemId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (deleteRes.status === 204) {
      return res.json({ status: "removed" });
    }

    const deleteData = await deleteRes.json();
    return res.json({ error: "Failed to remove", details: deleteData });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
