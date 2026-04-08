export default async function handler(req, res) {
  try {
    const { title, artist } = req.query;

    const cookies = req.headers.cookie || "";
    const tokenMatch = cookies.match(/youtube_access_token=([^;]+)/);

    if (!tokenMatch) {
      return res.status(401).json({ error: "Not connected to YouTube" });
    }

    const access_token = tokenMatch[1];

    // 🔍 SEARCH VIDEO
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        artist + " " + title
      )}&type=video&maxResults=1`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    const searchData = await searchRes.json();

    if (!searchData.items || !searchData.items.length) {
      return res.json({ status: "error" });
    }

    const videoId = searchData.items[0].id.videoId;

    // 📁 GET PLAYLISTS
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    const playlistData = await playlistRes.json();

    let playlist = playlistData.items.find(
      p => p.snippet.title === "FROM KIWI <3"
    );

    // 📦 CREATE PLAYLIST IF NOT EXISTS
    if (!playlist) {
      const createRes = await fetch(
        "https://www.googleapis.com/youtube/v3/playlists?part=snippet,status",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
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

      const created = await createRes.json();
      playlist = created;
    }

    const playlistId = playlist.id;

    // 🔎 CHECK DUPLICATES
    const itemsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    const itemsData = await itemsRes.json();

    const exists = itemsData.items.some(
      item => item.snippet.resourceId.videoId === videoId
    );

    if (exists) {
      return res.json({ status: "duplicate" });
    }

    // ➕ ADD TO PLAYLIST
    await fetch(
      "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          snippet: {
            playlistId,
            resourceId: {
              kind: "youtube#video",
              videoId
            }
          }
        })
      }
    );

    return res.json({ status: "added" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
