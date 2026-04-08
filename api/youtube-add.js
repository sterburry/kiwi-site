export default async function handler(req, res) {
  try {
    const { title, artist } = req.query;

    if (!title || !artist) {
      return res.status(400).json({ error: "Missing song info" });
    }

    const cookies = req.headers.cookie || "";
    const tokenMatch = cookies.match(/youtube_access_token=([^;]+)/);

    if (!tokenMatch) {
      return res.json({ error: "Not connected to YouTube" });
    }

    const accessToken = tokenMatch[1];

    // =========================
    // 1. GET PLAYLISTS
    // =========================
    const playlistsRes = await fetch(
      "https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50",
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    const playlistsData = await playlistsRes.json();

    let playlist = playlistsData.items?.find(
      p => p.snippet.title === "FROM KIWI <3"
    );

    // =========================
    // 2. CREATE IF NOT EXISTS
    // =========================
    if (!playlist) {
      const createRes = await fetch(
        "https://www.googleapis.com/youtube/v3/playlists?part=snippet,status",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            snippet: {
              title: "FROM KIWI <3",
              description: "Songs added from Kiwi's Diary"
            },
            status: {
              privacyStatus: "private"
            }
          })
        }
      );

      const createData = await createRes.json();

      // 🔴 IMPORTANT CHECK
      if (!createData.id) {
        return res.json({
          error: "Failed to create playlist",
          details: createData
        });
      }

      playlist = createData;
    }

    const playlistId = playlist.id;

    if (!playlistId) {
      return res.json({
        error: "Playlist ID missing",
        details: playlist
      });
    }

    // =========================
    // 3. SEARCH VIDEO
    // =========================
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        title + " " + artist
      )}&type=video&maxResults=1`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    const searchData = await searchRes.json();

    if (!searchData.items?.length) {
      return res.json({ error: "Song not found on YouTube" });
    }

    const videoId = searchData.items[0].id.videoId;

    // =========================
    // 4. CHECK DUPLICATES
    // =========================
    const itemsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    const itemsData = await itemsRes.json();

    const exists = itemsData.items?.some(
      item => item.snippet.resourceId.videoId === videoId
    );

    if (exists) {
      return res.json({ status: "duplicate" });
    }

    // =========================
    // 5. ADD SONG
    // =========================
    const addRes = await fetch(
      "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          snippet: {
            playlistId: playlistId,
            resourceId: {
              kind: "youtube#video",
              videoId: videoId
            }
          }
        })
      }
    );

    const addData = await addRes.json();

    if (addData.error) {
      return res.json({
        error: "YouTube API failed",
        details: addData.error
      });
    }

    return res.json({ status: "added" });

  } catch (err) {
    return res.json({
      error: "Server crashed",
      details: err.message
    });
  }
}
