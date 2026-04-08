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

    const PLAYLIST_NAME = "FROM KIWI :3";

    // Find the playlist
    const listRes = await fetch(
      "https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const listData = await listRes.json();

    if (!listData.items) {
      return res.json({ tracks: [] });
    }

    const playlist = listData.items.find(p => p.snippet.title === PLAYLIST_NAME);
    if (!playlist) {
      return res.json({ tracks: [] });
    }

    // Get playlist items
    const itemsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlist.id}&maxResults=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const itemsData = await itemsRes.json();

    if (!itemsData.items) {
      return res.json({ tracks: [] });
    }

    const tracks = itemsData.items.map(item => ({
      playlistItemId: item.id,
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || ""
    }));

    return res.json({ tracks });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
