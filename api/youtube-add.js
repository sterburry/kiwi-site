export default async function handler(req, res) {
  try {
    const { title, artist } = req.query;
    const access_token = req.cookies.youtube_access_token;

    if (!access_token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    /* 🔍 SEARCH VIDEO ON YOUTUBE */
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        artist + " " + title
      )}&type=video&maxResults=1`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const searchData = await searchRes.json();
    const videoId = searchData.items?.[0]?.id?.videoId;

    if (!videoId) {
      return res.status(200).json({ status: "error", message: "No video found" });
    }

    /* 📁 GET USER PLAYLISTS */
    const playlistsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const playlistsData = await playlistsRes.json();

    let playlist = playlistsData.items.find(
      (p) => p.snippet.title === "FROM KIWI <3"
    );

    /* ➕ CREATE PLAYLIST IF NOT EXISTS */
    if (!playlist) {
      const createRes = await fetch(
        "https://www.googleapis.com/youtube/v3/playlists?part=snippet,status",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            snippet: {
              title: "FROM KIWI <3",
              description: "Songs from Kiwi's Diary 💚",
            },
            status: {
              privacyStatus: "private",
            },
          }),
        }
      );

      const newPlaylist = await createRes.json();
      playlist = newPlaylist;
    }

    const playlistId = playlist.id;

    /* 🔍 CHECK FOR DUPLICATE */
    const itemsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const itemsData = await itemsRes.json();

    const exists = itemsData.items.some(
      (item) => item.snippet.resourceId.videoId === videoId
    );

    if (exists) {
      return res.status(200).json({ status: "duplicate" });
    }

    /* ➕ ADD VIDEO TO PLAYLIST */
    await fetch(
      "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            playlistId: playlistId,
            resourceId: {
              kind: "youtube#video",
              videoId: videoId,
            },
          },
        }),
      }
    );

    return res.status(200).json({ status: "added" });

  } catch (err) {
    return res.status(500).json({ status: "error" });
  }
}
