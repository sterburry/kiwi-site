export default async function handler(req, res) {
  try {
    let token = req.cookies.youtube_access_token;
    const refreshToken = req.cookies.youtube_refresh_token;

    // 🔄 If access token is missing, try to refresh it
    if (!token) {
      if (!refreshToken) {
        return res.status(401).json({ error: "Not connected to YouTube", step: "no_token" });
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
        return res.status(401).json({ error: "Token refresh failed", step: "refresh_failed" });
      }

      token = refreshData.access_token;

      // Save new access token to cookie
      res.setHeader("Set-Cookie",
        `youtube_access_token=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=3600`
      );
    }

    const { title, artist } = req.query;
    if (!title || !artist) {
      return res.status(400).json({ error: "Missing song info" });
    }

    const PLAYLIST_NAME = "FROM KIWI :3";

    // 🔍 STEP 1 — Check if playlist already exists
    const listRes = await fetch(
      "https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const listData = await listRes.json();

    let playlistId = null;

    if (listData.items) {
      const existing = listData.items.find(p => p.snippet.title === PLAYLIST_NAME);
      if (existing) playlistId = existing.id;
    }

    // 🆕 STEP 2 — Create playlist only if it doesn't exist
    if (!playlistId) {
      const playlistRes = await fetch(
        "https://www.googleapis.com/youtube/v3/playlists?part=snippet,status",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            snippet: { title: PLAYLIST_NAME, description: "Songs added from Kiwi site" },
            status: { privacyStatus: "private" }
          })
        }
      );
      const playlistData = await playlistRes.json();

      if (!playlistData.id) {
        return res.json({ error: "Failed to create playlist", details: playlistData, step: "playlist_create" });
      }

      playlistId = playlistData.id;
    }

    // 🔍 STEP 3 — Search for the video on YouTube
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(`${title} ${artist}`)}&maxResults=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const searchData = await searchRes.json();

    if (!searchData.items || !searchData.items.length) {
      return res.json({ error: "No video found", step: "search" });
    }

    const videoId = searchData.items[0].id.videoId;

    // 🔁 STEP 4 — Check if video is already in the playlist
    const itemsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const itemsData = await itemsRes.json();

    if (itemsData.items) {
      const alreadyIn = itemsData.items.some(
        item => item.snippet.resourceId.videoId === videoId
      );
      if (alreadyIn) return res.json({ status: "duplicate" });
    }

    // ➕ STEP 5 — Add video to playlist
    const addRes = await fetch(
      "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          snippet: {
            playlistId,
            resourceId: { kind: "youtube#video", videoId }
          }
        })
      }
    );
    const addData = await addRes.json();

    if (addData.error) {
      return res.json({ error: "Failed to add song", details: addData, step: "add" });
    }

    return res.json({ status: "added" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
